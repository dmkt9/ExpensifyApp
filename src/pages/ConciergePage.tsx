import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef} from 'react';
import {InteractionManager, View} from 'react-native';
import ReportActionsSkeletonView from '@components/ReportActionsSkeletonView';
import ReportHeaderSkeletonView from '@components/ReportHeaderSkeletonView';
import ScreenWrapper from '@components/ScreenWrapper';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import {confirmReadyToOpenApp} from '@libs/actions/App';
import {navigateToConciergeChat} from '@libs/actions/Report';
import BootSplash from '@libs/BootSplash';
import Navigation from '@libs/Navigation/Navigation';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';

let resolveIsReadyPromise: () => void;
const isReadyToHideSplash = new Promise<void>((resolve) => {
    resolveIsReadyPromise = resolve;
});

function confirmReadyToHideSplash() {
    resolveIsReadyPromise();
}
/*
 * This is a "utility page", that does this:
 *     - If the user is authenticated, find their concierge chat and re-route to it
 *     - Else re-route to the login page
 */
function ConciergePage() {
    const styles = useThemeStyles();
    const isUnmounted = useRef(false);
    const [session] = useOnyx(ONYXKEYS.SESSION, {canBeMissing: false});
    const [isLoadingReportData = true] = useOnyx(ONYXKEYS.IS_LOADING_REPORT_DATA, {canBeMissing: true});

    useFocusEffect(
        useCallback(() => {
            if (session && 'authToken' in session) {
                confirmReadyToOpenApp();
                Navigation.isNavigationReady().then(() => {
                    if (isUnmounted.current || isLoadingReportData === undefined || !!isLoadingReportData) {
                        return;
                    }

                    navigateToConciergeChat(true, () => !isUnmounted.current);
                    InteractionManager.runAfterInteractions(() => {
                        confirmReadyToHideSplash();
                    });
                });
            } else {
                Navigation.navigate(ROUTES.HOME);
                InteractionManager.runAfterInteractions(() => {
                    confirmReadyToHideSplash();
                });
            }
        }, [session, isLoadingReportData]),
    );

    useEffect(() => {
        isUnmounted.current = false;
        BootSplash.registerBootSplashHidePromise(() => isReadyToHideSplash);
        return () => {
            isUnmounted.current = true;
        };
    }, []);

    return (
        <ScreenWrapper testID={ConciergePage.displayName}>
            <View style={[styles.borderBottom, styles.appContentHeader]}>
                <ReportHeaderSkeletonView onBackButtonPress={Navigation.goBack} />
            </View>
            <ReportActionsSkeletonView />
        </ScreenWrapper>
    );
}

ConciergePage.displayName = 'ConciergePage';

export default ConciergePage;
