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
                    if (Array.isArray(data)) {
                        data = {};
                        json.files.forEach(function (f) {
                            data[f.id] = f;
                        });
                    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGFzdG9yZXMvZmlsZS5qcyIsIm1ldGFzdG9yZXMvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FBQ0EsSUFBSSxZQUFZLFNBQUMsSUFBUSxVQUFLLFNBQUwsSUFBbUIsVUFBVSxPQUFWLEVBQW1CLFVBQW5CLEVBQStCLENBQS9CLEVBQWtDLFNBQWxDLEVBQTZDO0FBQ3JGLFdBQU8sS0FBSyxNQUFNLElBQUksT0FBSixDQUFOLENBQUwsQ0FBeUIsVUFBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCO0FBQ3ZELGlCQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsSUFBVixDQUFlLEtBQWYsQ0FBTCxFQUFGO2FBQUosQ0FBcUMsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsS0FBVixDQUFnQixLQUFoQixDQUFMLEVBQUY7YUFBSixDQUFzQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0I7QUFBRSxtQkFBTyxJQUFQLEdBQWMsUUFBUSxPQUFPLEtBQVAsQ0FBdEIsR0FBc0MsSUFBSSxDQUFKLENBQU0sVUFBVSxPQUFWLEVBQW1CO0FBQUUsd0JBQVEsT0FBTyxLQUFQLENBQVIsQ0FBRjthQUFuQixDQUFOLENBQXFELElBQXJELENBQTBELFNBQTFELEVBQXFFLFFBQXJFLENBQXRDLENBQUY7U0FBdEI7QUFDQSxhQUFLLENBQUMsWUFBWSxVQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsRUFBeUIsVUFBekIsQ0FBWixDQUFELENBQW1ELElBQW5ELEVBQUwsRUFKdUQ7S0FBM0IsQ0FBaEMsQ0FEcUY7Q0FBN0M7QUNBNUMsSUFBWSxPQUFJLFFBQU0sTUFB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Q0FBUCxFQUFVLEVBQVY7QUFHRixxQkFBSyxVQUFMLEdBQWtCLFNBQWxCLENEdEJxRDtBQ3VCckQscUJBQUssS0FBTCxHQUFrQixJQUFsQixDRHZCcUQ7YUFBYixDQUF4QyxDQ0NPOzs7O2dDQXlCQTtBREhQLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhO0FDSXJELG9CQUFJLGFBQWEsS0FBSyxXQUFMLENESm9DO0FDS3JELG9CQUFJLE9BQU87QUFDUCwrQkFBVyxLQUFLLFVBQUw7QUFDWCwyQkFBTyxLQUFLLEtBQUw7aUJBRlAsQ0RMaUQ7QUNTckQsc0JBQU0sR0FBRyxTQUFILENBQWEsVUFBYixFQUF5QixLQUFLLFNBQUwsQ0FBZSxJQUFmLENBQXpCLENBQU4sQ0RUcUQ7YUFBYixDQUF4QyxDQ0dPOzs7OzRCQXBIWTtBQUNuQixtQkFBTyxLQUFLLElBQUwsQ0FBVSxLQUFLLElBQUwsQ0FBVSxJQUFWLEVBQWdCLGVBQTFCLENBQVAsQ0FEbUI7Ozs7V0FKM0I7OztBQUFhLFFBQUEsYUFBQSxHQUFhLGFBQWI7QUFtSWIsYUFBQSxpQkFBQSxDQUFrQixNQUFsQixFQUEwQixhQUExQiIsImZpbGUiOiJtZXRhc3RvcmVzL2ZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNvbnN0IFBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ216L2ZzJyk7XG5jb25zdCBta2RpcnAgPSByZXF1aXJlKCdta2RpcnAtcHJvbWlzZScpO1xuY29uc3QgcmVwb3NpdG9yeV8xID0gcmVxdWlyZSgnLi4vcmVwb3NpdG9yeScpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzOm1ldGFzdG9yZTpmaWxlc3lzdGVtJyk7XG5jbGFzcyBGaWxlTWV0YVN0b3JlIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLnBhdGgpXG4gICAgICAgICAgICBvcHRpb25zLnBhdGggPSBcImFzc2V0cy51cGxvYWRzXCI7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdGlvbnM7XG4gICAgfVxuICAgIGdldCBfY29uZmlnRmlsZSgpIHtcbiAgICAgICAgcmV0dXJuIFBhdGguam9pbih0aGlzLm9wdHMucGF0aCwgJ19fY29uZmlnLmpzb24nKTtcbiAgICB9XG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9pbml0UGF0aCh0aGlzLm9wdHMucGF0aCk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9sb2FkKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGUoYXNzZXQsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGFzc2V0LmlkID0gKCsrdGhpcy5fY3VycmVudElEKSArIFwiXCI7XG4gICAgICAgICAgICBkZWJ1ZygnY3JlYXRlIGFzc2V0IFwiJXNcIiwgaWQ6IFwiJXNcIicsIGFzc2V0LnBhdGgsIGFzc2V0LmlkKTtcbiAgICAgICAgICAgIHRoaXMuZmlsZXNbYXNzZXQuaWRdID0gYXNzZXQ7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9zYXZlKCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW1vdmUoYXNzZXQpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBkZWJ1ZygncmVtb3ZlIGFzc2V0IFwiJXNcIiwgaWQ6IFwiJXNcIicsIGFzc2V0LnBhdGgsIGFzc2V0LmlkKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2Fzc2V0LmlkXTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3NhdmUoKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxpc3Qob3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IG9mZnNldCA9IG9wdGlvbnMub2Zmc2V0IHx8IDAsIGxpbWl0ID0gb3B0aW9ucy5saW1pdCB8fCAxMDA7XG4gICAgICAgICAgICBsZXQgb3V0ID0gW107XG4gICAgICAgICAgICBsZXQgaW5kZXggPSAwLCBmb3VuZCA9IDA7XG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5maWxlcykge1xuICAgICAgICAgICAgICAgIGlmICgrK2luZGV4IDwgb3B0aW9ucy5vZmZzZXQgfHwgKHRoaXMuZmlsZXNba2V5XS5oaWRkZW4gJiYgIW9wdGlvbnMuaGlkZGVuKSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2godGhpcy5maWxlc1trZXldKTtcbiAgICAgICAgICAgICAgICBmb3VuZCsrO1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gbGltaXQpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGZpbmQob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCByZWcgPSBuZXcgUmVnRXhwKG9wdGlvbnMucGF0aCwgJ2knKTtcbiAgICAgICAgICAgIGxldCBvdXQgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmZpbGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlZy50ZXN0KFBhdGguam9pbih0aGlzLmZpbGVzW2tleV0ucGF0aCwgdGhpcy5maWxlc1trZXldLmZpbGVuYW1lKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2godGhpcy5maWxlc1trZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0KGlkKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsZXNbaWRdO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0QnlQYXRoKHBhdGgpIHtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuZmlsZXMpIHtcbiAgICAgICAgICAgIGxldCBmcCA9IFBhdGguam9pbih0aGlzLmZpbGVzW2tleV0ucGF0aCwgdGhpcy5maWxlc1trZXldLmZpbGVuYW1lKTtcbiAgICAgICAgICAgIGlmIChmcCA9PT0gcGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuZmlsZXNba2V5XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gICAgcmVtb3ZlQWxsKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3NhdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvdW50KCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmZpbGVzKS5sZW5ndGg7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfaW5pdFBhdGgocGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmICh5aWVsZCBmcy5leGlzdHMocGF0aCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgeWllbGQgbWtkaXJwKHBhdGgpO1xuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGggPSBQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfbG9hZCgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgY29uZmlnRmlsZSA9IHRoaXMuX2NvbmZpZ0ZpbGU7XG4gICAgICAgICAgICBsZXQgZGF0YSA9IHt9O1xuICAgICAgICAgICAgbGV0IGN1cnJlbnRJRCA9IDA7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBzdHIgPSB5aWVsZCBmcy5yZWFkRmlsZShjb25maWdGaWxlLCAndXRmOCcpO1xuICAgICAgICAgICAgICAgIGxldCBqc29uID0gSlNPTi5wYXJzZShzdHIpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJRCA9IGpzb24uY3VycmVudElEIHx8IDA7XG4gICAgICAgICAgICAgICAgZGF0YSA9IGpzb24uZmlsZXMgfHwge307XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBqc29uLmZpbGVzLmZvckVhY2goKGYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbZi5pZF0gPSBmO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fY3VycmVudElEID0gY3VycmVudElEO1xuICAgICAgICAgICAgdGhpcy5maWxlcyA9IGRhdGE7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfc2F2ZSgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgY29uZmlnRmlsZSA9IHRoaXMuX2NvbmZpZ0ZpbGU7XG4gICAgICAgICAgICBsZXQganNvbiA9IHtcbiAgICAgICAgICAgICAgICBjdXJyZW50SUQ6IHRoaXMuX2N1cnJlbnRJRCxcbiAgICAgICAgICAgICAgICBmaWxlczogdGhpcy5maWxlc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHlpZWxkIGZzLndyaXRlRmlsZShjb25maWdGaWxlLCBKU09OLnN0cmluZ2lmeShqc29uKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlsZU1ldGFTdG9yZSA9IEZpbGVNZXRhU3RvcmU7XG5yZXBvc2l0b3J5XzEucmVnaXN0ZXJNZXRhU3RvcmUoJ2ZpbGUnLCBGaWxlTWV0YVN0b3JlKTtcbiIsImRlY2xhcmUgdmFyIHJlcXVpcmU6YW55O1xuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ216L2ZzJztcbmNvbnN0IG1rZGlycCA9IHJlcXVpcmUoJ21rZGlycC1wcm9taXNlJyk7XG5pbXBvcnQge0lNZXRhU3RvcmUsIElGaWxlLCBJTGlzdE9wdGlvbnMsIElGaW5kT3B0aW9ucywgSUNyZWF0ZU9wdGlvbnN9IGZyb20gJy4uL2ludGVyZmFjZSc7XG5pbXBvcnQge3JlZ2lzdGVyTWV0YVN0b3JlfSBmcm9tICcuLi9yZXBvc2l0b3J5J1xuaW1wb3J0ICogYXMgRGVidWcgZnJvbSAnZGVidWcnO1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHM6bWV0YXN0b3JlOmZpbGVzeXN0ZW0nKVxuXG5leHBvcnQgaW50ZXJmYWNlIEZpbGVNZXRhU3RvcmVPcHRpb25zIHtcbiAgICBwYXRoPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgRmlsZU1ldGFTdG9yZSBpbXBsZW1lbnRzIElNZXRhU3RvcmUge1xuICAgIHByaXZhdGUgb3B0czogRmlsZU1ldGFTdG9yZU9wdGlvbnM7XG4gICAgcHJpdmF0ZSBmaWxlczoge1trZXk6IHN0cmluZ106IElGaWxlIH07XG4gICAgcHJpdmF0ZSBfY3VycmVudElEOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBnZXQgX2NvbmZpZ0ZpbGUgKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBQYXRoLmpvaW4odGhpcy5vcHRzLnBhdGgsICdfX2NvbmZpZy5qc29uJyk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0cnVjdG9yIChvcHRpb25zOkZpbGVNZXRhU3RvcmVPcHRpb25zID0ge30pIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLnBhdGgpIG9wdGlvbnMucGF0aCA9IFwiYXNzZXRzLnVwbG9hZHNcIjtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0aW9ucztcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2luaXRQYXRoKHRoaXMub3B0cy5wYXRoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5fbG9hZCgpO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBjcmVhdGUoYXNzZXQ6SUZpbGUsIG9wdGlvbnM6SUNyZWF0ZU9wdGlvbnM9e30pOiBQcm9taXNlPElGaWxlPiB7XG4gICAgICAgIFxuICAgICAgICBhc3NldC5pZCA9ICgrK3RoaXMuX2N1cnJlbnRJRCkgKyBcIlwiO1xuICAgICAgICBkZWJ1ZygnY3JlYXRlIGFzc2V0IFwiJXNcIiwgaWQ6IFwiJXNcIicsIGFzc2V0LnBhdGgsIGFzc2V0LmlkKVxuICAgICAgICB0aGlzLmZpbGVzW2Fzc2V0LmlkXSA9IGFzc2V0O1xuICAgICAgICBcbiAgICAgICAgYXdhaXQgdGhpcy5fc2F2ZSgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgIH1cbiAgICBcbiAgICBhc3luYyByZW1vdmUoYXNzZXQ6SUZpbGUpOiBQcm9taXNlPElGaWxlPiB7XG4gICAgICAgIGRlYnVnKCdyZW1vdmUgYXNzZXQgXCIlc1wiLCBpZDogXCIlc1wiJywgYXNzZXQucGF0aCwgYXNzZXQuaWQpXG4gICAgICAgIGRlbGV0ZSB0aGlzLmZpbGVzW2Fzc2V0LmlkXTtcbiAgICAgICAgYXdhaXQgdGhpcy5fc2F2ZSgpXG4gICAgICAgIHJldHVybiBhc3NldDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgbGlzdChvcHRpb25zOklMaXN0T3B0aW9ucz0ge30pOiBQcm9taXNlPElGaWxlW10+IHtcbiAgICAgICAgbGV0IG9mZnNldCA9IG9wdGlvbnMub2Zmc2V0fHwwLFxuICAgICAgICAgICAgbGltaXQgPSBvcHRpb25zLmxpbWl0fHwxMDA7XG4gICAgICAgICAgICBcbiAgICAgICAgbGV0IG91dDogSUZpbGVbXSA9IFtdO1xuICAgICAgICBsZXQgaW5kZXggPSAwLCBmb3VuZCA9IDA7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmZpbGVzKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICgrK2luZGV4IDwgb3B0aW9ucy5vZmZzZXQgfHwgKHRoaXMuZmlsZXNba2V5XS5oaWRkZW4gJiYgIW9wdGlvbnMuaGlkZGVuKSkgY29udGludWU7XG4gICAgICAgICAgICBvdXQucHVzaCh0aGlzLmZpbGVzW2tleV0pO1xuICAgICAgICAgICAgZm91bmQrKztcbiAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gbGltaXQpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBmaW5kKG9wdGlvbnM6SUZpbmRPcHRpb25zKTogUHJvbWlzZTxJRmlsZVtdPiB7XG4gICAgICAgIGxldCByZWcgPSBuZXcgUmVnRXhwKG9wdGlvbnMucGF0aCwgJ2knKTtcbiAgICAgICAgbGV0IG91dCA9IFtdO1xuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5maWxlcykge1xuICAgICAgICAgICAgaWYgKHJlZy50ZXN0KFBhdGguam9pbih0aGlzLmZpbGVzW2tleV0ucGF0aCwgdGhpcy5maWxlc1trZXldLmZpbGVuYW1lKSkpIHtcbiAgICAgICAgICAgICAgICBvdXQucHVzaCh0aGlzLmZpbGVzW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIGdldChpZDpzdHJpbmcpOiBQcm9taXNlPElGaWxlPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbGVzW2lkXTtcbiAgICB9XG4gICAgXG4gICAgZ2V0QnlQYXRoIChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPElGaWxlPiB7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmZpbGVzKSB7XG4gICAgICAgICAgICBsZXQgZnAgPSBQYXRoLmpvaW4odGhpcy5maWxlc1trZXldLnBhdGgsIHRoaXMuZmlsZXNba2V5XS5maWxlbmFtZSk7XG4gICAgICAgICAgICBpZiAoZnAgPT09IHBhdGgpIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5maWxlc1trZXldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyByZW1vdmVBbGwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICAgICAgYXdhaXQgdGhpcy5fc2F2ZSgpO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBjb3VudCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5maWxlcykubGVuZ3RoO1xuICAgIH1cbiAgICBcbiAgICBcbiAgICBwcml2YXRlIGFzeW5jIF9pbml0UGF0aCAocGF0aDpzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgXG4gICAgICAgIGlmIChhd2FpdCBmcy5leGlzdHMocGF0aCkpIHJldHVybjtcbiAgICAgICAgYXdhaXQgbWtkaXJwKHBhdGgpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5vcHRzLnBhdGggPSBQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIF9sb2FkICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgbGV0IGNvbmZpZ0ZpbGUgPSB0aGlzLl9jb25maWdGaWxlO1xuICAgICAgICBcbiAgICAgICAgbGV0IGRhdGEgPSB7fTtcbiAgICAgICAgbGV0IGN1cnJlbnRJRCA9IDA7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc3RyID0gYXdhaXQgZnMucmVhZEZpbGUoY29uZmlnRmlsZSwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIGxldCBqc29uID0gSlNPTi5wYXJzZSg8c3RyaW5nPnN0cik7XG4gICAgICAgICAgICBjdXJyZW50SUQgPSBqc29uLmN1cnJlbnRJRHx8MDtcbiAgICAgICAgICAgIGRhdGEgPSBqc29uLmZpbGVzfHx7fTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgICAgIGpzb24uZmlsZXMuZm9yRWFjaCgoZikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkYXRhW2YuaWRdID0gZjtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBcbiAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY3VycmVudElEID0gY3VycmVudElEO1xuICAgICAgICB0aGlzLmZpbGVzID0gPGFueT5kYXRhO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBfc2F2ZSAoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBjb25maWdGaWxlID0gdGhpcy5fY29uZmlnRmlsZTsgXG4gICAgICAgIGxldCBqc29uID0ge1xuICAgICAgICAgICAgY3VycmVudElEOiB0aGlzLl9jdXJyZW50SUQsXG4gICAgICAgICAgICBmaWxlczogdGhpcy5maWxlc1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZShjb25maWdGaWxlLCBKU09OLnN0cmluZ2lmeShqc29uKSk7XG4gICAgfVxuICAgIFxufVxuXG5yZWdpc3Rlck1ldGFTdG9yZSgnZmlsZScsIEZpbGVNZXRhU3RvcmUpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
