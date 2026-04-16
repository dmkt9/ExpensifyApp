import {getActionFromState} from '@react-navigation/core';
import type {NavigationAction, NavigationState} from '@react-navigation/native';
import {StackActions} from '@react-navigation/native';
// eslint-disable-next-line you-dont-need-lodash-underscore/omit
import omit from 'lodash/omit';
import {nanoid} from 'nanoid/non-secure';
import type {Writable} from 'type-fest';
import {linkingConfig} from '@libs/Navigation/linkingConfig';
import type {NavigationPartialRoute, NavigationRoute, NavigationStateRoute} from '@libs/Navigation/types';
import {shallowCompare} from '@libs/ObjectUtils';
import type {Route} from '@src/ROUTES';
import findMatchingDynamicSuffix from './dynamicRoutesUtils/findMatchingDynamicSuffix';
import getStateFromPath from './getStateFromPath';
import getMinimalAction from './linkTo/getMinimalAction';

const routeParamsIgnore = ['path', 'initial', 'params', 'state', 'screen', 'policyID', 'pop'];

function getRouteParamsToCompare(routeParams: Record<string, string | undefined>) {
    return omit(routeParams, routeParamsIgnore);
}

function doesRouteMatchToMinimalActionPayload(route: NavigationStateRoute | NavigationPartialRoute, minimalAction: Writable<NavigationAction>, compareParams: boolean) {
    if (!minimalAction.payload || !('name' in minimalAction.payload) || route.name !== minimalAction.payload.name) {
        return false;
    }

    if (!compareParams) {
        return true;
    }

    if (!('params' in minimalAction.payload)) {
        return false;
    }

    const routeParams = getRouteParamsToCompare(route.params as Record<string, string | undefined>);
    const minimalActionParams = getRouteParamsToCompare(minimalAction.payload.params as Record<string, string | undefined>);

    return shallowCompare(routeParams, minimalActionParams);
}

export default function getGoUpActionForState(backToRoute: Route, rootState: NavigationState, compareParams = true): NavigationAction | null {
    const stateFromPath = getStateFromPath(backToRoute);
    const action = getActionFromState(stateFromPath, linkingConfig.config);

    if (!action) {
        return null;
    }

    const {action: minimalAction, targetState} = getMinimalAction(action, rootState);

    if (minimalAction.type !== 'NAVIGATE' || !targetState) {
        return null;
    }

    const indexOfBackToRoute = targetState.routes.findLastIndex((route) => doesRouteMatchToMinimalActionPayload(route, minimalAction, compareParams));
    const distanceToPop = targetState.routes.length - indexOfBackToRoute - 1;

    if (indexOfBackToRoute === -1 || (targetState.key === rootState.key && distanceToPop > 1)) {
        const actionPayload = minimalAction.payload as NavigationRoute;

        if (actionPayload?.path && findMatchingDynamicSuffix(backToRoute)) {
            const routes = targetState.routes.with(targetState.index ?? targetState.routes.length - 1, {
                key: `${actionPayload.name}-${nanoid()}`,
                name: actionPayload.name,
                params: actionPayload.params,
                path: actionPayload.path,
            });

            return {type: 'RESET', payload: {index: targetState.index, routes}, target: targetState.key} as NavigationAction;
        }

        return {...minimalAction, type: 'REPLACE'} as NavigationAction;
    }

    if (!compareParams) {
        return {...minimalAction, type: 'POP_TO'} as NavigationAction;
    }

    return {...StackActions.pop(distanceToPop), target: targetState.key};
}
