// eslint-disable-next-line no-restricted-imports
import FontUtils from '@styles/utils/FontUtils';
import type EmojiDefaultStyles from './types';

const emojiDefaultStyles: EmojiDefaultStyles = {
    ...FontUtils.fontFamily.platform.EXP_NEUE,
    verticalAlign: 'top',
    fontStyle: 'normal', // remove italic
    textDecoration: 'none', // remove strikethrough
    display: 'inline-block',
};

export default emojiDefaultStyles;
