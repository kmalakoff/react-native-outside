"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return ActiveBoundary;
    }
});
var _react = require("react");
var _reactNativeContains = /*#__PURE__*/ _interopRequireDefault(require("react-native-contains"));
var _reactNativeEvent = require("react-native-event");
var _reactRefBoundary = require("react-ref-boundary");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function Component(param) {
    var children = param.children, isActive = param.isActive, setIsActive = param.setIsActive;
    var ref = (0, _reactRefBoundary.useRef)(null);
    var boundary = (0, _reactRefBoundary.useBoundary)();
    (0, _reactNativeEvent.useEvent)(function(event) {
        if (!isActive) return;
        for(var i = 0; i < boundary.refs.length; i++){
            var x = boundary.refs[i];
            if (x.current && (0, _reactNativeContains.default)(x.current, event.target)) return;
        }
        setIsActive(false);
    }, [
        isActive,
        setIsActive
    ]);
    return (0, _react.createElement)(_react.Fragment, null, _react.Children.map(children, function(child) {
        return (0, _react.isValidElement)(child) ? (0, _react.cloneElement)(child, {
            isActive: isActive,
            setIsActive: setIsActive,
            ref: ref
        }) : child;
    }));
}
function ActiveBoundary(param) {
    var children = param.children;
    var state = (0, _react.useState)(false);
    var isActive = state[0];
    var setIsActive = state[1];
    return (0, _react.createElement)(_reactRefBoundary.BoundaryProvider, null, (0, _react.createElement)(Component, {
        isActive: isActive,
        setIsActive: setIsActive
    }, children));
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}