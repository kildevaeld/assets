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
var thumbnailer_1 = require('./thumbnailer');
var asset_1 = require('./asset');
var utils_1 = require('./utils');
var generators = require('./generators/index');
var Path = require('path');
var os = require('os');
var fs = require('fs');
var Debug = require('debug');
var sanitize = require('sanitize-filename');
var debug = Debug('assets');
var idCounter = 0;
function getId() {
    return ++idCounter + "";
}
(function (Hook) {
    Hook[Hook["BeforeCreate"] = 0] = "BeforeCreate";
    Hook[Hook["Create"] = 1] = "Create";
    Hook[Hook["BeforeRemove"] = 2] = "BeforeRemove";
    Hook[Hook["Remove"] = 3] = "Remove";
    Hook[Hook["BeforeList"] = 4] = "BeforeList";
    Hook[Hook["BeforeStream"] = 5] = "BeforeStream";
    Hook[Hook["BeforeThumbnail"] = 6] = "BeforeThumbnail";
    Hook[Hook["BeforeGet"] = 7] = "BeforeGet";
    Hook[Hook["BeforeCount"] = 8] = "BeforeCount";
})(exports.Hook || (exports.Hook = {}));
var Hook = exports.Hook;
function isString(a) {
    return typeof a === 'string';
}

