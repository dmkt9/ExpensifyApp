import type {NavigationState, PartialState} from '@react-navigation/native';

/**
 * Walks down the focused route chain and returns the leaf screen name.
 */
function getFocusedLeafScreenName(state: NavigationState | PartialState<NavigationState> | undefined): string | undefined {
    // When opening the app via deeplink, the state isn't fully hydrated and only contains `routes` and `stale` properties.
    // In this case, we still rely on `focused?.name` to prevent the `TabNavigationBar` from showing up immediately upon app launch.
    if (!state || (state.index === undefined && !(Object.values(state).length === 2 && state.routes.length === 1))) {
        return undefined;
    }

    const focused = state.routes[state.index ?? 0];
    if (focused?.state) {
        return getFocusedLeafScreenName(focused.state);
    }
    return focused?.name;
}

export default getFocusedLeafScreenName;
