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
var repository_1 = require('../repository');
var utils_1 = require('../utils');
var Debug = require('debug');
var debug = Debug('assets:filestore:filesystem');
var fs = require('mz/fs'),
    mkdirp = require('mkdirp-promise');

var FileStoreFileSystem = function () {
    function FileStoreFileSystem() {
        var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, FileStoreFileSystem);

        this.opts = opts;
        if (!this.opts.path) this.opts.path = "assets.uploads";
    }

    _createClass(FileStoreFileSystem, [{
        key: 'initialize',
        value: function initialize() {
            return __awaiter(this, void 0, Promise, function* () {
                yield this._initPath(this.opts.path);
            });
        }
    }, {
        key: 'create',
        value: function create(asset, stream) {
            return __awaiter(this, void 0, Promise, function* () {
                //let bn = Path.dirname(asset.path),
                var bnF = this._getPath(asset.path);
                try {
                    var stats = yield utils_1.getFileStats(bnF);
                    if (stats.isFile()) {
                        throw new Error("A files called " + asset.path + " already exists");
                    }
                } catch (e) {
                    console.log(e);
                    yield mkdirp(bnF);
                }
                var fp = this._getPath(asset);
                yield utils_1.writeStream(stream, fp);
                return asset;
            });
        }
    }, {
        key: 'remove',
        value: function remove(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                var path = this._getPath(asset);
                try {
                    var stats = yield utils_1.getFileStats(path);
                    if (stats.isFile()) {
                        yield fs.unlink(path);
                    }
                } catch (e) {
                    return null;
                }
                return asset;
            });
        }
    }, {
        key: 'stream',
        value: function stream(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                if (!(yield this.has(asset))) {
                    return null;
                }
                var fp = this._getPath(asset);
                debug('stream %s', fp);
                return fs.createReadStream(fp);
            });
        }
    }, {
        key: 'has',
        value: function has(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                var path = this._getPath(asset);
                try {
                    var stats = yield utils_1.getFileStats(path);
                    return stats.isFile();
                } catch (e) {
                    return false;
                }
            });
        }
    }, {
        key: '_getPath',
        value: function _getPath(asset) {
            if (typeof asset === 'string') {
                return Path.join(this.opts.path, asset);
            }
            var a = asset;
            return Path.join(this.opts.path, a.path, a.filename);
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
    }]);

    return FileStoreFileSystem;
}();