var Assets = function (_events_1$EventEmitte) {
    _inherits(Assets, _events_1$EventEmitte);

    function Assets(options) {
        _classCallCheck(this, Assets);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Assets).call(this));

        _this._hooks = new Map();
        _this._mimeHandlers = [];
        if (!options) {
            throw new Error('options');
        }
        if (!options.metaStore) {
            options.metaStore = 'file';
        }
        if (!options.fileStore) {
            options.fileStore = 'file';
        }
        var meta = void 0,
            file = void 0;
        if (isString(options.metaStore)) {
            meta = repository_1.getMetaStore(options.metaStore, options.metaStoreOptions);
        } else {
            meta = options.metaStore;
        }
        if (isString(options.fileStore)) {
            file = repository_1.getFileStore(options.fileStore, options.fileStoreOptions);
        } else {
            file = options.fileStore;
        }
        if (!meta || !file) {
            throw new Error("no file or meta store");
        }
        _this.thumbnailer = new thumbnailer_1.Thumbnailer();
        _this._metaStore = meta;
        _this._fileStore = file;
        return _this;
    }

    _createClass(Assets, [{
        key: 'initialize',
        value: function initialize() {
            return __awaiter(this, void 0, Promise, function* () {
                yield Promise.all([this.metaStore.initialize(), this.fileStore.initialize(), generators.initialize(), this.thumbnailer.initialize(this)]);
            });
        }
    }, {
        key: 'thumbnail',
        value: function thumbnail(asset, options) {
            return __awaiter(this, void 0, Promise, function* () {
                this._runHook(Hook.BeforeThumbnail, asset, null, options);
                var stream = yield this.thumbnailer.request(asset, options);
                return stream;
            });
        }
    }, {
        key: 'canThumbnail',
        value: function canThumbnail(asset) {
            return this.thumbnailer.canThumbnail(asset.mime);
        }
    }, {
        key: 'createFromPath',
        value: function createFromPath(path, dest) {
            var options = arguments.length <= 2 || arguments[2] === undefined ? { skipMeta: false } : arguments[2];

            return __awaiter(this, void 0, void 0, function* () {
                var stat = yield utils_1.getFileStats(path);
                if (!stat.isFile()) throw new Error('not a file');
                var reader = fs.createReadStream(path);
                options.size = stat.size;
                options.mime = utils_1.getMimeType(path);
                return yield this.create(reader, dest, options);
            });
        }
    }, {
        key: 'create',
        value: function create(stream, path) {
            var options = arguments.length <= 2 || arguments[2] === undefined ? { skipMeta: false } : arguments[2];

            return __awaiter(this, void 0, Promise, function* () {
                var _this2 = this;

                var tmpFile = void 0;
                var clean = function clean() {
                    if (tmpFile) fs.unlink(tmpFile);
                };
                var filename = Path.basename(path);
                filename = sanitize(filename.replace(/[^a-z0-9\-\.]/gi, '_'));
                // If mime or size isnt provided, we have to get it
                // the hard way
                if (!options.mime || !options.size || options.mime === "" || options.size === 0) {
                    tmpFile = yield this._createTemp(stream, path);
                    var stats = yield utils_1.getFileStats(tmpFile);
                    var mime = utils_1.getMimeType(tmpFile);
                    options.mime = mime;
                    options.size = stats.size;
                }
                var dirPath = Path.dirname(path);
                //console.log(dirPath, options.path);
                //if (options.path) dirPath = Path.join(options.path, dirPath);
                if (options.path) dirPath = options.path;
                var asset = new asset_1.Asset({
                    name: options.name || filename,
                    path: dirPath,
                    filename: filename,
                    mime: options.mime,
                    size: options.size,
                    hidden: options.hidden,
                    meta: options.meta || {}
                });
                var createFn = function createFn() {
                    return __awaiter(_this2, void 0, Promise, function* () {
                        if (!tmpFile) {
                            tmpFile = yield this._createTemp(stream, path);
                        }
                        return fs.createReadStream(tmpFile);
                    });
                };
                var self = this;
                this._runHook(Hook.BeforeCreate, asset, createFn, options);
                if (tmpFile) {
                    stream = fs.createReadStream(tmpFile);
                }
                if (asset.path[asset.path.length - 1] !== '/') asset.path += '/';
                yield this.fileStore.create(asset, stream, options);
                try {
                    yield this._runHandlers(asset, function () {
                        return _this2.stream(asset);
                    });
                } catch (e) {
                    debug('error %s', e);
                }
                if (!options.skipMeta) {
                    try {
                        yield this.metaStore.create(asset, options);
                    } catch (e) {
                        yield this.fileStore.remove(asset);
                        clean();
                        throw e;
                    }
                }
                clean();
                debug('create %j', asset);
                this._runHook(Hook.Create, asset, null, options);
                return asset;
            });
        }
        /** Get an asset by id
         * @param {string} id The id
         * @return Promise<Asset>
         */

    }, {
        key: 'getById',
        value: function getById(id, options) {
            return __awaiter(this, void 0, Promise, function* () {
                var info = yield this.metaStore.get(id, options);
                if (!(info instanceof asset_1.Asset)) {
                    info = new asset_1.Asset(info);
                }
                return info;
            });
        }
        /**
         * Get an asset by full path
         * @param {string} path The full path to the file
         * @return Promise<Asset>
         */

    }, {
        key: 'getByPath',
        value: function getByPath(path, options) {
            return this.metaStore.getByPath(path, options).then(function (asset) {
                if (asset) {
                    if (!(asset instanceof asset_1.Asset)) asset = new asset_1.Asset(asset);
                }
                return asset;
            });
        }
    }, {
        key: 'has',
        value: function has(path, options) {
            return this.getByPath(path, options).then(function (a) {
                return a != null;
            });
        }
    }, {
        key: 'query',
        value: function query(term, options) {
            return __awaiter(this, void 0, Promise, function* () {
                options = options || {};
                options.path = term;
                return (yield this.metaStore.find(options)).map(function (a) {
                    if (a instanceof asset_1.Asset) {
                        return a;
                    }
                    return new asset_1.Asset(a);
                });
            });
        }
    }, {
        key: 'remove',
        value: function remove(asset, options) {
            return __awaiter(this, void 0, Promise, function* () {
                if ((yield this.getById(asset.id, options)) == null) {
                    return null;
                }
                yield this._runHook(Hook.BeforeRemove, asset, options);
                yield this.fileStore.remove(asset);
                yield this.metaStore.remove(asset);
                this._runHook(Hook.Remove, asset, null, options);
            });
        }
    }, {
        key: 'list',
        value: function list(options) {
            return __awaiter(this, void 0, Promise, function* () {
                yield this._runHook(Hook.BeforeList, null, null, options);
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
        value: function stream(asset, options) {
            return __awaiter(this, void 0, Promise, function* () {
                yield this._runHook(Hook.BeforeStream, asset, null, options);
                return yield this.fileStore.stream(asset);
            });
        }
    }, {
        key: 'count',
        value: function count(options) {
            return __awaiter(this, void 0, Promise, function* () {
                yield this._runHook(Hook.BeforeCount, null, null, options);
                return yield this.metaStore.count(options);
            });
        }
    }, {
        key: 'use',
        value: function use(mime, fn) {
            if (typeof mime === 'function') {
                fn = mime;
                mime = '.*';
            }
            this._mimeHandlers.push({
                r: new RegExp(mime, 'i'),
                f: fn
            });
            return this;
        }
    }, {
        key: 'registerHook',
        value: function registerHook(hook, fn) {
            if (!this._hooks.has(hook)) {
                this._hooks.set(hook, []);
            }
            var id = getId();
            this._hooks.get(hook).push([id, fn]);
            return id;
        }
    }, {
        key: 'unregister',
        value: function unregister(hook, fn) {
            if (!this._hooks.has(hook)) return;
            var hooks = this._hooks.get(hook);
            for (var i = 0, ii = hooks.length; i < ii; i++) {
                if (hooks[i][0] === fn || hooks[i][1] === fn) {
                    hooks.splice(i, 1);
                    break;
                }
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
        value: function _runHook(hook, asset, fn, options) {
            return __awaiter(this, void 0, Promise, function* () {
                var hooks = this._hooks.get(hook);
                if (!hooks) return;
                debug("run hook %s (%d)", Hook[hook], hooks.length);
                for (var i = 0, ii = hooks.length; i < ii; i++) {
                    debug("run hook id %s", hooks[i][0]);
                    yield hooks[i][1](asset, fn, options);
                }
            });
        }
    }, {
        key: '_runHandlers',
        value: function _runHandlers(asset, fn) {
            return __awaiter(this, void 0, Promise, function* () {
                for (var i = 0, ii = this._mimeHandlers.length; i < ii; i++) {
                    if (this._mimeHandlers[i].r.test(asset.mime)) {
                        yield this._mimeHandlers[i].f(asset, fn);
                    }
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
    }, {
        key: 'metaStore',
        get: function get() {
            return this._metaStore;
        }
    }, {
        key: 'fileStore',
        get: function get() {
            return this._fileStore;
        }
    }]);

    return Assets;
}(events_1.EventEmitter);

exports.Assets = Assets;
//# sourceMappingURL=data:application/json;base64,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QVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTtBQzhFckQsdUJBQU8sSUFBSSxPQUFKLENBQWtCLFVBQVMsT0FBVCxFQUFrQixNQUFsQixFQUF3QjtBQUM3Qyx3QkFBSSxLQUFLLEdBQUcsaUJBQUgsQ0FBcUIsSUFBckIsQ0FBTCxDQUR5QztBQUU3Qyx1QkFBRyxFQUFILENBQU0sUUFBTixFQUFnQixPQUFoQixFQUNLLEVBREwsQ0FDUSxPQURSLEVBQ2lCLE1BRGpCLEVBRjZDO0FBSzdDLDJCQUFPLEVBQVAsQ0FBVSxPQUFWLEVBQW1CLE1BQW5CLEVBTDZDO0FBTzdDLDJCQUFPLElBQVAsQ0FBWSxFQUFaLEVBUDZDO2lCQUF4QixDQUF6QixDRDlFcUQ7YUFBYixDQUF4QyxDQzZFbUQ7Ozs7NEJBcFVuQztBQUNoQixtQkFBTyxLQUFLLFVBQUwsQ0FEUzs7Ozs0QkFJQTtBQUNoQixtQkFBTyxLQUFLLFVBQUwsQ0FEUzs7OztXQU54QjtFQUE0QixTQUFBLFlBQUE7O0FBQWYsUUFBQSxNQUFBLEdBQU0sTUFBTiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL21haW4uZC50c1wiIC8+XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNvbnN0IGV2ZW50c18xID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5jb25zdCByZXBvc2l0b3J5XzEgPSByZXF1aXJlKCcuL3JlcG9zaXRvcnknKTtcbmNvbnN0IHRodW1ibmFpbGVyXzEgPSByZXF1aXJlKCcuL3RodW1ibmFpbGVyJyk7XG5jb25zdCBhc3NldF8xID0gcmVxdWlyZSgnLi9hc3NldCcpO1xuY29uc3QgdXRpbHNfMSA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmNvbnN0IGdlbmVyYXRvcnMgPSByZXF1aXJlKCcuL2dlbmVyYXRvcnMvaW5kZXgnKTtcbmNvbnN0IFBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBEZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJyk7XG5jb25zdCBzYW5pdGl6ZSA9IHJlcXVpcmUoJ3Nhbml0aXplLWZpbGVuYW1lJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHMnKTtcbnZhciBpZENvdW50ZXIgPSAwO1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gICAgcmV0dXJuICsraWRDb3VudGVyICsgXCJcIjtcbn1cbihmdW5jdGlvbiAoSG9vaykge1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZUNyZWF0ZVwiXSA9IDBdID0gXCJCZWZvcmVDcmVhdGVcIjtcbiAgICBIb29rW0hvb2tbXCJDcmVhdGVcIl0gPSAxXSA9IFwiQ3JlYXRlXCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlUmVtb3ZlXCJdID0gMl0gPSBcIkJlZm9yZVJlbW92ZVwiO1xuICAgIEhvb2tbSG9va1tcIlJlbW92ZVwiXSA9IDNdID0gXCJSZW1vdmVcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVMaXN0XCJdID0gNF0gPSBcIkJlZm9yZUxpc3RcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVTdHJlYW1cIl0gPSA1XSA9IFwiQmVmb3JlU3RyZWFtXCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlVGh1bWJuYWlsXCJdID0gNl0gPSBcIkJlZm9yZVRodW1ibmFpbFwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZUdldFwiXSA9IDddID0gXCJCZWZvcmVHZXRcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVDb3VudFwiXSA9IDhdID0gXCJCZWZvcmVDb3VudFwiO1xufSkoZXhwb3J0cy5Ib29rIHx8IChleHBvcnRzLkhvb2sgPSB7fSkpO1xudmFyIEhvb2sgPSBleHBvcnRzLkhvb2s7XG5mdW5jdGlvbiBpc1N0cmluZyhhKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBhID09PSAnc3RyaW5nJztcbn1cbmNsYXNzIEFzc2V0cyBleHRlbmRzIGV2ZW50c18xLkV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9ob29rcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fbWltZUhhbmRsZXJzID0gW107XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvcHRpb25zJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLm1ldGFTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5tZXRhU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLmZpbGVTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5maWxlU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1ldGEsIGZpbGU7XG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLm1ldGFTdG9yZSkpIHtcbiAgICAgICAgICAgIG1ldGEgPSByZXBvc2l0b3J5XzEuZ2V0TWV0YVN0b3JlKG9wdGlvbnMubWV0YVN0b3JlLCBvcHRpb25zLm1ldGFTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbWV0YSA9IG9wdGlvbnMubWV0YVN0b3JlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLmZpbGVTdG9yZSkpIHtcbiAgICAgICAgICAgIGZpbGUgPSByZXBvc2l0b3J5XzEuZ2V0RmlsZVN0b3JlKG9wdGlvbnMuZmlsZVN0b3JlLCBvcHRpb25zLmZpbGVTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlsZSA9IG9wdGlvbnMuZmlsZVN0b3JlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbWV0YSB8fCAhZmlsZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gZmlsZSBvciBtZXRhIHN0b3JlXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGh1bWJuYWlsZXIgPSBuZXcgdGh1bWJuYWlsZXJfMS5UaHVtYm5haWxlcigpO1xuICAgICAgICB0aGlzLl9tZXRhU3RvcmUgPSBtZXRhO1xuICAgICAgICB0aGlzLl9maWxlU3RvcmUgPSBmaWxlO1xuICAgIH1cbiAgICBnZXQgbWV0YVN0b3JlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWV0YVN0b3JlO1xuICAgIH1cbiAgICBnZXQgZmlsZVN0b3JlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZVN0b3JlO1xuICAgIH1cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICB0aGlzLm1ldGFTdG9yZS5pbml0aWFsaXplKCksXG4gICAgICAgICAgICAgICAgdGhpcy5maWxlU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRvcnMuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgICAgIHRoaXMudGh1bWJuYWlsZXIuaW5pdGlhbGl6ZSh0aGlzKVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB0aHVtYm5haWwoYXNzZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlVGh1bWJuYWlsLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBsZXQgc3RyZWFtID0geWllbGQgdGhpcy50aHVtYm5haWxlci5yZXF1ZXN0KGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjYW5UaHVtYm5haWwoYXNzZXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGh1bWJuYWlsZXIuY2FuVGh1bWJuYWlsKGFzc2V0Lm1pbWUpO1xuICAgIH1cbiAgICBjcmVhdGVGcm9tUGF0aChwYXRoLCBkZXN0LCBvcHRpb25zID0geyBza2lwTWV0YTogZmFsc2UgfSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHN0YXQgPSB5aWVsZCB1dGlsc18xLmdldEZpbGVTdGF0cyhwYXRoKTtcbiAgICAgICAgICAgIGlmICghc3RhdC5pc0ZpbGUoKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIGZpbGUnKTtcbiAgICAgICAgICAgIGxldCByZWFkZXIgPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHBhdGgpO1xuICAgICAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdC5zaXplO1xuICAgICAgICAgICAgb3B0aW9ucy5taW1lID0gdXRpbHNfMS5nZXRNaW1lVHlwZShwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLmNyZWF0ZShyZWFkZXIsIGRlc3QsIG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlKHN0cmVhbSwgcGF0aCwgb3B0aW9ucyA9IHsgc2tpcE1ldGE6IGZhbHNlIH0pIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgdG1wRmlsZTtcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuID0gKCkgPT4geyBpZiAodG1wRmlsZSlcbiAgICAgICAgICAgICAgICBmcy51bmxpbmsodG1wRmlsZSk7IH07XG4gICAgICAgICAgICBsZXQgZmlsZW5hbWUgPSBQYXRoLmJhc2VuYW1lKHBhdGgpO1xuICAgICAgICAgICAgZmlsZW5hbWUgPSBzYW5pdGl6ZShmaWxlbmFtZS5yZXBsYWNlKC9bXmEtejAtOVxcLVxcLl0vZ2ksICdfJykpO1xuICAgICAgICAgICAgLy8gSWYgbWltZSBvciBzaXplIGlzbnQgcHJvdmlkZWQsIHdlIGhhdmUgdG8gZ2V0IGl0XG4gICAgICAgICAgICAvLyB0aGUgaGFyZCB3YXlcbiAgICAgICAgICAgIGlmICgoIW9wdGlvbnMubWltZSB8fCAhb3B0aW9ucy5zaXplKSB8fCAob3B0aW9ucy5taW1lID09PSBcIlwiIHx8IG9wdGlvbnMuc2l6ZSA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICB0bXBGaWxlID0geWllbGQgdGhpcy5fY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IHlpZWxkIHV0aWxzXzEuZ2V0RmlsZVN0YXRzKHRtcEZpbGUpO1xuICAgICAgICAgICAgICAgIGxldCBtaW1lID0gdXRpbHNfMS5nZXRNaW1lVHlwZSh0bXBGaWxlKTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLm1pbWUgPSBtaW1lO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuc2l6ZSA9IHN0YXRzLnNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZGlyUGF0aCA9IFBhdGguZGlybmFtZShwYXRoKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coZGlyUGF0aCwgb3B0aW9ucy5wYXRoKTtcbiAgICAgICAgICAgIC8vaWYgKG9wdGlvbnMucGF0aCkgZGlyUGF0aCA9IFBhdGguam9pbihvcHRpb25zLnBhdGgsIGRpclBhdGgpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF0aClcbiAgICAgICAgICAgICAgICBkaXJQYXRoID0gb3B0aW9ucy5wYXRoO1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0gbmV3IGFzc2V0XzEuQXNzZXQoe1xuICAgICAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSB8fCBmaWxlbmFtZSxcbiAgICAgICAgICAgICAgICBwYXRoOiBkaXJQYXRoLFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZSxcbiAgICAgICAgICAgICAgICBtaW1lOiBvcHRpb25zLm1pbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogb3B0aW9ucy5zaXplLFxuICAgICAgICAgICAgICAgIGhpZGRlbjogb3B0aW9ucy5oaWRkZW4sXG4gICAgICAgICAgICAgICAgbWV0YTogb3B0aW9ucy5tZXRhIHx8IHt9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZUZuID0gKCkgPT4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRtcEZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdG1wRmlsZSA9IHlpZWxkIHRoaXMuX2NyZWF0ZVRlbXAoc3RyZWFtLCBwYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVDcmVhdGUsIGFzc2V0LCBjcmVhdGVGbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAodG1wRmlsZSkge1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXNzZXQucGF0aFthc3NldC5wYXRoLmxlbmd0aCAtIDFdICE9PSAnLycpXG4gICAgICAgICAgICAgICAgYXNzZXQucGF0aCArPSAnLyc7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmZpbGVTdG9yZS5jcmVhdGUoYXNzZXQsIHN0cmVhbSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhhbmRsZXJzKGFzc2V0LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdlcnJvciAlcycsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnNraXBNZXRhKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhpcy5tZXRhU3RvcmUuY3JlYXRlKGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhpcy5maWxlU3RvcmUucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGVhbigpO1xuICAgICAgICAgICAgZGVidWcoJ2NyZWF0ZSAlaicsIGFzc2V0KTtcbiAgICAgICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5DcmVhdGUsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKiBHZXQgYW4gYXNzZXQgYnkgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIGlkXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGdldEJ5SWQoaWQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgaW5mbyA9IHlpZWxkIHRoaXMubWV0YVN0b3JlLmdldChpZCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoIShpbmZvIGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkpIHtcbiAgICAgICAgICAgICAgICBpbmZvID0gbmV3IGFzc2V0XzEuQXNzZXQoaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5mbztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhc3NldCBieSBmdWxsIHBhdGhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBwYXRoIHRvIHRoZSBmaWxlXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGdldEJ5UGF0aChwYXRoLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGFTdG9yZS5nZXRCeVBhdGgocGF0aCwgb3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGFzc2V0ID0+IHtcbiAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgIGlmICghKGFzc2V0IGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkpXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0ID0gbmV3IGFzc2V0XzEuQXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaGFzKHBhdGgsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QnlQYXRoKHBhdGgsIG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihhID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhICE9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBxdWVyeSh0ZXJtLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBvcHRpb25zLnBhdGggPSB0ZXJtO1xuICAgICAgICAgICAgcmV0dXJuICh5aWVsZCB0aGlzLm1ldGFTdG9yZS5maW5kKG9wdGlvbnMpKS5tYXAoYSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBhc3NldF8xLkFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGFzc2V0XzEuQXNzZXQoYSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZShhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmICgoeWllbGQgdGhpcy5nZXRCeUlkKGFzc2V0LmlkLCBvcHRpb25zKSkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVJlbW92ZSwgYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5maWxlU3RvcmUucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMubWV0YVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suUmVtb3ZlLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsaXN0KG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlTGlzdCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBsZXQgaW5mb3MgPSB5aWVsZCB0aGlzLm1ldGFTdG9yZS5saXN0KG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFpbmZvcy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZm9zO1xuICAgICAgICAgICAgcmV0dXJuIGluZm9zLm1hcChtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIShtIGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBhc3NldF8xLkFzc2V0KG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3RyZWFtKGFzc2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVN0cmVhbSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuZmlsZVN0b3JlLnN0cmVhbShhc3NldCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb3VudChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNvdW50LCBudWxsLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLm1ldGFTdG9yZS5jb3VudChvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHVzZShtaW1lLCBmbikge1xuICAgICAgICBpZiAodHlwZW9mIG1pbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGZuID0gbWltZTtcbiAgICAgICAgICAgIG1pbWUgPSAnLionO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHI6IG5ldyBSZWdFeHAobWltZSwgJ2knKSxcbiAgICAgICAgICAgIGY6IGZuXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVnaXN0ZXJIb29rKGhvb2ssIGZuKSB7XG4gICAgICAgIGlmICghdGhpcy5faG9va3MuaGFzKGhvb2spKSB7XG4gICAgICAgICAgICB0aGlzLl9ob29rcy5zZXQoaG9vaywgW10pO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpZCA9IGdldElkKCk7XG4gICAgICAgIHRoaXMuX2hvb2tzLmdldChob29rKS5wdXNoKFtpZCwgZm5dKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbiAgICB1bnJlZ2lzdGVyKGhvb2ssIGZuKSB7XG4gICAgICAgIGlmICghdGhpcy5faG9va3MuaGFzKGhvb2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vayk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGhvb2tzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChob29rc1tpXVswXSA9PT0gZm4gfHwgaG9va3NbaV1bMV0gPT09IGZuKSB7XG4gICAgICAgICAgICAgICAgaG9va3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9jcmVhdGVUZW1wKHN0cmVhbSwgcGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBybmQgPSB5aWVsZCB1dGlsc18xLnJhbmRvbU5hbWUocGF0aCk7XG4gICAgICAgICAgICBsZXQgdG1wRmlsZSA9IFBhdGguam9pbihvcy50bXBkaXIoKSwgcm5kKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3dyaXRlRmlsZShzdHJlYW0sIHRtcEZpbGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRtcEZpbGU7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcnVuSG9vayhob29rLCBhc3NldCwgZm4sIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vayk7XG4gICAgICAgICAgICBpZiAoIWhvb2tzKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgJXMgKCVkKVwiLCBIb29rW2hvb2tdLCBob29rcy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gaG9va3MubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgaWQgJXNcIiwgaG9va3NbaV1bMF0pO1xuICAgICAgICAgICAgICAgIHlpZWxkIGhvb2tzW2ldWzFdKGFzc2V0LCBmbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcnVuSGFuZGxlcnMoYXNzZXQsIGZuKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fbWltZUhhbmRsZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbWltZUhhbmRsZXJzW2ldLnIudGVzdChhc3NldC5taW1lKSkge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9taW1lSGFuZGxlcnNbaV0uZihhc3NldCwgZm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF93cml0ZUZpbGUoc3RyZWFtLCBwYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgd3MgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShwYXRoKTtcbiAgICAgICAgICAgICAgICB3cy5vbignZmluaXNoJywgcmVzb2x2ZSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgc3RyZWFtLnBpcGUod3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuQXNzZXRzID0gQXNzZXRzO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvbWFpbi5kLnRzXCIgLz5cblxuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQge1JlYWRhYmxlfSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHtnZXRGaWxlU3RvcmUsIGdldE1ldGFTdG9yZX0gZnJvbSAnLi9yZXBvc2l0b3J5JztcbmltcG9ydCB7SUZpbGUsIElNZXRhU3RvcmUsIElGaWxlU3RvcmUsIElMaXN0T3B0aW9ucywgSUZpbmRPcHRpb25zfSBmcm9tICcuL2ludGVyZmFjZSc7XG5pbXBvcnQge1RodW1ibmFpbGVyfSBmcm9tICcuL3RodW1ibmFpbGVyJztcbmltcG9ydCB7QXNzZXR9IGZyb20gJy4vYXNzZXQnO1xuaW1wb3J0IHtyYW5kb21OYW1lLCBnZXRGaWxlU3RhdHMsIGdldE1pbWVUeXBlLCB3cml0ZVN0cmVhbX0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgKiBhcyBnZW5lcmF0b3JzIGZyb20gJy4vZ2VuZXJhdG9ycy9pbmRleCc7XG5pbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgRGVidWcgZnJvbSAnZGVidWcnO1xuXG5cblxuXG5jb25zdCBzYW5pdGl6ZSA9IHJlcXVpcmUoJ3Nhbml0aXplLWZpbGVuYW1lJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHMnKTtcblxudmFyIGlkQ291bnRlciA9IDA7XG5mdW5jdGlvbiBnZXRJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiArK2lkQ291bnRlciArIFwiXCI7XG59XG5cbmV4cG9ydCBlbnVtIEhvb2sge1xuICAgIEJlZm9yZUNyZWF0ZSxcbiAgICBDcmVhdGUsXG4gICAgQmVmb3JlUmVtb3ZlLFxuICAgIFJlbW92ZSxcbiAgICBCZWZvcmVMaXN0LFxuICAgIEJlZm9yZVN0cmVhbSxcbiAgICBCZWZvcmVUaHVtYm5haWwsXG4gICAgQmVmb3JlR2V0LFxuICAgIEJlZm9yZUNvdW50XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGE6YW55KTogYSBpcyBTdHJpbmcge1xuICAgIHJldHVybiB0eXBlb2YgYSA9PT0gJ3N0cmluZyc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSG9va0Z1bmMge1xuICAgIChhc3NldDogQXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4sIG9wdGlvbnM/OmFueSk6IFByb21pc2U8dm9pZD47XG59XG5cbnR5cGUgaG9va190dXBsZSA9IFtzdHJpbmcsIEhvb2tGdW5jXTsgXG5cbmV4cG9ydCBpbnRlcmZhY2UgTWltZUZ1bmMge1xuICAgIChhc3NldDogQXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4pOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5pbnRlcmZhY2UgTWltZU1hcCB7XG4gICAgcjogUmVnRXhwO1xuICAgIGY6IE1pbWVGdW5jO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2V0c09wdGlvbnMge1xuICAgIG1ldGFTdG9yZT86IHN0cmluZ3xJTWV0YVN0b3JlO1xuICAgIGZpbGVTdG9yZT86IHN0cmluZ3xJRmlsZVN0b3JlO1xuICAgIGZpbGVTdG9yZU9wdGlvbnM/OiBhbnk7XG4gICAgbWV0YVN0b3JlT3B0aW9ucz86IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBc3NldENyZWF0ZU9wdGlvbnMge1xuICAgIHNpemU/OiBudW1iZXI7XG4gICAgbWltZT86IHN0cmluZztcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGhpZGRlbj86Ym9vbGVhbjtcbiAgICBza2lwTWV0YT86IGJvb2xlYW47XG4gICAgbWV0YT86e1trZXk6IHN0cmluZ106IGFueX07XG4gICAgcGF0aD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0cyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgcHJvdGVjdGVkIF9tZXRhU3RvcmU6IElNZXRhU3RvcmU7XG4gICAgcHVibGljIGdldCBtZXRhU3RvcmUoKTogSU1ldGFTdG9yZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tZXRhU3RvcmVcbiAgICB9XG4gICAgcHJvdGVjdGVkIF9maWxlU3RvcmU6IElGaWxlU3RvcmU7XG4gICAgcHVibGljIGdldCBmaWxlU3RvcmUoKTogSUZpbGVTdG9yZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlU3RvcmVcbiAgICB9XG4gICAgXG4gICAgcHJvdGVjdGVkIHRodW1ibmFpbGVyOiBUaHVtYm5haWxlcjtcbiAgICAgXG4gICAgcHJpdmF0ZSBfaG9va3M6IE1hcDxIb29rLCBob29rX3R1cGxlW10+O1xuICAgIHByaXZhdGUgX21pbWVIYW5kbGVyczogTWltZU1hcFtdO1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEFzc2V0c09wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9ob29rcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fbWltZUhhbmRsZXJzID0gW107XG4gICAgICAgIFxuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb3B0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvcHRpb25zLm1ldGFTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5tZXRhU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLmZpbGVTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5maWxlU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBtZXRhOiBJTWV0YVN0b3JlLCBmaWxlOiBJRmlsZVN0b3JlO1xuICAgICAgICBpZiAoaXNTdHJpbmcob3B0aW9ucy5tZXRhU3RvcmUpKSB7XG4gICAgICAgICAgICBtZXRhID0gZ2V0TWV0YVN0b3JlKDxzdHJpbmc+b3B0aW9ucy5tZXRhU3RvcmUsIG9wdGlvbnMubWV0YVN0b3JlT3B0aW9ucyk7ICAgICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXRhID0gPElNZXRhU3RvcmU+b3B0aW9ucy5tZXRhU3RvcmU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNTdHJpbmcob3B0aW9ucy5maWxlU3RvcmUpKSB7XG4gICAgICAgICAgICBmaWxlID0gZ2V0RmlsZVN0b3JlKDxzdHJpbmc+b3B0aW9ucy5maWxlU3RvcmUsIG9wdGlvbnMuZmlsZVN0b3JlT3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlID0gPElGaWxlU3RvcmU+b3B0aW9ucy5maWxlU3RvcmU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW1ldGEgfHwgIWZpbGUpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gZmlsZSBvciBtZXRhIHN0b3JlXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGh1bWJuYWlsZXIgPSBuZXcgVGh1bWJuYWlsZXIoKTtcbiAgICAgICAgdGhpcy5fbWV0YVN0b3JlID0gbWV0YTtcbiAgICAgICAgdGhpcy5fZmlsZVN0b3JlID0gZmlsZTtcblxuICAgIH1cblxuICAgIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5tZXRhU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgdGhpcy5maWxlU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgZ2VuZXJhdG9ycy5pbml0aWFsaXplKCksXG4gICAgICAgICAgICB0aGlzLnRodW1ibmFpbGVyLmluaXRpYWxpemUodGhpcylcbiAgICAgICAgXSk7XG5cbiAgICB9XG4gICAgXG4gICAgYXN5bmMgdGh1bWJuYWlsIChhc3NldDpBc3NldCwgb3B0aW9ucz86YW55KTogUHJvbWlzZTxSZWFkYWJsZT4ge1xuICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlVGh1bWJuYWlsLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIGxldCBzdHJlYW0gPSBhd2FpdCB0aGlzLnRodW1ibmFpbGVyLnJlcXVlc3QoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgIH1cbiAgICBcbiAgICBjYW5UaHVtYm5haWwgKGFzc2V0OkFzc2V0KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnRodW1ibmFpbGVyLmNhblRodW1ibmFpbChhc3NldC5taW1lKTtcbiAgICB9XG4gICAgXG4gICAgXG4gICAgYXN5bmMgY3JlYXRlRnJvbVBhdGgocGF0aDogc3RyaW5nLCBkZXN0OiBzdHJpbmcsIG9wdGlvbnM6IEFzc2V0Q3JlYXRlT3B0aW9ucyA9IHsgc2tpcE1ldGE6IGZhbHNlIH0pIHtcbiAgICAgICAgXG4gICAgICAgIGxldCBzdGF0ID0gYXdhaXQgZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFzdGF0LmlzRmlsZSgpKSB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIGZpbGUnKTtcbiAgICAgICAgXG4gICAgICAgIGxldCByZWFkZXIgPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHBhdGgpO1xuICAgICAgICBcbiAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdC5zaXplO1xuICAgICAgICBvcHRpb25zLm1pbWUgPSBnZXRNaW1lVHlwZShwYXRoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZShyZWFkZXIsIGRlc3QsIG9wdGlvbnMpO1xuICAgICAgICBcbiAgICB9XG5cbiAgICBhc3luYyBjcmVhdGUoc3RyZWFtOiBSZWFkYWJsZSwgcGF0aDogc3RyaW5nLCBvcHRpb25zOiBBc3NldENyZWF0ZU9wdGlvbnMgPSB7IHNraXBNZXRhOiBmYWxzZSB9KTogUHJvbWlzZTxJRmlsZT4ge1xuXG4gICAgICAgIGxldCB0bXBGaWxlO1xuXG4gICAgICAgIGNvbnN0IGNsZWFuID0gKCkgPT4geyBpZiAodG1wRmlsZSkgZnMudW5saW5rKHRtcEZpbGUpOyB9O1xuXG4gICAgICAgIFxuICAgICAgICBsZXQgZmlsZW5hbWUgPSBQYXRoLmJhc2VuYW1lKHBhdGgpO1xuICAgICAgICBmaWxlbmFtZSA9IHNhbml0aXplKGZpbGVuYW1lLnJlcGxhY2UoL1teYS16MC05XFwtXFwuXS9naSwgJ18nKSk7XG4gICAgICAgIFxuXG4gICAgICAgIC8vIElmIG1pbWUgb3Igc2l6ZSBpc250IHByb3ZpZGVkLCB3ZSBoYXZlIHRvIGdldCBpdFxuICAgICAgICAvLyB0aGUgaGFyZCB3YXlcbiAgICAgICAgaWYgKCghb3B0aW9ucy5taW1lIHx8ICFvcHRpb25zLnNpemUpIHx8IChvcHRpb25zLm1pbWUgPT09IFwiXCIgfHwgb3B0aW9ucy5zaXplID09PSAwKSkge1xuXG4gICAgICAgICAgICB0bXBGaWxlID0gYXdhaXQgdGhpcy5fY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuXG4gICAgICAgICAgICBsZXQgc3RhdHMgPSBhd2FpdCBnZXRGaWxlU3RhdHModG1wRmlsZSk7XG4gICAgICAgICAgICBsZXQgbWltZSA9IGdldE1pbWVUeXBlKHRtcEZpbGUpO1xuXG4gICAgICAgICAgICBvcHRpb25zLm1pbWUgPSBtaW1lO1xuICAgICAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdHMuc2l6ZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZGlyUGF0aCA9IFBhdGguZGlybmFtZShwYXRoKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhkaXJQYXRoLCBvcHRpb25zLnBhdGgpO1xuICAgICAgICAvL2lmIChvcHRpb25zLnBhdGgpIGRpclBhdGggPSBQYXRoLmpvaW4ob3B0aW9ucy5wYXRoLCBkaXJQYXRoKTtcbiAgICAgICAgaWYgKG9wdGlvbnMucGF0aCkgZGlyUGF0aCA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBsZXQgYXNzZXQgPSBuZXcgQXNzZXQoe1xuICAgICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lfHxmaWxlbmFtZSxcbiAgICAgICAgICAgIHBhdGg6IGRpclBhdGgsXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXG4gICAgICAgICAgICBtaW1lOiBvcHRpb25zLm1pbWUsXG4gICAgICAgICAgICBzaXplOiBvcHRpb25zLnNpemUsXG4gICAgICAgICAgICBoaWRkZW46IG9wdGlvbnMuaGlkZGVuLFxuICAgICAgICAgICAgbWV0YTogb3B0aW9ucy5tZXRhIHx8IHt9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNyZWF0ZUZuID0gYXN5bmMgKCk6IFByb21pc2U8UmVhZGFibGU+IHtcbiAgICAgICAgICAgIGlmICghdG1wRmlsZSkge1xuICAgICAgICAgICAgICAgIHRtcEZpbGUgPSBhd2FpdCB0aGlzLl9jcmVhdGVUZW1wKHN0cmVhbSwgcGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNyZWF0ZSwgYXNzZXQsIGNyZWF0ZUZuLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAodG1wRmlsZSkge1xuICAgICAgICAgICAgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGFzc2V0LnBhdGhbYXNzZXQucGF0aC5sZW5ndGggLSAxXSAhPT0gJy8nKSBhc3NldC5wYXRoICs9ICcvJztcbiAgICAgICAgICAgICAgICBcblxuICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5jcmVhdGUoYXNzZXQsIHN0cmVhbSwgb3B0aW9ucyk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fcnVuSGFuZGxlcnMoYXNzZXQsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJlYW0oYXNzZXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGRlYnVnKCdlcnJvciAlcycsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvcHRpb25zLnNraXBNZXRhKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubWV0YVN0b3JlLmNyZWF0ZShhc3NldCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5maWxlU3RvcmUucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICBjbGVhbigpO1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjbGVhbigpO1xuICAgICAgICBkZWJ1ZygnY3JlYXRlICVqJywgYXNzZXQpO1xuICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQ3JlYXRlLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG5cbiAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgIH1cblxuICAgIC8qKiBHZXQgYW4gYXNzZXQgYnkgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIGlkXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGFzeW5jIGdldEJ5SWQoaWQ6IHN0cmluZywgb3B0aW9ucz86YW55KTogUHJvbWlzZTxBc3NldD4ge1xuICAgICAgICBsZXQgaW5mbyA9IGF3YWl0IHRoaXMubWV0YVN0b3JlLmdldChpZCwgb3B0aW9ucyk7XG4gICAgICAgIGlmICghKGluZm8gaW5zdGFuY2VvZiBBc3NldCkpIHtcbiAgICAgICAgICAgIGluZm8gPSBuZXcgQXNzZXQoaW5mbyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxBc3NldD5pbmZvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhc3NldCBieSBmdWxsIHBhdGhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBwYXRoIHRvIHRoZSBmaWxlXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGdldEJ5UGF0aChwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OmFueSk6IFByb21pc2U8QXNzZXQ+IHtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLm1ldGFTdG9yZS5nZXRCeVBhdGgocGF0aCwgb3B0aW9ucylcbiAgICAgICAgLnRoZW4oIGFzc2V0ID0+IHtcbiAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgIGlmICghKGFzc2V0IGluc3RhbmNlb2YgQXNzZXQpKSBhc3NldCA9IG5ldyBBc3NldChhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQ7ICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBoYXMocGF0aDogc3RyaW5nLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QnlQYXRoKHBhdGgsIG9wdGlvbnMpXG4gICAgICAgIC50aGVuKCBhID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhICE9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBxdWVyeSh0ZXJtOiBzdHJpbmcsIG9wdGlvbnM/OiBJRmluZE9wdGlvbnMpOiBQcm9taXNlPEFzc2V0W10+IHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnN8fDxhbnk+e307XG4gICAgICAgIG9wdGlvbnMucGF0aCA9IHRlcm07XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gKGF3YWl0IHRoaXMubWV0YVN0b3JlLmZpbmQob3B0aW9ucykpLm1hcCggYSA9PiB7XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IEFzc2V0KGEpOyBcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgXG5cbiAgICBhc3luYyByZW1vdmUoYXNzZXQ6IEFzc2V0LCBvcHRpb25zPzogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIFxuICAgICAgICBpZiAoKGF3YWl0IHRoaXMuZ2V0QnlJZChhc3NldC5pZCwgb3B0aW9ucykpID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVSZW1vdmUsIGFzc2V0LCBvcHRpb25zKVxuICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICBhd2FpdCB0aGlzLm1ldGFTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suUmVtb3ZlLCBhc3NldCwgbnVsbCwgb3B0aW9ucylcblxuICAgIH1cblxuICAgIGFzeW5jIGxpc3Qob3B0aW9ucz86IElMaXN0T3B0aW9ucyk6IFByb21pc2U8QXNzZXRbXT4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlTGlzdCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIGxldCBpbmZvcyA9IGF3YWl0IHRoaXMubWV0YVN0b3JlLmxpc3Qob3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKCFpbmZvcy5sZW5ndGgpIHJldHVybiA8QXNzZXRbXT5pbmZvcztcblxuICAgICAgICByZXR1cm4gaW5mb3MubWFwKG0gPT4ge1xuICAgICAgICAgICAgaWYgKCEobSBpbnN0YW5jZW9mIEFzc2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQXNzZXQobSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gPEFzc2V0Pm07XG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBhc3luYyBzdHJlYW0oYXNzZXQ6IEFzc2V0LCBvcHRpb25zPzphbnkpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVTdHJlYW0sIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZmlsZVN0b3JlLnN0cmVhbShhc3NldCk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIGNvdW50KG9wdGlvbnM/OklGaW5kT3B0aW9ucyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNvdW50LCBudWxsLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5tZXRhU3RvcmUuY291bnQob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdXNlKG1pbWU6c3RyaW5nfE1pbWVGdW5jLCBmbj86TWltZUZ1bmMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBmbiA9IDxNaW1lRnVuYz5taW1lO1xuICAgICAgICAgICAgbWltZSA9ICcuKic7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHI6IG5ldyBSZWdFeHAoPHN0cmluZz5taW1lLCAnaScpLFxuICAgICAgICAgICAgZjogZm5cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZ2lzdGVySG9vayhob29rOiBIb29rLCBmbjogSG9va0Z1bmMpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSkge1xuICAgICAgICAgICAgdGhpcy5faG9va3Muc2V0KGhvb2ssIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWQgPSBnZXRJZCgpO1xuICAgICAgICB0aGlzLl9ob29rcy5nZXQoaG9vaykucHVzaChbaWQsIGZuXSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgXG4gICAgdW5yZWdpc3Rlcihob29rOiBIb29rLCBmbjogSG9va0Z1bmN8c3RyaW5nKSB7XG4gICAgICAgIGlmICghdGhpcy5faG9va3MuaGFzKGhvb2spKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vaylcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGhvb2tzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChob29rc1tpXVswXSA9PT0gZm4gfHwgaG9va3NbaV1bMV0gPT09IGZuKSB7XG4gICAgICAgICAgICAgICAgaG9va3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2NyZWF0ZVRlbXAoc3RyZWFtOiBSZWFkYWJsZSwgcGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgbGV0IHJuZCA9IGF3YWl0IHJhbmRvbU5hbWUocGF0aCk7XG4gICAgICAgIGxldCB0bXBGaWxlID0gUGF0aC5qb2luKG9zLnRtcGRpcigpLCBybmQpO1xuICAgICAgICBhd2FpdCB0aGlzLl93cml0ZUZpbGUoc3RyZWFtLCB0bXBGaWxlKTtcbiAgICAgICAgcmV0dXJuIHRtcEZpbGVcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ydW5Ib29rKGhvb2s6IEhvb2ssIGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPiwgb3B0aW9ucz86YW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBob29rczogaG9va190dXBsZVtdID0gdGhpcy5faG9va3MuZ2V0KGhvb2spO1xuICAgICAgICBpZiAoIWhvb2tzKSByZXR1cm47XG4gICAgICAgIGRlYnVnKFwicnVuIGhvb2sgJXMgKCVkKVwiLCBIb29rW2hvb2tdLCBob29rcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInJ1biBob29rIGlkICVzXCIsIGhvb2tzW2ldWzBdKTtcbiAgICAgICAgICAgIGF3YWl0IGhvb2tzW2ldWzFdKGFzc2V0LCBmbiwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBhc3luYyBfcnVuSGFuZGxlcnMoYXNzZXQ6QXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fbWltZUhhbmRsZXJzLmxlbmd0aDsgaSA8IGlpOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWltZUhhbmRsZXJzW2ldLnIudGVzdChhc3NldC5taW1lKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX21pbWVIYW5kbGVyc1tpXS5mKGFzc2V0LCBmbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF93cml0ZUZpbGUoc3RyZWFtOiBSZWFkYWJsZSwgcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHZhciB3cyA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHBhdGgpO1xuICAgICAgICAgICAgd3Mub24oJ2ZpbmlzaCcsIHJlc29sdmUpXG4gICAgICAgICAgICAgICAgLm9uKCdlcnJvcicsIHJlamVjdCk7XG5cbiAgICAgICAgICAgIHN0cmVhbS5vbignZXJyb3InLCByZWplY3QpO1xuXG4gICAgICAgICAgICBzdHJlYW0ucGlwZSh3cyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
