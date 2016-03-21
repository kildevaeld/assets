"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Path = require('path');
function observe(target, key, descriptor) {
    var oset = descriptor.set;
    descriptor.set = function (value) {
        var oldValue = this[key];
        oset.call(this, value);
        if (typeof this.emit === 'function') {
            this.emit('change:' + key, oldValue, value);
        }
    };
}
exports.observe = observe;

var Asset = function () {
    function Asset() {
        var file = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Asset);

        this._attributes = file;
        if (!this._attributes['meta']) this._attributes['meta'] = {};
        if (!file.ctime) file.ctime = new Date().getTime() / 1000;
        if (!file.mtime) file.mtime = file.ctime;
        if (file.hidden == null) file.hidden = false;
    }

    _createClass(Asset, [{
        key: "get",
        value: function get(key) {
            return this._attributes[key];
        }
    }, {
        key: "setMeta",
        value: function setMeta(key, value) {
            this._attributes['meta'][key] = value;
            return this;
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            return this._attributes;
        }
    }, {
        key: "validdata",
        value: function validdata() {
            return this.size != null && this.filename != null && this.path != "" && this.mime != null;
        }
    }, {
        key: "id",
        set: function set(id) {
            this._attributes['id'] = id;
        },
        get: function get() {
            return this.get('id');
        }
    }, {
        key: "name",
        get: function get() {
            return this.get('name');
        },
        set: function set(name) {
            this._attributes['name'] = name;
        }
    }, {
        key: "filename",
        get: function get() {
            return this.get('filename');
        },
        set: function set(filename) {
            this._attributes['filename'] = filename;
        }
    }, {
        key: "path",
        get: function get() {
            return this.get('path');
        },
        set: function set(path) {
            this._attributes['path'] = path;
        }
    }, {
        key: "mime",
        get: function get() {
            return this.get('mime');
        },
        set: function set(mime) {
            this._attributes['mime'] = mime;
        }
    }, {
        key: "size",
        get: function get() {
            return this.get('size');
        },
        set: function set(size) {
            this._attributes['size'] = size;
        }
    }, {
        key: "ctime",
        get: function get() {
            return this.get('ctime');
        },
        set: function set(time) {
            this._attributes['ctime'] = time;
        }
    }, {
        key: "mtime",
        get: function get() {
            return this.get('mtime');
        },
        set: function set(time) {
            this._attributes['mtime'] = time;
        }
    }, {
        key: "hidden",
        get: function get() {
            return this.get('hidden');
        },
        set: function set(hidden) {
            this._attributes['hidden'] = hidden;
        }
    }, {
        key: "meta",
        get: function get() {
            return this._attributes['meta'];
        }
    }, {
        key: "fullPath",
        get: function get() {
            return Path.join(this.path, this.filename);
        }
    }]);

    return Asset;
}();

__decorate([observe], Asset.prototype, "name", null);
__decorate([observe], Asset.prototype, "filename", null);
__decorate([observe], Asset.prototype, "path", null);
__decorate([observe], Asset.prototype, "mime", null);
__decorate([observe], Asset.prototype, "size", null);
__decorate([observe], Asset.prototype, "ctime", null);
__decorate([observe], Asset.prototype, "mtime", null);
__decorate([observe], Asset.prototype, "hidden", null);
exports.Asset = Asset;