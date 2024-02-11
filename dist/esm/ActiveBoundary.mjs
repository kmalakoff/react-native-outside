import { Children, Fragment, cloneElement, createElement, isValidElement, useState } from 'react';
import contains from 'react-native-contains';
import { useEvent } from 'react-native-event';
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
    return createElement(Fragment, null, Children.map(children, (child)=>isValidElement(child) ? cloneElement(child, {
            isActive,
            setIsActive,
            ref
        }) : child));
}
export default function ActiveBoundary({ children  }) {
    const state = useState(false);
    const isActive = state[0];
    const setIsActive = state[1];
    return createElement(BoundaryProvider, null, createElement(Component, {
        isActive,
        setIsActive
    }, children));
};
