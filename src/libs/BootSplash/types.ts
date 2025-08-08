type BootSplashModule = {
    logoSizeRatio: number;
    navigationBarHeight: number;
    hide: () => Promise<void>;
    registerBootSplashHidePromise(promise: () => Promise<void>): void;
};

// eslint-disable-next-line import/prefer-default-export
export type {BootSplashModule};
