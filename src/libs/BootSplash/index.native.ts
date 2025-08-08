import {InteractionManager, NativeModules} from 'react-native';
import Timing from '@libs/actions/Timing';
import Log from '@libs/Log';
import CONST from '@src/CONST';

const BootSplash = NativeModules.BootSplash;

let hidePromise = () => Promise.resolve();
function registerBootSplashHidePromise(promise: () => Promise<void>) {
    hidePromise = promise;
}

function hide(): Promise<void> {
    Log.info('[BootSplash] hiding splash screen', false);

    return hidePromise().then(() =>
        BootSplash.hide().finally(() => {
            InteractionManager.runAfterInteractions(() => {
                Timing.end(CONST.TIMING.SPLASH_SCREEN);
            });
        }),
    );
}

export default {
    hide,
    registerBootSplashHidePromise,
    logoSizeRatio: BootSplash.logoSizeRatio || 1,
    navigationBarHeight: BootSplash.navigationBarHeight || 0,
};
