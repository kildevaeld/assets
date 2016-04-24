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
                var bnF = this._getPath(asset.path);
                try {
                    var stats = yield utils_1.getFileStats(bnF);
                    if (stats.isFile()) {
                        throw new Error("A files called " + asset.path + " already exists");
                    }
                } catch (e) {
                    debug("path %s does not exist, creating...", bnF);
                    yield mkdirp(bnF);
                }
                var fp = this._getPath(asset);
                debug('create %s', fp);
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
                    debug('could not remove file at path: %s. Got error: %s', path, e.message);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGVzdG9yZXMvZmlsZS5qcyIsImZpbGVzdG9yZXMvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FBQ0EsSUFBSSxZQUFZLFNBQUMsSUFBUSxVQUFLLFNBQUwsSUFBbUIsVUFBVSxPQUFWLEVBQW1CLFVBQW5CLEVBQStCLENBQS9CLEVBQWtDLFNBQWxDLEVBQTZDO0FBQ3JGLFdBQU8sS0FBSyxNQUFNLElBQUksT0FBSixDQUFOLENBQUwsQ0FBeUIsVUFBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCO0FBQ3ZELGlCQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsSUFBVixDQUFlLEtBQWYsQ0FBTCxFQUFGO2FBQUosQ0FBcUMsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsS0FBVixDQUFnQixLQUFoQixDQUFMLEVBQUY7YUFBSixDQUFzQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0I7QUFBRSxtQkFBTyxJQUFQLEdBQWMsUUFBUSxPQUFPLEtBQVAsQ0FBdEIsR0FBc0MsSUFBSSxDQUFKLENBQU0sVUFBVSxPQUFWLEVBQW1CO0FBQUUsd0JBQVEsT0FBTyxLQUFQLENBQVIsQ0FBRjthQUFuQixDQUFOLENBQXFELElBQXJELENBQTBELFNBQTFELEVBQXFFLFFBQXJFLENBQXRDLENBQUY7U0FBdEI7QUFDQSxhQUFLLENBQUMsWUFBWSxVQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsRUFBeUIsVUFBekIsQ0FBWixDQUFELENBQW1ELElBQW5ELEVBQUwsRUFKdUQ7S0FBM0IsQ0FBaEMsQ0FEcUY7Q0FBN0M7QUNBNUMsSUFBWSxPQUFJLFFBQU0sTUFB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dG9yZXMvZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IHJlcG9zaXRvcnlfMSA9IHJlcXVpcmUoJy4uL3JlcG9zaXRvcnknKTtcbmNvbnN0IHV0aWxzXzEgPSByZXF1aXJlKCcuLi91dGlscycpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzOmZpbGVzdG9yZTpmaWxlc3lzdGVtJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ216L2ZzJyksIG1rZGlycCA9IHJlcXVpcmUoJ21rZGlycC1wcm9taXNlJyk7XG5jbGFzcyBGaWxlU3RvcmVGaWxlU3lzdGVtIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICAgICAgaWYgKCF0aGlzLm9wdHMucGF0aClcbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoID0gXCJhc3NldHMudXBsb2Fkc1wiO1xuICAgIH1cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX2luaXRQYXRoKHRoaXMub3B0cy5wYXRoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZShhc3NldCwgc3RyZWFtKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IGJuRiA9IHRoaXMuX2dldFBhdGgoYXNzZXQucGF0aCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IHlpZWxkIHV0aWxzXzEuZ2V0RmlsZVN0YXRzKGJuRik7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgZmlsZXMgY2FsbGVkIFwiICsgYXNzZXQucGF0aCArIFwiIGFscmVhZHkgZXhpc3RzXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoXCJwYXRoICVzIGRvZXMgbm90IGV4aXN0LCBjcmVhdGluZy4uLlwiLCBibkYpO1xuICAgICAgICAgICAgICAgIHlpZWxkIG1rZGlycChibkYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZwID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgICAgICBkZWJ1ZygnY3JlYXRlICVzJywgZnApO1xuICAgICAgICAgICAgeWllbGQgdXRpbHNfMS53cml0ZVN0cmVhbShzdHJlYW0sIGZwKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZShhc3NldCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBwYXRoID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IHlpZWxkIHV0aWxzXzEuZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCBmcy51bmxpbmsocGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IHJlbW92ZSBmaWxlIGF0IHBhdGg6ICVzLiBHb3QgZXJyb3I6ICVzJywgcGF0aCwgZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0cmVhbShhc3NldCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmICghKHlpZWxkIHRoaXMuaGFzKGFzc2V0KSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBmcCA9IHRoaXMuX2dldFBhdGgoYXNzZXQpO1xuICAgICAgICAgICAgZGVidWcoJ3N0cmVhbSAlcycsIGZwKTtcbiAgICAgICAgICAgIHJldHVybiBmcy5jcmVhdGVSZWFkU3RyZWFtKGZwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhcyhhc3NldCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBwYXRoID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IHlpZWxkIHV0aWxzXzEuZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0cy5pc0ZpbGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2dldFBhdGgoYXNzZXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhc3NldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBQYXRoLmpvaW4odGhpcy5vcHRzLnBhdGgsIGFzc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYSA9IGFzc2V0O1xuICAgICAgICByZXR1cm4gUGF0aC5qb2luKHRoaXMub3B0cy5wYXRoLCBhLnBhdGgsIGEuZmlsZW5hbWUpO1xuICAgIH1cbiAgICBfaW5pdFBhdGgocGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmICh5aWVsZCBmcy5leGlzdHMocGF0aCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgeWllbGQgbWtkaXJwKHBhdGgpO1xuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGggPSBQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuRmlsZVN0b3JlRmlsZVN5c3RlbSA9IEZpbGVTdG9yZUZpbGVTeXN0ZW07XG5yZXBvc2l0b3J5XzEucmVnaXN0ZXJGaWxlU3RvcmUoJ2ZpbGUnLCBGaWxlU3RvcmVGaWxlU3lzdGVtKTtcbiIsImltcG9ydCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQge0lGaWxlU3RvcmUsIElGaWxlfSBmcm9tICcuLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHtyZWdpc3RlckZpbGVTdG9yZX0gZnJvbSAnLi4vcmVwb3NpdG9yeSc7XG5pbXBvcnQge2dldEZpbGVTdGF0cywgd3JpdGVTdHJlYW19IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzOmZpbGVzdG9yZTpmaWxlc3lzdGVtJyk7XG5cbmNvbnN0IGZzID0gcmVxdWlyZSgnbXovZnMnKSxcbiAgICBta2RpcnAgPSByZXF1aXJlKCdta2RpcnAtcHJvbWlzZScpO1xuZXhwb3J0IGludGVyZmFjZSBGaWxlU3RvcmVGaWxlU3lzdGVtT3B0aW9ucyB7XG4gICAgcGF0aD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVTdG9yZUZpbGVTeXN0ZW0gaW1wbGVtZW50cyBJRmlsZVN0b3JlIHtcbiAgICBcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb3B0czpGaWxlU3RvcmVGaWxlU3lzdGVtT3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRzLnBhdGgpIHRoaXMub3B0cy5wYXRoID0gXCJhc3NldHMudXBsb2Fkc1wiO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgXG4gICAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5faW5pdFBhdGgodGhpcy5vcHRzLnBhdGgpO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBjcmVhdGUoYXNzZXQ6IElGaWxlLCBzdHJlYW06IFJlYWRhYmxlKTogUHJvbWlzZTxJRmlsZT4ge1xuICAgICAgICBcbiAgICAgICAgbGV0IGJuRiA9IHRoaXMuX2dldFBhdGgoYXNzZXQucGF0aCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc3RhdHMgPSBhd2FpdCBnZXRGaWxlU3RhdHMoYm5GKTtcbiAgICAgICAgICAgIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkEgZmlsZXMgY2FsbGVkIFwiICsgYXNzZXQucGF0aCArIFwiIGFscmVhZHkgZXhpc3RzXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGRlYnVnKFwicGF0aCAlcyBkb2VzIG5vdCBleGlzdCwgY3JlYXRpbmcuLi5cIiwgYm5GKVxuICAgICAgICAgICAgYXdhaXQgbWtkaXJwKGJuRik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBmcCA9IHRoaXMuX2dldFBhdGgoYXNzZXQpO1xuICAgICAgICBkZWJ1ZygnY3JlYXRlICVzJywgZnApXG4gICAgICAgIGF3YWl0IHdyaXRlU3RyZWFtKHN0cmVhbSwgZnApO1xuICAgICAgICAgXG4gICAgICAgIHJldHVybiBhc3NldDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgcmVtb3ZlKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8SUZpbGU+IHtcbiAgICAgICAgXG4gICAgICAgIGxldCBwYXRoID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHN0YXRzID0gYXdhaXQgZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZnMudW5saW5rKHBhdGgpO1xuICAgICAgICAgICAgfSAgICBcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCByZW1vdmUgZmlsZSBhdCBwYXRoOiAlcy4gR290IGVycm9yOiAlcycsIHBhdGgsIGUubWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBzdHJlYW0oYXNzZXQ6IElGaWxlKTogUHJvbWlzZTxSZWFkYWJsZT4ge1xuICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmhhcyhhc3NldCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDsgXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGZwID0gdGhpcy5fZ2V0UGF0aChhc3NldCk7XG4gICAgICAgIGRlYnVnKCdzdHJlYW0gJXMnLCBmcCk7XG4gICAgICAgIHJldHVybiBmcy5jcmVhdGVSZWFkU3RyZWFtKGZwKTtcbiAgICB9XG4gICAgYXN5bmMgaGFzKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBsZXQgcGF0aCA9IHRoaXMuX2dldFBhdGgoYXNzZXQpO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzdGF0cyA9IGF3YWl0IGdldEZpbGVTdGF0cyhwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBzdGF0cy5pc0ZpbGUoKTsgICAgICAgXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBfZ2V0UGF0aChhc3NldDogSUZpbGV8c3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhc3NldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBQYXRoLmpvaW4odGhpcy5vcHRzLnBhdGgsIGFzc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYSA9IDxJRmlsZT5hc3NldDtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBQYXRoLmpvaW4odGhpcy5vcHRzLnBhdGgsIGEucGF0aCwgYS5maWxlbmFtZSk7XG4gICAgfVxuICAgIFxuICAgIHByaXZhdGUgYXN5bmMgX2luaXRQYXRoIChwYXRoOnN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBcbiAgICAgICAgaWYgKGF3YWl0IGZzLmV4aXN0cyhwYXRoKSkgcmV0dXJuO1xuICAgICAgICBhd2FpdCBta2RpcnAocGF0aCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm9wdHMucGF0aCA9IFBhdGgucmVzb2x2ZShwYXRoKTtcbiAgICB9XG59XG5cbnJlZ2lzdGVyRmlsZVN0b3JlKCdmaWxlJywgRmlsZVN0b3JlRmlsZVN5c3RlbSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
