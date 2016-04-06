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
//# sourceMappingURL=data:application/json;base64,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QUFoRDthRDFGd0MsQ0FBeEMsQ0NzRnVGOzs7O3FDQVVoRSxPQUFhLElBQTRCO0FEcEZoRSxtQkFBTyxVQUFVLElBQVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTtBQ3FGckQscUJBQUssSUFBSSxJQUFJLENBQUosRUFBTyxLQUFLLEtBQUssYUFBTCxDQUFtQixNQUFuQixFQUEyQixJQUFJLEVBQUosRUFBUSxHQUF4RCxFQUE4RDtBQUMxRCx3QkFBSSxLQUFLLGFBQUwsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsQ0FBd0IsSUFBeEIsQ0FBNkIsTUFBTSxJQUFOLENBQWpDLEVBQThDO0FBQzFDLDhCQUFNLEtBQUssYUFBTCxDQUFtQixDQUFuQixFQUFzQixDQUF0QixDQUF3QixLQUF4QixFQUErQixFQUEvQixDQUFOLENBRDBDO3FCQUE5QztpQkFESjthRHJGd0MsQ0FBeEMsQ0NvRmdFOzs7OzRCQXhUaEQ7QUFDaEIsbUJBQU8sS0FBSyxVQUFMLENBRFM7Ozs7NEJBSUE7QUFDaEIsbUJBQU8sS0FBSyxVQUFMLENBRFM7Ozs7V0FOeEI7RUFBNEIsU0FBQSxZQUFBOztBQUFmLFFBQUEsTUFBQSxHQUFNLE1BQU4iLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9tYWluLmQudHNcIiAvPlxuXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci50aHJvdyh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jb25zdCBldmVudHNfMSA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuY29uc3QgcmVwb3NpdG9yeV8xID0gcmVxdWlyZSgnLi9yZXBvc2l0b3J5Jyk7XG5jb25zdCB0aHVtYm5haWxlcl8xID0gcmVxdWlyZSgnLi90aHVtYm5haWxlcicpO1xuY29uc3QgYXNzZXRfMSA9IHJlcXVpcmUoJy4vYXNzZXQnKTtcbmNvbnN0IHV0aWxzXzEgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5jb25zdCBnZW5lcmF0b3JzID0gcmVxdWlyZSgnLi9nZW5lcmF0b3JzL2luZGV4Jyk7XG5jb25zdCBQYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzJyk7XG52YXIgaWRDb3VudGVyID0gMDtcbmZ1bmN0aW9uIGdldElkKCkge1xuICAgIHJldHVybiArK2lkQ291bnRlciArIFwiXCI7XG59XG4oZnVuY3Rpb24gKEhvb2spIHtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVDcmVhdGVcIl0gPSAwXSA9IFwiQmVmb3JlQ3JlYXRlXCI7XG4gICAgSG9va1tIb29rW1wiQ3JlYXRlXCJdID0gMV0gPSBcIkNyZWF0ZVwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZVJlbW92ZVwiXSA9IDJdID0gXCJCZWZvcmVSZW1vdmVcIjtcbiAgICBIb29rW0hvb2tbXCJSZW1vdmVcIl0gPSAzXSA9IFwiUmVtb3ZlXCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlTGlzdFwiXSA9IDRdID0gXCJCZWZvcmVMaXN0XCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlU3RyZWFtXCJdID0gNV0gPSBcIkJlZm9yZVN0cmVhbVwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZVRodW1ibmFpbFwiXSA9IDZdID0gXCJCZWZvcmVUaHVtYm5haWxcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVHZXRcIl0gPSA3XSA9IFwiQmVmb3JlR2V0XCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlQ291bnRcIl0gPSA4XSA9IFwiQmVmb3JlQ291bnRcIjtcbn0pKGV4cG9ydHMuSG9vayB8fCAoZXhwb3J0cy5Ib29rID0ge30pKTtcbnZhciBIb29rID0gZXhwb3J0cy5Ib29rO1xuZnVuY3Rpb24gaXNTdHJpbmcoYSkge1xuICAgIHJldHVybiB0eXBlb2YgYSA9PT0gJ3N0cmluZyc7XG59XG5jbGFzcyBBc3NldHMgZXh0ZW5kcyBldmVudHNfMS5FdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5faG9va3MgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycyA9IFtdO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb3B0aW9ucycpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5tZXRhU3RvcmUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMubWV0YVN0b3JlID0gJ2ZpbGUnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5maWxlU3RvcmUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZmlsZVN0b3JlID0gJ2ZpbGUnO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtZXRhLCBmaWxlO1xuICAgICAgICBpZiAoaXNTdHJpbmcob3B0aW9ucy5tZXRhU3RvcmUpKSB7XG4gICAgICAgICAgICBtZXRhID0gcmVwb3NpdG9yeV8xLmdldE1ldGFTdG9yZShvcHRpb25zLm1ldGFTdG9yZSwgb3B0aW9ucy5tZXRhU3RvcmVPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG1ldGEgPSBvcHRpb25zLm1ldGFTdG9yZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNTdHJpbmcob3B0aW9ucy5maWxlU3RvcmUpKSB7XG4gICAgICAgICAgICBmaWxlID0gcmVwb3NpdG9yeV8xLmdldEZpbGVTdG9yZShvcHRpb25zLmZpbGVTdG9yZSwgb3B0aW9ucy5maWxlU3RvcmVPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZpbGUgPSBvcHRpb25zLmZpbGVTdG9yZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1ldGEgfHwgIWZpbGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIGZpbGUgb3IgbWV0YSBzdG9yZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRodW1ibmFpbGVyID0gbmV3IHRodW1ibmFpbGVyXzEuVGh1bWJuYWlsZXIoKTtcbiAgICAgICAgdGhpcy5fbWV0YVN0b3JlID0gbWV0YTtcbiAgICAgICAgdGhpcy5fZmlsZVN0b3JlID0gZmlsZTtcbiAgICB9XG4gICAgZ2V0IG1ldGFTdG9yZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21ldGFTdG9yZTtcbiAgICB9XG4gICAgZ2V0IGZpbGVTdG9yZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVTdG9yZTtcbiAgICB9XG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHRoaXMubWV0YVN0b3JlLmluaXRpYWxpemUoKSxcbiAgICAgICAgICAgIHRoaXMuZmlsZVN0b3JlLmluaXRpYWxpemUoKSxcbiAgICAgICAgICAgIGdlbmVyYXRvcnMuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgdGhpcy50aHVtYm5haWxlci5pbml0aWFsaXplKHRoaXMpXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICB0aHVtYm5haWwoYXNzZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlVGh1bWJuYWlsLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBsZXQgc3RyZWFtID0geWllbGQgdGhpcy50aHVtYm5haWxlci5yZXF1ZXN0KGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjYW5UaHVtYm5haWwoYXNzZXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGh1bWJuYWlsZXIuY2FuVGh1bWJuYWlsKGFzc2V0Lm1pbWUpO1xuICAgIH1cbiAgICBjcmVhdGVGcm9tUGF0aChwYXRoLCBkZXN0LCBvcHRpb25zID0geyBza2lwTWV0YTogZmFsc2UgfSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHN0YXQgPSB5aWVsZCB1dGlsc18xLmdldEZpbGVTdGF0cyhwYXRoKTtcbiAgICAgICAgICAgIGlmICghc3RhdC5pc0ZpbGUoKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIGZpbGUnKTtcbiAgICAgICAgICAgIGxldCByZWFkZXIgPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHBhdGgpO1xuICAgICAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdC5zaXplO1xuICAgICAgICAgICAgb3B0aW9ucy5taW1lID0gdXRpbHNfMS5nZXRNaW1lVHlwZShwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLmNyZWF0ZShyZWFkZXIsIGRlc3QsIG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlKHN0cmVhbSwgcGF0aCwgb3B0aW9ucyA9IHsgc2tpcE1ldGE6IGZhbHNlIH0pIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgdG1wRmlsZTtcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuID0gKCkgPT4geyBpZiAodG1wRmlsZSlcbiAgICAgICAgICAgICAgICBmcy51bmxpbmsodG1wRmlsZSk7IH07XG4gICAgICAgICAgICBsZXQgZmlsZW5hbWUgPSBQYXRoLmJhc2VuYW1lKHBhdGgpO1xuICAgICAgICAgICAgZmlsZW5hbWUgPSB1dGlsc18xLm5vcm1hbGl6ZUZpbGVOYW1lKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIC8vIElmIG1pbWUgb3Igc2l6ZSBpc250IHByb3ZpZGVkLCB3ZSBoYXZlIHRvIGdldCBpdFxuICAgICAgICAgICAgLy8gdGhlIGhhcmQgd2F5XG4gICAgICAgICAgICBpZiAoKCFvcHRpb25zLm1pbWUgfHwgIW9wdGlvbnMuc2l6ZSkgfHwgKG9wdGlvbnMubWltZSA9PT0gXCJcIiB8fCBvcHRpb25zLnNpemUgPT09IDApKSB7XG4gICAgICAgICAgICAgICAgdG1wRmlsZSA9IHlpZWxkIHV0aWxzXzEuY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuICAgICAgICAgICAgICAgIGxldCBzdGF0cyA9IHlpZWxkIHV0aWxzXzEuZ2V0RmlsZVN0YXRzKHRtcEZpbGUpO1xuICAgICAgICAgICAgICAgIGxldCBtaW1lID0gdXRpbHNfMS5nZXRNaW1lVHlwZSh0bXBGaWxlKTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLm1pbWUgPSBtaW1lO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuc2l6ZSA9IHN0YXRzLnNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZGlyUGF0aCA9IFBhdGguZGlybmFtZShwYXRoKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBhdGgpXG4gICAgICAgICAgICAgICAgZGlyUGF0aCA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICAgIGxldCBhc3NldCA9IG5ldyBhc3NldF8xLkFzc2V0KHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvcHRpb25zLm5hbWUgfHwgZmlsZW5hbWUsXG4gICAgICAgICAgICAgICAgcGF0aDogdXRpbHNfMS5ub3JtYWxpemVQYXRoKGRpclBhdGgpLFxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlbmFtZSxcbiAgICAgICAgICAgICAgICBtaW1lOiBvcHRpb25zLm1pbWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogb3B0aW9ucy5zaXplLFxuICAgICAgICAgICAgICAgIGhpZGRlbjogb3B0aW9ucy5oaWRkZW4sXG4gICAgICAgICAgICAgICAgbWV0YTogb3B0aW9ucy5tZXRhIHx8IHt9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGNyZWF0ZUZuID0gKCkgPT4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRtcEZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdG1wRmlsZSA9IHlpZWxkIHV0aWxzXzEuY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gUnVuIGJlZm9yZSBjcmVhdGUgaG9vaywgXG4gICAgICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlQ3JlYXRlLCBhc3NldCwgY3JlYXRlRm4sIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKHRtcEZpbGUpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHRtcEZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFzc2V0LnBhdGhbYXNzZXQucGF0aC5sZW5ndGggLSAxXSAhPT0gJy8nKVxuICAgICAgICAgICAgICAgIGFzc2V0LnBhdGggKz0gJy8nO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5maWxlU3RvcmUuY3JlYXRlKGFzc2V0LCBzdHJlYW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9ydW5IYW5kbGVycyhhc3NldCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJlYW0oYXNzZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IHJ1biBoYW5kbGVyIGZvciBcIiVzXCIsIGdvdCBlcnJvcjogJXMnLCBhc3NldC5taW1lLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5za2lwTWV0YSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMubWV0YVN0b3JlLmNyZWF0ZShhc3NldCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFuKCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgICAgIGRlYnVnKCdjcmVhdGUgJWonLCBhc3NldCk7XG4gICAgICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQ3JlYXRlLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKiogR2V0IGFuIGFzc2V0IGJ5IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBpZFxuICAgICAqIEByZXR1cm4gUHJvbWlzZTxBc3NldD5cbiAgICAgKi9cbiAgICBnZXRCeUlkKGlkLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IGluZm8gPSB5aWVsZCB0aGlzLm1ldGFTdG9yZS5nZXQoaWQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCEoaW5mbyBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgaW5mbyA9IG5ldyBhc3NldF8xLkFzc2V0KGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluZm87XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXNzZXQgYnkgZnVsbCBwYXRoXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIGZ1bGwgcGF0aCB0byB0aGUgZmlsZVxuICAgICAqIEByZXR1cm4gUHJvbWlzZTxBc3NldD5cbiAgICAgKi9cbiAgICBnZXRCeVBhdGgocGF0aCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRhU3RvcmUuZ2V0QnlQYXRoKHBhdGgsIG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihhc3NldCA9PiB7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhc3NldCBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpKVxuICAgICAgICAgICAgICAgICAgICBhc3NldCA9IG5ldyBhc3NldF8xLkFzc2V0KGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhcyhwYXRoLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEJ5UGF0aChwYXRoLCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oYSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYSAhPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcXVlcnkodGVybSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5wYXRoID0gdGVybTtcbiAgICAgICAgICAgIHJldHVybiAoeWllbGQgdGhpcy5tZXRhU3RvcmUuZmluZChvcHRpb25zKSkubWFwKGEgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBhc3NldF8xLkFzc2V0KGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW1vdmUoYXNzZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAoKHlpZWxkIHRoaXMuZ2V0QnlJZChhc3NldC5pZCwgb3B0aW9ucykpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVSZW1vdmUsIGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLm1ldGFTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLlJlbW92ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGlzdChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUxpc3QsIG51bGwsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgbGV0IGluZm9zID0geWllbGQgdGhpcy5tZXRhU3RvcmUubGlzdChvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghaW5mb3MubGVuZ3RoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmZvcztcbiAgICAgICAgICAgIHJldHVybiBpbmZvcy5tYXAobSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCEobSBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgYXNzZXRfMS5Bc3NldChtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0cmVhbShhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVTdHJlYW0sIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLmZpbGVTdG9yZS5zdHJlYW0oYXNzZXQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY291bnQob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVDb3VudCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5tZXRhU3RvcmUuY291bnQob3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1c2UobWltZSwgZm4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBmbiA9IG1pbWU7XG4gICAgICAgICAgICBtaW1lID0gJy4qJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9taW1lSGFuZGxlcnMucHVzaCh7XG4gICAgICAgICAgICByOiBuZXcgUmVnRXhwKG1pbWUsICdpJyksXG4gICAgICAgICAgICBmOiBmblxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlZ2lzdGVySG9vayhob29rLCBmbikge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSkge1xuICAgICAgICAgICAgdGhpcy5faG9va3Muc2V0KGhvb2ssIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWQgPSBnZXRJZCgpO1xuICAgICAgICB0aGlzLl9ob29rcy5nZXQoaG9vaykucHVzaChbaWQsIGZuXSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgdW5yZWdpc3Rlcihob29rLCBmbikge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGhvb2tzID0gdGhpcy5faG9va3MuZ2V0KGhvb2spO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaG9va3NbaV1bMF0gPT09IGZuIHx8IGhvb2tzW2ldWzFdID09PSBmbikge1xuICAgICAgICAgICAgICAgIGhvb2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfcnVuSG9vayhob29rLCBhc3NldCwgZm4sIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vayk7XG4gICAgICAgICAgICBpZiAoIWhvb2tzKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgJXMgKCVkKVwiLCBIb29rW2hvb2tdLCBob29rcy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gaG9va3MubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgaWQgJXNcIiwgaG9va3NbaV1bMF0pO1xuICAgICAgICAgICAgICAgIHlpZWxkIGhvb2tzW2ldWzFdKGFzc2V0LCBmbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcnVuSGFuZGxlcnMoYXNzZXQsIGZuKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fbWltZUhhbmRsZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbWltZUhhbmRsZXJzW2ldLnIudGVzdChhc3NldC5taW1lKSkge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9taW1lSGFuZGxlcnNbaV0uZihhc3NldCwgZm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldHMgPSBBc3NldHM7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9tYWluLmQudHNcIiAvPlxuXG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQge2dldEZpbGVTdG9yZSwgZ2V0TWV0YVN0b3JlfSBmcm9tICcuL3JlcG9zaXRvcnknO1xuaW1wb3J0IHtJRmlsZSwgSU1ldGFTdG9yZSwgSUZpbGVTdG9yZSwgSUxpc3RPcHRpb25zLCBJRmluZE9wdGlvbnN9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7VGh1bWJuYWlsZXJ9IGZyb20gJy4vdGh1bWJuYWlsZXInO1xuaW1wb3J0IHtBc3NldH0gZnJvbSAnLi9hc3NldCc7XG5pbXBvcnQge3JhbmRvbU5hbWUsIGdldEZpbGVTdGF0cywgZ2V0TWltZVR5cGUsIHdyaXRlU3RyZWFtLCBub3JtYWxpemVGaWxlTmFtZSwgbm9ybWFsaXplUGF0aCxjcmVhdGVUZW1wfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCAqIGFzIGdlbmVyYXRvcnMgZnJvbSAnLi9nZW5lcmF0b3JzL2luZGV4JztcbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBvcyBmcm9tICdvcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0cycpO1xuXG52YXIgaWRDb3VudGVyID0gMDtcbmZ1bmN0aW9uIGdldElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICsraWRDb3VudGVyICsgXCJcIjtcbn1cblxuZXhwb3J0IGVudW0gSG9vayB7XG4gICAgQmVmb3JlQ3JlYXRlLFxuICAgIENyZWF0ZSxcbiAgICBCZWZvcmVSZW1vdmUsXG4gICAgUmVtb3ZlLFxuICAgIEJlZm9yZUxpc3QsXG4gICAgQmVmb3JlU3RyZWFtLFxuICAgIEJlZm9yZVRodW1ibmFpbCxcbiAgICBCZWZvcmVHZXQsXG4gICAgQmVmb3JlQ291bnRcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcoYTphbnkpOiBhIGlzIFN0cmluZyB7XG4gICAgcmV0dXJuIHR5cGVvZiBhID09PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb29rRnVuYyB7XG4gICAgKGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPiwgb3B0aW9ucz86YW55KTogUHJvbWlzZTx2b2lkPjtcbn1cblxudHlwZSBob29rX3R1cGxlID0gW3N0cmluZywgSG9va0Z1bmNdOyBcblxuZXhwb3J0IGludGVyZmFjZSBNaW1lRnVuYyB7XG4gICAgKGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPik6IFByb21pc2U8dm9pZD47XG59XG5cbmludGVyZmFjZSBNaW1lTWFwIHtcbiAgICByOiBSZWdFeHA7XG4gICAgZjogTWltZUZ1bmM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRzT3B0aW9ucyB7XG4gICAgbWV0YVN0b3JlPzogc3RyaW5nfElNZXRhU3RvcmU7XG4gICAgZmlsZVN0b3JlPzogc3RyaW5nfElGaWxlU3RvcmU7XG4gICAgZmlsZVN0b3JlT3B0aW9ucz86IGFueTtcbiAgICBtZXRhU3RvcmVPcHRpb25zPzogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2V0Q3JlYXRlT3B0aW9ucyB7XG4gICAgc2l6ZT86IG51bWJlcjtcbiAgICBtaW1lPzogc3RyaW5nO1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgaGlkZGVuPzpib29sZWFuO1xuICAgIHNraXBNZXRhPzogYm9vbGVhbjtcbiAgICBtZXRhPzp7W2tleTogc3RyaW5nXTogYW55fTtcbiAgICBwYXRoPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBwcm90ZWN0ZWQgX21ldGFTdG9yZTogSU1ldGFTdG9yZTtcbiAgICBwdWJsaWMgZ2V0IG1ldGFTdG9yZSgpOiBJTWV0YVN0b3JlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21ldGFTdG9yZVxuICAgIH1cbiAgICBwcm90ZWN0ZWQgX2ZpbGVTdG9yZTogSUZpbGVTdG9yZTtcbiAgICBwdWJsaWMgZ2V0IGZpbGVTdG9yZSgpOiBJRmlsZVN0b3JlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVTdG9yZVxuICAgIH1cbiAgICBcbiAgICBwcm90ZWN0ZWQgdGh1bWJuYWlsZXI6IFRodW1ibmFpbGVyO1xuICAgICBcbiAgICBwcml2YXRlIF9ob29rczogTWFwPEhvb2ssIGhvb2tfdHVwbGVbXT47XG4gICAgcHJpdmF0ZSBfbWltZUhhbmRsZXJzOiBNaW1lTWFwW107XG4gICAgXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogQXNzZXRzT3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuX2hvb2tzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9taW1lSGFuZGxlcnMgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvcHRpb25zJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9wdGlvbnMubWV0YVN0b3JlKSB7XG4gICAgICAgICAgICBvcHRpb25zLm1ldGFTdG9yZSA9ICdmaWxlJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMuZmlsZVN0b3JlKSB7XG4gICAgICAgICAgICBvcHRpb25zLmZpbGVTdG9yZSA9ICdmaWxlJztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgbGV0IG1ldGE6IElNZXRhU3RvcmUsIGZpbGU6IElGaWxlU3RvcmU7XG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLm1ldGFTdG9yZSkpIHtcbiAgICAgICAgICAgIG1ldGEgPSBnZXRNZXRhU3RvcmUoPHN0cmluZz5vcHRpb25zLm1ldGFTdG9yZSwgb3B0aW9ucy5tZXRhU3RvcmVPcHRpb25zKTsgICAgICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1ldGEgPSA8SU1ldGFTdG9yZT5vcHRpb25zLm1ldGFTdG9yZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLmZpbGVTdG9yZSkpIHtcbiAgICAgICAgICAgIGZpbGUgPSBnZXRGaWxlU3RvcmUoPHN0cmluZz5vcHRpb25zLmZpbGVTdG9yZSwgb3B0aW9ucy5maWxlU3RvcmVPcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGUgPSA8SUZpbGVTdG9yZT5vcHRpb25zLmZpbGVTdG9yZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbWV0YSB8fCAhZmlsZSkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBmaWxlIG9yIG1ldGEgc3RvcmVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aHVtYm5haWxlciA9IG5ldyBUaHVtYm5haWxlcigpO1xuICAgICAgICB0aGlzLl9tZXRhU3RvcmUgPSBtZXRhO1xuICAgICAgICB0aGlzLl9maWxlU3RvcmUgPSBmaWxlO1xuXG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWRbXT4ge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLm1ldGFTdG9yZS5pbml0aWFsaXplKCksXG4gICAgICAgICAgICB0aGlzLmZpbGVTdG9yZS5pbml0aWFsaXplKCksXG4gICAgICAgICAgICBnZW5lcmF0b3JzLmluaXRpYWxpemUoKSxcbiAgICAgICAgICAgIHRoaXMudGh1bWJuYWlsZXIuaW5pdGlhbGl6ZSh0aGlzKVxuICAgICAgICBdKTtcblxuICAgIH1cbiAgICBcbiAgICBhc3luYyB0aHVtYm5haWwgKGFzc2V0OkFzc2V0LCBvcHRpb25zPzphbnkpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVUaHVtYm5haWwsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgbGV0IHN0cmVhbSA9IGF3YWl0IHRoaXMudGh1bWJuYWlsZXIucmVxdWVzdChhc3NldCwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgfVxuICAgIFxuICAgIGNhblRodW1ibmFpbCAoYXNzZXQ6QXNzZXQpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGh1bWJuYWlsZXIuY2FuVGh1bWJuYWlsKGFzc2V0Lm1pbWUpO1xuICAgIH1cbiAgICBcbiAgICBcbiAgICBhc3luYyBjcmVhdGVGcm9tUGF0aChwYXRoOiBzdHJpbmcsIGRlc3Q6IHN0cmluZywgb3B0aW9uczogQXNzZXRDcmVhdGVPcHRpb25zID0geyBza2lwTWV0YTogZmFsc2UgfSkge1xuICAgICAgICBcbiAgICAgICAgbGV0IHN0YXQgPSBhd2FpdCBnZXRGaWxlU3RhdHMocGF0aCk7XG4gICAgICAgIGlmICghc3RhdC5pc0ZpbGUoKSkgdGhyb3cgbmV3IEVycm9yKCdub3QgYSBmaWxlJyk7XG4gICAgICAgIFxuICAgICAgICBsZXQgcmVhZGVyID0gZnMuY3JlYXRlUmVhZFN0cmVhbShwYXRoKTtcbiAgICAgICAgXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHN0YXQuc2l6ZTtcbiAgICAgICAgb3B0aW9ucy5taW1lID0gZ2V0TWltZVR5cGUocGF0aCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGUocmVhZGVyLCBkZXN0LCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgYXN5bmMgY3JlYXRlKHN0cmVhbTogUmVhZGFibGUsIHBhdGg6IHN0cmluZywgb3B0aW9uczogQXNzZXRDcmVhdGVPcHRpb25zID0geyBza2lwTWV0YTogZmFsc2UgfSk6IFByb21pc2U8SUZpbGU+IHtcblxuICAgICAgICBsZXQgdG1wRmlsZTtcblxuICAgICAgICBjb25zdCBjbGVhbiA9ICgpID0+IHsgaWYgKHRtcEZpbGUpIGZzLnVubGluayh0bXBGaWxlKTsgfTtcblxuICAgICAgICBcbiAgICAgICAgbGV0IGZpbGVuYW1lID0gUGF0aC5iYXNlbmFtZShwYXRoKTtcbiAgICAgICAgZmlsZW5hbWUgPSBub3JtYWxpemVGaWxlTmFtZShmaWxlbmFtZSk7XG4gICAgICAgIFxuXG4gICAgICAgIC8vIElmIG1pbWUgb3Igc2l6ZSBpc250IHByb3ZpZGVkLCB3ZSBoYXZlIHRvIGdldCBpdFxuICAgICAgICAvLyB0aGUgaGFyZCB3YXlcbiAgICAgICAgaWYgKCghb3B0aW9ucy5taW1lIHx8ICFvcHRpb25zLnNpemUpIHx8IChvcHRpb25zLm1pbWUgPT09IFwiXCIgfHwgb3B0aW9ucy5zaXplID09PSAwKSkge1xuXG4gICAgICAgICAgICB0bXBGaWxlID0gYXdhaXQgY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuXG4gICAgICAgICAgICBsZXQgc3RhdHMgPSBhd2FpdCBnZXRGaWxlU3RhdHModG1wRmlsZSk7XG4gICAgICAgICAgICBsZXQgbWltZSA9IGdldE1pbWVUeXBlKHRtcEZpbGUpO1xuXG4gICAgICAgICAgICBvcHRpb25zLm1pbWUgPSBtaW1lO1xuICAgICAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdHMuc2l6ZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZGlyUGF0aCA9IFBhdGguZGlybmFtZShwYXRoKTsgXG4gICAgICAgIGlmIChvcHRpb25zLnBhdGgpIGRpclBhdGggPSBvcHRpb25zLnBhdGg7XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgbGV0IGFzc2V0ID0gbmV3IEFzc2V0KHtcbiAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZXx8ZmlsZW5hbWUsXG4gICAgICAgICAgICBwYXRoOiBub3JtYWxpemVQYXRoKGRpclBhdGgpLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lLFxuICAgICAgICAgICAgbWltZTogb3B0aW9ucy5taW1lLFxuICAgICAgICAgICAgc2l6ZTogb3B0aW9ucy5zaXplLFxuICAgICAgICAgICAgaGlkZGVuOiBvcHRpb25zLmhpZGRlbixcbiAgICAgICAgICAgIG1ldGE6IG9wdGlvbnMubWV0YSB8fCB7fVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBjb25zdCBjcmVhdGVGbiA9IGFzeW5jICgpOiBQcm9taXNlPFJlYWRhYmxlPiA9PiB7XG4gICAgICAgICAgICBpZiAoIXRtcEZpbGUpIHtcbiAgICAgICAgICAgICAgICB0bXBGaWxlID0gYXdhaXQgY3JlYXRlVGVtcChzdHJlYW0sIHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgIH07XG4gICAgICAgIFxuXG4gICAgICAgIC8vIFJ1biBiZWZvcmUgY3JlYXRlIGhvb2ssIFxuICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlQ3JlYXRlLCBhc3NldCwgY3JlYXRlRm4sIG9wdGlvbnMpO1xuXG4gICAgICAgIGlmICh0bXBGaWxlKSB7XG4gICAgICAgICAgICBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHRtcEZpbGUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoYXNzZXQucGF0aFthc3NldC5wYXRoLmxlbmd0aCAtIDFdICE9PSAnLycpIGFzc2V0LnBhdGggKz0gJy8nO1xuICAgICAgICAgICAgICAgIFxuXG4gICAgICAgIGF3YWl0IHRoaXMuZmlsZVN0b3JlLmNyZWF0ZShhc3NldCwgc3RyZWFtLCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9ydW5IYW5kbGVycyhhc3NldCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCBydW4gaGFuZGxlciBmb3IgXCIlc1wiLCBnb3QgZXJyb3I6ICVzJywgYXNzZXQubWltZSwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9wdGlvbnMuc2tpcE1ldGEpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5tZXRhU3RvcmUuY3JlYXRlKGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgIGNsZWFuKCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNsZWFuKCk7XG4gICAgICAgIGRlYnVnKCdjcmVhdGUgJWonLCBhc3NldCk7XG4gICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5DcmVhdGUsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgfVxuXG4gICAgLyoqIEdldCBhbiBhc3NldCBieSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBUaGUgaWRcbiAgICAgKiBAcmV0dXJuIFByb21pc2U8QXNzZXQ+XG4gICAgICovXG4gICAgYXN5bmMgZ2V0QnlJZChpZDogc3RyaW5nLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPEFzc2V0PiB7XG4gICAgICAgIGxldCBpbmZvID0gYXdhaXQgdGhpcy5tZXRhU3RvcmUuZ2V0KGlkLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKCEoaW5mbyBpbnN0YW5jZW9mIEFzc2V0KSkge1xuICAgICAgICAgICAgaW5mbyA9IG5ldyBBc3NldChpbmZvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPEFzc2V0PmluZm87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFuIGFzc2V0IGJ5IGZ1bGwgcGF0aFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFRoZSBmdWxsIHBhdGggdG8gdGhlIGZpbGVcbiAgICAgKiBAcmV0dXJuIFByb21pc2U8QXNzZXQ+XG4gICAgICovXG4gICAgZ2V0QnlQYXRoKHBhdGg6IHN0cmluZywgb3B0aW9ucz86YW55KTogUHJvbWlzZTxBc3NldD4ge1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMubWV0YVN0b3JlLmdldEJ5UGF0aChwYXRoLCBvcHRpb25zKVxuICAgICAgICAudGhlbiggYXNzZXQgPT4ge1xuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXNzZXQgaW5zdGFuY2VvZiBBc3NldCkpIGFzc2V0ID0gbmV3IEFzc2V0KGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc3NldDsgICAgXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGhhcyhwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OmFueSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRCeVBhdGgocGF0aCwgb3B0aW9ucylcbiAgICAgICAgLnRoZW4oIGEgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGEgIT0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIHF1ZXJ5KHRlcm06IHN0cmluZywgb3B0aW9ucz86IElGaW5kT3B0aW9ucyk6IFByb21pc2U8QXNzZXRbXT4ge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9uc3x8PGFueT57fTtcbiAgICAgICAgb3B0aW9ucy5wYXRoID0gdGVybTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5tZXRhU3RvcmUuZmluZChvcHRpb25zKSkubWFwKCBhID0+IHtcbiAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgQXNzZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgQXNzZXQoYSk7IFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICBcblxuICAgIGFzeW5jIHJlbW92ZShhc3NldDogQXNzZXQsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgXG4gICAgICAgIGlmICgoYXdhaXQgdGhpcy5nZXRCeUlkKGFzc2V0LmlkLCBvcHRpb25zKSkgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVJlbW92ZSwgYXNzZXQsIG9wdGlvbnMpXG4gICAgICAgIFxuICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICBhd2FpdCB0aGlzLm1ldGFTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICBcbiAgICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLlJlbW92ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpXG5cbiAgICB9XG5cbiAgICBhc3luYyBsaXN0KG9wdGlvbnM/OiBJTGlzdE9wdGlvbnMpOiBQcm9taXNlPEFzc2V0W10+IHtcbiAgICAgICAgXG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVMaXN0LCBudWxsLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBpbmZvcyA9IGF3YWl0IHRoaXMubWV0YVN0b3JlLmxpc3Qob3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKCFpbmZvcy5sZW5ndGgpIHJldHVybiA8QXNzZXRbXT5pbmZvcztcblxuICAgICAgICByZXR1cm4gaW5mb3MubWFwKG0gPT4ge1xuICAgICAgICAgICAgaWYgKCEobSBpbnN0YW5jZW9mIEFzc2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQXNzZXQobSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gPEFzc2V0Pm07XG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBhc3luYyBzdHJlYW0oYXNzZXQ6IEFzc2V0LCBvcHRpb25zPzphbnkpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVTdHJlYW0sIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZmlsZVN0b3JlLnN0cmVhbShhc3NldCk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIGNvdW50KG9wdGlvbnM/OklGaW5kT3B0aW9ucyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNvdW50LCBudWxsLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5tZXRhU3RvcmUuY291bnQob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgdXNlKG1pbWU6c3RyaW5nfE1pbWVGdW5jLCBmbj86TWltZUZ1bmMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBmbiA9IDxNaW1lRnVuYz5taW1lO1xuICAgICAgICAgICAgbWltZSA9ICcuKic7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHI6IG5ldyBSZWdFeHAoPHN0cmluZz5taW1lLCAnaScpLFxuICAgICAgICAgICAgZjogZm5cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZWdpc3Rlckhvb2soaG9vazogSG9vaywgZm46IEhvb2tGdW5jKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKCF0aGlzLl9ob29rcy5oYXMoaG9vaykpIHtcbiAgICAgICAgICAgIHRoaXMuX2hvb2tzLnNldChob29rLCBbXSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGlkID0gZ2V0SWQoKTtcbiAgICAgICAgdGhpcy5faG9va3MuZ2V0KGhvb2spLnB1c2goW2lkLCBmbl0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuICAgIFxuICAgIHVucmVnaXN0ZXIoaG9vazogSG9vaywgZm46IEhvb2tGdW5jfHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgbGV0IGhvb2tzID0gdGhpcy5faG9va3MuZ2V0KGhvb2spXG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaG9va3NbaV1bMF0gPT09IGZuIHx8IGhvb2tzW2ldWzFdID09PSBmbikge1xuICAgICAgICAgICAgICAgIGhvb2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ydW5Ib29rKGhvb2s6IEhvb2ssIGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPiwgb3B0aW9ucz86YW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBob29rczogaG9va190dXBsZVtdID0gdGhpcy5faG9va3MuZ2V0KGhvb2spO1xuICAgICAgICBpZiAoIWhvb2tzKSByZXR1cm47XG4gICAgICAgIGRlYnVnKFwicnVuIGhvb2sgJXMgKCVkKVwiLCBIb29rW2hvb2tdLCBob29rcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInJ1biBob29rIGlkICVzXCIsIGhvb2tzW2ldWzBdKTtcbiAgICAgICAgICAgIGF3YWl0IGhvb2tzW2ldWzFdKGFzc2V0LCBmbiwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBhc3luYyBfcnVuSGFuZGxlcnMoYXNzZXQ6QXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fbWltZUhhbmRsZXJzLmxlbmd0aDsgaSA8IGlpOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWltZUhhbmRsZXJzW2ldLnIudGVzdChhc3NldC5taW1lKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX21pbWVIYW5kbGVyc1tpXS5mKGFzc2V0LCBmbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
