"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var Path = require('path');
var fs = require('mz/fs');
var mkdirp = require('mkdirp-promise');
var repository_1 = require('../repository');
var Debug = require('debug');
var debug = Debug('assets:metastore:filesystem');

var FileMetaStore = function () {
    function FileMetaStore() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, FileMetaStore);

        if (!options.path) options.path = "assets.uploads";
        this.opts = options;
    }

    _createClass(FileMetaStore, [{
        key: 'initialize',
        value: function initialize() {
            return __awaiter(this, void 0, Promise, function* () {
                yield this._initPath(this.opts.path);
                yield this._load();
            });
        }
    }, {
        key: 'create',
        value: function create(asset) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            return __awaiter(this, void 0, Promise, function* () {
                asset.id = ++this._currentID + "";
                debug('create asset "%s", id: "%s"', asset.path, asset.id);
                this.files[asset.id] = asset;
                yield this._save();
                return asset;
            });
        }
    }, {
        key: 'remove',
        value: function remove(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                debug('remove asset "%s", id: "%s"', asset.path, asset.id);
                delete this.files[asset.id];
                yield this._save();
                return asset;
            });
        }
    }, {
        key: 'list',
        value: function list() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            return __awaiter(this, void 0, Promise, function* () {
                var offset = options.offset || 0,
                    limit = options.limit || 100;
                var out = [];
                var index = 0,
                    found = 0;
                for (var key in this.files) {
                    if (++index < options.offset || this.files[key].hidden && !options.hidden) continue;
                    out.push(this.files[key]);
                    found++;
                    if (found === limit) break;
                }
                return out;
            });
        }
    }, {
        key: 'find',
        value: function find(options) {
            return __awaiter(this, void 0, Promise, function* () {
                var reg = new RegExp(options.path, 'i');
                var out = [];
                for (var key in this.files) {
                    if (reg.test(Path.join(this.files[key].path, this.files[key].filename))) {
                        out.push(this.files[key]);
                    }
                }
                return out;
            });
        }
    }, {
        key: 'get',
        value: function get(id) {
            return __awaiter(this, void 0, Promise, function* () {
                return this.files[id];
            });
        }
    }, {
        key: 'getByPath',
        value: function getByPath(path) {
            for (var key in this.files) {
                var fp = Path.join(this.files[key].path, this.files[key].filename);
                if (fp === path) return Promise.resolve(this.files[key]);
            }
            return Promise.resolve(null);
        }
    }, {
        key: 'removeAll',
        value: function removeAll() {
            return __awaiter(this, void 0, Promise, function* () {
                this.files = {};
                yield this._save();
            });
        }
    }, {
        key: 'count',
        value: function count() {
            return __awaiter(this, void 0, Promise, function* () {
                return Object.keys(this.files).length;
            });
        }
    }, {
        key: '_initPath',
        value: function _initPath(path) {
            return __awaiter(this, void 0, Promise, function* () {
                if (yield fs.exists(path)) return;
                yield mkdirp(path);
                this.opts.path = Path.resolve(path);
            });
        }
    }, {
        key: '_load',
        value: function _load() {
            return __awaiter(this, void 0, Promise, function* () {
                var configFile = this._configFile;
                var data = {};
                var currentID = 0;
                try {
                    var str = yield fs.readFile(configFile, 'utf8');
                    var json = JSON.parse(str);
                    currentID = json.currentID || 0;
                    data = json.files || {};
                } catch (e) {}
                this._currentID = currentID;
                this.files = data;
            });
        }
    }, {
        key: '_save',
        value: function _save() {
            return __awaiter(this, void 0, Promise, function* () {
                var configFile = this._configFile;
                var json = {
                    currentID: this._currentID,
                    files: this.files
                };
                yield fs.writeFile(configFile, JSON.stringify(json));
            });
        }
    }, {
        key: '_configFile',
        get: function get() {
            return Path.join(this.opts.path, '__config.json');
        }
    }]);

    return FileMetaStore;
}();

