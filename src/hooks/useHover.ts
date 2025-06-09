import {useIsFocused} from '@react-navigation/native';
import {useEffect, useState} from 'react';

const useHover = () => {
    const [hovered, setHovered] = useState(false);
    const isFocused = useIsFocused();
    // eslint-disable-next-line rulesdir/prefer-early-return
    useEffect(() => {
        if (!isFocused) {
            setHovered(false);
        }
    }, [isFocused]);
    return {
        hovered,
        bind: {
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
        },
    };
};

export default useHover;