exports.FileStoreFileSystem = FileStoreFileSystem;
repository_1.registerFileStore('file', FileStoreFileSystem);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGVzdG9yZXMvZmlsZS5qcyIsImZpbGVzdG9yZXMvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FBQ0EsSUFBSSxZQUFZLFNBQUMsSUFBUSxVQUFLLFNBQUwsSUFBbUIsVUFBVSxPQUFWLEVBQW1CLFVBQW5CLEVBQStCLENBQS9CLEVBQWtDLFNBQWxDLEVBQTZDO0FBQ3JGLFdBQU8sS0FBSyxNQUFNLElBQUksT0FBSixDQUFOLENBQUwsQ0FBeUIsVUFBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCO0FBQ3ZELGlCQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsSUFBVixDQUFlLEtBQWYsQ0FBTCxFQUFGO2FBQUosQ0FBcUMsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsS0FBVixDQUFnQixLQUFoQixDQUFMLEVBQUY7YUFBSixDQUFzQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0I7QUFBRSxtQkFBTyxJQUFQLEdBQWMsUUFBUSxPQUFPLEtBQVAsQ0FBdEIsR0FBc0MsSUFBSSxDQUFKLENBQU0sVUFBVSxPQUFWLEVBQW1CO0FBQUUsd0JBQVEsT0FBTyxLQUFQLENBQVIsQ0FBRjthQUFuQixDQUFOLENBQXFELElBQXJELENBQTBELFNBQTFELEVBQXFFLFFBQXJFLENBQXRDLENBQUY7U0FBdEI7QUFDQSxhQUFLLENBQUMsWUFBWSxVQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsRUFBeUIsVUFBekIsQ0FBWixDQUFELENBQW1ELElBQW5ELEVBQUwsRUFKdUQ7S0FBM0IsQ0FBaEMsQ0FEcUY7Q0FBN0M7QUNBNUMsSUFBWSxPQUFJLFFBQU0sTUFBTixDQUFKO0FBR1osSUFBQSxlQUFBLFFBQWdDLGVBQWhDLENBQUE7QUFDQSxJQUFBLFVBQUEsUUFBd0MsVUFBeEMsQ0FBQTtBQUNBLElBQVksUUFBSyxRQUFNLE9BQU4sQ0FBTDtBQUVaLElBQU0sUUFBUSxNQUFNLDZCQUFOLENBQVI7QUFFTixJQUFNLEtBQUssUUFBUSxPQUFSLENBQUw7SUFDRixTQUFTLFFBQVEsZ0JBQVIsQ0FBVDs7SUFLSjtBQUVJLGFBRkosbUJBRUksR0FBdUQ7WUFBcEMsNkRBQWtDLGtCQUFFOzs4QkFGM0QscUJBRTJEOztBQUFwQyxhQUFBLElBQUEsR0FBQSxJQUFBLENBQW9DO0FBQ25ELFlBQUksQ0FBQyxLQUFLLElBQUwsQ0FBVSxJQUFWLEVBQWdCLEtBQUssSUFBTCxDQUFVLElBQVYsR0FBaUIsZ0JBQWpCLENBQXJCO0tBREo7O2lCQUZKOztxQ0FRb0I7QURGWixtQkFBTyxVQUFVLElBQVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTtBQ0dyRCxzQkFBTSxLQUFLLFNBQUwsQ0FBZSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQXJCLENESHFEO2FBQWIsQ0FBeEMsQ0NFWTs7OzsrQkFJSCxPQUFjLFFBQWdCO0FERHZDLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhOztBQ0dyRCxvQkFBSSxNQUFNLEtBQUssUUFBTCxDQUFjLE1BQU0sSUFBTixDQUFwQixDREhpRDtBQ0lyRCxvQkFBSTtBQUNBLHdCQUFJLFFBQVEsTUFBTSxRQUFBLFlBQUEsQ0FBYSxHQUFiLENBQU4sQ0FEWjtBQUVBLHdCQUFJLE1BQU0sTUFBTixFQUFKLEVBQW9CO0FBQ2hCLDhCQUFNLElBQUksS0FBSixDQUFVLG9CQUFvQixNQUFNLElBQU4sR0FBYSxpQkFBakMsQ0FBaEIsQ0FEZ0I7cUJBQXBCO2lCQUZKLENBS0UsT0FBTyxDQUFQLEVBQVU7QUFDUiw0QkFBUSxHQUFSLENBQVksQ0FBWixFQURRO0FBRVIsMEJBQU0sT0FBTyxHQUFQLENBQU4sQ0FGUTtpQkFBVjtBQUtGLG9CQUFJLEtBQUssS0FBSyxRQUFMLENBQWMsS0FBZCxDQUFMLENEZGlEO0FDZ0JyRCxzQkFBTSxRQUFBLFdBQUEsQ0FBWSxNQUFaLEVBQW9CLEVBQXBCLENBQU4sQ0RoQnFEO0FDa0JyRCx1QkFBTyxLQUFQLENEbEJxRDthQUFiLENBQXhDLENDQ3VDOzs7OytCQW9COUIsT0FBWTtBREZyQixtQkFBTyxVQUFVLElBQVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTtBQ0lyRCxvQkFBSSxPQUFPLEtBQUssUUFBTCxDQUFjLEtBQWQsQ0FBUCxDREppRDtBQ01yRCxvQkFBSTtBQUNBLHdCQUFJLFFBQVEsTUFBTSxRQUFBLFlBQUEsQ0FBYSxJQUFiLENBQU4sQ0FEWjtBQUVBLHdCQUFJLE1BQU0sTUFBTixFQUFKLEVBQW9CO0FBQ2hCLDhCQUFNLEdBQUcsTUFBSCxDQUFVLElBQVYsQ0FBTixDQURnQjtxQkFBcEI7aUJBRkosQ0FLRSxPQUFPLENBQVAsRUFBVTtBQUNSLDJCQUFPLElBQVAsQ0FEUTtpQkFBVjtBQUlGLHVCQUFPLEtBQVAsQ0RmcUQ7YUFBYixDQUF4QyxDQ0VxQjs7OzsrQkFnQlosT0FBWTtBREhyQixtQkFBTyxVQUFVLElBQVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTtBQ0lyRCxvQkFBSSxFQUFFLE1BQU0sS0FBSyxHQUFMLENBQVMsS0FBVCxDQUFOLENBQUYsRUFBMEI7QUFDMUIsMkJBQU8sSUFBUCxDQUQwQjtpQkFBOUI7QUFHQSxvQkFBSSxLQUFLLEtBQUssUUFBTCxDQUFjLEtBQWQsQ0FBTCxDRFBpRDtBQ1FyRCxzQkFBTSxXQUFOLEVBQW1CLEVBQW5CLEVEUnFEO0FDU3JELHVCQUFPLEdBQUcsZ0JBQUgsQ0FBb0IsRUFBcEIsQ0FBUCxDRFRxRDthQUFiLENBQXhDLENDR3FCOzs7OzRCQVFmLE9BQVk7QUREbEIsbUJBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7QUNFckQsb0JBQUksT0FBTyxLQUFLLFFBQUwsQ0FBYyxLQUFkLENBQVAsQ0RGaUQ7QUNJckQsb0JBQUk7QUFDQSx3QkFBSSxRQUFRLE1BQU0sUUFBQSxZQUFBLENBQWEsSUFBYixDQUFOLENBRFo7QUFFQSwyQkFBTyxNQUFNLE1BQU4sRUFBUCxDQUZBO2lCQUFKLENBR0UsT0FBTyxDQUFQLEVBQVU7QUFDUiwyQkFBTyxLQUFQLENBRFE7aUJBQVY7YURQc0MsQ0FBeEMsQ0NDa0I7Ozs7aUNBWUwsT0FBbUI7QUFDaEMsZ0JBQUksT0FBTyxLQUFQLEtBQWlCLFFBQWpCLEVBQTJCO0FBQzNCLHVCQUFPLEtBQUssSUFBTCxDQUFVLEtBQUssSUFBTCxDQUFVLElBQVYsRUFBZ0IsS0FBMUIsQ0FBUCxDQUQyQjthQUEvQjtBQUdBLGdCQUFJLElBQVcsS0FBWCxDQUo0QjtBQU1oQyxtQkFBTyxLQUFLLElBQUwsQ0FBVSxLQUFLLElBQUwsQ0FBVSxJQUFWLEVBQWdCLEVBQUUsSUFBRixFQUFRLEVBQUUsUUFBRixDQUF6QyxDQU5nQzs7OztrQ0FTWCxNQUFXO0FESGhDLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhO0FDS3JELG9CQUFJLE1BQU0sR0FBRyxNQUFILENBQVUsSUFBVixDQUFOLEVBQXVCLE9BQTNCO0FBQ0Esc0JBQU0sT0FBTyxJQUFQLENBQU4sQ0ROcUQ7QUNRckQscUJBQUssSUFBTCxDQUFVLElBQVYsR0FBaUIsS0FBSyxPQUFMLENBQWEsSUFBYixDQUFqQixDRFJxRDthQUFiLENBQXhDLENDR2dDOzs7O1dBN0V4Qzs7O0FBQWEsUUFBQSxtQkFBQSxHQUFtQixtQkFBbkI7QUFzRmIsYUFBQSxpQkFBQSxDQUFrQixNQUFsQixFQUEwQixtQkFBMUIiLCJmaWxlIjoiZmlsZXN0b3Jlcy9maWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci50aHJvdyh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jb25zdCBQYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgcmVwb3NpdG9yeV8xID0gcmVxdWlyZSgnLi4vcmVwb3NpdG9yeScpO1xuY29uc3QgdXRpbHNfMSA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5jb25zdCBEZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHM6ZmlsZXN0b3JlOmZpbGVzeXN0ZW0nKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnbXovZnMnKSwgbWtkaXJwID0gcmVxdWlyZSgnbWtkaXJwLXByb21pc2UnKTtcbmNsYXNzIEZpbGVTdG9yZUZpbGVTeXN0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICBpZiAoIXRoaXMub3B0cy5wYXRoKVxuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGggPSBcImFzc2V0cy51cGxvYWRzXCI7XG4gICAgfVxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5faW5pdFBhdGgodGhpcy5vcHRzLnBhdGgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlKGFzc2V0LCBzdHJlYW0pIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAvL2xldCBibiA9IFBhdGguZGlybmFtZShhc3NldC5wYXRoKSxcbiAgICAgICAgICAgIGxldCBibkYgPSB0aGlzLl9nZXRQYXRoKGFzc2V0LnBhdGgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSB5aWVsZCB1dGlsc18xLmdldEZpbGVTdGF0cyhibkYpO1xuICAgICAgICAgICAgICAgIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIGZpbGVzIGNhbGxlZCBcIiArIGFzc2V0LnBhdGggKyBcIiBhbHJlYWR5IGV4aXN0c1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgIHlpZWxkIG1rZGlycChibkYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZwID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgICAgICB5aWVsZCB1dGlsc18xLndyaXRlU3RyZWFtKHN0cmVhbSwgZnApO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVtb3ZlKGFzc2V0KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHBhdGggPSB0aGlzLl9nZXRQYXRoKGFzc2V0KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0geWllbGQgdXRpbHNfMS5nZXRGaWxlU3RhdHMocGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIGZzLnVubGluayhwYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3RyZWFtKGFzc2V0KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKCEoeWllbGQgdGhpcy5oYXMoYXNzZXQpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZwID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgICAgICBkZWJ1Zygnc3RyZWFtICVzJywgZnApO1xuICAgICAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0oZnApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaGFzKGFzc2V0KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHBhdGggPSB0aGlzLl9nZXRQYXRoKGFzc2V0KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0geWllbGQgdXRpbHNfMS5nZXRGaWxlU3RhdHMocGF0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRzLmlzRmlsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfZ2V0UGF0aChhc3NldCkge1xuICAgICAgICBpZiAodHlwZW9mIGFzc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIFBhdGguam9pbih0aGlzLm9wdHMucGF0aCwgYXNzZXQpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBhID0gYXNzZXQ7XG4gICAgICAgIHJldHVybiBQYXRoLmpvaW4odGhpcy5vcHRzLnBhdGgsIGEucGF0aCwgYS5maWxlbmFtZSk7XG4gICAgfVxuICAgIF9pbml0UGF0aChwYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKHlpZWxkIGZzLmV4aXN0cyhwYXRoKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB5aWVsZCBta2RpcnAocGF0aCk7XG4gICAgICAgICAgICB0aGlzLm9wdHMucGF0aCA9IFBhdGgucmVzb2x2ZShwYXRoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5GaWxlU3RvcmVGaWxlU3lzdGVtID0gRmlsZVN0b3JlRmlsZVN5c3RlbTtcbnJlcG9zaXRvcnlfMS5yZWdpc3RlckZpbGVTdG9yZSgnZmlsZScsIEZpbGVTdG9yZUZpbGVTeXN0ZW0pO1xuIiwiaW1wb3J0IHtSZWFkYWJsZX0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7SUZpbGVTdG9yZSwgSUZpbGV9IGZyb20gJy4uL2ludGVyZmFjZSc7XG5pbXBvcnQge3JlZ2lzdGVyRmlsZVN0b3JlfSBmcm9tICcuLi9yZXBvc2l0b3J5JztcbmltcG9ydCB7Z2V0RmlsZVN0YXRzLCB3cml0ZVN0cmVhbX0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0ICogYXMgRGVidWcgZnJvbSAnZGVidWcnO1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHM6ZmlsZXN0b3JlOmZpbGVzeXN0ZW0nKTtcblxuY29uc3QgZnMgPSByZXF1aXJlKCdtei9mcycpLFxuICAgIG1rZGlycCA9IHJlcXVpcmUoJ21rZGlycC1wcm9taXNlJyk7XG5leHBvcnQgaW50ZXJmYWNlIEZpbGVTdG9yZUZpbGVTeXN0ZW1PcHRpb25zIHtcbiAgICBwYXRoPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgRmlsZVN0b3JlRmlsZVN5c3RlbSBpbXBsZW1lbnRzIElGaWxlU3RvcmUge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBvcHRzOkZpbGVTdG9yZUZpbGVTeXN0ZW1PcHRpb25zID0ge30pIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdHMucGF0aCkgdGhpcy5vcHRzLnBhdGggPSBcImFzc2V0cy51cGxvYWRzXCI7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBcbiAgICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9pbml0UGF0aCh0aGlzLm9wdHMucGF0aCk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIGNyZWF0ZShhc3NldDogSUZpbGUsIHN0cmVhbTogUmVhZGFibGUpOiBQcm9taXNlPElGaWxlPiB7XG4gICAgICAgIC8vbGV0IGJuID0gUGF0aC5kaXJuYW1lKGFzc2V0LnBhdGgpLFxuICAgICAgICBsZXQgYm5GID0gdGhpcy5fZ2V0UGF0aChhc3NldC5wYXRoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzdGF0cyA9IGF3YWl0IGdldEZpbGVTdGF0cyhibkYpO1xuICAgICAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSBmaWxlcyBjYWxsZWQgXCIgKyBhc3NldC5wYXRoICsgXCIgYWxyZWFkeSBleGlzdHNcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcbiAgICAgICAgICAgIGF3YWl0IG1rZGlycChibkYpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZnAgPSB0aGlzLl9nZXRQYXRoKGFzc2V0KTtcbiAgICAgICAgXG4gICAgICAgIGF3YWl0IHdyaXRlU3RyZWFtKHN0cmVhbSwgZnApO1xuICAgICAgICAgXG4gICAgICAgIHJldHVybiBhc3NldDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgcmVtb3ZlKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8SUZpbGU+IHtcbiAgICAgICAgXG4gICAgICAgIGxldCBwYXRoID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHN0YXRzID0gYXdhaXQgZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMudW5saW5rKHBhdGgpO1xuICAgICAgICAgICAgfSAgICBcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhc3NldDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgc3RyZWFtKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8UmVhZGFibGU+IHtcbiAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5oYXMoYXNzZXQpKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgICAgICB9XG4gICAgICAgIGxldCBmcCA9IHRoaXMuX2dldFBhdGgoYXNzZXQpO1xuICAgICAgICBkZWJ1Zygnc3RyZWFtICVzJywgZnApO1xuICAgICAgICByZXR1cm4gZnMuY3JlYXRlUmVhZFN0cmVhbShmcCk7XG4gICAgfVxuICAgIGFzeW5jIGhhcyhhc3NldDogSUZpbGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgbGV0IHBhdGggPSB0aGlzLl9nZXRQYXRoKGFzc2V0KTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc3RhdHMgPSBhd2FpdCBnZXRGaWxlU3RhdHMocGF0aCk7XG4gICAgICAgICAgICByZXR1cm4gc3RhdHMuaXNGaWxlKCk7ICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIHByaXZhdGUgX2dldFBhdGgoYXNzZXQ6IElGaWxlfHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGlmICh0eXBlb2YgYXNzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gUGF0aC5qb2luKHRoaXMub3B0cy5wYXRoLCBhc3NldCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGEgPSA8SUZpbGU+YXNzZXQ7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gUGF0aC5qb2luKHRoaXMub3B0cy5wYXRoLCBhLnBhdGgsIGEuZmlsZW5hbWUpO1xuICAgIH1cbiAgICBcbiAgICBwcml2YXRlIGFzeW5jIF9pbml0UGF0aCAocGF0aDpzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgXG4gICAgICAgIGlmIChhd2FpdCBmcy5leGlzdHMocGF0aCkpIHJldHVybjtcbiAgICAgICAgYXdhaXQgbWtkaXJwKHBhdGgpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5vcHRzLnBhdGggPSBQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgfVxufVxuXG5yZWdpc3RlckZpbGVTdG9yZSgnZmlsZScsIEZpbGVTdG9yZUZpbGVTeXN0ZW0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
