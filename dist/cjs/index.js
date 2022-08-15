// @ts-ignore
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ActiveBoundary: function() {
        return _activeBoundaryTsx.default;
    },
    Active: function() {
        return _activeTsx.default;
    }
});
var _activeBoundaryTsx = /*#__PURE__*/ _interopRequireDefault(require("./ActiveBoundary.js"));
var _activeTsx = /*#__PURE__*/ _interopRequireDefault(require("./Active.js"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}