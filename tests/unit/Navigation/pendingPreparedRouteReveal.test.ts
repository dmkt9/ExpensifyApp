import {clearPendingPreparedRouteReveal, getPendingPreparedRouteReveal, markPreparedRouteReady, startPendingPreparedRouteReveal} from '@libs/Navigation/helpers/pendingPreparedRouteReveal';
import type {Route} from '@src/ROUTES';

describe('pendingPreparedRouteReveal', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        clearPendingPreparedRouteReveal();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        clearPendingPreparedRouteReveal();
    });

    it('reveals immediately when the matching prepared route becomes ready', () => {
        const onReveal = jest.fn();

        startPendingPreparedRouteReveal('/r/1' as Route, {onReveal, timeoutMs: 1000});

        expect(getPendingPreparedRouteReveal()).toBe('/r/1');
        expect(markPreparedRouteReady('/r/1' as Route)).toBe(true);
        expect(onReveal).toHaveBeenCalledTimes(1);
        expect(getPendingPreparedRouteReveal()).toBeUndefined();
    });

    it('does not reveal for a different route', () => {
        const onReveal = jest.fn();

        startPendingPreparedRouteReveal('/r/1' as Route, {onReveal, timeoutMs: 1000});

        expect(markPreparedRouteReady('/r/2' as Route)).toBe(false);
        expect(onReveal).not.toHaveBeenCalled();
        expect(getPendingPreparedRouteReveal()).toBe('/r/1');
    });

    it('falls back to reveal after the timeout', () => {
        const onReveal = jest.fn();

        startPendingPreparedRouteReveal('/r/1' as Route, {onReveal, timeoutMs: 1000});

        jest.advanceTimersByTime(1000);

        expect(onReveal).toHaveBeenCalledTimes(1);
        expect(getPendingPreparedRouteReveal()).toBeUndefined();
    });

    it('cancels the previous prepared route when a new one starts', () => {
        const firstOnCancel = jest.fn();
        const secondOnReveal = jest.fn();

        startPendingPreparedRouteReveal('/r/1' as Route, {onReveal: jest.fn(), onCancel: firstOnCancel, timeoutMs: 1000});
        startPendingPreparedRouteReveal('/r/2' as Route, {onReveal: secondOnReveal, timeoutMs: 1000});

        expect(firstOnCancel).toHaveBeenCalledTimes(1);
        expect(getPendingPreparedRouteReveal()).toBe('/r/2');

        expect(markPreparedRouteReady('/r/2' as Route)).toBe(true);
        expect(secondOnReveal).toHaveBeenCalledTimes(1);
    });
});
