# iOS Native Rendering Notes For `goBackUnderRHP`

## Goal

Capture the current understanding of how screens render on iOS native in this app, and what that implies for a future `goBackUnderRHP` flow that prepares the route under RHP before dismissing the RHP modal.

## Current Stack In This Repo

- `@react-navigation/native`: `7.1.33`
- `@react-navigation/native-stack`: `7.14.5`
- `@react-navigation/stack`: `7.8.5`
- `react-native-screens`: `4.15.4`
- `react-native`: `0.83.1`

Source: [package.json](/home/dnh/ws/ExpensifyApp/package.json)

## What Renders The Native Stack On iOS

On native, this app renders stack navigators through `NativeStackView` from `@react-navigation/native-stack`, not the JS stack view.

Relevant code:

- [index.native.tsx](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/PlatformStackNavigation/createPlatformStackNavigatorComponent/index.native.tsx)
- [AuthScreens.tsx](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/AppNavigator/AuthScreens.tsx#L320)

This means:

- root-level fullscreen and RHP routes are managed by native stack primitives on iOS
- route presence in navigation state does not automatically mean the underlying React screen is fully committed and visually ready
- a modal dismiss animation can start while the destination screen is still mounting, laying out, or waiting for data

## How RHP Is Configured

The root RHP route is `RightModalNavigator`.

Relevant code:

- [AuthScreens.tsx](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/AppNavigator/AuthScreens.tsx#L318)
- [useRootNavigatorScreenOptions.ts](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/AppNavigator/useRootNavigatorScreenOptions.ts#L47)
- [useRHPScreenOptions.ts](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/AppNavigator/useRHPScreenOptions.ts#L31)

Important observations:

- RHP uses slide-from-right animation on native
- on web, RHP is explicitly `transparentModal`
- on native, the navigator still goes through native-stack rendering, so the view-controller lifecycle matters even when the state shape looks correct

## Existing Repo Evidence That Rendering Timing Matters

### 1. Split navigators freeze non-top screens on native

Relevant code:

- [createSplitNavigator/index.tsx](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/AppNavigator/createSplitNavigator/index.tsx#L38)
- [wrapDescriptorsWithFreeze.tsx](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/PlatformStackNavigation/createPlatformStackNavigatorComponent/wrapDescriptorsWithFreeze.tsx)
- [ScreenFreezeWrapper](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/PlatformStackNavigation/createPlatformStackNavigatorComponent/ScreenFreezeWrapper/index.native.tsx)

This repo already delays freezing blurred screens to avoid breaking in-flight animations. That is direct evidence that "screen exists in state" and "screen is safe to reveal during animation" are different concerns.

### 2. The codebase already calls out `react-native-screens` freezing behavior

Relevant code:

- [shouldStripRHPOnFullscreenPush/index.native.ts](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/helpers/shouldStripRHPOnFullscreenPush/index.native.ts)

The inline comment explicitly says inactive screens are frozen on native and that this can disconnect listeners and lose internal RHP state.

### 3. RHP animation is already disabled in some pre-insert flows

Relevant code:

- [RightModalNavigator.tsx](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/AppNavigator/Navigators/RightModalNavigator.tsx#L118)
- [Navigation.ts](/home/dnh/ws/ExpensifyApp/src/libs/Navigation/Navigation.ts#L921)

This is another signal that the app already treats "route state change under RHP" and "visible modal close animation" as separate concerns.

## Key Finding For `goBackUnderRHP`

There are three separate milestones:

1. The route under RHP has been updated in navigation state.
2. The native screen/view-controller under RHP has been attached and made current inside its navigator.
3. The React content of that screen has completed enough work to be safely revealed.

Only the third milestone prevents the user from seeing a blank or half-mounted screen during RHP dismiss.

So a future `goBackUnderRHP` cannot rely only on navigation state mutation.

## Important Distinction: Root Target vs Nested Target

When `goUp` resolves to a nested navigator action, dispatching that nested action should keep RHP on top at the root level because the root stack order does not change.

Example shape:

- before: `[ReportsSplitNavigator(state: [..., ReportB]), RightModalNavigator]`
- nested action updates only `ReportsSplitNavigator.state`
- after: `[ReportsSplitNavigator(state: [..., ReportA]), RightModalNavigator]`

However, this still does not guarantee the destination screen is fully rendered before RHP is dismissed.

That means:

- nested dispatch can preserve the root stack shape
- nested dispatch alone is not sufficient to avoid blank-screen reveal on iOS

## Why A Direct Root `REPLACE` Is Not The Right Primitive

If a root stack action looks like this:

```ts
{
  type: 'REPLACE',
  payload: {
    name: 'Report',
    params: {reportID: '...'},
    path: '/r/...'
  }
}
```

it fails at the root because `Report` is not a root route name. The root stack only knows routes such as `ReportsSplitNavigator`, `SearchFullscreenNavigator`, and `RightModalNavigator`.

If the action is converted to:

```ts
{
  type: 'REPLACE',
  payload: {
    name: 'ReportsSplitNavigator',
    params: {
      screen: 'Report',
      params: {reportID: '...'}
    }
  }
}
```

then the action is valid at the root, but it replaces the fullscreen navigator route itself. That is not equivalent to "go back inside the nested navigator under RHP".

## Practical Design Direction

For the blank-screen problem, the primitive should be:

1. Prepare the destination under RHP.
2. Wait until the destination screen is ready to reveal.
3. Dismiss or reveal the RHP without exposing an unready screen.

That suggests a future flow closer to `prepare + ready signal + reveal` than to a plain `goBack` abstraction.

## Recommended Implementation Shape

- Keep `goBackUnderRHP` focused on navigation-state preparation.
- Add an explicit readiness signal from the destination screen.
- Define "ready" narrowly. For example:
  - first layout has happened
  - route is focused inside the nested navigator
  - minimum blocking data for the screen has loaded
- Only dismiss the RHP after that readiness signal.
- Prefer reveal-without-animation or very fast reveal if the prepared screen is already mounted.

## External References

- React Navigation native stack docs:
  - https://reactnavigation.org/docs/native-stack-navigator/
- React Navigation navigation object docs, including `preload`:
  - https://reactnavigation.org/docs/navigation-object/
- `react-native-screens` repository:
  - https://github.com/software-mansion/react-native-screens
- `react-freeze` repository:
  - https://github.com/software-mansion/react-freeze
- `react-native-screens` issue relevant to changing screens behind a modal on iOS:
  - https://github.com/software-mansion/react-native-screens/issues/1678

## Working Conclusion

The desired UX is valid, but the correct mental model is not "go back while RHP stays on top". The correct model is "prepare the route under RHP, confirm the screen under it is actually ready, then reveal it".
