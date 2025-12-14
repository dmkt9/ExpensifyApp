import type {ValueOf} from 'type-fest';
import type Form from './Form';

const INPUT_IDS = {
    EMOJI_CODE: 'emojiCode',
    STATUS_TEXT: 'statusText',
    clearAfter: 'clearAfter',
    VACATION_DELEGATE_ERROR: 'vacationDelegateError',
} as const;

type InputID = ValueOf<typeof INPUT_IDS>;

type SettingsStatusSetForm = Form<
    InputID,
    {
        [INPUT_IDS.EMOJI_CODE]: string;
        [INPUT_IDS.STATUS_TEXT]: string;
        [INPUT_IDS.clearAfter]: string;
        [INPUT_IDS.VACATION_DELEGATE_ERROR]: string;
    }
>;

// eslint-disable-next-line import/prefer-default-export
export type {SettingsStatusSetForm};
export default INPUT_IDS;