exports.FileMetaStore = FileMetaStore;
repository_1.registerMetaStore('file', FileMetaStore);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGFzdG9yZXMvZmlsZS5qcyIsIm1ldGFzdG9yZXMvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FBQ0EsSUFBSSxZQUFZLFNBQUMsSUFBUSxVQUFLLFNBQUwsSUFBbUIsVUFBVSxPQUFWLEVBQW1CLFVBQW5CLEVBQStCLENBQS9CLEVBQWtDLFNBQWxDLEVBQTZDO0FBQ3JGLFdBQU8sS0FBSyxNQUFNLElBQUksT0FBSixDQUFOLENBQUwsQ0FBeUIsVUFBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCO0FBQ3ZELGlCQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsSUFBVixDQUFlLEtBQWYsQ0FBTCxFQUFGO2FBQUosQ0FBcUMsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsS0FBVixDQUFnQixLQUFoQixDQUFMLEVBQUY7YUFBSixDQUFzQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0I7QUFBRSxtQkFBTyxJQUFQLEdBQWMsUUFBUSxPQUFPLEtBQVAsQ0FBdEIsR0FBc0MsSUFBSSxDQUFKLENBQU0sVUFBVSxPQUFWLEVBQW1CO0FBQUUsd0JBQVEsT0FBTyxLQUFQLENBQVIsQ0FBRjthQUFuQixDQUFOLENBQXFELElBQXJELENBQTBELFNBQTFELEVBQXFFLFFBQXJFLENBQXRDLENBQUY7U0FBdEI7QUFDQSxhQUFLLENBQUMsWUFBWSxVQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsRUFBeUIsVUFBekIsQ0FBWixDQUFELENBQW1ELElBQW5ELEVBQUwsRUFKdUQ7S0FBM0IsQ0FBaEMsQ0FEcUY7Q0FBN0M7QUNBNUMsSUFBWSxPQUFJLFFBQU0sTUFB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YUFBYSxLQUFLLFdBQUwsQ0RGb0M7QUNHckQsb0JBQUksT0FBTztBQUNQLCtCQUFXLEtBQUssVUFBTDtBQUNYLDJCQUFPLEtBQUssS0FBTDtpQkFGUCxDREhpRDtBQ09yRCxzQkFBTSxHQUFHLFNBQUgsQ0FBYSxVQUFiLEVBQXlCLEtBQUssU0FBTCxDQUFlLElBQWYsQ0FBekIsQ0FBTixDRFBxRDthQUFiLENBQXhDLENDQ087Ozs7NEJBNUdZO0FBQ25CLG1CQUFPLEtBQUssSUFBTCxDQUFVLEtBQUssSUFBTCxDQUFVLElBQVYsRUFBZ0IsZUFBMUIsQ0FBUCxDQURtQjs7OztXQUozQjs7O0FBQWEsUUFBQSxhQUFBLEdBQWEsYUFBYjtBQTJIYixhQUFBLGlCQUFBLENBQWtCLE1BQWxCLEVBQTBCLGFBQTFCIiwiZmlsZSI6Im1ldGFzdG9yZXMvZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnbXovZnMnKTtcbmNvbnN0IG1rZGlycCA9IHJlcXVpcmUoJ21rZGlycC1wcm9taXNlJyk7XG5jb25zdCByZXBvc2l0b3J5XzEgPSByZXF1aXJlKCcuLi9yZXBvc2l0b3J5Jyk7XG5jb25zdCBEZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHM6bWV0YXN0b3JlOmZpbGVzeXN0ZW0nKTtcbmNsYXNzIEZpbGVNZXRhU3RvcmUge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBpZiAoIW9wdGlvbnMucGF0aClcbiAgICAgICAgICAgIG9wdGlvbnMucGF0aCA9IFwiYXNzZXRzLnVwbG9hZHNcIjtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0aW9ucztcbiAgICB9XG4gICAgZ2V0IF9jb25maWdGaWxlKCkge1xuICAgICAgICByZXR1cm4gUGF0aC5qb2luKHRoaXMub3B0cy5wYXRoLCAnX19jb25maWcuanNvbicpO1xuICAgIH1cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX2luaXRQYXRoKHRoaXMub3B0cy5wYXRoKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX2xvYWQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZShhc3NldCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgYXNzZXQuaWQgPSAoKyt0aGlzLl9jdXJyZW50SUQpICsgXCJcIjtcbiAgICAgICAgICAgIGRlYnVnKCdjcmVhdGUgYXNzZXQgXCIlc1wiLCBpZDogXCIlc1wiJywgYXNzZXQucGF0aCwgYXNzZXQuaWQpO1xuICAgICAgICAgICAgdGhpcy5maWxlc1thc3NldC5pZF0gPSBhc3NldDtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3NhdmUoKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZShhc3NldCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGRlYnVnKCdyZW1vdmUgYXNzZXQgXCIlc1wiLCBpZDogXCIlc1wiJywgYXNzZXQucGF0aCwgYXNzZXQuaWQpO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNbYXNzZXQuaWRdO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fc2F2ZSgpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGlzdChvcHRpb25zID0ge30pIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXQgfHwgMCwgbGltaXQgPSBvcHRpb25zLmxpbWl0IHx8IDEwMDtcbiAgICAgICAgICAgIGxldCBvdXQgPSBbXTtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IDAsIGZvdW5kID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmZpbGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsraW5kZXggPCBvcHRpb25zLm9mZnNldCB8fCAodGhpcy5maWxlc1trZXldLmhpZGRlbiAmJiAhb3B0aW9ucy5oaWRkZW4pKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBvdXQucHVzaCh0aGlzLmZpbGVzW2tleV0pO1xuICAgICAgICAgICAgICAgIGZvdW5kKys7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kID09PSBsaW1pdClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZmluZChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHJlZyA9IG5ldyBSZWdFeHAob3B0aW9ucy5wYXRoLCAnaScpO1xuICAgICAgICAgICAgbGV0IG91dCA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuZmlsZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVnLnRlc3QoUGF0aC5qb2luKHRoaXMuZmlsZXNba2V5XS5wYXRoLCB0aGlzLmZpbGVzW2tleV0uZmlsZW5hbWUpKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaCh0aGlzLmZpbGVzW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXQoaWQpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWxlc1tpZF07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRCeVBhdGgocGF0aCkge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5maWxlcykge1xuICAgICAgICAgICAgbGV0IGZwID0gUGF0aC5qb2luKHRoaXMuZmlsZXNba2V5XS5wYXRoLCB0aGlzLmZpbGVzW2tleV0uZmlsZW5hbWUpO1xuICAgICAgICAgICAgaWYgKGZwID09PSBwYXRoKVxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5maWxlc1trZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgIH1cbiAgICByZW1vdmVBbGwoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fc2F2ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY291bnQoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZmlsZXMpLmxlbmd0aDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9pbml0UGF0aChwYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKHlpZWxkIGZzLmV4aXN0cyhwYXRoKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB5aWVsZCBta2RpcnAocGF0aCk7XG4gICAgICAgICAgICB0aGlzLm9wdHMucGF0aCA9IFBhdGgucmVzb2x2ZShwYXRoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9sb2FkKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBjb25maWdGaWxlID0gdGhpcy5fY29uZmlnRmlsZTtcbiAgICAgICAgICAgIGxldCBkYXRhID0ge307XG4gICAgICAgICAgICBsZXQgY3VycmVudElEID0gMDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0ciA9IHlpZWxkIGZzLnJlYWRGaWxlKGNvbmZpZ0ZpbGUsICd1dGY4Jyk7XG4gICAgICAgICAgICAgICAgbGV0IGpzb24gPSBKU09OLnBhcnNlKHN0cik7XG4gICAgICAgICAgICAgICAgY3VycmVudElEID0ganNvbi5jdXJyZW50SUQgfHwgMDtcbiAgICAgICAgICAgICAgICBkYXRhID0ganNvbi5maWxlcyB8fCB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SUQgPSBjdXJyZW50SUQ7XG4gICAgICAgICAgICB0aGlzLmZpbGVzID0gZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9zYXZlKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBjb25maWdGaWxlID0gdGhpcy5fY29uZmlnRmlsZTtcbiAgICAgICAgICAgIGxldCBqc29uID0ge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJRDogdGhpcy5fY3VycmVudElELFxuICAgICAgICAgICAgICAgIGZpbGVzOiB0aGlzLmZpbGVzXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgeWllbGQgZnMud3JpdGVGaWxlKGNvbmZpZ0ZpbGUsIEpTT04uc3RyaW5naWZ5KGpzb24pKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWxlTWV0YVN0b3JlID0gRmlsZU1ldGFTdG9yZTtcbnJlcG9zaXRvcnlfMS5yZWdpc3Rlck1ldGFTdG9yZSgnZmlsZScsIEZpbGVNZXRhU3RvcmUpO1xuIiwiZGVjbGFyZSB2YXIgcmVxdWlyZTphbnk7XG5pbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnbXovZnMnO1xuY29uc3QgbWtkaXJwID0gcmVxdWlyZSgnbWtkaXJwLXByb21pc2UnKTtcbmltcG9ydCB7SU1ldGFTdG9yZSwgSUZpbGUsIElMaXN0T3B0aW9ucywgSUZpbmRPcHRpb25zLCBJQ3JlYXRlT3B0aW9uc30gZnJvbSAnLi4vaW50ZXJmYWNlJztcbmltcG9ydCB7cmVnaXN0ZXJNZXRhU3RvcmV9IGZyb20gJy4uL3JlcG9zaXRvcnknXG5pbXBvcnQgKiBhcyBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czptZXRhc3RvcmU6ZmlsZXN5c3RlbScpXG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZU1ldGFTdG9yZU9wdGlvbnMge1xuICAgIHBhdGg/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBGaWxlTWV0YVN0b3JlIGltcGxlbWVudHMgSU1ldGFTdG9yZSB7XG4gICAgcHJpdmF0ZSBvcHRzOiBGaWxlTWV0YVN0b3JlT3B0aW9ucztcbiAgICBwcml2YXRlIGZpbGVzOiB7W2tleTogc3RyaW5nXTogSUZpbGUgfTtcbiAgICBwcml2YXRlIF9jdXJyZW50SUQ6IG51bWJlcjtcbiAgICBwcml2YXRlIGdldCBfY29uZmlnRmlsZSAoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIFBhdGguam9pbih0aGlzLm9wdHMucGF0aCwgJ19fY29uZmlnLmpzb24nKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3RydWN0b3IgKG9wdGlvbnM6RmlsZU1ldGFTdG9yZU9wdGlvbnMgPSB7fSkge1xuICAgICAgICBpZiAoIW9wdGlvbnMucGF0aCkgb3B0aW9ucy5wYXRoID0gXCJhc3NldHMudXBsb2Fkc1wiO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRpb25zO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5faW5pdFBhdGgodGhpcy5vcHRzLnBhdGgpO1xuICAgICAgICBhd2FpdCB0aGlzLl9sb2FkKCk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIGNyZWF0ZShhc3NldDpJRmlsZSwgb3B0aW9uczpJQ3JlYXRlT3B0aW9ucz17fSk6IFByb21pc2U8SUZpbGU+IHtcbiAgICAgICAgXG4gICAgICAgIGFzc2V0LmlkID0gKCsrdGhpcy5fY3VycmVudElEKSArIFwiXCI7XG4gICAgICAgIGRlYnVnKCdjcmVhdGUgYXNzZXQgXCIlc1wiLCBpZDogXCIlc1wiJywgYXNzZXQucGF0aCwgYXNzZXQuaWQpXG4gICAgICAgIHRoaXMuZmlsZXNbYXNzZXQuaWRdID0gYXNzZXQ7XG4gICAgICAgIFxuICAgICAgICBhd2FpdCB0aGlzLl9zYXZlKCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIHJlbW92ZShhc3NldDpJRmlsZSk6IFByb21pc2U8SUZpbGU+IHtcbiAgICAgICAgZGVidWcoJ3JlbW92ZSBhc3NldCBcIiVzXCIsIGlkOiBcIiVzXCInLCBhc3NldC5wYXRoLCBhc3NldC5pZClcbiAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNbYXNzZXQuaWRdO1xuICAgICAgICBhd2FpdCB0aGlzLl9zYXZlKClcbiAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBsaXN0KG9wdGlvbnM6SUxpc3RPcHRpb25zPSB7fSk6IFByb21pc2U8SUZpbGVbXT4ge1xuICAgICAgICBsZXQgb2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXR8fDAsXG4gICAgICAgICAgICBsaW1pdCA9IG9wdGlvbnMubGltaXR8fDEwMDtcbiAgICAgICAgICAgIFxuICAgICAgICBsZXQgb3V0OiBJRmlsZVtdID0gW107XG4gICAgICAgIGxldCBpbmRleCA9IDAsIGZvdW5kID0gMDtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuZmlsZXMpIHtcbiAgICAgICAgICAgIGlmICgrK2luZGV4IDwgb3B0aW9ucy5vZmZzZXQgfHwgKHRoaXMuZmlsZXNba2V5XS5oaWRkZW4gJiYgIW9wdGlvbnMuaGlkZGVuKSkgY29udGludWU7XG4gICAgICAgICAgICBvdXQucHVzaCh0aGlzLmZpbGVzW2tleV0pO1xuICAgICAgICAgICAgZm91bmQrKztcbiAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gbGltaXQpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgZmluZChvcHRpb25zOklGaW5kT3B0aW9ucyk6IFByb21pc2U8SUZpbGVbXT4ge1xuICAgICAgICBsZXQgcmVnID0gbmV3IFJlZ0V4cChvcHRpb25zLnBhdGgsICdpJyk7XG4gICAgICAgIGxldCBvdXQgPSBbXTtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuZmlsZXMpIHtcbiAgICAgICAgICAgIGlmIChyZWcudGVzdChQYXRoLmpvaW4odGhpcy5maWxlc1trZXldLnBhdGgsIHRoaXMuZmlsZXNba2V5XS5maWxlbmFtZSkpKSB7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2godGhpcy5maWxlc1trZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBnZXQoaWQ6c3RyaW5nKTogUHJvbWlzZTxJRmlsZT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5maWxlc1tpZF07XG4gICAgfVxuICAgIFxuICAgIGdldEJ5UGF0aCAocGF0aDogc3RyaW5nKTogUHJvbWlzZTxJRmlsZT4ge1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5maWxlcykge1xuICAgICAgICAgICAgbGV0IGZwID0gUGF0aC5qb2luKHRoaXMuZmlsZXNba2V5XS5wYXRoLCB0aGlzLmZpbGVzW2tleV0uZmlsZW5hbWUpO1xuICAgICAgICAgICAgaWYgKGZwID09PSBwYXRoKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuZmlsZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgcmVtb3ZlQWxsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLmZpbGVzID0ge307XG4gICAgICAgIGF3YWl0IHRoaXMuX3NhdmUoKTtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgY291bnQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZmlsZXMpLmxlbmd0aDtcbiAgICB9XG4gICAgXG4gICAgXG4gICAgcHJpdmF0ZSBhc3luYyBfaW5pdFBhdGggKHBhdGg6c3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIFxuICAgICAgICBpZiAoYXdhaXQgZnMuZXhpc3RzKHBhdGgpKSByZXR1cm47XG4gICAgICAgIGF3YWl0IG1rZGlycChwYXRoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMub3B0cy5wYXRoID0gUGF0aC5yZXNvbHZlKHBhdGgpO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBfbG9hZCAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBjb25maWdGaWxlID0gdGhpcy5fY29uZmlnRmlsZTtcbiAgICAgICAgXG4gICAgICAgIGxldCBkYXRhID0ge307XG4gICAgICAgIGxldCBjdXJyZW50SUQgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHN0ciA9IGF3YWl0IGZzLnJlYWRGaWxlKGNvbmZpZ0ZpbGUsICd1dGY4Jyk7XG4gICAgICAgICAgICBsZXQganNvbiA9IEpTT04ucGFyc2UoPHN0cmluZz5zdHIpO1xuICAgICAgICAgICAgY3VycmVudElEID0ganNvbi5jdXJyZW50SUR8fDA7XG4gICAgICAgICAgICBkYXRhID0ganNvbi5maWxlc3x8e307XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgXG4gICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2N1cnJlbnRJRCA9IGN1cnJlbnRJRDtcbiAgICAgICAgdGhpcy5maWxlcyA9IDxhbnk+ZGF0YTtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgX3NhdmUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgY29uZmlnRmlsZSA9IHRoaXMuX2NvbmZpZ0ZpbGU7IFxuICAgICAgICBsZXQganNvbiA9IHtcbiAgICAgICAgICAgIGN1cnJlbnRJRDogdGhpcy5fY3VycmVudElELFxuICAgICAgICAgICAgZmlsZXM6IHRoaXMuZmlsZXNcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBmcy53cml0ZUZpbGUoY29uZmlnRmlsZSwgSlNPTi5zdHJpbmdpZnkoanNvbikpO1xuICAgIH1cbiAgICBcbn1cblxucmVnaXN0ZXJNZXRhU3RvcmUoJ2ZpbGUnLCBGaWxlTWV0YVN0b3JlKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
