import {Keyboard} from 'react-native';

type SimplifiedKeyboardEvent = {
    height?: number;
};

let isVisible = false;

const keyboardVisibilityChangeListenersSet = new Set<(isVisible: boolean) => void>();

const subscribeKeyboardVisibilityChange = (cb: (isVisible: boolean) => void) => {
    keyboardVisibilityChangeListenersSet.add(cb);
    cb(isVisible);

    return () => {
        keyboardVisibilityChangeListenersSet.delete(cb);
    };
};

Keyboard.addListener('keyboardDidHide', () => {
    isVisible = false;
    keyboardVisibilityChangeListenersSet.forEach((cb) => cb(false));
});

Keyboard.addListener('keyboardDidShow', () => {
    isVisible = true;
    keyboardVisibilityChangeListenersSet.forEach((cb) => cb(true));
});

const dismiss = (): Promise<void> => {
    return new Promise((resolve) => {
        if (!isVisible) {
            resolve();

            return;
        }

        const subscription = Keyboard.addListener('keyboardDidHide', () => {
            resolve();
            subscription.remove();
        });

        Keyboard.dismiss();
    });
};

const dismissKeyboardAndExecute = (cb: () => void): Promise<void> => {
    return new Promise((resolve) => {
        // For iOS and other platforms, execute callback immediately
        cb();
        resolve();
    });
};

const utils = {dismiss, dismissKeyboardAndExecute, subscribeKeyboardVisibilityChange};

export type {SimplifiedKeyboardEvent};
export default utils;
