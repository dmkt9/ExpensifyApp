import {renderHook} from '@testing-library/react-native';
import {act} from 'react';
import UnreadActionIndicatorContextProvider, {useUnreadActionIndicatorContext} from '@components/UnreadActionIndicatorContext';
import type {ReportAction} from '@src/types/onyx';
import * as ReportTestUtils from '../../utils/ReportTestUtils';

const wrapper =
    (sortedVisibleReportActions: ReportAction[], unreadMarkerReportActionID: string | null) =>
    ({children}: {children: React.ReactNode}) => (
        <UnreadActionIndicatorContextProvider
            sortedVisibleReportActions={sortedVisibleReportActions}
            unreadMarkerReportActionID={unreadMarkerReportActionID}
        >
            {children}
        </UnreadActionIndicatorContextProvider>
    );

const getUnreadMarkerReportActionID = (prevSortedVisibleReportActions: ReportAction[], sortedVisibleReportActions: ReportAction[]) => {
    const prevSortedVisibleReportActionIDSet = new Set(prevSortedVisibleReportActions.map((action) => action.reportActionID));

    for (const action of sortedVisibleReportActions.toReversed()) {
        if (!prevSortedVisibleReportActionIDSet.has(action.reportActionID)) {
            return action.reportActionID;
        }
    }

    return null;
};

describe('UnreadActionIndicatorContextProvider', () => {
    it('should return unreadMarkerReportActionID as null when there are no unread reportActions', () => {
        const sortedVisibleReportActions = ReportTestUtils.getMockedSortedReportActions(5);
        const unreadMarkerReportActionIDProps = getUnreadMarkerReportActionID([...sortedVisibleReportActions], sortedVisibleReportActions);

        const {result} = renderHook(() => useUnreadActionIndicatorContext(), {wrapper: wrapper(sortedVisibleReportActions, unreadMarkerReportActionIDProps)});

        act(() => {
            sortedVisibleReportActions.forEach((action) => result.current.setReportActionHasComponentToDisplay(action.reportActionID));
        });

        expect(result.current.unreadMarkerReportActionID).toBe(null);
    });

    it('should return unreadMarkerReportActionID as the first reportActionID when the reportAction with that ID is displayed', () => {
        const sortedVisibleReportActions = ReportTestUtils.getMockedSortedReportActions(5);
        const UNREAD_INDEX = 2;
        const preSortedVisibleReportActions = sortedVisibleReportActions.slice(UNREAD_INDEX);
        const unreadMarkerReportActionIDProps = getUnreadMarkerReportActionID(preSortedVisibleReportActions, sortedVisibleReportActions);

        const {result} = renderHook(() => useUnreadActionIndicatorContext(), {wrapper: wrapper(sortedVisibleReportActions, unreadMarkerReportActionIDProps)});

        act(() => {
            sortedVisibleReportActions.forEach((action) => result.current.setReportActionHasComponentToDisplay(action.reportActionID));
        });

        expect(result.current.unreadMarkerReportActionID).toBe(sortedVisibleReportActions.at(UNREAD_INDEX - 1)?.reportActionID);
    });

    it('should return unreadMarkerReportActionID as null when when NO unread reportActions are displayed', () => {
        const sortedVisibleReportActions = ReportTestUtils.getMockedSortedReportActions(10);
        const preSortedVisibleReportActions = sortedVisibleReportActions.slice(5);
        // eslint-disable-next-line rulesdir/no-negated-variables
        const notBeDisplayedReportActionIDs = sortedVisibleReportActions.slice(0, 5).map((action) => action.reportActionID);

        const unreadMarkerReportActionIDProps = getUnreadMarkerReportActionID(preSortedVisibleReportActions, sortedVisibleReportActions);

        const {result} = renderHook(() => useUnreadActionIndicatorContext(), {wrapper: wrapper(sortedVisibleReportActions, unreadMarkerReportActionIDProps)});

        act(() => {
            sortedVisibleReportActions.forEach((action) => {
                if (notBeDisplayedReportActionIDs.includes(action.reportActionID)) {
                    return;
                }
                result.current.setReportActionHasComponentToDisplay(action.reportActionID);
            });
        });

        expect(result.current.unreadMarkerReportActionID).toBe(null);
    });

    it('should return unreadMarkerReportActionID as the first reportActionID when the reportAction with that ID is not displayed, but a subsequent reportAction is', () => {
        const sortedVisibleReportActions = ReportTestUtils.getMockedSortedReportActions(10);
        const UNREAD_INDEX = 5;
        const preSortedVisibleReportActions = sortedVisibleReportActions.slice(UNREAD_INDEX);
        // eslint-disable-next-line rulesdir/no-negated-variables
        const notBeDisplayedReportActionIDs = sortedVisibleReportActions.slice(0, UNREAD_INDEX).map((action) => action.reportActionID);
        // Delete any
        notBeDisplayedReportActionIDs.splice(1, 2);

        const unreadMarkerReportActionIDProps = getUnreadMarkerReportActionID(preSortedVisibleReportActions, sortedVisibleReportActions);

        const {result} = renderHook(() => useUnreadActionIndicatorContext(), {wrapper: wrapper(sortedVisibleReportActions, unreadMarkerReportActionIDProps)});

        act(() => {
            sortedVisibleReportActions.forEach((action) => {
                if (notBeDisplayedReportActionIDs.includes(action.reportActionID)) {
                    return;
                }
                result.current.setReportActionHasComponentToDisplay(action.reportActionID);
            });
        });

        expect(result.current.unreadMarkerReportActionID).toBe(sortedVisibleReportActions.at(UNREAD_INDEX - 1)?.reportActionID);
    });
});
