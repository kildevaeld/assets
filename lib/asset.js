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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0LmpzIiwiYXNzZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0FBQ0EsSUFBSSxhQUFhLFNBQUMsSUFBUSxVQUFLLFVBQUwsSUFBb0IsVUFBVSxVQUFWLEVBQXNCLE1BQXRCLEVBQThCLEdBQTlCLEVBQW1DLElBQW5DLEVBQXlDO0FBQ25GLFFBQUksSUFBSSxVQUFVLE1BQVY7UUFBa0IsSUFBSSxJQUFJLENBQUosR0FBUSxNQUFSLEdBQWlCLFNBQVMsSUFBVCxHQUFnQixPQUFPLE9BQU8sd0JBQVAsQ0FBZ0MsTUFBaEMsRUFBd0MsR0FBeEMsQ0FBUCxHQUFzRCxJQUF0RTtRQUE0RSxDQUEzSCxDQURtRjtBQUVuRixRQUFJLFFBQU8seURBQVAsS0FBbUIsUUFBbkIsSUFBK0IsT0FBTyxRQUFRLFFBQVIsS0FBcUIsVUFBNUIsRUFBd0MsSUFBSSxRQUFRLFFBQVIsQ0FBaUIsVUFBakIsRUFBNkIsTUFBN0IsRUFBcUMsR0FBckMsRUFBMEMsSUFBMUMsQ0FBSixDQUEzRSxLQUNLLEtBQUssSUFBSSxJQUFJLFdBQVcsTUFBWCxHQUFvQixDQUFwQixFQUF1QixLQUFLLENBQUwsRUFBUSxHQUE1QztBQUFpRCxZQUFJLElBQUksV0FBVyxDQUFYLENBQUosRUFBbUIsSUFBSSxDQUFDLElBQUksQ0FBSixHQUFRLEVBQUUsQ0FBRixDQUFSLEdBQWUsSUFBSSxDQUFKLEdBQVEsRUFBRSxNQUFGLEVBQVUsR0FBVixFQUFlLENBQWYsQ0FBUixHQUE0QixFQUFFLE1BQUYsRUFBVSxHQUFWLENBQTVCLENBQWhCLElBQStELENBQS9ELENBQTNCO0tBQWpELE9BQ0UsSUFBSSxDQUFKLElBQVMsQ0FBVCxJQUFjLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixHQUE5QixFQUFtQyxDQUFuQyxDQUFkLEVBQXFELENBQXJELENBSjRFO0NBQXpDO0FDRTlDLElBQVksT0FBSSxRQUFNLE1BQU4sQ0FBSjtBQUVaLFNBQUEsT0FBQSxDQUF3QixNQUF4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SUNmMUI7QUFyQ1MsUUFBQSxLQUFBLEdBQUssS0FBTCIsImZpbGUiOiJhc3NldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmZ1bmN0aW9uIG9ic2VydmUodGFyZ2V0LCBrZXksIGRlc2NyaXB0b3IpIHtcbiAgICBsZXQgb3NldCA9IGRlc2NyaXB0b3Iuc2V0O1xuICAgIGRlc2NyaXB0b3Iuc2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGxldCBvbGRWYWx1ZSA9IHRoaXNba2V5XTtcbiAgICAgICAgb3NldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlOicgKyBrZXksIG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0cy5vYnNlcnZlID0gb2JzZXJ2ZTtcbmNsYXNzIEFzc2V0IHtcbiAgICBjb25zdHJ1Y3RvcihmaWxlID0ge30pIHtcbiAgICAgICAgdGhpcy5fYXR0cmlidXRlcyA9IGZpbGU7XG4gICAgICAgIGlmICghdGhpcy5fYXR0cmlidXRlc1snbWV0YSddKVxuICAgICAgICAgICAgdGhpcy5fYXR0cmlidXRlc1snbWV0YSddID0ge307XG4gICAgICAgIGlmICghZmlsZS5jdGltZSlcbiAgICAgICAgICAgIGZpbGUuY3RpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgIGlmICghZmlsZS5tdGltZSlcbiAgICAgICAgICAgIGZpbGUubXRpbWUgPSBmaWxlLmN0aW1lO1xuICAgICAgICBpZiAoZmlsZS5oaWRkZW4gPT0gbnVsbClcbiAgICAgICAgICAgIGZpbGUuaGlkZGVuID0gZmFsc2U7XG4gICAgfVxuICAgIHNldCBpZChpZCkgeyB0aGlzLl9hdHRyaWJ1dGVzWydpZCddID0gaWQ7IH1cbiAgICBnZXQgaWQoKSB7IHJldHVybiB0aGlzLmdldCgnaWQnKTsgfVxuICAgIGdldCBuYW1lKCkgeyByZXR1cm4gdGhpcy5nZXQoJ25hbWUnKTsgfVxuICAgIHNldCBuYW1lKG5hbWUpIHsgdGhpcy5fYXR0cmlidXRlc1snbmFtZSddID0gbmFtZTsgfVxuICAgIGdldCBmaWxlbmFtZSgpIHsgcmV0dXJuIHRoaXMuZ2V0KCdmaWxlbmFtZScpOyB9XG4gICAgc2V0IGZpbGVuYW1lKGZpbGVuYW1lKSB7IHRoaXMuX2F0dHJpYnV0ZXNbJ2ZpbGVuYW1lJ10gPSBmaWxlbmFtZTsgfVxuICAgIGdldCBwYXRoKCkgeyByZXR1cm4gdGhpcy5nZXQoJ3BhdGgnKTsgfVxuICAgIHNldCBwYXRoKHBhdGgpIHsgdGhpcy5fYXR0cmlidXRlc1sncGF0aCddID0gcGF0aDsgfVxuICAgIGdldCBtaW1lKCkgeyByZXR1cm4gdGhpcy5nZXQoJ21pbWUnKTsgfVxuICAgIHNldCBtaW1lKG1pbWUpIHsgdGhpcy5fYXR0cmlidXRlc1snbWltZSddID0gbWltZTsgfVxuICAgIGdldCBzaXplKCkgeyByZXR1cm4gdGhpcy5nZXQoJ3NpemUnKTsgfVxuICAgIHNldCBzaXplKHNpemUpIHsgdGhpcy5fYXR0cmlidXRlc1snc2l6ZSddID0gc2l6ZTsgfVxuICAgIGdldCBjdGltZSgpIHsgcmV0dXJuIHRoaXMuZ2V0KCdjdGltZScpOyB9XG4gICAgc2V0IGN0aW1lKHRpbWUpIHsgdGhpcy5fYXR0cmlidXRlc1snY3RpbWUnXSA9IHRpbWU7IH1cbiAgICBnZXQgbXRpbWUoKSB7IHJldHVybiB0aGlzLmdldCgnbXRpbWUnKTsgfVxuICAgIHNldCBtdGltZSh0aW1lKSB7IHRoaXMuX2F0dHJpYnV0ZXNbJ210aW1lJ10gPSB0aW1lOyB9XG4gICAgZ2V0IGhpZGRlbigpIHsgcmV0dXJuIHRoaXMuZ2V0KCdoaWRkZW4nKTsgfVxuICAgIHNldCBoaWRkZW4oaGlkZGVuKSB7IHRoaXMuX2F0dHJpYnV0ZXNbJ2hpZGRlbiddID0gaGlkZGVuOyB9XG4gICAgZ2V0IG1ldGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzWydtZXRhJ107XG4gICAgfVxuICAgIGdldCBmdWxsUGF0aCgpIHtcbiAgICAgICAgcmV0dXJuIFBhdGguam9pbih0aGlzLnBhdGgsIHRoaXMuZmlsZW5hbWUpO1xuICAgIH1cbiAgICBnZXQoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hdHRyaWJ1dGVzW2tleV07XG4gICAgfVxuICAgIHNldE1ldGEoa2V5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzWydtZXRhJ11ba2V5XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXR0cmlidXRlcztcbiAgICB9XG4gICAgdmFsaWRkYXRhKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaXplICE9IG51bGwgJiYgdGhpcy5maWxlbmFtZSAhPSBudWxsICYmIHRoaXMucGF0aCAhPSBcIlwiICYmIHRoaXMubWltZSAhPSBudWxsO1xuICAgIH1cbn1cbl9fZGVjb3JhdGUoW1xuICAgIG9ic2VydmVcbl0sIEFzc2V0LnByb3RvdHlwZSwgXCJuYW1lXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgb2JzZXJ2ZVxuXSwgQXNzZXQucHJvdG90eXBlLCBcImZpbGVuYW1lXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgb2JzZXJ2ZVxuXSwgQXNzZXQucHJvdG90eXBlLCBcInBhdGhcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBvYnNlcnZlXG5dLCBBc3NldC5wcm90b3R5cGUsIFwibWltZVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIG9ic2VydmVcbl0sIEFzc2V0LnByb3RvdHlwZSwgXCJzaXplXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgb2JzZXJ2ZVxuXSwgQXNzZXQucHJvdG90eXBlLCBcImN0aW1lXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgb2JzZXJ2ZVxuXSwgQXNzZXQucHJvdG90eXBlLCBcIm10aW1lXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgb2JzZXJ2ZVxuXSwgQXNzZXQucHJvdG90eXBlLCBcImhpZGRlblwiLCBudWxsKTtcbmV4cG9ydHMuQXNzZXQgPSBBc3NldDtcbiIsIlxuaW1wb3J0IHtJRmlsZX0gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZnVuY3Rpb24gb2JzZXJ2ZSh0YXJnZXQsIGtleTogc3RyaW5nLCBkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgICBsZXQgb3NldCA9IGRlc2NyaXB0b3Iuc2V0O1xuICAgIFxuICAgIGRlc2NyaXB0b3Iuc2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGxldCBvbGRWYWx1ZSA9IHRoaXNba2V5XTtcbiAgICAgICAgb3NldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlOicgKyBrZXksIG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRPcHRpb25zIHtcbiAgICAvKiogIFVuaXF1ZSBpZCBmb3IgdGhlIGFzc2V0LiBTaG91bGQgYmUgZ2VuZXJhdGVkIGJ5IHRoZSBtZXRhU3RvcmUgKi9cbiAgICBpZD86IHN0cmluZztcbiAgICAvKiogIEFyYml0cmFyeSBmb3IgdGhlIGZpbGUuICovXG4gICAgbmFtZT86IHN0cmluZztcbiAgICAvKiogRmlsZSBuYW1lICovXG4gICAgZmlsZW5hbWU/OiBzdHJpbmc7XG4gICAgLyoqIHBhdGggdG8gZmlsZSAod2l0aG91dCB0aGUgZmlsZW5hbWUgYW5kIHByZWZpeGVkIHdpdGggJy8nKSAqL1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgLyoqIFRoZSBtaW1lIGZpbGUgb2YgdGhlIGZpbGUgKi9cbiAgICBtaW1lPzogc3RyaW5nO1xuICAgIC8qKiBUaGUgc2l6ZSBvZiB0aGUgZmlsZSBpbiBieXRlcyovXG4gICAgc2l6ZT86IG51bWJlcjtcbiAgICAvKiogQ3JlYXRpb24gZGF0ZSAqL1xuICAgIGN0aW1lPzogbnVtYmVyO1xuICAgIC8qKiBNb2RpZmljYXRpb24gZGF0ZSAqL1xuICAgIG10aW1lPzogbnVtYmVyO1xuICAgIC8qKiBNZXRhIGRhdGEgKi9cbiAgICBtZXRhPzoge1trZXk6IHN0cmluZ106IGFueSB9O1xuICAgIC8qKiBIaWRkZW4gKi9cbiAgICBoaWRkZW4/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXQgaW1wbGVtZW50cyBJRmlsZSB7XG4gICAgcHJpdmF0ZSBfYXR0cmlidXRlczoge1trZXk6c3RyaW5nXTogYW55fTtcbiAgICBcbiAgICBzZXQgaWQgKGlkOiBzdHJpbmcpIHsgdGhpcy5fYXR0cmlidXRlc1snaWQnXSA9IGlkOyB9XG4gICAgZ2V0IGlkICgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXQoJ2lkJyk7IH1cbiAgICBcbiAgICBAb2JzZXJ2ZVxuICAgIC8qKiBOYW1lIG9mIHRoZSBhc3NldCAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmdldCgnbmFtZScpO31cbiAgICBzZXQgbmFtZShuYW1lOnN0cmluZykgeyAgdGhpcy5fYXR0cmlidXRlc1snbmFtZSddID0gbmFtZTsgfVxuICAgIFxuICAgIEBvYnNlcnZlXG4gICAgLyoqIFRoZSBmaWxlIG5hbWUgb2YgdGhlIGFzc2V0ICovXG4gICAgZ2V0IGZpbGVuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmdldCgnZmlsZW5hbWUnKTt9XG4gICAgc2V0IGZpbGVuYW1lKGZpbGVuYW1lOnN0cmluZykgeyAgdGhpcy5fYXR0cmlidXRlc1snZmlsZW5hbWUnXSA9IGZpbGVuYW1lOyB9XG4gICAgXG4gICAgQG9ic2VydmVcbiAgICAvKiogVGhlIHBhdGggb2YgdGhlIGFzc2V0ICovXG4gICAgZ2V0IHBhdGgoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZ2V0KCdwYXRoJyk7fVxuICAgIHNldCBwYXRoKHBhdGg6c3RyaW5nKSB7ICB0aGlzLl9hdHRyaWJ1dGVzWydwYXRoJ10gPSBwYXRoOyB9XG4gICAgXG4gICAgQG9ic2VydmVcbiAgICBnZXQgbWltZSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5nZXQoJ21pbWUnKTt9XG4gICAgc2V0IG1pbWUobWltZTpzdHJpbmcpIHsgIHRoaXMuX2F0dHJpYnV0ZXNbJ21pbWUnXSA9IG1pbWU7IH1cbiAgICBcbiAgICBAb2JzZXJ2ZVxuICAgIGdldCBzaXplKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldCgnc2l6ZScpO31cbiAgICBzZXQgc2l6ZShzaXplOm51bWJlcikgeyAgdGhpcy5fYXR0cmlidXRlc1snc2l6ZSddID0gc2l6ZTsgfVxuICAgIFxuICAgIEBvYnNlcnZlXG4gICAgZ2V0IGN0aW1lKCk6IG51bWJlciB7IHJldHVybiB0aGlzLmdldCgnY3RpbWUnKTsgfVxuICAgIHNldCBjdGltZSh0aW1lOiBudW1iZXIpIHsgdGhpcy5fYXR0cmlidXRlc1snY3RpbWUnXSA9IHRpbWU7IH1cbiAgICBcbiAgICBAb2JzZXJ2ZVxuICAgIGdldCBtdGltZSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5nZXQoJ210aW1lJyk7IH1cbiAgICBzZXQgbXRpbWUodGltZTogbnVtYmVyKSB7IHRoaXMuX2F0dHJpYnV0ZXNbJ210aW1lJ10gPSB0aW1lOyB9XG4gICAgXG4gICAgQG9ic2VydmVcbiAgICBnZXQgaGlkZGVuKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5nZXQoJ2hpZGRlbicpOyB9XG4gICAgc2V0IGhpZGRlbihoaWRkZW46Ym9vbGVhbikgeyB0aGlzLl9hdHRyaWJ1dGVzWydoaWRkZW4nXSA9IGhpZGRlbjsgfVxuICAgIFxuICAgIGdldCBtZXRhKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXTtcbiAgICB9XG4gICAgXG4gICAgZ2V0IGZ1bGxQYXRoICgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gUGF0aC5qb2luKHRoaXMucGF0aCwgdGhpcy5maWxlbmFtZSk7XG4gICAgfVxuICAgIFxuICAgIGdldCAoa2V5OiBzdHJpbmcpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXR0cmlidXRlc1trZXldO1xuICAgIH1cbiAgICBcbiAgICBzZXRNZXRhKGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXVtrZXldID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBcbiAgICB0b0pTT04oKTogSUZpbGUge1xuICAgICAgICByZXR1cm4gPElGaWxlPnRoaXMuX2F0dHJpYnV0ZXNcbiAgICB9XG4gICAgXG4gICAgdmFsaWRkYXRhICgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZSAhPSBudWxsICYmIHRoaXMuZmlsZW5hbWUgIT0gbnVsbCAmJiB0aGlzLnBhdGggIT0gXCJcIiAmJiB0aGlzLm1pbWUgIT0gbnVsbDtcbiAgICB9IFxuICAgIFxuICAgIGNvbnN0cnVjdG9yKGZpbGU6QXNzZXRPcHRpb25zPXt9KSB7XG4gICAgICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSBmaWxlOyAgIFxuICAgICAgICBpZiAoIXRoaXMuX2F0dHJpYnV0ZXNbJ21ldGEnXSkgdGhpcy5fYXR0cmlidXRlc1snbWV0YSddID0ge307XG4gICAgICAgIFxuICAgICAgICBpZiAoIWZpbGUuY3RpbWUpIGZpbGUuY3RpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDA7XG4gICAgICAgIGlmICghZmlsZS5tdGltZSkgZmlsZS5tdGltZSA9IGZpbGUuY3RpbWU7XG4gICAgICAgIFxuICAgICAgICBpZiAoZmlsZS5oaWRkZW4gPT0gbnVsbCkgZmlsZS5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgXG4gICAgfVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
