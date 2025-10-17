import {useMemo} from 'react';
import getNonEmptyStringOnyxID from '@libs/getNonEmptyStringOnyxID';
import {isViolationDismissed, shouldShowViolation} from '@libs/TransactionUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import type {TransactionViolation, TransactionViolations} from '@src/types/onyx';
import getEmptyArray from '@src/types/utils/getEmptyArray';
import useOnyx from './useOnyx';
import useTransactionsAndViolationsForReport from './useTransactionsAndViolationsForReport';

function useTransactionViolations(transactionID?: string, shouldShowRterForSettledReport = true): TransactionViolations {
    const [transaction] = useOnyx(`${ONYXKEYS.COLLECTION.TRANSACTION}${getNonEmptyStringOnyxID(transactionID)}`, {
        canBeMissing: true,
    });

    const {violations} = useTransactionsAndViolationsForReport(transaction?.reportID);
    const allTransactionViolations = violations[`${ONYXKEYS.COLLECTION.TRANSACTION_VIOLATIONS}${transactionID}`] ?? getEmptyArray<TransactionViolation>();
    const [transactionViolationsFromSnapshot] = useOnyx(`${ONYXKEYS.COLLECTION.TRANSACTION_VIOLATIONS}${transactionID}`, {
        canBeMissing: true,
    });
    const transactionViolations = transactionViolationsFromSnapshot ?? allTransactionViolations;

    const [iouReport] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT}${transaction?.reportID}`, {
        canBeMissing: true,
    });
    const [policy] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY}${iouReport?.policyID}`, {
        canBeMissing: true,
    });

    return useMemo(
        () =>
            transactionViolations.filter(
                (violation: TransactionViolation) => !isViolationDismissed(transaction, violation) && shouldShowViolation(iouReport, policy, violation.name, shouldShowRterForSettledReport),
            ),
        [transaction, transactionViolations, iouReport, policy, shouldShowRterForSettledReport],
    );
}

export default useTransactionViolations;
