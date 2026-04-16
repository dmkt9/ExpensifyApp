import type {Route} from '@src/ROUTES';

type StartPendingPreparedRouteRevealOptions = {
    onReveal: () => void;
    onCancel?: () => void;
    timeoutMs: number;
};

type PendingPreparedRouteReveal = {
    route: Route;
    onReveal: () => void;
    onCancel?: () => void;
    timeoutID: ReturnType<typeof setTimeout>;
};

let pendingPreparedRouteReveal: PendingPreparedRouteReveal | undefined;

function clearPendingPreparedRouteReveal(shouldInvokeOnCancel = true) {
    if (!pendingPreparedRouteReveal) {
        return;
    }

    clearTimeout(pendingPreparedRouteReveal.timeoutID);

    if (shouldInvokeOnCancel) {
        pendingPreparedRouteReveal.onCancel?.();
    }

    pendingPreparedRouteReveal = undefined;
}

function startPendingPreparedRouteReveal(route: Route, options: StartPendingPreparedRouteRevealOptions) {
    clearPendingPreparedRouteReveal();

    const timeoutID = setTimeout(() => {
        if (pendingPreparedRouteReveal?.route !== route) {
            return;
        }

        const onReveal = pendingPreparedRouteReveal.onReveal;
        pendingPreparedRouteReveal = undefined;
        onReveal();
    }, options.timeoutMs);

    pendingPreparedRouteReveal = {
        route,
        onReveal: options.onReveal,
        onCancel: options.onCancel,
        timeoutID,
    };
}

function markPreparedRouteReady(route: Route) {
    if (pendingPreparedRouteReveal?.route !== route) {
        return false;
    }

    const onReveal = pendingPreparedRouteReveal.onReveal;
    clearPendingPreparedRouteReveal(false);
    onReveal();
    return true;
}

function getPendingPreparedRouteReveal() {
    return pendingPreparedRouteReveal?.route;
}

export {clearPendingPreparedRouteReveal, getPendingPreparedRouteReveal, markPreparedRouteReady, startPendingPreparedRouteReveal};
