import React, {createContext, useContext, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import type {ReportAction} from '@src/types/onyx';

type UnreadActionIndicatorContextType = {
    /**
     * Whether the full screen loader is visible.
     */
    unreadMarkerReportActionID: string | null;
    /**
     * Set the full screen loader visibility.
     */
    setReportActionHasComponentToDisplay: (reportActionID: string) => void;
};

const UnreadActionIndicatorContext = createContext<UnreadActionIndicatorContextType>({
    unreadMarkerReportActionID: null,
    setReportActionHasComponentToDisplay: () => {},
});

type UnreadActionIndicatorContextProviderProps = {
    sortedVisibleReportActions: ReportAction[];
    unreadMarkerReportActionID: string | null;
    /**
     * The children of the full screen loader context provider.
     */
    children: ReactNode;
};

function UnreadActionIndicatorContextProvider({sortedVisibleReportActions, unreadMarkerReportActionID: unreadMarkerReportActionIDProp, children}: UnreadActionIndicatorContextProviderProps) {
    const [unreadMarkerReportActionID, setUnreadMarkerReportActionID] = useState<string | null>(null);

    const context = useMemo(() => {
        const unreadMarkerReportActionIndex = sortedVisibleReportActions.findIndex((action) => action.reportActionID === unreadMarkerReportActionIDProp);
        return {
            unreadMarkerReportActionID,
            setReportActionHasComponentToDisplay: (reportActionID: string) => {
                if (unreadMarkerReportActionIndex === -1 || !unreadMarkerReportActionIDProp) {
                    return;
                }
                const currentReportActionIndex = sortedVisibleReportActions.findIndex((action) => action.reportActionID === reportActionID);
                if (currentReportActionIndex <= unreadMarkerReportActionIndex) {
                    setUnreadMarkerReportActionID(unreadMarkerReportActionIDProp);
                }
            },
        };
    }, [sortedVisibleReportActions, unreadMarkerReportActionIDProp, unreadMarkerReportActionID]);

    return <UnreadActionIndicatorContext.Provider value={context}>{children}</UnreadActionIndicatorContext.Provider>;
}

function useUnreadActionIndicatorContext() {
    const context = useContext(UnreadActionIndicatorContext);

    if (!context) {
        throw new Error('useUnreadActionIndicatorContext must be used within a UnreadActionIndicatorContextProvider');
    }

    return context;
}

UnreadActionIndicatorContextProvider.displayName = 'UnreadActionIndicatorContextProvider';

export default UnreadActionIndicatorContextProvider;
export {UnreadActionIndicatorContext, useUnreadActionIndicatorContext};
