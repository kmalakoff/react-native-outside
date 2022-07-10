import React from 'react';
import { useEvent } from 'react-native-event';
import contains from 'react-native-contains';
import { BoundaryProvider, useBoundary, useRef } from 'react-ref-boundary';
function Component({ children , isActive , setIsActive  }) {
    const ref = useRef(null);
    const boundary = useBoundary();
    useEvent((event)=>{
        if (!isActive) return;
        for(let i = 0; i < boundary.refs.length; i++){
            const x = boundary.refs[i];
            if (x.current && contains(x.current, event.target)) return;
        }
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
}
export default function ActiveBoundary({ children  }) {
    const state = React.useState(false);
    const isActive = state[0];
    const setIsActive = state[1];
    return /*#__PURE__*/ React.createElement(BoundaryProvider, null, /*#__PURE__*/ React.createElement(Component, {
        isActive: isActive,
        setIsActive: setIsActive
    }, children));
};
