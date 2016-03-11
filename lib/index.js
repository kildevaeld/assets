/// <reference path="../typings/main.d.ts" />
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
var events_1 = require('events');
var repository_1 = require('./repository');
var asset_1 = require('./asset');
var utils_1 = require('./utils');
var Path = require('path');
var os = require('os');
var fs = require('fs');
var Debug = require('debug');
var debug = Debug('assets');
(function (Hook) {
    Hook[Hook["BeforeCreate"] = 0] = "BeforeCreate";
    Hook[Hook["Create"] = 1] = "Create";
})(exports.Hook || (exports.Hook = {}));
var Hook = exports.Hook;

var Assets = function (_events_1$EventEmitte) {
    _inherits(Assets, _events_1$EventEmitte);

    function Assets(options) {
        _classCallCheck(this, Assets);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Assets).call(this));

        _this._hooks = new Map();
        if (!options) {
            throw new Error('options');
        }
        if (!options.metaStore) {
            options.metaStore = 'file';
        }
        if (!options.dataStore) {
            options.dataStore = 'file';
        }
        var meta = repository_1.getMetaStore(options.metaStore, options.metaStoreOptions);
        var file = repository_1.getFileStore(options.dataStore, options.dataStoreOptions);
        if (!meta || !file) {
            throw new Error("no file or meta store");
        }
        _this.metaStore = meta;
        _this.fileStore = file;
        return _this;
    }

    _createClass(Assets, [{
        key: 'initialize',
        value: function initialize() {
            return __awaiter(this, void 0, Promise, function* () {
                yield Promise.all([this.metaStore.initialize(), this.fileStore.initialize()]);
            });
        }
    }, {
        key: 'create',
        value: function create(stream, path) {
            var options = arguments.length <= 2 || arguments[2] === undefined ? { skipMeta: false } : arguments[2];

            return __awaiter(this, void 0, Promise, function* () {
                var tmpFile = void 0;
                var clean = function clean() {
                    if (tmpFile) fs.unlink(tmpFile);
                };
                // If mime or size isnt provided, we have to get it
                // the hard way
                if (!options.mime || !options.size) {
                    tmpFile = yield this._createTemp(stream, path);
                    var stats = yield utils_1.getFileStats(tmpFile);
                    var mime = utils_1.getMimeType(tmpFile);
                    options.mime = mime;
                    options.size = stats.size;
                }
                var asset = new asset_1.Asset({
                    name: options.name,
                    path: path,
                    filename: Path.basename(path),
                    mime: options.mime,
                    size: options.size
                });
                var self = this;
                this._runHook(Hook.BeforeCreate, asset, function () {
                    return __awaiter(this, void 0, Promise, function* () {
                        if (!tmpFile) {
                            tmpFile = yield self._createTemp(stream, path);
                        }
                        return fs.createReadStream(tmpFile);
                    });
                });
                if (tmpFile) {
                    stream = fs.createReadStream(tmpFile);
                }
                yield this.fileStore.create(asset, stream);
                if (!options.skipMeta) {
                    try {
                        yield this.metaStore.create(asset);
                    } catch (e) {
                        yield this.fileStore.remove(asset);
                        clean();
                        throw e;
                    }
                }
                clean();
                this._runHook(Hook.Create, asset);
                return asset;
            });
        }
    }, {
        key: 'getById',
        value: function getById(id) {
            return __awaiter(this, void 0, Promise, function* () {
                var info = yield this.metaStore.get(id);
                if (!(info instanceof asset_1.Asset)) {
                    info = new asset_1.Asset(info);
                }
                return info;
            });
        }
    }, {
        key: 'getByPath',
        value: function getByPath(path) {
            return __awaiter(this, void 0, Promise, function* () {
                var info = yield this.metaStore.find({
                    path: path
                });
                if (!info || info.length === 0) return null;
                if (!(info[0] instanceof asset_1.Asset)) {
                    info[0] = new asset_1.Asset(info[0]);
                }
                return info[0];
            });
        }
    }, {
        key: 'remove',
        value: function remove(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                if ((yield this.getById(asset.id)) == null) {
                    return null;
                }
                yield this.fileStore.remove(asset);
                yield this.metaStore.remove(asset);
            });
        }
    }, {
        key: 'list',
        value: function list(options) {
            return __awaiter(this, void 0, Promise, function* () {
                var infos = yield this.metaStore.list(options);
                if (!infos.length) return infos;
                return infos.map(function (m) {
                    if (!(m instanceof asset_1.Asset)) {
                        return new asset_1.Asset(m);
                    }
                    return m;
                });
            });
        }
    }, {
        key: 'stream',
        value: function stream(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                return yield this.fileStore.stream(asset);
            });
        }
    }, {
        key: 'registerHook',
        value: function registerHook(hook) {
            if (!this._hooks.has(hook)) {
                this._hooks.set(hook, []);
            }

            for (var _len = arguments.length, fn = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                fn[_key - 1] = arguments[_key];
            }

            for (var i = 0, ii = fn.length; i < ii; i++) {
                this._hooks.get(hook).push(fn[i]);
            }
        }
    }, {
        key: '_createTemp',
        value: function _createTemp(stream, path) {
            return __awaiter(this, void 0, Promise, function* () {
                var rnd = yield utils_1.randomName(path);
                var tmpFile = Path.join(os.tmpdir(), rnd);
                yield this._writeFile(stream, tmpFile);
                return tmpFile;
            });
        }
    }, {
        key: '_runHook',
        value: function _runHook(hook, asset, fn) {
            return __awaiter(this, void 0, Promise, function* () {
                var hooks = this._hooks.get(hook);
                if (!hooks) return;
                for (var i = 0, ii = hooks.length; i < ii; i++) {
                    yield hooks[i](asset, fn);
                }
            });
        }
    }, {
        key: '_writeFile',
        value: function _writeFile(stream, path) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise(function (resolve, reject) {
                    var ws = fs.createWriteStream(path);
                    ws.on('finish', resolve).on('error', reject);
                    stream.on('error', reject);
                    stream.pipe(ws);
                });
            });
        }
    }]);

    return Assets;
}(events_1.EventEmitter);

exports.Assets = Assets;