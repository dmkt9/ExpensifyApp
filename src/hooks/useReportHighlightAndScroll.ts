import {useCallback, useEffect, useRef, useState} from 'react';
import {InteractionManager} from 'react-native';
import type {OnyxCollection, OnyxEntry} from 'react-native-onyx';
import {getReportOrDraftReport, isChatReport} from '@libs/ReportUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Report, ReportAction, Transaction} from '@src/types/onyx';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import usePrevious from './usePrevious';
import type ReportScrollManagerData from './useReportScrollManager/types';

type UseReportHighlightAndScroll = {
    report: OnyxEntry<Report>;
    transactions: OnyxCollection<Transaction>;
};

/**
 * Hook used to determine when a new transaction is added and handle highlighting and scrolling.
 */
function useReportHighlightAndScroll({report, transactions}: UseReportHighlightAndScroll) {
    const previousTransactions = usePrevious(transactions);
    const [newReportActionResultKey, setNewReportActionResultKey] = useState<string | null>(null);
    const highlightedIDs = useRef<Set<string>>(new Set());
    const initializedRef = useRef(false);
    const hasScrolledToIndex = useRef(false);
    const isChat = isChatReport(report);

    // Initialize the set with existing IDs only once
    useEffect(() => {
        if (initializedRef.current || isEmptyObject(transactions)) {
            return;
        }

        highlightedIDs.current = new Set(extractTransactionIDs(transactions));
        initializedRef.current = true;
    }, [isChat, transactions]);

    // Detect new items (transactions)
    useEffect(() => {
        if (isEmptyObject(previousTransactions) || isEmptyObject(transactions) || !isChat) {
            return;
        }

        const previousTransactionIDs = extractTransactionIDs(previousTransactions);
        const currentTransactionIDs = extractTransactionIDs(transactions);

        // Find new transaction IDs that are not in the previousTransactionIDs and not already highlighted
        const newTransactionIDs = currentTransactionIDs.filter((id) => !previousTransactionIDs.includes(id) && !highlightedIDs.current.has(id));

        if (newTransactionIDs.length === 0) {
            return;
        }

        const newTransactionID = newTransactionIDs.at(0) ?? '';
        const newTransaction = transactions[`${ONYXKEYS.COLLECTION.TRANSACTION}${newTransactionID}`];
        const newTransactionThreadReport = getReportOrDraftReport(newTransaction?.reportID);

        setNewReportActionResultKey(newTransactionThreadReport?.parentReportActionID ?? null);
        highlightedIDs.current.add(newTransactionID);
    }, [transactions, previousTransactions, isChat]);

    // Reset newReportActionResultKey after it's been used
    useEffect(() => {
        if (newReportActionResultKey === null) {
            return;
        }

        const timer = setTimeout(() => {
            setNewReportActionResultKey(null);
        }, CONST.ANIMATED_HIGHLIGHT_START_DURATION);

        return () => clearTimeout(timer);
    }, [newReportActionResultKey]);

    /**
     * Callback to handle scrolling to the new search result.
     */
    const handleSelectionListScrollToHighLightItem = useCallback(
        (data: ReportAction[], ref: ReportScrollManagerData | null) => {
            // Early return if there's no ref, new transaction wasn't brought in by this hook
            // or there's no new search result key
            if (!ref || newReportActionResultKey === null || !isChat || hasScrolledToIndex.current) {
                return;
            }

            // Find the index of the new report action in the data array
            const indexOfNewItem = data.findIndex((item) => item.reportActionID === newReportActionResultKey);

            // Early return if the new item is not found in the data array
            if (indexOfNewItem < 0) {
                return;
            }

            // Perform the scrolling action
            InteractionManager.runAfterInteractions(() => {
                ref.scrollToIndex(indexOfNewItem);
                hasScrolledToIndex.current = false;
            });

            hasScrolledToIndex.current = true;
        },
        [newReportActionResultKey, isChat],
    );

    /**
     * Function to check if the list will scroll to the index of the newly added item.
     */
    const hasAlreadyScrolledToHighLightItem = useCallback(() => hasScrolledToIndex.current, []);

    return {newReportActionResultKey, handleSelectionListScrollToHighLightItem, hasAlreadyScrolledToHighLightItem};
}

/**
 * Helper function to extract transaction IDs
 */
function extractTransactionIDs(transactions: OnyxCollection<Transaction>): string[] {
    return Object.values(transactions ?? {}).reduce((result, transaction) => {
        if (transaction) {
            result.push(transaction.transactionID);
        }
        return result;
    }, [] as string[]);
}

export default useReportHighlightAndScroll;
export type {UseReportHighlightAndScroll};
