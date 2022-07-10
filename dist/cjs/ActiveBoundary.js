"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
module.exports = ActiveBoundary;
var _react = _interopRequireDefault(require("react"));
var _reactNativeEvent = require("react-native-event");
var _reactNativeContains = _interopRequireDefault(require("react-native-contains"));
var _reactRefBoundary = require("react-ref-boundary");
function ActiveBoundary(param) {
    var children = param.children;
    var state = _react.default.useState(false);
    var isActive = state[0];
    var setIsActive = state[1];
    return /*#__PURE__*/ _react.default.createElement(_reactRefBoundary.BoundaryProvider, null, /*#__PURE__*/ _react.default.createElement(Component, {
        isActive: isActive,
        setIsActive: setIsActive
    }, children));
}
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function Component(param) {
    var children = param.children, isActive = param.isActive, setIsActive = param.setIsActive;
    var ref = (0, _reactRefBoundary).useRef(null);
    var boundary = (0, _reactRefBoundary).useBoundary();
    (0, _reactNativeEvent).useEvent(function(event) {
        if (!isActive) return;
        for(var i = 0; i < boundary.refs.length; i++){
            var x = boundary.refs[i];
            if (x.current && (0, _reactNativeContains).default(x.current, event.target)) return;
        }
        setIsActive(false);
    }, [
        isActive,
        setIsActive
    ]);
    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, _react.default.Children.map(children, function(child) {
        return /*#__PURE__*/ _react.default.isValidElement(child) ? /*#__PURE__*/ _react.default.cloneElement(child, {
            isActive: isActive,
            setIsActive: setIsActive,
            ref: ref
        }) : child;
    }));
}
