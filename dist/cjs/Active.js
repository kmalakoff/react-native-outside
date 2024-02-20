"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return Active;
    }
});
var _react = require("react");
var _reactnativecontains = /*#__PURE__*/ _interop_require_default(require("react-native-contains"));
var _reactnativeevent = require("react-native-event");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function Active(param) {
    var children = param.children;
    var state = (0, _react.useState)(false);
    var isActive = state[0];
    var setIsActive = state[1];
    var ref = (0, _react.useRef)(null);
    (0, _reactnativeevent.useEvent)(function(event) {
        if (!isActive) return;
        if (ref.current && (0, _reactnativecontains.default)(ref.current, event.target)) return;
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
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }