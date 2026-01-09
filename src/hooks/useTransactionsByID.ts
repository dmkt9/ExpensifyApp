import {useCallback, useMemo} from 'react';
import type {OnyxCollection} from 'react-native-onyx';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Transaction} from '@src/types/onyx';
import useOnyx from './useOnyx';

function useTransactionsByID(transactionIDs: string[] | undefined) {
    const transactionsSelector = useCallback(
        (transactions: OnyxCollection<Transaction>) => transactionIDs?.map((id) => transactions?.[`${ONYXKEYS.COLLECTION.TRANSACTION}${id}`]) ?? [],
        [transactionIDs],
    );

    const [allTransactions] = useOnyx(ONYXKEYS.COLLECTION.TRANSACTION, {
        canBeMissing: true,
    });
    const transactions = useMemo(() => transactionsSelector(allTransactions), [transactionsSelector, allTransactions]);

    return [transactions];
}

export default useTransactionsByID;
