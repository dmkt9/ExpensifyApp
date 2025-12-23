// Making an exception to this rule here since we don't need an "action" for Log and Log should just be used directly. Creating a Log
// action would likely cause confusion about which one to use. But most other API methods should happen inside an action file.

/* eslint-disable rulesdir/no-api-in-views */
import HybridAppModule from '@expensify/react-native-hybrid-app';
import {Logger} from 'expensify-common';
import {Platform} from 'react-native';
import AppLogs from 'react-native-app-logs';
import Onyx from 'react-native-onyx';
import type {Merge} from 'type-fest';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import pkg from '../../package.json';
import {addLog, flushAllLogsOnAppLaunch} from './actions/Console';
import {shouldAttachLog} from './Console';
import getPlatform from './getPlatform';
import {post} from './Network';
import requireParameters from './requireParameters';
import forwardLogsToSentry from './telemetry/forwardLogsToSentry';

let timeout: NodeJS.Timeout;
let shouldCollectLogs = false;

Onyx.connectWithoutView({
    key: ONYXKEYS.SHOULD_STORE_LOGS,
    callback: (val) => {
        if (!val) {
            shouldCollectLogs = false;
        }

        shouldCollectLogs = !!val;
    },
});

type LogCommandParameters = {
    expensifyCashAppVersion: string;
    logPacket: string;
};

function LogCommand(parameters: LogCommandParameters): Promise<{requestID: string}> {
    const commandName = 'Log';
    requireParameters(['logPacket', 'expensifyCashAppVersion'], parameters, commandName);

    // Note: We are forcing Log to run since it requires no authToken and should only be queued when we are offline.
    // Non-cancellable request: during logout, when requests are cancelled, we don't want to cancel any remaining logs
    return post(commandName, {...parameters, forceNetworkRequest: true, canCancel: false}) as Promise<{requestID: string}>;
}

// eslint-disable-next-line
type ServerLoggingCallbackOptions = {api_setCookie: boolean; logPacket: string};
type RequestParams = Merge<ServerLoggingCallbackOptions, {shouldProcessImmediately: boolean; shouldRetry: boolean; expensifyCashAppVersion: string; parameters: string}>;

/**
 * Network interface for logger.
 */
function serverLoggingCallback(logger: Logger, params: ServerLoggingCallbackOptions): Promise<{requestID: string}> {
    const requestParams = params as RequestParams;
    requestParams.shouldProcessImmediately = false;
    requestParams.shouldRetry = false;
    requestParams.expensifyCashAppVersion = `expensifyCash[${getPlatform()}]${pkg.version}`;
    if (requestParams.parameters) {
        requestParams.parameters = JSON.stringify(requestParams.parameters);
    }
    // Mirror backend log payload into Telemetry logger for better context
    forwardLogsToSentry(requestParams.logPacket);
    clearTimeout(timeout);
    timeout = setTimeout(() => logger.info('Flushing logs older than 10 minutes', true, {}, true), 10 * 60 * 1000);
    return LogCommand(requestParams);
}

const isNative = Platform.OS === 'android' || Platform.OS === 'ios';
let wss: WebSocket | undefined;
const wrapLogger = (fnName: string) => {
    // eslint-disable-next-line no-console
    const originFn = (console as unknown as Record<string, (message: string, ...params: unknown[]) => unknown>)[fnName];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-console
    (console as unknown as Record<string, (message: string, ...params: unknown[]) => unknown>)[fnName] = (message: string, ...params: unknown[]) => {
        if (wss?.readyState === WebSocket.OPEN) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            wss.send(JSON.stringify({message, params}, (key, value) => (value === undefined ? '__undefined__' : value)));
        }
        return originFn(message, ...params);
    };
};
wrapLogger('log');
wrapLogger('error');
wrapLogger('debug');
wrapLogger('info');
const connect = () => {
    if (typeof WebSocket !== 'function') {
        return;
    }
    const socket = new WebSocket(isNative ? `ws://192.168.1.100:8080` : `wss://${window.location.hostname}:8082/logs`);
    socket.onopen = () => {
        socket.send(`client-info: ${window.navigator.userAgent}`);
    };
    socket.onerror = (ev) => {
        console.error('socket occur error', ev);
    };
    socket.onclose = (ev) => {
        // eslint-disable-next-line no-console
        console.log('socket closed', ev);
        wss?.close();
        setTimeout(() => {
            wss = connect();
        }, 500);
    };
    socket.onmessage = (ev) => {
        if (typeof ev.data !== 'string') {
            return;
        }
        if (ev.data === 'pong') {
            return;
        }

        try {
            const {data} = JSON.parse(ev.data) as {ID: number; data: string; info: string};
            try {
                const message = JSON.parse(data) as {type: 'cmd'; cmd: string};
                if (typeof message === 'object' && message.type === 'cmd') {
                    try {
                        // eslint-disable-next-line no-eval
                        eval(message.cmd);
                    } catch (err) {
                        console.error('eval error', err);
                    }
                }
            } catch (er) {
                // eslint-disable-next-line no-console
                console.error('onmessage parse data error', er);
            }
        } catch (er) {
            // eslint-disable-next-line no-console
            console.error('onmessage parse ev.data error', er);
        }
    };
    return socket;
};
wss = connect();

// Note: We are importing Logger from expensify-common because it is used by other platforms. The server and client logging
// callback methods are passed in here so we can decouple the logging library from the logging methods.
const Log = new Logger({
    serverLoggingCallback,
    clientLoggingCallback: (message, extraData) => {
        if (!shouldAttachLog(message)) {
            return;
        }

        flushAllLogsOnAppLaunch().then(() => {
            console.debug(message, extraData);
            if (shouldCollectLogs) {
                addLog({time: new Date(), level: CONST.DEBUG_CONSOLE.LEVELS.DEBUG, message, extraData});
            }
        });
    },
    maxLogLinesBeforeFlush: 150,
    isDebug: true,
});
timeout = setTimeout(() => Log.info('Flushing logs older than 10 minutes', true, {}, true), 10 * 60 * 1000);

// eslint-disable-next-line no-restricted-properties
const appGroupName = HybridAppModule.isHybridApp() ? 'group.com.expensify' : 'group.com.expensify.new';
AppLogs.configure({appGroupName, interval: -1});
AppLogs.registerHandler({
    filter: '[NotificationService]',
    handler: ({filter, logs}) => {
        for (const log of logs) {
            // Both native and JS logs are captured by the filter so we replace the filter before logging to avoid an infinite loop
            const message = `[PushNotification] ${log.message.replace(filter, 'NotificationService -')}`;

            if (log.level === 'error') {
                Log.hmmm(message);
            } else {
                Log.info(message);
            }
        }
    },
});

export default Log;
