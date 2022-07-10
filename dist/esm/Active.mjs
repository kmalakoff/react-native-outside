import React from 'react';
import { useEvent } from 'react-native-event';
import contains from 'react-native-contains';
export default function Active({ children  }) {
    const state = React.useState(false);
    const isActive = state[0];
    const setIsActive = state[1];
    const ref = React.useRef(null);
    useEvent((event)=>{
        if (!isActive) return;
        if (ref.current && contains(ref.current, event.target)) return;
        setIsActive(false);
    }, [
        isActive,
        setIsActive
    ]);
    return /*#__PURE__*/ React.createElement(React.Fragment, null, React.Children.map(children, (child)=>/*#__PURE__*/ React.isValidElement(child) ? /*#__PURE__*/ React.cloneElement(child, {
            isActive,
            setIsActive,
            ref
        }) : child));
};
