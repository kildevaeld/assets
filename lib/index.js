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
var fs = require('fs');
var Debug = require('debug');
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
            return Promise.all([this.metaStore.initialize(), this.fileStore.initialize(), generators.initialize(), this.thumbnailer.initialize(this)]);
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
                filename = utils_1.normalizeFileName(filename);
                // If mime or size isnt provided, we have to get it
                // the hard way
                if (!options.mime || !options.size || options.mime === "" || options.size === 0) {
                    tmpFile = yield utils_1.createTemp(stream, path);
                    var stats = yield utils_1.getFileStats(tmpFile);
                    var mime = utils_1.getMimeType(tmpFile);
                    options.mime = mime;
                    options.size = stats.size;
                }
                var dirPath = Path.dirname(path);
                if (options.path) dirPath = options.path;
                var asset = new asset_1.Asset({
                    name: options.name || filename,
                    path: utils_1.normalizePath(dirPath),
                    filename: filename,
                    mime: options.mime,
                    size: options.size,
                    hidden: options.hidden,
                    meta: options.meta || {}
                });
                var createFn = function createFn() {
                    return __awaiter(_this2, void 0, Promise, function* () {
                        if (!tmpFile) {
                            tmpFile = yield utils_1.createTemp(stream, path);
                        }
                        return fs.createReadStream(tmpFile);
                    });
                };
                // Run before create hook,
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
                    debug('could not run handler for "%s", got error: %s', asset.mime, e);
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
                var asset = yield this.metaStore.get(id, options);
                if (asset) {
                    if (!(asset instanceof asset_1.Asset)) asset = new asset_1.Asset(asset);
                }
                return asset;
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
                yield this._runHook(Hook.Remove, asset, null, options);
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
//# sourceMappingURL=data:application/json;base64,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QXZCLENBQU4sQ0FGNEM7aUJBQWhEO2FEekZ3QyxDQUF4QyxDQ3FGd0Y7Ozs7cUNBVWpFLE9BQWMsSUFBNEI7QURuRmpFLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhO0FDb0ZyRCxxQkFBSyxJQUFJLElBQUksQ0FBSixFQUFPLEtBQUssS0FBSyxhQUFMLENBQW1CLE1BQW5CLEVBQTJCLElBQUksRUFBSixFQUFRLEdBQXhELEVBQTZEO0FBQ3pELHdCQUFJLEtBQUssYUFBTCxDQUFtQixDQUFuQixFQUFzQixDQUF0QixDQUF3QixJQUF4QixDQUE2QixNQUFNLElBQU4sQ0FBakMsRUFBOEM7QUFDMUMsOEJBQU0sS0FBSyxhQUFMLENBQW1CLENBQW5CLEVBQXNCLENBQXRCLENBQXdCLEtBQXhCLEVBQStCLEVBQS9CLENBQU4sQ0FEMEM7cUJBQTlDO2lCQURKO2FEcEZ3QyxDQUF4QyxDQ21GaUU7Ozs7NEJBeFRqRDtBQUNoQixtQkFBTyxLQUFLLFVBQUwsQ0FEUzs7Ozs0QkFJQTtBQUNoQixtQkFBTyxLQUFLLFVBQUwsQ0FEUzs7OztXQU54QjtFQUE0QixTQUFBLFlBQUE7O0FBQWYsUUFBQSxNQUFBLEdBQU0sTUFBTiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL21haW4uZC50c1wiIC8+XG5cInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNvbnN0IGV2ZW50c18xID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5jb25zdCByZXBvc2l0b3J5XzEgPSByZXF1aXJlKCcuL3JlcG9zaXRvcnknKTtcbmNvbnN0IHRodW1ibmFpbGVyXzEgPSByZXF1aXJlKCcuL3RodW1ibmFpbGVyJyk7XG5jb25zdCBhc3NldF8xID0gcmVxdWlyZSgnLi9hc3NldCcpO1xuY29uc3QgdXRpbHNfMSA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmNvbnN0IGdlbmVyYXRvcnMgPSByZXF1aXJlKCcuL2dlbmVyYXRvcnMvaW5kZXgnKTtcbmNvbnN0IFBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBEZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHMnKTtcbnZhciBpZENvdW50ZXIgPSAwO1xuZnVuY3Rpb24gZ2V0SWQoKSB7XG4gICAgcmV0dXJuICsraWRDb3VudGVyICsgXCJcIjtcbn1cbihmdW5jdGlvbiAoSG9vaykge1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZUNyZWF0ZVwiXSA9IDBdID0gXCJCZWZvcmVDcmVhdGVcIjtcbiAgICBIb29rW0hvb2tbXCJDcmVhdGVcIl0gPSAxXSA9IFwiQ3JlYXRlXCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlUmVtb3ZlXCJdID0gMl0gPSBcIkJlZm9yZVJlbW92ZVwiO1xuICAgIEhvb2tbSG9va1tcIlJlbW92ZVwiXSA9IDNdID0gXCJSZW1vdmVcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVMaXN0XCJdID0gNF0gPSBcIkJlZm9yZUxpc3RcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVTdHJlYW1cIl0gPSA1XSA9IFwiQmVmb3JlU3RyZWFtXCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlVGh1bWJuYWlsXCJdID0gNl0gPSBcIkJlZm9yZVRodW1ibmFpbFwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZUdldFwiXSA9IDddID0gXCJCZWZvcmVHZXRcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVDb3VudFwiXSA9IDhdID0gXCJCZWZvcmVDb3VudFwiO1xufSkoZXhwb3J0cy5Ib29rIHx8IChleHBvcnRzLkhvb2sgPSB7fSkpO1xudmFyIEhvb2sgPSBleHBvcnRzLkhvb2s7XG5mdW5jdGlvbiBpc1N0cmluZyhhKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBhID09PSAnc3RyaW5nJztcbn1cbmNsYXNzIEFzc2V0cyBleHRlbmRzIGV2ZW50c18xLkV2ZW50RW1pdHRlciB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLl9ob29rcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fbWltZUhhbmRsZXJzID0gW107XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvcHRpb25zJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLm1ldGFTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5tZXRhU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLmZpbGVTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5maWxlU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1ldGEsIGZpbGU7XG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLm1ldGFTdG9yZSkpIHtcbiAgICAgICAgICAgIG1ldGEgPSByZXBvc2l0b3J5XzEuZ2V0TWV0YVN0b3JlKG9wdGlvbnMubWV0YVN0b3JlLCBvcHRpb25zLm1ldGFTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbWV0YSA9IG9wdGlvbnMubWV0YVN0b3JlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLmZpbGVTdG9yZSkpIHtcbiAgICAgICAgICAgIGZpbGUgPSByZXBvc2l0b3J5XzEuZ2V0RmlsZVN0b3JlKG9wdGlvbnMuZmlsZVN0b3JlLCBvcHRpb25zLmZpbGVTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlsZSA9IG9wdGlvbnMuZmlsZVN0b3JlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbWV0YSB8fCAhZmlsZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gZmlsZSBvciBtZXRhIHN0b3JlXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGh1bWJuYWlsZXIgPSBuZXcgdGh1bWJuYWlsZXJfMS5UaHVtYm5haWxlcigpO1xuICAgICAgICB0aGlzLl9tZXRhU3RvcmUgPSBtZXRhO1xuICAgICAgICB0aGlzLl9maWxlU3RvcmUgPSBmaWxlO1xuICAgIH1cbiAgICBnZXQgbWV0YVN0b3JlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWV0YVN0b3JlO1xuICAgIH1cbiAgICBnZXQgZmlsZVN0b3JlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZVN0b3JlO1xuICAgIH1cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5tZXRhU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgdGhpcy5maWxlU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgZ2VuZXJhdG9ycy5pbml0aWFsaXplKCksXG4gICAgICAgICAgICB0aGlzLnRodW1ibmFpbGVyLmluaXRpYWxpemUodGhpcylcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIHRodW1ibmFpbChhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVUaHVtYm5haWwsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGxldCBzdHJlYW0gPSB5aWVsZCB0aGlzLnRodW1ibmFpbGVyLnJlcXVlc3QoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNhblRodW1ibmFpbChhc3NldCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aHVtYm5haWxlci5jYW5UaHVtYm5haWwoYXNzZXQubWltZSk7XG4gICAgfVxuICAgIGNyZWF0ZUZyb21QYXRoKHBhdGgsIGRlc3QsIG9wdGlvbnMgPSB7IHNraXBNZXRhOiBmYWxzZSB9KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgc3RhdCA9IHlpZWxkIHV0aWxzXzEuZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFzdGF0LmlzRmlsZSgpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGEgZmlsZScpO1xuICAgICAgICAgICAgbGV0IHJlYWRlciA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aCk7XG4gICAgICAgICAgICBvcHRpb25zLnNpemUgPSBzdGF0LnNpemU7XG4gICAgICAgICAgICBvcHRpb25zLm1pbWUgPSB1dGlsc18xLmdldE1pbWVUeXBlKHBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuY3JlYXRlKHJlYWRlciwgZGVzdCwgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGUoc3RyZWFtLCBwYXRoLCBvcHRpb25zID0geyBza2lwTWV0YTogZmFsc2UgfSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCB0bXBGaWxlO1xuICAgICAgICAgICAgY29uc3QgY2xlYW4gPSAoKSA9PiB7IGlmICh0bXBGaWxlKVxuICAgICAgICAgICAgICAgIGZzLnVubGluayh0bXBGaWxlKTsgfTtcbiAgICAgICAgICAgIGxldCBmaWxlbmFtZSA9IFBhdGguYmFzZW5hbWUocGF0aCk7XG4gICAgICAgICAgICBmaWxlbmFtZSA9IHV0aWxzXzEubm9ybWFsaXplRmlsZU5hbWUoZmlsZW5hbWUpO1xuICAgICAgICAgICAgLy8gSWYgbWltZSBvciBzaXplIGlzbnQgcHJvdmlkZWQsIHdlIGhhdmUgdG8gZ2V0IGl0XG4gICAgICAgICAgICAvLyB0aGUgaGFyZCB3YXlcbiAgICAgICAgICAgIGlmICgoIW9wdGlvbnMubWltZSB8fCAhb3B0aW9ucy5zaXplKSB8fCAob3B0aW9ucy5taW1lID09PSBcIlwiIHx8IG9wdGlvbnMuc2l6ZSA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICB0bXBGaWxlID0geWllbGQgdXRpbHNfMS5jcmVhdGVUZW1wKHN0cmVhbSwgcGF0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0geWllbGQgdXRpbHNfMS5nZXRGaWxlU3RhdHModG1wRmlsZSk7XG4gICAgICAgICAgICAgICAgbGV0IG1pbWUgPSB1dGlsc18xLmdldE1pbWVUeXBlKHRtcEZpbGUpO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMubWltZSA9IG1pbWU7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdHMuc2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBkaXJQYXRoID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF0aClcbiAgICAgICAgICAgICAgICBkaXJQYXRoID0gb3B0aW9ucy5wYXRoO1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0gbmV3IGFzc2V0XzEuQXNzZXQoe1xuICAgICAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSB8fCBmaWxlbmFtZSxcbiAgICAgICAgICAgICAgICBwYXRoOiB1dGlsc18xLm5vcm1hbGl6ZVBhdGgoZGlyUGF0aCksXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lLFxuICAgICAgICAgICAgICAgIG1pbWU6IG9wdGlvbnMubWltZSxcbiAgICAgICAgICAgICAgICBzaXplOiBvcHRpb25zLnNpemUsXG4gICAgICAgICAgICAgICAgaGlkZGVuOiBvcHRpb25zLmhpZGRlbixcbiAgICAgICAgICAgICAgICBtZXRhOiBvcHRpb25zLm1ldGEgfHwge31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgY3JlYXRlRm4gPSAoKSA9PiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGlmICghdG1wRmlsZSkge1xuICAgICAgICAgICAgICAgICAgICB0bXBGaWxlID0geWllbGQgdXRpbHNfMS5jcmVhdGVUZW1wKHN0cmVhbSwgcGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmcy5jcmVhdGVSZWFkU3RyZWFtKHRtcEZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBSdW4gYmVmb3JlIGNyZWF0ZSBob29rLCBcbiAgICAgICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVDcmVhdGUsIGFzc2V0LCBjcmVhdGVGbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAodG1wRmlsZSkge1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXNzZXQucGF0aFthc3NldC5wYXRoLmxlbmd0aCAtIDFdICE9PSAnLycpXG4gICAgICAgICAgICAgICAgYXNzZXQucGF0aCArPSAnLyc7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLmZpbGVTdG9yZS5jcmVhdGUoYXNzZXQsIHN0cmVhbSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhhbmRsZXJzKGFzc2V0LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdjb3VsZCBub3QgcnVuIGhhbmRsZXIgZm9yIFwiJXNcIiwgZ290IGVycm9yOiAlcycsIGFzc2V0Lm1pbWUsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnNraXBNZXRhKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhpcy5tZXRhU3RvcmUuY3JlYXRlKGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhpcy5maWxlU3RvcmUucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGVhbigpO1xuICAgICAgICAgICAgZGVidWcoJ2NyZWF0ZSAlaicsIGFzc2V0KTtcbiAgICAgICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5DcmVhdGUsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKiBHZXQgYW4gYXNzZXQgYnkgaWRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIGlkXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGdldEJ5SWQoaWQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLm1ldGFTdG9yZS5nZXQoaWQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXNzZXQgaW5zdGFuY2VvZiBhc3NldF8xLkFzc2V0KSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXQgPSBuZXcgYXNzZXRfMS5Bc3NldChhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXNzZXQgYnkgZnVsbCBwYXRoXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIGZ1bGwgcGF0aCB0byB0aGUgZmlsZVxuICAgICAqIEByZXR1cm4gUHJvbWlzZTxBc3NldD5cbiAgICAgKi9cbiAgICBnZXRCeVBhdGgocGF0aCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRhU3RvcmUuZ2V0QnlQYXRoKHBhdGgsIG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihhc3NldCA9PiB7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhc3NldCBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpKVxuICAgICAgICAgICAgICAgICAgICBhc3NldCA9IG5ldyBhc3NldF8xLkFzc2V0KGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhcyhwYXRoLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEJ5UGF0aChwYXRoLCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oYSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYSAhPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcXVlcnkodGVybSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5wYXRoID0gdGVybTtcbiAgICAgICAgICAgIHJldHVybiAoeWllbGQgdGhpcy5tZXRhU3RvcmUuZmluZChvcHRpb25zKSkubWFwKGEgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBhc3NldF8xLkFzc2V0KGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW1vdmUoYXNzZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAoKHlpZWxkIHRoaXMuZ2V0QnlJZChhc3NldC5pZCwgb3B0aW9ucykpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVSZW1vdmUsIGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLm1ldGFTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLlJlbW92ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGlzdChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUxpc3QsIG51bGwsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgbGV0IGluZm9zID0geWllbGQgdGhpcy5tZXRhU3RvcmUubGlzdChvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghaW5mb3MubGVuZ3RoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmZvcztcbiAgICAgICAgICAgIHJldHVybiBpbmZvcy5tYXAobSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCEobSBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgYXNzZXRfMS5Bc3NldChtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0cmVhbShhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVTdHJlYW0sIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLmZpbGVTdG9yZS5zdHJlYW0oYXNzZXQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY291bnQob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVDb3VudCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5tZXRhU3RvcmUuY291bnQob3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1c2UobWltZSwgZm4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBmbiA9IG1pbWU7XG4gICAgICAgICAgICBtaW1lID0gJy4qJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9taW1lSGFuZGxlcnMucHVzaCh7XG4gICAgICAgICAgICByOiBuZXcgUmVnRXhwKG1pbWUsICdpJyksXG4gICAgICAgICAgICBmOiBmblxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlZ2lzdGVySG9vayhob29rLCBmbikge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSkge1xuICAgICAgICAgICAgdGhpcy5faG9va3Muc2V0KGhvb2ssIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWQgPSBnZXRJZCgpO1xuICAgICAgICB0aGlzLl9ob29rcy5nZXQoaG9vaykucHVzaChbaWQsIGZuXSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgdW5yZWdpc3Rlcihob29rLCBmbikge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGhvb2tzID0gdGhpcy5faG9va3MuZ2V0KGhvb2spO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaG9va3NbaV1bMF0gPT09IGZuIHx8IGhvb2tzW2ldWzFdID09PSBmbikge1xuICAgICAgICAgICAgICAgIGhvb2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfcnVuSG9vayhob29rLCBhc3NldCwgZm4sIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vayk7XG4gICAgICAgICAgICBpZiAoIWhvb2tzKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgJXMgKCVkKVwiLCBIb29rW2hvb2tdLCBob29rcy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gaG9va3MubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgaWQgJXNcIiwgaG9va3NbaV1bMF0pO1xuICAgICAgICAgICAgICAgIHlpZWxkIGhvb2tzW2ldWzFdKGFzc2V0LCBmbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcnVuSGFuZGxlcnMoYXNzZXQsIGZuKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fbWltZUhhbmRsZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbWltZUhhbmRsZXJzW2ldLnIudGVzdChhc3NldC5taW1lKSkge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9taW1lSGFuZGxlcnNbaV0uZihhc3NldCwgZm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldHMgPSBBc3NldHM7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9tYWluLmQudHNcIiAvPlxuXG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQge2dldEZpbGVTdG9yZSwgZ2V0TWV0YVN0b3JlfSBmcm9tICcuL3JlcG9zaXRvcnknO1xuaW1wb3J0IHtJRmlsZSwgSU1ldGFTdG9yZSwgSUZpbGVTdG9yZSwgSUxpc3RPcHRpb25zLCBJRmluZE9wdGlvbnN9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7VGh1bWJuYWlsZXJ9IGZyb20gJy4vdGh1bWJuYWlsZXInO1xuaW1wb3J0IHtBc3NldH0gZnJvbSAnLi9hc3NldCc7XG5pbXBvcnQge3JhbmRvbU5hbWUsIGdldEZpbGVTdGF0cywgZ2V0TWltZVR5cGUsIHdyaXRlU3RyZWFtLCBub3JtYWxpemVGaWxlTmFtZSwgbm9ybWFsaXplUGF0aCwgY3JlYXRlVGVtcH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgKiBhcyBnZW5lcmF0b3JzIGZyb20gJy4vZ2VuZXJhdG9ycy9pbmRleCc7XG5pbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgRGVidWcgZnJvbSAnZGVidWcnO1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHMnKTtcblxudmFyIGlkQ291bnRlciA9IDA7XG5mdW5jdGlvbiBnZXRJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiArK2lkQ291bnRlciArIFwiXCI7XG59XG5cbmV4cG9ydCBlbnVtIEhvb2sge1xuICAgIEJlZm9yZUNyZWF0ZSxcbiAgICBDcmVhdGUsXG4gICAgQmVmb3JlUmVtb3ZlLFxuICAgIFJlbW92ZSxcbiAgICBCZWZvcmVMaXN0LFxuICAgIEJlZm9yZVN0cmVhbSxcbiAgICBCZWZvcmVUaHVtYm5haWwsXG4gICAgQmVmb3JlR2V0LFxuICAgIEJlZm9yZUNvdW50XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGE6IGFueSk6IGEgaXMgU3RyaW5nIHtcbiAgICByZXR1cm4gdHlwZW9mIGEgPT09ICdzdHJpbmcnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhvb2tGdW5jIHtcbiAgICAoYXNzZXQ6IEFzc2V0LCBmbj86ICgpID0+IFByb21pc2U8UmVhZGFibGU+LCBvcHRpb25zPzogYW55KTogUHJvbWlzZTx2b2lkPjtcbn1cblxudHlwZSBob29rX3R1cGxlID0gW3N0cmluZywgSG9va0Z1bmNdO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pbWVGdW5jIHtcbiAgICAoYXNzZXQ6IEFzc2V0LCBmbj86ICgpID0+IFByb21pc2U8UmVhZGFibGU+KTogUHJvbWlzZTx2b2lkPjtcbn1cblxuaW50ZXJmYWNlIE1pbWVNYXAge1xuICAgIHI6IFJlZ0V4cDtcbiAgICBmOiBNaW1lRnVuYztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBc3NldHNPcHRpb25zIHtcbiAgICBtZXRhU3RvcmU/OiBzdHJpbmcgfCBJTWV0YVN0b3JlO1xuICAgIGZpbGVTdG9yZT86IHN0cmluZyB8IElGaWxlU3RvcmU7XG4gICAgZmlsZVN0b3JlT3B0aW9ucz86IGFueTtcbiAgICBtZXRhU3RvcmVPcHRpb25zPzogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2V0Q3JlYXRlT3B0aW9ucyB7XG4gICAgc2l6ZT86IG51bWJlcjtcbiAgICBtaW1lPzogc3RyaW5nO1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgaGlkZGVuPzogYm9vbGVhbjtcbiAgICBza2lwTWV0YT86IGJvb2xlYW47XG4gICAgbWV0YT86IHsgW2tleTogc3RyaW5nXTogYW55IH07XG4gICAgcGF0aD86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0cyBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgcHJvdGVjdGVkIF9tZXRhU3RvcmU6IElNZXRhU3RvcmU7XG4gICAgcHVibGljIGdldCBtZXRhU3RvcmUoKTogSU1ldGFTdG9yZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tZXRhU3RvcmVcbiAgICB9XG4gICAgcHJvdGVjdGVkIF9maWxlU3RvcmU6IElGaWxlU3RvcmU7XG4gICAgcHVibGljIGdldCBmaWxlU3RvcmUoKTogSUZpbGVTdG9yZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlU3RvcmVcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdGh1bWJuYWlsZXI6IFRodW1ibmFpbGVyO1xuXG4gICAgcHJpdmF0ZSBfaG9va3M6IE1hcDxIb29rLCBob29rX3R1cGxlW10+O1xuICAgIHByaXZhdGUgX21pbWVIYW5kbGVyczogTWltZU1hcFtdO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogQXNzZXRzT3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuX2hvb2tzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9taW1lSGFuZGxlcnMgPSBbXTtcblxuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb3B0aW9ucycpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvcHRpb25zLm1ldGFTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5tZXRhU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLmZpbGVTdG9yZSkge1xuICAgICAgICAgICAgb3B0aW9ucy5maWxlU3RvcmUgPSAnZmlsZSc7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbWV0YTogSU1ldGFTdG9yZSwgZmlsZTogSUZpbGVTdG9yZTtcbiAgICAgICAgaWYgKGlzU3RyaW5nKG9wdGlvbnMubWV0YVN0b3JlKSkge1xuICAgICAgICAgICAgbWV0YSA9IGdldE1ldGFTdG9yZSg8c3RyaW5nPm9wdGlvbnMubWV0YVN0b3JlLCBvcHRpb25zLm1ldGFTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWV0YSA9IDxJTWV0YVN0b3JlPm9wdGlvbnMubWV0YVN0b3JlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzU3RyaW5nKG9wdGlvbnMuZmlsZVN0b3JlKSkge1xuICAgICAgICAgICAgZmlsZSA9IGdldEZpbGVTdG9yZSg8c3RyaW5nPm9wdGlvbnMuZmlsZVN0b3JlLCBvcHRpb25zLmZpbGVTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZSA9IDxJRmlsZVN0b3JlPm9wdGlvbnMuZmlsZVN0b3JlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtZXRhIHx8ICFmaWxlKSB7XG5cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIGZpbGUgb3IgbWV0YSBzdG9yZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRodW1ibmFpbGVyID0gbmV3IFRodW1ibmFpbGVyKCk7XG4gICAgICAgIHRoaXMuX21ldGFTdG9yZSA9IG1ldGE7XG4gICAgICAgIHRoaXMuX2ZpbGVTdG9yZSA9IGZpbGU7XG5cbiAgICB9XG5cbiAgICBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZFtdPiB7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHRoaXMubWV0YVN0b3JlLmluaXRpYWxpemUoKSxcbiAgICAgICAgICAgIHRoaXMuZmlsZVN0b3JlLmluaXRpYWxpemUoKSxcbiAgICAgICAgICAgIGdlbmVyYXRvcnMuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgdGhpcy50aHVtYm5haWxlci5pbml0aWFsaXplKHRoaXMpXG4gICAgICAgIF0pO1xuXG4gICAgfVxuXG4gICAgYXN5bmMgdGh1bWJuYWlsKGFzc2V0OiBBc3NldCwgb3B0aW9ucz86IGFueSk6IFByb21pc2U8UmVhZGFibGU+IHtcbiAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVRodW1ibmFpbCwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICBsZXQgc3RyZWFtID0gYXdhaXQgdGhpcy50aHVtYm5haWxlci5yZXF1ZXN0KGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICB9XG5cbiAgICBjYW5UaHVtYm5haWwoYXNzZXQ6IEFzc2V0KTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnRodW1ibmFpbGVyLmNhblRodW1ibmFpbChhc3NldC5taW1lKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIGNyZWF0ZUZyb21QYXRoKHBhdGg6IHN0cmluZywgZGVzdDogc3RyaW5nLCBvcHRpb25zOiBBc3NldENyZWF0ZU9wdGlvbnMgPSB7IHNraXBNZXRhOiBmYWxzZSB9KSB7XG5cbiAgICAgICAgbGV0IHN0YXQgPSBhd2FpdCBnZXRGaWxlU3RhdHMocGF0aCk7XG4gICAgICAgIGlmICghc3RhdC5pc0ZpbGUoKSkgdGhyb3cgbmV3IEVycm9yKCdub3QgYSBmaWxlJyk7XG5cbiAgICAgICAgbGV0IHJlYWRlciA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aCk7XG5cbiAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdC5zaXplO1xuICAgICAgICBvcHRpb25zLm1pbWUgPSBnZXRNaW1lVHlwZShwYXRoKTtcblxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGUocmVhZGVyLCBkZXN0LCBvcHRpb25zKTtcblxuICAgIH1cblxuICAgIGFzeW5jIGNyZWF0ZShzdHJlYW06IFJlYWRhYmxlLCBwYXRoOiBzdHJpbmcsIG9wdGlvbnM6IEFzc2V0Q3JlYXRlT3B0aW9ucyA9IHsgc2tpcE1ldGE6IGZhbHNlIH0pOiBQcm9taXNlPElGaWxlPiB7XG5cbiAgICAgICAgbGV0IHRtcEZpbGU7XG5cbiAgICAgICAgY29uc3QgY2xlYW4gPSAoKSA9PiB7IGlmICh0bXBGaWxlKSBmcy51bmxpbmsodG1wRmlsZSk7IH07XG5cblxuICAgICAgICBsZXQgZmlsZW5hbWUgPSBQYXRoLmJhc2VuYW1lKHBhdGgpO1xuICAgICAgICBmaWxlbmFtZSA9IG5vcm1hbGl6ZUZpbGVOYW1lKGZpbGVuYW1lKTtcblxuXG4gICAgICAgIC8vIElmIG1pbWUgb3Igc2l6ZSBpc250IHByb3ZpZGVkLCB3ZSBoYXZlIHRvIGdldCBpdFxuICAgICAgICAvLyB0aGUgaGFyZCB3YXlcbiAgICAgICAgaWYgKCghb3B0aW9ucy5taW1lIHx8ICFvcHRpb25zLnNpemUpIHx8IChvcHRpb25zLm1pbWUgPT09IFwiXCIgfHwgb3B0aW9ucy5zaXplID09PSAwKSkge1xuXG4gICAgICAgICAgICB0bXBGaWxlID0gYXdhaXQgY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuXG4gICAgICAgICAgICBsZXQgc3RhdHMgPSBhd2FpdCBnZXRGaWxlU3RhdHModG1wRmlsZSk7XG4gICAgICAgICAgICBsZXQgbWltZSA9IGdldE1pbWVUeXBlKHRtcEZpbGUpO1xuXG4gICAgICAgICAgICBvcHRpb25zLm1pbWUgPSBtaW1lO1xuICAgICAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdHMuc2l6ZVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRpclBhdGggPSBQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgICAgIGlmIChvcHRpb25zLnBhdGgpIGRpclBhdGggPSBvcHRpb25zLnBhdGg7XG5cblxuICAgICAgICBsZXQgYXNzZXQgPSBuZXcgQXNzZXQoe1xuICAgICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lIHx8IGZpbGVuYW1lLFxuICAgICAgICAgICAgcGF0aDogbm9ybWFsaXplUGF0aChkaXJQYXRoKSxcbiAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZSxcbiAgICAgICAgICAgIG1pbWU6IG9wdGlvbnMubWltZSxcbiAgICAgICAgICAgIHNpemU6IG9wdGlvbnMuc2l6ZSxcbiAgICAgICAgICAgIGhpZGRlbjogb3B0aW9ucy5oaWRkZW4sXG4gICAgICAgICAgICBtZXRhOiBvcHRpb25zLm1ldGEgfHwge31cbiAgICAgICAgfSk7XG5cblxuICAgICAgICBjb25zdCBjcmVhdGVGbiA9IGFzeW5jICgpOiBQcm9taXNlPFJlYWRhYmxlPiA9PiB7XG4gICAgICAgICAgICBpZiAoIXRtcEZpbGUpIHtcbiAgICAgICAgICAgICAgICB0bXBGaWxlID0gYXdhaXQgY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgIH07XG5cblxuICAgICAgICAvLyBSdW4gYmVmb3JlIGNyZWF0ZSBob29rLCBcbiAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNyZWF0ZSwgYXNzZXQsIGNyZWF0ZUZuLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAodG1wRmlsZSkge1xuICAgICAgICAgICAgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldC5wYXRoW2Fzc2V0LnBhdGgubGVuZ3RoIC0gMV0gIT09ICcvJykgYXNzZXQucGF0aCArPSAnLyc7XG5cblxuICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5jcmVhdGUoYXNzZXQsIHN0cmVhbSwgb3B0aW9ucyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3J1bkhhbmRsZXJzKGFzc2V0LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RyZWFtKGFzc2V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IHJ1biBoYW5kbGVyIGZvciBcIiVzXCIsIGdvdCBlcnJvcjogJXMnLCBhc3NldC5taW1lLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb3B0aW9ucy5za2lwTWV0YSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm1ldGFTdG9yZS5jcmVhdGUoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgZGVidWcoJ2NyZWF0ZSAlaicsIGFzc2V0KTtcbiAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkNyZWF0ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiBhc3NldDtcbiAgICB9XG5cbiAgICAvKiogR2V0IGFuIGFzc2V0IGJ5IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBpZFxuICAgICAqIEByZXR1cm4gUHJvbWlzZTxBc3NldD5cbiAgICAgKi9cbiAgICBhc3luYyBnZXRCeUlkKGlkOiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPEFzc2V0PiB7XG4gICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMubWV0YVN0b3JlLmdldChpZCwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgaWYgKCEoYXNzZXQgaW5zdGFuY2VvZiBBc3NldCkpIGFzc2V0ID0gbmV3IEFzc2V0KGFzc2V0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPEFzc2V0PmFzc2V0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhc3NldCBieSBmdWxsIHBhdGhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBwYXRoIHRvIHRoZSBmaWxlXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGdldEJ5UGF0aChwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPEFzc2V0PiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubWV0YVN0b3JlLmdldEJ5UGF0aChwYXRoLCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oYXNzZXQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShhc3NldCBpbnN0YW5jZW9mIEFzc2V0KSkgYXNzZXQgPSBuZXcgQXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgfVxuXG4gICAgaGFzKHBhdGg6IHN0cmluZywgb3B0aW9ucz86IGFueSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRCeVBhdGgocGF0aCwgb3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGEgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBhICE9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeSh0ZXJtOiBzdHJpbmcsIG9wdGlvbnM/OiBJRmluZE9wdGlvbnMpOiBQcm9taXNlPEFzc2V0W10+IHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgPGFueT57fTtcbiAgICAgICAgb3B0aW9ucy5wYXRoID0gdGVybTtcblxuICAgICAgICByZXR1cm4gKGF3YWl0IHRoaXMubWV0YVN0b3JlLmZpbmQob3B0aW9ucykpLm1hcChhID0+IHtcbiAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgQXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgQXNzZXQoYSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBhc3luYyByZW1vdmUoYXNzZXQ6IEFzc2V0LCBvcHRpb25zPzogYW55KTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgaWYgKChhd2FpdCB0aGlzLmdldEJ5SWQoYXNzZXQuaWQsIG9wdGlvbnMpKSA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlUmVtb3ZlLCBhc3NldCwgb3B0aW9ucylcblxuICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICBhd2FpdCB0aGlzLm1ldGFTdG9yZS5yZW1vdmUoYXNzZXQpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5SZW1vdmUsIGFzc2V0LCBudWxsLCBvcHRpb25zKVxuXG4gICAgfVxuXG4gICAgYXN5bmMgbGlzdChvcHRpb25zPzogSUxpc3RPcHRpb25zKTogUHJvbWlzZTxBc3NldFtdPiB7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUxpc3QsIG51bGwsIG51bGwsIG9wdGlvbnMpO1xuXG4gICAgICAgIGxldCBpbmZvcyA9IGF3YWl0IHRoaXMubWV0YVN0b3JlLmxpc3Qob3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKCFpbmZvcy5sZW5ndGgpIHJldHVybiA8QXNzZXRbXT5pbmZvcztcblxuICAgICAgICByZXR1cm4gaW5mb3MubWFwKG0gPT4ge1xuICAgICAgICAgICAgaWYgKCEobSBpbnN0YW5jZW9mIEFzc2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQXNzZXQobSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gPEFzc2V0Pm07XG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBhc3luYyBzdHJlYW0oYXNzZXQ6IEFzc2V0LCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxSZWFkYWJsZT4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlU3RyZWFtLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmZpbGVTdG9yZS5zdHJlYW0oYXNzZXQpO1xuICAgIH1cblxuICAgIGFzeW5jIGNvdW50KG9wdGlvbnM/OiBJRmluZE9wdGlvbnMpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlQ291bnQsIG51bGwsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5tZXRhU3RvcmUuY291bnQob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdXNlKG1pbWU6IHN0cmluZyB8IE1pbWVGdW5jLCBmbj86IE1pbWVGdW5jKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWltZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgZm4gPSA8TWltZUZ1bmM+bWltZTtcbiAgICAgICAgICAgIG1pbWUgPSAnLionO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbWltZUhhbmRsZXJzLnB1c2goe1xuICAgICAgICAgICAgcjogbmV3IFJlZ0V4cCg8c3RyaW5nPm1pbWUsICdpJyksXG4gICAgICAgICAgICBmOiBmblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZWdpc3Rlckhvb2soaG9vazogSG9vaywgZm46IEhvb2tGdW5jKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ob29rcy5oYXMoaG9vaykpIHtcbiAgICAgICAgICAgIHRoaXMuX2hvb2tzLnNldChob29rLCBbXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGlkID0gZ2V0SWQoKTtcbiAgICAgICAgdGhpcy5faG9va3MuZ2V0KGhvb2spLnB1c2goW2lkLCBmbl0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgdW5yZWdpc3Rlcihob29rOiBIb29rLCBmbjogSG9va0Z1bmMgfCBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ob29rcy5oYXMoaG9vaykpIHJldHVybjtcblxuICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vaylcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaG9va3NbaV1bMF0gPT09IGZuIHx8IGhvb2tzW2ldWzFdID09PSBmbikge1xuICAgICAgICAgICAgICAgIGhvb2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcnVuSG9vayhob29rOiBIb29rLCBhc3NldDogQXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4sIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgbGV0IGhvb2tzOiBob29rX3R1cGxlW10gPSB0aGlzLl9ob29rcy5nZXQoaG9vayk7XG4gICAgICAgIGlmICghaG9va3MpIHJldHVybjtcbiAgICAgICAgZGVidWcoXCJydW4gaG9vayAlcyAoJWQpXCIsIEhvb2tbaG9va10sIGhvb2tzLmxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGhvb2tzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgaWQgJXNcIiwgaG9va3NbaV1bMF0pO1xuICAgICAgICAgICAgYXdhaXQgaG9va3NbaV1bMV0oYXNzZXQsIGZuLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3J1bkhhbmRsZXJzKGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSB0aGlzLl9taW1lSGFuZGxlcnMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX21pbWVIYW5kbGVyc1tpXS5yLnRlc3QoYXNzZXQubWltZSkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9taW1lSGFuZGxlcnNbaV0uZihhc3NldCwgZm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
