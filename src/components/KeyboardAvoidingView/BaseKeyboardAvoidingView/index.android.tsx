import {NavigationContainerRefContext, NavigationContext} from '@react-navigation/native';
import React from 'react';
import type {KeyboardAvoidingViewProps} from 'react-native-keyboard-controller';
import {KeyboardAvoidingView as KeyboardAvoidingViewComponent} from 'react-native-keyboard-controller';

function BaseKeyboardAvoidingView(props: KeyboardAvoidingViewProps) {
    const root = React.useContext(NavigationContainerRefContext);
    const navigation = React.useContext(NavigationContext);

    return (
        <KeyboardAvoidingViewComponent
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            navigation={navigation ?? root}
        />
    );
}

BaseKeyboardAvoidingView.displayName = 'BaseKeyboardAvoidingView';

export default BaseKeyboardAvoidingView;
