"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
module.exports = Active;
var _react = _interopRequireDefault(require("react"));
var _reactNativeEvent = require("react-native-event");
var _reactNativeContains = _interopRequireDefault(require("react-native-contains"));
function Active(param) {
    var children = param.children;
    var state = _react.default.useState(false);
    var isActive = state[0];
    var setIsActive = state[1];
    var ref = _react.default.useRef(null);
    (0, _reactNativeEvent).useEvent(function(event) {
        if (!isActive) return;
        if (ref.current && (0, _reactNativeContains).default(ref.current, event.target)) return;
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
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
