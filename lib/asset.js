"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var events_1 = require('events');
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

var Asset = function (_events_1$EventEmitte) {
    _inherits(Asset, _events_1$EventEmitte);

    function Asset() {
        var file = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Asset);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Asset).call(this));

        _this._attributes = file;
        if (!_this._attributes['meta']) _this._attributes['meta'] = {};
        if (!file.ctime) file.ctime = new Date();
        if (!file.mtime) file.mtime = file.ctime;
        if (file.hidden == null) file.hidden = false;
        return _this;
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
}(events_1.EventEmitter);

__decorate([observe], Asset.prototype, "name", null);
__decorate([observe], Asset.prototype, "filename", null);
__decorate([observe], Asset.prototype, "path", null);
__decorate([observe], Asset.prototype, "mime", null);
__decorate([observe], Asset.prototype, "size", null);
__decorate([observe], Asset.prototype, "ctime", null);
__decorate([observe], Asset.prototype, "mtime", null);
__decorate([observe], Asset.prototype, "hidden", null);
exports.Asset = Asset;
//# sourceMappingURL=data:application/json;base64,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QnpCO0FBSUEsV0FBQSxDQUFDLE9BQUQsQ0FBQSxFRGdCRCxNQUFNLFNBQU4sRUFBaUIsUUNoQmhCLEVEZ0IwQixJQ2hCMUI7QUFyQ1MsUUFBQSxLQUFBLEdBQUssS0FBTCIsImZpbGUiOiJhc3NldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuY29uc3QgZXZlbnRzXzEgPSByZXF1aXJlKCdldmVudHMnKTtcbmNvbnN0IFBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5mdW5jdGlvbiBvYnNlcnZlKHRhcmdldCwga2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgbGV0IG9zZXQgPSBkZXNjcmlwdG9yLnNldDtcbiAgICBkZXNjcmlwdG9yLnNldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBsZXQgb2xkVmFsdWUgPSB0aGlzW2tleV07XG4gICAgICAgIG9zZXQuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5lbWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZTonICsga2V5LCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydHMub2JzZXJ2ZSA9IG9ic2VydmU7XG5jbGFzcyBBc3NldCBleHRlbmRzIGV2ZW50c18xLkV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3IoZmlsZSA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSBmaWxlO1xuICAgICAgICBpZiAoIXRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXSlcbiAgICAgICAgICAgIHRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXSA9IHt9O1xuICAgICAgICBpZiAoIWZpbGUuY3RpbWUpXG4gICAgICAgICAgICBmaWxlLmN0aW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgaWYgKCFmaWxlLm10aW1lKVxuICAgICAgICAgICAgZmlsZS5tdGltZSA9IGZpbGUuY3RpbWU7XG4gICAgICAgIGlmIChmaWxlLmhpZGRlbiA9PSBudWxsKVxuICAgICAgICAgICAgZmlsZS5oaWRkZW4gPSBmYWxzZTtcbiAgICB9XG4gICAgc2V0IGlkKGlkKSB7IHRoaXMuX2F0dHJpYnV0ZXNbJ2lkJ10gPSBpZDsgfVxuICAgIGdldCBpZCgpIHsgcmV0dXJuIHRoaXMuZ2V0KCdpZCcpOyB9XG4gICAgZ2V0IG5hbWUoKSB7IHJldHVybiB0aGlzLmdldCgnbmFtZScpOyB9XG4gICAgc2V0IG5hbWUobmFtZSkgeyB0aGlzLl9hdHRyaWJ1dGVzWyduYW1lJ10gPSBuYW1lOyB9XG4gICAgZ2V0IGZpbGVuYW1lKCkgeyByZXR1cm4gdGhpcy5nZXQoJ2ZpbGVuYW1lJyk7IH1cbiAgICBzZXQgZmlsZW5hbWUoZmlsZW5hbWUpIHsgdGhpcy5fYXR0cmlidXRlc1snZmlsZW5hbWUnXSA9IGZpbGVuYW1lOyB9XG4gICAgZ2V0IHBhdGgoKSB7IHJldHVybiB0aGlzLmdldCgncGF0aCcpOyB9XG4gICAgc2V0IHBhdGgocGF0aCkgeyB0aGlzLl9hdHRyaWJ1dGVzWydwYXRoJ10gPSBwYXRoOyB9XG4gICAgZ2V0IG1pbWUoKSB7IHJldHVybiB0aGlzLmdldCgnbWltZScpOyB9XG4gICAgc2V0IG1pbWUobWltZSkgeyB0aGlzLl9hdHRyaWJ1dGVzWydtaW1lJ10gPSBtaW1lOyB9XG4gICAgZ2V0IHNpemUoKSB7IHJldHVybiB0aGlzLmdldCgnc2l6ZScpOyB9XG4gICAgc2V0IHNpemUoc2l6ZSkgeyB0aGlzLl9hdHRyaWJ1dGVzWydzaXplJ10gPSBzaXplOyB9XG4gICAgZ2V0IGN0aW1lKCkgeyByZXR1cm4gdGhpcy5nZXQoJ2N0aW1lJyk7IH1cbiAgICBzZXQgY3RpbWUodGltZSkgeyB0aGlzLl9hdHRyaWJ1dGVzWydjdGltZSddID0gdGltZTsgfVxuICAgIGdldCBtdGltZSgpIHsgcmV0dXJuIHRoaXMuZ2V0KCdtdGltZScpOyB9XG4gICAgc2V0IG10aW1lKHRpbWUpIHsgdGhpcy5fYXR0cmlidXRlc1snbXRpbWUnXSA9IHRpbWU7IH1cbiAgICBnZXQgaGlkZGVuKCkgeyByZXR1cm4gdGhpcy5nZXQoJ2hpZGRlbicpOyB9XG4gICAgc2V0IGhpZGRlbihoaWRkZW4pIHsgdGhpcy5fYXR0cmlidXRlc1snaGlkZGVuJ10gPSBoaWRkZW47IH1cbiAgICBnZXQgbWV0YSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXTtcbiAgICB9XG4gICAgZ2V0IGZ1bGxQYXRoKCkge1xuICAgICAgICByZXR1cm4gUGF0aC5qb2luKHRoaXMucGF0aCwgdGhpcy5maWxlbmFtZSk7XG4gICAgfVxuICAgIGdldChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXNba2V5XTtcbiAgICB9XG4gICAgc2V0TWV0YShrZXksIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXVtrZXldID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzO1xuICAgIH1cbiAgICB2YWxpZGRhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpemUgIT0gbnVsbCAmJiB0aGlzLmZpbGVuYW1lICE9IG51bGwgJiYgdGhpcy5wYXRoICE9IFwiXCIgJiYgdGhpcy5taW1lICE9IG51bGw7XG4gICAgfVxufVxuX19kZWNvcmF0ZShbXG4gICAgb2JzZXJ2ZVxuXSwgQXNzZXQucHJvdG90eXBlLCBcIm5hbWVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBvYnNlcnZlXG5dLCBBc3NldC5wcm90b3R5cGUsIFwiZmlsZW5hbWVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBvYnNlcnZlXG5dLCBBc3NldC5wcm90b3R5cGUsIFwicGF0aFwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIG9ic2VydmVcbl0sIEFzc2V0LnByb3RvdHlwZSwgXCJtaW1lXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgb2JzZXJ2ZVxuXSwgQXNzZXQucHJvdG90eXBlLCBcInNpemVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBvYnNlcnZlXG5dLCBBc3NldC5wcm90b3R5cGUsIFwiY3RpbWVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBvYnNlcnZlXG5dLCBBc3NldC5wcm90b3R5cGUsIFwibXRpbWVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBvYnNlcnZlXG5dLCBBc3NldC5wcm90b3R5cGUsIFwiaGlkZGVuXCIsIG51bGwpO1xuZXhwb3J0cy5Bc3NldCA9IEFzc2V0O1xuIiwiXG5pbXBvcnQge0lGaWxlfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG9ic2VydmUodGFyZ2V0LCBrZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgbGV0IG9zZXQgPSBkZXNjcmlwdG9yLnNldDtcbiAgICBcbiAgICBkZXNjcmlwdG9yLnNldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBsZXQgb2xkVmFsdWUgPSB0aGlzW2tleV07XG4gICAgICAgIG9zZXQuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5lbWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZTonICsga2V5LCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2V0T3B0aW9ucyB7XG4gICAgLyoqICBVbmlxdWUgaWQgZm9yIHRoZSBhc3NldC4gU2hvdWxkIGJlIGdlbmVyYXRlZCBieSB0aGUgbWV0YVN0b3JlICovXG4gICAgaWQ/OiBzdHJpbmc7XG4gICAgLyoqICBBcmJpdHJhcnkgZm9yIHRoZSBmaWxlLiAqL1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgLyoqIEZpbGUgbmFtZSAqL1xuICAgIGZpbGVuYW1lPzogc3RyaW5nO1xuICAgIC8qKiBwYXRoIHRvIGZpbGUgKHdpdGhvdXQgdGhlIGZpbGVuYW1lIGFuZCBwcmVmaXhlZCB3aXRoICcvJykgKi9cbiAgICBwYXRoPzogc3RyaW5nO1xuICAgIC8qKiBUaGUgbWltZSBmaWxlIG9mIHRoZSBmaWxlICovXG4gICAgbWltZT86IHN0cmluZztcbiAgICAvKiogVGhlIHNpemUgb2YgdGhlIGZpbGUgaW4gYnl0ZXMqL1xuICAgIHNpemU/OiBudW1iZXI7XG4gICAgLyoqIENyZWF0aW9uIGRhdGUgKi9cbiAgICBjdGltZT86IERhdGU7XG4gICAgLyoqIE1vZGlmaWNhdGlvbiBkYXRlICovXG4gICAgbXRpbWU/OiBEYXRlO1xuICAgIC8qKiBNZXRhIGRhdGEgKi9cbiAgICBtZXRhPzoge1trZXk6IHN0cmluZ106IGFueSB9O1xuICAgIC8qKiBIaWRkZW4gKi9cbiAgICBoaWRkZW4/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIgaW1wbGVtZW50cyBJRmlsZSB7XG4gICAgcHJpdmF0ZSBfYXR0cmlidXRlczoge1trZXk6c3RyaW5nXTogYW55fTtcbiAgICBcbiAgICBzZXQgaWQgKGlkOiBzdHJpbmcpIHsgdGhpcy5fYXR0cmlidXRlc1snaWQnXSA9IGlkOyB9XG4gICAgZ2V0IGlkICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXQoJ2lkJyk7IH1cbiAgICBcbiAgICBAb2JzZXJ2ZVxuICAgIC8qKiBOYW1lIG9mIHRoZSBhc3NldCAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmdldCgnbmFtZScpO31cbiAgICBzZXQgbmFtZShuYW1lOnN0cmluZykgeyAgdGhpcy5fYXR0cmlidXRlc1snbmFtZSddID0gbmFtZTsgfVxuICAgIFxuICAgIEBvYnNlcnZlXG4gICAgLyoqIFRoZSBmaWxlIG5hbWUgb2YgdGhlIGFzc2V0ICovXG4gICAgZ2V0IGZpbGVuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmdldCgnZmlsZW5hbWUnKTt9XG4gICAgc2V0IGZpbGVuYW1lKGZpbGVuYW1lOnN0cmluZykgeyAgdGhpcy5fYXR0cmlidXRlc1snZmlsZW5hbWUnXSA9IGZpbGVuYW1lOyB9XG4gICAgXG4gICAgQG9ic2VydmVcbiAgICAvKiogVGhlIHBhdGggb2YgdGhlIGFzc2V0ICovXG4gICAgZ2V0IHBhdGgoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZ2V0KCdwYXRoJyk7fVxuICAgIHNldCBwYXRoKHBhdGg6c3RyaW5nKSB7ICB0aGlzLl9hdHRyaWJ1dGVzWydwYXRoJ10gPSBwYXRoOyB9XG4gICAgXG4gICAgQG9ic2VydmVcbiAgICBnZXQgbWltZSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXQoJ21pbWUnKTt9XG4gICAgc2V0IG1pbWUobWltZTpzdHJpbmcpIHsgIHRoaXMuX2F0dHJpYnV0ZXNbJ21pbWUnXSA9IG1pbWU7IH1cbiAgICBcbiAgICBAb2JzZXJ2ZVxuICAgIGdldCBzaXplKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldCgnc2l6ZScpO31cbiAgICBzZXQgc2l6ZShzaXplOm51bWJlcikgeyAgdGhpcy5fYXR0cmlidXRlc1snc2l6ZSddID0gc2l6ZTsgfVxuICAgIFxuICAgIEBvYnNlcnZlXG4gICAgZ2V0IGN0aW1lKCk6IERhdGUgeyByZXR1cm4gdGhpcy5nZXQoJ2N0aW1lJyk7IH1cbiAgICBzZXQgY3RpbWUodGltZTogRGF0ZSkgeyB0aGlzLl9hdHRyaWJ1dGVzWydjdGltZSddID0gdGltZTsgfVxuICAgIFxuICAgIEBvYnNlcnZlXG4gICAgZ2V0IG10aW1lKCk6IERhdGUgeyByZXR1cm4gdGhpcy5nZXQoJ210aW1lJyk7IH1cbiAgICBzZXQgbXRpbWUodGltZTogRGF0ZSkgeyB0aGlzLl9hdHRyaWJ1dGVzWydtdGltZSddID0gdGltZTsgfVxuICAgIFxuICAgIEBvYnNlcnZlXG4gICAgZ2V0IGhpZGRlbigpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZ2V0KCdoaWRkZW4nKTsgfVxuICAgIHNldCBoaWRkZW4oaGlkZGVuOmJvb2xlYW4pIHsgdGhpcy5fYXR0cmlidXRlc1snaGlkZGVuJ10gPSBoaWRkZW47IH1cbiAgICBcbiAgICBnZXQgbWV0YSgpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzWydtZXRhJ107XG4gICAgfVxuICAgIFxuICAgIGdldCBmdWxsUGF0aCAoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIFBhdGguam9pbih0aGlzLnBhdGgsIHRoaXMuZmlsZW5hbWUpO1xuICAgIH1cbiAgICBcbiAgICBnZXQ8VD4oa2V5OiBzdHJpbmcpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXR0cmlidXRlc1trZXldO1xuICAgIH1cbiAgICBcbiAgICBzZXRNZXRhKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXVtrZXldID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICB0b0pTT04oKTogSUZpbGUge1xuICAgICAgICByZXR1cm4gPElGaWxlPnRoaXMuX2F0dHJpYnV0ZXNcbiAgICB9XG4gICAgXG4gICAgdmFsaWRkYXRhICgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZSAhPSBudWxsICYmIHRoaXMuZmlsZW5hbWUgIT0gbnVsbCAmJiB0aGlzLnBhdGggIT0gXCJcIiAmJiB0aGlzLm1pbWUgIT0gbnVsbDtcbiAgICB9IFxuICAgIFxuICAgIGNvbnN0cnVjdG9yKGZpbGU6QXNzZXRPcHRpb25zPXt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSBmaWxlOyAgIFxuICAgICAgICBpZiAoIXRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXSkgdGhpcy5fYXR0cmlidXRlc1snbWV0YSddID0ge307XG4gICAgICAgIFxuICAgICAgICBpZiAoIWZpbGUuY3RpbWUpIGZpbGUuY3RpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBpZiAoIWZpbGUubXRpbWUpIGZpbGUubXRpbWUgPSBmaWxlLmN0aW1lO1xuICAgICAgICBcbiAgICAgICAgaWYgKGZpbGUuaGlkZGVuID09IG51bGwpIGZpbGUuaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIFxuICAgIH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
