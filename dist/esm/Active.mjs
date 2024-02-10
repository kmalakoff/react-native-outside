import { useState, useRef, Fragment, Children, isValidElement, cloneElement, createElement } from 'react';
import { useEvent } from 'react-native-event';
import contains from 'react-native-contains';
export default function Active({ children  }) {
    const state = useState(false);
    const isActive = state[0];
    const setIsActive = state[1];
    const ref = useRef(null);
    useEvent((event)=>{
        if (!isActive) return;
        if (ref.current && contains(ref.current, event.target)) return;
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
};
