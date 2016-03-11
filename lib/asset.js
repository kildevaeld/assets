"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Asset = function () {
    function Asset() {
        var file = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Asset);

        this._attributes = file;
        if (!this._attributes['meta']) this._attributes['meta'] = {};
    }

    _createClass(Asset, [{
        key: 'get',
        value: function get(key) {
            return this._attributes[key];
        }
    }, {
        key: 'setMeta',
        value: function setMeta(key, value) {
            this._attributes['meta'][key] = value;
            return this;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this._attributes;
        }
    }, {
        key: 'id',
        set: function set(id) {
            this._attributes['id'] = id;
        },
        get: function get() {
            return this.get('id');
        }
    }, {
        key: 'name',
        get: function get() {
            return this.get('name');
        },
        set: function set(name) {
            this._attributes['name'] = name;
        }
    }, {
        key: 'filename',
        get: function get() {
            return this.get('filename');
        },
        set: function set(filename) {
            this._attributes['filename'] = filename;
        }
    }, {
        key: 'path',
        get: function get() {
            return this.get('path');
        },
        set: function set(path) {
            this._attributes['path'] = path;
        }
    }, {
        key: 'mime',
        get: function get() {
            return this.get('mime');
        },
        set: function set(mime) {
            this._attributes['mime'] = mime;
        }
    }, {
        key: 'size',
        get: function get() {
            return this.get('size');
        },
        set: function set(size) {
            this._attributes['size'] = size;
        }
    }, {
        key: 'meta',
        get: function get() {
            return this._attributes['meta'];
        }
    }]);

    return Asset;
}();

exports.Asset = Asset;