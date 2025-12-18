import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Keyboard} from 'react-native';
import type {View} from 'react-native';
import {isMobileChrome, isMobileSafari} from '@libs/Browser';
import {canUseTouchScreen} from '@libs/DeviceCapabilities';
import mergeRefs from '@libs/mergeRefs';
import addViewportResizeListener from '@libs/VisualViewport';
import CONST from '@src/CONST';
import BaseSelectionList from './BaseSelectionListWithSections';
import type {ListItem, SelectionListHandle, SelectionListProps} from './types';

function SelectionListWithSections<TItem extends ListItem>({onScroll, shouldHideKeyboardOnScroll = true, ref, onContentSizeChange, ...props}: SelectionListProps<TItem>) {
    const [isScreenTouched, setIsScreenTouched] = useState(false);
    const isScreenTouchedRef = useRef(false);
    const [shouldDisableHoverStyle, setShouldDisableHoverStyle] = useState(false);

    const touchStart = () => {
        setIsScreenTouched(true);
        isScreenTouchedRef.current = true;
    };
    const touchEnd = () => {
        setIsScreenTouched(false);
        isScreenTouchedRef.current = false;
    };

    useEffect(() => {
        if (!canUseTouchScreen()) {
            return;
        }

        // We're setting `isScreenTouched` in this listener only for web platforms with touchscreen (mWeb) where
        // we want to dismiss the keyboard only when the list is scrolled by the user and not when it's scrolled programmatically.
        document.addEventListener('touchstart', touchStart);
        document.addEventListener('touchend', touchEnd);

        return () => {
            document.removeEventListener('touchstart', touchStart);
            document.removeEventListener('touchend', touchEnd);
        };
    }, []);

    const [shouldDebounceScrolling, setShouldDebounceScrolling] = useState(false);

    const checkShouldDebounceScrolling = (event: KeyboardEvent) => {
        if (!event) {
            return;
        }

        // Moving through items using the keyboard triggers scrolling by the browser, so we debounce programmatic scrolling to prevent jittering.
        if (
            event.key === CONST.KEYBOARD_SHORTCUTS.ARROW_DOWN.shortcutKey ||
            event.key === CONST.KEYBOARD_SHORTCUTS.ARROW_UP.shortcutKey ||
            event.key === CONST.KEYBOARD_SHORTCUTS.TAB.shortcutKey
        ) {
            setShouldDebounceScrolling(event.type === 'keydown');
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', checkShouldDebounceScrolling, {passive: true});
        document.addEventListener('keyup', checkShouldDebounceScrolling, {passive: true});

        return () => {
            document.removeEventListener('keydown', checkShouldDebounceScrolling);
            document.removeEventListener('keyup', checkShouldDebounceScrolling);
        };
    }, []);

    const hasScrollRef = useRef(false);
    // In SearchPageBottomTab we use useAnimatedScrollHandler from reanimated(for performance reasons) and it returns object instead of function. In that case we cannot change it to a function call, that's why we have to choose between onScroll and defaultOnScroll.
    const defaultOnScroll = () => {
        hasScrollRef.current = true;
        // Only dismiss the keyboard whenever the user scrolls the screen or `shouldHideKeyboardOnScroll` is true
        if (!isScreenTouched || !shouldHideKeyboardOnScroll) {
            return;
        }
        Keyboard.dismiss();
    };

    const outerViewRef = useRef<View>(null);
    const listRef = useRef<SelectionListHandle>(null);
    const contentHeightRef = useRef(0);
    const onContentSizeChangeHandler = useCallback(
        (w: number, h: number) => {
            onContentSizeChange?.(w, h);
            contentHeightRef.current = h;
        },
        [onContentSizeChange],
    );
    const viewportResizeHander = () => {
        if (!isMobileSafari() || isScreenTouchedRef.current || !hasScrollRef.current) {
            return;
        }
        hasScrollRef.current = false;
        outerViewRef.current?.measureInWindow((x, y, w, h) => {
            if (h < contentHeightRef.current) {
                return;
            }
            listRef.current?.scrollToIndex(0);
        });
    };
    useEffect(() => addViewportResizeListener(viewportResizeHander), []);
    useEffect(() => {
        if (isScreenTouched) {
            return;
        }
        viewportResizeHander();
    }, [isScreenTouched]);

    useEffect(() => {
        if (canUseTouchScreen()) {
            return;
        }

        let lastClientX = 0;
        let lastClientY = 0;
        const mouseMoveHandler = (event: MouseEvent) => {
            // On Safari, scrolling can also trigger a mousemove event,
            // so this comparison is needed to filter out cases where the mouse hasn't actually moved.
            if (event.clientX === lastClientX && event.clientY === lastClientY) {
                return;
            }

            lastClientX = event.clientX;
            lastClientY = event.clientY;

            setShouldDisableHoverStyle(false);
        };
        const wheelHandler = () => setShouldDisableHoverStyle(false);

        document.addEventListener('mousemove', mouseMoveHandler, {passive: true});
        document.addEventListener('wheel', wheelHandler, {passive: true});
        return () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('wheel', wheelHandler);
        };
    }, []);

    return (
        <BaseSelectionList
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            ref={mergeRefs(ref, listRef)}
            outerViewRef={outerViewRef}
            onScroll={onScroll ?? defaultOnScroll}
            // Ignore the focus if it's caused by a touch event on mobile chrome.
            // For example, a long press will trigger a focus event on mobile chrome.
            shouldIgnoreFocus={isMobileChrome() && isScreenTouched}
            shouldDebounceScrolling={shouldDebounceScrolling}
            isRowMultilineSupported
            shouldDisableHoverStyle={shouldDisableHoverStyle}
            setShouldDisableHoverStyle={setShouldDisableHoverStyle}
            onContentSizeChange={onContentSizeChangeHandler}
        />
    );
}

export default SelectionListWithSections;
