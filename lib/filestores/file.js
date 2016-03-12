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