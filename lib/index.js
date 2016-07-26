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
            debug("using meta store: %s", options.metaStore);
            meta = repository_1.getMetaStore(options.metaStore, options.metaStoreOptions);
        } else {
            meta = options.metaStore;
        }
        if (isString(options.fileStore)) {
            debug('using file store: %s', options.fileStore);
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
        /**
         * Create a new asset
         *
         * @param {Readable} stream A readable stream
         * @param {string} path The full destination path (path + filename)
         * @param {AssetCreateOptions} [options={ skipMeta: false }] (description)
         * @returns {Promise<Asset>} (description)
         */

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
                    debug('getting mime and size for asset');
                    tmpFile = yield utils_1.writeToTempFile(stream, path);
                    var stats = yield utils_1.getFileStats(tmpFile);
                    var mime = options.mime;
                    if (mime == null || mime == "") {
                        mime = utils_1.getMimeType(tmpFile);
                    }
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
                            tmpFile = yield utils_1.writeToTempFile(stream, path);
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
        /**
         * Check if a given path exists
         *
         * @param {string} path The full path to the asset (path/to/filename.ext)
         * @param {*} [options] (description)
         * @returns {Promise<boolean>} (description)
         */

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
//# sourceMappingURL=data:application/json;base64,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QUFOLENBQXRDLENEcEZxRDtBQ3FGckQscUJBQUssSUFBSSxJQUFJLENBQUosRUFBTyxLQUFLLE1BQU0sTUFBTixFQUFjLElBQUksRUFBSixFQUFRLEdBQTNDLEVBQWdEO0FBQzVDLDBCQUFNLGdCQUFOLEVBQXdCLE1BQU0sQ0FBTixFQUFTLENBQVQsQ0FBeEIsRUFENEM7QUFFNUMsMEJBQU0sTUFBTSxDQUFOLEVBQVMsQ0FBVCxFQUFZLEtBQVosRUFBbUIsRUFBbkIsRUFBdUIsT0FBdkIsQ0FBTixDQUY0QztpQkFBaEQ7YURyRndDLENBQXhDLENDaUZ3Rjs7OztxQ0FVakUsT0FBYyxJQUE0QjtBRC9FakUsbUJBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7QUNnRnJELHFCQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxLQUFLLGFBQUwsQ0FBbUIsTUFBbkIsRUFBMkIsSUFBSSxFQUFKLEVBQVEsR0FBeEQsRUFBNkQ7QUFDekQsd0JBQUksS0FBSyxhQUFMLENBQW1CLENBQW5CLEVBQXNCLENBQXRCLENBQXdCLElBQXhCLENBQTZCLE1BQU0sSUFBTixDQUFqQyxFQUE4QztBQUMxQyw4QkFBTSxLQUFLLGFBQUwsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsQ0FBd0IsS0FBeEIsRUFBK0IsRUFBL0IsQ0FBTixDQUQwQztxQkFBOUM7aUJBREo7YURoRndDLENBQXhDLENDK0VpRTs7Ozs0QkExVWpEO0FBQ2hCLG1CQUFPLEtBQUssVUFBTCxDQURTOzs7OzRCQUlBO0FBQ2hCLG1CQUFPLEtBQUssVUFBTCxDQURTOzs7O1dBTnhCO0VBQTRCLFNBQUEsWUFBQTs7QUFBZixRQUFBLE1BQUEsR0FBTSxNQUFOIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci50aHJvdyh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jb25zdCBldmVudHNfMSA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuY29uc3QgcmVwb3NpdG9yeV8xID0gcmVxdWlyZSgnLi9yZXBvc2l0b3J5Jyk7XG5jb25zdCB0aHVtYm5haWxlcl8xID0gcmVxdWlyZSgnLi90aHVtYm5haWxlcicpO1xuY29uc3QgYXNzZXRfMSA9IHJlcXVpcmUoJy4vYXNzZXQnKTtcbmNvbnN0IHV0aWxzXzEgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5jb25zdCBnZW5lcmF0b3JzID0gcmVxdWlyZSgnLi9nZW5lcmF0b3JzL2luZGV4Jyk7XG5jb25zdCBQYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzJyk7XG52YXIgaWRDb3VudGVyID0gMDtcbmZ1bmN0aW9uIGdldElkKCkge1xuICAgIHJldHVybiArK2lkQ291bnRlciArIFwiXCI7XG59XG4oZnVuY3Rpb24gKEhvb2spIHtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVDcmVhdGVcIl0gPSAwXSA9IFwiQmVmb3JlQ3JlYXRlXCI7XG4gICAgSG9va1tIb29rW1wiQ3JlYXRlXCJdID0gMV0gPSBcIkNyZWF0ZVwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZVJlbW92ZVwiXSA9IDJdID0gXCJCZWZvcmVSZW1vdmVcIjtcbiAgICBIb29rW0hvb2tbXCJSZW1vdmVcIl0gPSAzXSA9IFwiUmVtb3ZlXCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlTGlzdFwiXSA9IDRdID0gXCJCZWZvcmVMaXN0XCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlU3RyZWFtXCJdID0gNV0gPSBcIkJlZm9yZVN0cmVhbVwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZVRodW1ibmFpbFwiXSA9IDZdID0gXCJCZWZvcmVUaHVtYm5haWxcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVHZXRcIl0gPSA3XSA9IFwiQmVmb3JlR2V0XCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlQ291bnRcIl0gPSA4XSA9IFwiQmVmb3JlQ291bnRcIjtcbn0pKGV4cG9ydHMuSG9vayB8fCAoZXhwb3J0cy5Ib29rID0ge30pKTtcbnZhciBIb29rID0gZXhwb3J0cy5Ib29rO1xuZnVuY3Rpb24gaXNTdHJpbmcoYSkge1xuICAgIHJldHVybiB0eXBlb2YgYSA9PT0gJ3N0cmluZyc7XG59XG5jbGFzcyBBc3NldHMgZXh0ZW5kcyBldmVudHNfMS5FdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5faG9va3MgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycyA9IFtdO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb3B0aW9ucycpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5tZXRhU3RvcmUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMubWV0YVN0b3JlID0gJ2ZpbGUnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5maWxlU3RvcmUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZmlsZVN0b3JlID0gJ2ZpbGUnO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtZXRhLCBmaWxlO1xuICAgICAgICBpZiAoaXNTdHJpbmcob3B0aW9ucy5tZXRhU3RvcmUpKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInVzaW5nIG1ldGEgc3RvcmU6ICVzXCIsIG9wdGlvbnMubWV0YVN0b3JlKTtcbiAgICAgICAgICAgIG1ldGEgPSByZXBvc2l0b3J5XzEuZ2V0TWV0YVN0b3JlKG9wdGlvbnMubWV0YVN0b3JlLCBvcHRpb25zLm1ldGFTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbWV0YSA9IG9wdGlvbnMubWV0YVN0b3JlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLmZpbGVTdG9yZSkpIHtcbiAgICAgICAgICAgIGRlYnVnKCd1c2luZyBmaWxlIHN0b3JlOiAlcycsIG9wdGlvbnMuZmlsZVN0b3JlKTtcbiAgICAgICAgICAgIGZpbGUgPSByZXBvc2l0b3J5XzEuZ2V0RmlsZVN0b3JlKG9wdGlvbnMuZmlsZVN0b3JlLCBvcHRpb25zLmZpbGVTdG9yZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlsZSA9IG9wdGlvbnMuZmlsZVN0b3JlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbWV0YSB8fCAhZmlsZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gZmlsZSBvciBtZXRhIHN0b3JlXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGh1bWJuYWlsZXIgPSBuZXcgdGh1bWJuYWlsZXJfMS5UaHVtYm5haWxlcigpO1xuICAgICAgICB0aGlzLl9tZXRhU3RvcmUgPSBtZXRhO1xuICAgICAgICB0aGlzLl9maWxlU3RvcmUgPSBmaWxlO1xuICAgIH1cbiAgICBnZXQgbWV0YVN0b3JlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWV0YVN0b3JlO1xuICAgIH1cbiAgICBnZXQgZmlsZVN0b3JlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZVN0b3JlO1xuICAgIH1cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5tZXRhU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgdGhpcy5maWxlU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgZ2VuZXJhdG9ycy5pbml0aWFsaXplKCksXG4gICAgICAgICAgICB0aGlzLnRodW1ibmFpbGVyLmluaXRpYWxpemUodGhpcylcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIHRodW1ibmFpbChhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVUaHVtYm5haWwsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGxldCBzdHJlYW0gPSB5aWVsZCB0aGlzLnRodW1ibmFpbGVyLnJlcXVlc3QoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNhblRodW1ibmFpbChhc3NldCkge1xuICAgICAgICByZXR1cm4gdGhpcy50aHVtYm5haWxlci5jYW5UaHVtYm5haWwoYXNzZXQubWltZSk7XG4gICAgfVxuICAgIGNyZWF0ZUZyb21QYXRoKHBhdGgsIGRlc3QsIG9wdGlvbnMgPSB7IHNraXBNZXRhOiBmYWxzZSB9KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgc3RhdCA9IHlpZWxkIHV0aWxzXzEuZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFzdGF0LmlzRmlsZSgpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGEgZmlsZScpO1xuICAgICAgICAgICAgbGV0IHJlYWRlciA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aCk7XG4gICAgICAgICAgICBvcHRpb25zLnNpemUgPSBzdGF0LnNpemU7XG4gICAgICAgICAgICBvcHRpb25zLm1pbWUgPSB1dGlsc18xLmdldE1pbWVUeXBlKHBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuY3JlYXRlKHJlYWRlciwgZGVzdCwgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgYXNzZXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UmVhZGFibGV9IHN0cmVhbSBBIHJlYWRhYmxlIHN0cmVhbVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFRoZSBmdWxsIGRlc3RpbmF0aW9uIHBhdGggKHBhdGggKyBmaWxlbmFtZSlcbiAgICAgKiBAcGFyYW0ge0Fzc2V0Q3JlYXRlT3B0aW9uc30gW29wdGlvbnM9eyBza2lwTWV0YTogZmFsc2UgfV0gKGRlc2NyaXB0aW9uKVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPEFzc2V0Pn0gKGRlc2NyaXB0aW9uKVxuICAgICAqL1xuICAgIGNyZWF0ZShzdHJlYW0sIHBhdGgsIG9wdGlvbnMgPSB7IHNraXBNZXRhOiBmYWxzZSB9KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHRtcEZpbGU7XG4gICAgICAgICAgICBjb25zdCBjbGVhbiA9ICgpID0+IHsgaWYgKHRtcEZpbGUpXG4gICAgICAgICAgICAgICAgZnMudW5saW5rKHRtcEZpbGUpOyB9O1xuICAgICAgICAgICAgbGV0IGZpbGVuYW1lID0gUGF0aC5iYXNlbmFtZShwYXRoKTtcbiAgICAgICAgICAgIGZpbGVuYW1lID0gdXRpbHNfMS5ub3JtYWxpemVGaWxlTmFtZShmaWxlbmFtZSk7XG4gICAgICAgICAgICAvLyBJZiBtaW1lIG9yIHNpemUgaXNudCBwcm92aWRlZCwgd2UgaGF2ZSB0byBnZXQgaXRcbiAgICAgICAgICAgIC8vIHRoZSBoYXJkIHdheVxuICAgICAgICAgICAgaWYgKCghb3B0aW9ucy5taW1lIHx8ICFvcHRpb25zLnNpemUpIHx8IChvcHRpb25zLm1pbWUgPT09IFwiXCIgfHwgb3B0aW9ucy5zaXplID09PSAwKSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdnZXR0aW5nIG1pbWUgYW5kIHNpemUgZm9yIGFzc2V0Jyk7XG4gICAgICAgICAgICAgICAgdG1wRmlsZSA9IHlpZWxkIHV0aWxzXzEud3JpdGVUb1RlbXBGaWxlKHN0cmVhbSwgcGF0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXRzID0geWllbGQgdXRpbHNfMS5nZXRGaWxlU3RhdHModG1wRmlsZSk7XG4gICAgICAgICAgICAgICAgbGV0IG1pbWUgPSBvcHRpb25zLm1pbWU7XG4gICAgICAgICAgICAgICAgaWYgKG1pbWUgPT0gbnVsbCB8fCBtaW1lID09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWltZSA9IHV0aWxzXzEuZ2V0TWltZVR5cGUodG1wRmlsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9wdGlvbnMubWltZSA9IG1pbWU7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zaXplID0gc3RhdHMuc2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBkaXJQYXRoID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF0aClcbiAgICAgICAgICAgICAgICBkaXJQYXRoID0gb3B0aW9ucy5wYXRoO1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0gbmV3IGFzc2V0XzEuQXNzZXQoe1xuICAgICAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSB8fCBmaWxlbmFtZSxcbiAgICAgICAgICAgICAgICBwYXRoOiB1dGlsc18xLm5vcm1hbGl6ZVBhdGgoZGlyUGF0aCksXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lLFxuICAgICAgICAgICAgICAgIG1pbWU6IG9wdGlvbnMubWltZSxcbiAgICAgICAgICAgICAgICBzaXplOiBvcHRpb25zLnNpemUsXG4gICAgICAgICAgICAgICAgaGlkZGVuOiBvcHRpb25zLmhpZGRlbixcbiAgICAgICAgICAgICAgICBtZXRhOiBvcHRpb25zLm1ldGEgfHwge31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgY3JlYXRlRm4gPSAoKSA9PiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGlmICghdG1wRmlsZSkge1xuICAgICAgICAgICAgICAgICAgICB0bXBGaWxlID0geWllbGQgdXRpbHNfMS53cml0ZVRvVGVtcEZpbGUoc3RyZWFtLCBwYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIFJ1biBiZWZvcmUgY3JlYXRlIGhvb2ssIFxuICAgICAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNyZWF0ZSwgYXNzZXQsIGNyZWF0ZUZuLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICh0bXBGaWxlKSB7XG4gICAgICAgICAgICAgICAgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhc3NldC5wYXRoW2Fzc2V0LnBhdGgubGVuZ3RoIC0gMV0gIT09ICcvJylcbiAgICAgICAgICAgICAgICBhc3NldC5wYXRoICs9ICcvJztcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuZmlsZVN0b3JlLmNyZWF0ZShhc3NldCwgc3RyZWFtLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSGFuZGxlcnMoYXNzZXQsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RyZWFtKGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCBydW4gaGFuZGxlciBmb3IgXCIlc1wiLCBnb3QgZXJyb3I6ICVzJywgYXNzZXQubWltZSwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuc2tpcE1ldGEpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLm1ldGFTdG9yZS5jcmVhdGUoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLmZpbGVTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhbigpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFuKCk7XG4gICAgICAgICAgICBkZWJ1ZygnY3JlYXRlICVqJywgYXNzZXQpO1xuICAgICAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkNyZWF0ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqIEdldCBhbiBhc3NldCBieSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBUaGUgaWRcbiAgICAgKiBAcmV0dXJuIFByb21pc2U8QXNzZXQ+XG4gICAgICovXG4gICAgZ2V0QnlJZChpZCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBhc3NldCA9IHlpZWxkIHRoaXMubWV0YVN0b3JlLmdldChpZCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhc3NldCBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpKVxuICAgICAgICAgICAgICAgICAgICBhc3NldCA9IG5ldyBhc3NldF8xLkFzc2V0KGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhc3NldCBieSBmdWxsIHBhdGhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBwYXRoIHRvIHRoZSBmaWxlXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGdldEJ5UGF0aChwYXRoLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGFTdG9yZS5nZXRCeVBhdGgocGF0aCwgb3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGFzc2V0ID0+IHtcbiAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgIGlmICghKGFzc2V0IGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkpXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0ID0gbmV3IGFzc2V0XzEuQXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgYSBnaXZlbiBwYXRoIGV4aXN0c1xuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIGZ1bGwgcGF0aCB0byB0aGUgYXNzZXQgKHBhdGgvdG8vZmlsZW5hbWUuZXh0KVxuICAgICAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdIChkZXNjcmlwdGlvbilcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn0gKGRlc2NyaXB0aW9uKVxuICAgICAqL1xuICAgIGhhcyhwYXRoLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEJ5UGF0aChwYXRoLCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oYSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYSAhPSBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcXVlcnkodGVybSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgb3B0aW9ucy5wYXRoID0gdGVybTtcbiAgICAgICAgICAgIHJldHVybiAoeWllbGQgdGhpcy5tZXRhU3RvcmUuZmluZChvcHRpb25zKSkubWFwKGEgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBhc3NldF8xLkFzc2V0KGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZW1vdmUoYXNzZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAoKHlpZWxkIHRoaXMuZ2V0QnlJZChhc3NldC5pZCwgb3B0aW9ucykpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVSZW1vdmUsIGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLm1ldGFTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLlJlbW92ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGlzdChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUxpc3QsIG51bGwsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgbGV0IGluZm9zID0geWllbGQgdGhpcy5tZXRhU3RvcmUubGlzdChvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghaW5mb3MubGVuZ3RoKVxuICAgICAgICAgICAgICAgIHJldHVybiBpbmZvcztcbiAgICAgICAgICAgIHJldHVybiBpbmZvcy5tYXAobSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCEobSBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgYXNzZXRfMS5Bc3NldChtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0cmVhbShhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVTdHJlYW0sIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLmZpbGVTdG9yZS5zdHJlYW0oYXNzZXQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY291bnQob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVDb3VudCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5tZXRhU3RvcmUuY291bnQob3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICB1c2UobWltZSwgZm4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBmbiA9IG1pbWU7XG4gICAgICAgICAgICBtaW1lID0gJy4qJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9taW1lSGFuZGxlcnMucHVzaCh7XG4gICAgICAgICAgICByOiBuZXcgUmVnRXhwKG1pbWUsICdpJyksXG4gICAgICAgICAgICBmOiBmblxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlZ2lzdGVySG9vayhob29rLCBmbikge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSkge1xuICAgICAgICAgICAgdGhpcy5faG9va3Muc2V0KGhvb2ssIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWQgPSBnZXRJZCgpO1xuICAgICAgICB0aGlzLl9ob29rcy5nZXQoaG9vaykucHVzaChbaWQsIGZuXSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgdW5yZWdpc3Rlcihob29rLCBmbikge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGhvb2tzID0gdGhpcy5faG9va3MuZ2V0KGhvb2spO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaG9va3NbaV1bMF0gPT09IGZuIHx8IGhvb2tzW2ldWzFdID09PSBmbikge1xuICAgICAgICAgICAgICAgIGhvb2tzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfcnVuSG9vayhob29rLCBhc3NldCwgZm4sIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vayk7XG4gICAgICAgICAgICBpZiAoIWhvb2tzKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgJXMgKCVkKVwiLCBIb29rW2hvb2tdLCBob29rcy5sZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gaG9va3MubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGRlYnVnKFwicnVuIGhvb2sgaWQgJXNcIiwgaG9va3NbaV1bMF0pO1xuICAgICAgICAgICAgICAgIHlpZWxkIGhvb2tzW2ldWzFdKGFzc2V0LCBmbiwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcnVuSGFuZGxlcnMoYXNzZXQsIGZuKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fbWltZUhhbmRsZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbWltZUhhbmRsZXJzW2ldLnIudGVzdChhc3NldC5taW1lKSkge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9taW1lSGFuZGxlcnNbaV0uZihhc3NldCwgZm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldHMgPSBBc3NldHM7XG4iLCJpbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQge2dldEZpbGVTdG9yZSwgZ2V0TWV0YVN0b3JlfSBmcm9tICcuL3JlcG9zaXRvcnknO1xuaW1wb3J0IHtJRmlsZSwgSU1ldGFTdG9yZSwgSUZpbGVTdG9yZSwgSUxpc3RPcHRpb25zLCBJRmluZE9wdGlvbnN9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7VGh1bWJuYWlsZXJ9IGZyb20gJy4vdGh1bWJuYWlsZXInO1xuaW1wb3J0IHtBc3NldH0gZnJvbSAnLi9hc3NldCc7XG5pbXBvcnQge3JhbmRvbU5hbWUsIGdldEZpbGVTdGF0cywgZ2V0TWltZVR5cGUsIHdyaXRlU3RyZWFtLCBub3JtYWxpemVGaWxlTmFtZSwgbm9ybWFsaXplUGF0aCwgd3JpdGVUb1RlbXBGaWxlfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCAqIGFzIGdlbmVyYXRvcnMgZnJvbSAnLi9nZW5lcmF0b3JzL2luZGV4JztcbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBvcyBmcm9tICdvcyc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0cycpO1xuXG52YXIgaWRDb3VudGVyID0gMDtcbmZ1bmN0aW9uIGdldElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICsraWRDb3VudGVyICsgXCJcIjtcbn1cblxuZXhwb3J0IGVudW0gSG9vayB7XG4gICAgQmVmb3JlQ3JlYXRlLFxuICAgIENyZWF0ZSxcbiAgICBCZWZvcmVSZW1vdmUsXG4gICAgUmVtb3ZlLFxuICAgIEJlZm9yZUxpc3QsXG4gICAgQmVmb3JlU3RyZWFtLFxuICAgIEJlZm9yZVRodW1ibmFpbCxcbiAgICBCZWZvcmVHZXQsXG4gICAgQmVmb3JlQ291bnRcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcoYTogYW55KTogYSBpcyBTdHJpbmcge1xuICAgIHJldHVybiB0eXBlb2YgYSA9PT0gJ3N0cmluZyc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSG9va0Z1bmMge1xuICAgIChhc3NldDogQXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4sIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG50eXBlIGhvb2tfdHVwbGUgPSBbc3RyaW5nLCBIb29rRnVuY107XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWltZUZ1bmMge1xuICAgIChhc3NldDogQXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4pOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5pbnRlcmZhY2UgTWltZU1hcCB7XG4gICAgcjogUmVnRXhwO1xuICAgIGY6IE1pbWVGdW5jO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2V0c09wdGlvbnMge1xuICAgIG1ldGFTdG9yZT86IHN0cmluZyB8IElNZXRhU3RvcmU7XG4gICAgZmlsZVN0b3JlPzogc3RyaW5nIHwgSUZpbGVTdG9yZTtcbiAgICBmaWxlU3RvcmVPcHRpb25zPzogYW55O1xuICAgIG1ldGFTdG9yZU9wdGlvbnM/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRDcmVhdGVPcHRpb25zIHtcbiAgICBzaXplPzogbnVtYmVyO1xuICAgIG1pbWU/OiBzdHJpbmc7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICBoaWRkZW4/OiBib29sZWFuO1xuICAgIHNraXBNZXRhPzogYm9vbGVhbjtcbiAgICBtZXRhPzogeyBba2V5OiBzdHJpbmddOiBhbnkgfTtcbiAgICBwYXRoPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICBwcm90ZWN0ZWQgX21ldGFTdG9yZTogSU1ldGFTdG9yZTtcbiAgICBwdWJsaWMgZ2V0IG1ldGFTdG9yZSgpOiBJTWV0YVN0b3JlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21ldGFTdG9yZVxuICAgIH1cbiAgICBwcm90ZWN0ZWQgX2ZpbGVTdG9yZTogSUZpbGVTdG9yZTtcbiAgICBwdWJsaWMgZ2V0IGZpbGVTdG9yZSgpOiBJRmlsZVN0b3JlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVTdG9yZVxuICAgIH1cblxuICAgIHByb3RlY3RlZCB0aHVtYm5haWxlcjogVGh1bWJuYWlsZXI7XG5cbiAgICBwcml2YXRlIF9ob29rczogTWFwPEhvb2ssIGhvb2tfdHVwbGVbXT47XG4gICAgcHJpdmF0ZSBfbWltZUhhbmRsZXJzOiBNaW1lTWFwW107XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBBc3NldHNPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5faG9va3MgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycyA9IFtdO1xuXG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdvcHRpb25zJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9wdGlvbnMubWV0YVN0b3JlKSB7XG4gICAgICAgICAgICBvcHRpb25zLm1ldGFTdG9yZSA9ICdmaWxlJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMuZmlsZVN0b3JlKSB7XG4gICAgICAgICAgICBvcHRpb25zLmZpbGVTdG9yZSA9ICdmaWxlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtZXRhOiBJTWV0YVN0b3JlLCBmaWxlOiBJRmlsZVN0b3JlO1xuICAgICAgICBpZiAoaXNTdHJpbmcob3B0aW9ucy5tZXRhU3RvcmUpKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInVzaW5nIG1ldGEgc3RvcmU6ICVzXCIsIG9wdGlvbnMubWV0YVN0b3JlKTtcbiAgICAgICAgICAgIG1ldGEgPSBnZXRNZXRhU3RvcmUoPHN0cmluZz5vcHRpb25zLm1ldGFTdG9yZSwgb3B0aW9ucy5tZXRhU3RvcmVPcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1ldGEgPSA8SU1ldGFTdG9yZT5vcHRpb25zLm1ldGFTdG9yZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLmZpbGVTdG9yZSkpIHtcbiAgICAgICAgICAgIGRlYnVnKCd1c2luZyBmaWxlIHN0b3JlOiAlcycsIG9wdGlvbnMuZmlsZVN0b3JlKTtcbiAgICAgICAgICAgIGZpbGUgPSBnZXRGaWxlU3RvcmUoPHN0cmluZz5vcHRpb25zLmZpbGVTdG9yZSwgb3B0aW9ucy5maWxlU3RvcmVPcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGUgPSA8SUZpbGVTdG9yZT5vcHRpb25zLmZpbGVTdG9yZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbWV0YSB8fCAhZmlsZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gZmlsZSBvciBtZXRhIHN0b3JlXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGh1bWJuYWlsZXIgPSBuZXcgVGh1bWJuYWlsZXIoKTtcbiAgICAgICAgdGhpcy5fbWV0YVN0b3JlID0gbWV0YTtcbiAgICAgICAgdGhpcy5fZmlsZVN0b3JlID0gZmlsZTtcblxuICAgIH1cblxuICAgIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkW10+IHtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgdGhpcy5tZXRhU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgdGhpcy5maWxlU3RvcmUuaW5pdGlhbGl6ZSgpLFxuICAgICAgICAgICAgZ2VuZXJhdG9ycy5pbml0aWFsaXplKCksXG4gICAgICAgICAgICB0aGlzLnRodW1ibmFpbGVyLmluaXRpYWxpemUodGhpcylcbiAgICAgICAgXSk7XG5cbiAgICB9XG5cbiAgICBhc3luYyB0aHVtYm5haWwoYXNzZXQ6IEFzc2V0LCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxSZWFkYWJsZT4ge1xuICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlVGh1bWJuYWlsLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIGxldCBzdHJlYW0gPSBhd2FpdCB0aGlzLnRodW1ibmFpbGVyLnJlcXVlc3QoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgIH1cblxuICAgIGNhblRodW1ibmFpbChhc3NldDogQXNzZXQpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGh1bWJuYWlsZXIuY2FuVGh1bWJuYWlsKGFzc2V0Lm1pbWUpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgY3JlYXRlRnJvbVBhdGgocGF0aDogc3RyaW5nLCBkZXN0OiBzdHJpbmcsIG9wdGlvbnM6IEFzc2V0Q3JlYXRlT3B0aW9ucyA9IHsgc2tpcE1ldGE6IGZhbHNlIH0pIHtcblxuICAgICAgICBsZXQgc3RhdCA9IGF3YWl0IGdldEZpbGVTdGF0cyhwYXRoKTtcbiAgICAgICAgaWYgKCFzdGF0LmlzRmlsZSgpKSB0aHJvdyBuZXcgRXJyb3IoJ25vdCBhIGZpbGUnKTtcblxuICAgICAgICBsZXQgcmVhZGVyID0gZnMuY3JlYXRlUmVhZFN0cmVhbShwYXRoKTtcblxuICAgICAgICBvcHRpb25zLnNpemUgPSBzdGF0LnNpemU7XG4gICAgICAgIG9wdGlvbnMubWltZSA9IGdldE1pbWVUeXBlKHBhdGgpO1xuXG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZShyZWFkZXIsIGRlc3QsIG9wdGlvbnMpO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IGFzc2V0XG4gICAgICogXG4gICAgICogQHBhcmFtIHtSZWFkYWJsZX0gc3RyZWFtIEEgcmVhZGFibGUgc3RyZWFtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIGZ1bGwgZGVzdGluYXRpb24gcGF0aCAocGF0aCArIGZpbGVuYW1lKVxuICAgICAqIEBwYXJhbSB7QXNzZXRDcmVhdGVPcHRpb25zfSBbb3B0aW9ucz17IHNraXBNZXRhOiBmYWxzZSB9XSAoZGVzY3JpcHRpb24pXG4gICAgICogQHJldHVybnMge1Byb21pc2U8QXNzZXQ+fSAoZGVzY3JpcHRpb24pXG4gICAgICovXG4gICAgYXN5bmMgY3JlYXRlKHN0cmVhbTogUmVhZGFibGUsIHBhdGg6IHN0cmluZywgb3B0aW9uczogQXNzZXRDcmVhdGVPcHRpb25zID0geyBza2lwTWV0YTogZmFsc2UgfSk6IFByb21pc2U8QXNzZXQ+IHtcblxuICAgICAgICBsZXQgdG1wRmlsZTtcblxuICAgICAgICBjb25zdCBjbGVhbiA9ICgpID0+IHsgaWYgKHRtcEZpbGUpIGZzLnVubGluayh0bXBGaWxlKTsgfTtcblxuXG4gICAgICAgIGxldCBmaWxlbmFtZSA9IFBhdGguYmFzZW5hbWUocGF0aCk7XG4gICAgICAgIGZpbGVuYW1lID0gbm9ybWFsaXplRmlsZU5hbWUoZmlsZW5hbWUpO1xuXG5cbiAgICAgICAgLy8gSWYgbWltZSBvciBzaXplIGlzbnQgcHJvdmlkZWQsIHdlIGhhdmUgdG8gZ2V0IGl0XG4gICAgICAgIC8vIHRoZSBoYXJkIHdheVxuICAgICAgICBpZiAoKCFvcHRpb25zLm1pbWUgfHwgIW9wdGlvbnMuc2l6ZSkgfHwgKG9wdGlvbnMubWltZSA9PT0gXCJcIiB8fCBvcHRpb25zLnNpemUgPT09IDApKSB7XG4gICAgICAgICAgICBkZWJ1ZygnZ2V0dGluZyBtaW1lIGFuZCBzaXplIGZvciBhc3NldCcpXG4gICAgICAgICAgICB0bXBGaWxlID0gYXdhaXQgd3JpdGVUb1RlbXBGaWxlKHN0cmVhbSwgcGF0aCk7XG5cbiAgICAgICAgICAgIGxldCBzdGF0cyA9IGF3YWl0IGdldEZpbGVTdGF0cyh0bXBGaWxlKTtcbiAgICAgICAgICAgIGxldCBtaW1lID0gb3B0aW9ucy5taW1lO1xuICAgICAgICAgICAgaWYgKG1pbWUgPT0gbnVsbCB8fCBtaW1lID09IFwiXCIpIHtcbiAgICAgICAgICAgICAgIG1pbWUgPSBnZXRNaW1lVHlwZSh0bXBGaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAgIG9wdGlvbnMubWltZSA9IG1pbWU7XG4gICAgICAgICAgICBvcHRpb25zLnNpemUgPSBzdGF0cy5zaXplXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGlyUGF0aCA9IFBhdGguZGlybmFtZShwYXRoKTtcbiAgICAgICAgaWYgKG9wdGlvbnMucGF0aCkgZGlyUGF0aCA9IG9wdGlvbnMucGF0aDtcblxuXG4gICAgICAgIGxldCBhc3NldCA9IG5ldyBBc3NldCh7XG4gICAgICAgICAgICBuYW1lOiBvcHRpb25zLm5hbWUgfHwgZmlsZW5hbWUsXG4gICAgICAgICAgICBwYXRoOiBub3JtYWxpemVQYXRoKGRpclBhdGgpLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lLFxuICAgICAgICAgICAgbWltZTogb3B0aW9ucy5taW1lLFxuICAgICAgICAgICAgc2l6ZTogb3B0aW9ucy5zaXplLFxuICAgICAgICAgICAgaGlkZGVuOiBvcHRpb25zLmhpZGRlbixcbiAgICAgICAgICAgIG1ldGE6IG9wdGlvbnMubWV0YSB8fCB7fVxuICAgICAgICB9KTtcblxuXG4gICAgICAgIGNvbnN0IGNyZWF0ZUZuID0gYXN5bmMgKCk6IFByb21pc2U8UmVhZGFibGU+ID0+IHtcbiAgICAgICAgICAgIGlmICghdG1wRmlsZSkge1xuICAgICAgICAgICAgICAgIHRtcEZpbGUgPSBhd2FpdCB3cml0ZVRvVGVtcEZpbGUoc3RyZWFtLCBwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmcy5jcmVhdGVSZWFkU3RyZWFtKHRtcEZpbGUpO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgLy8gUnVuIGJlZm9yZSBjcmVhdGUgaG9vaywgXG4gICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVDcmVhdGUsIGFzc2V0LCBjcmVhdGVGbiwgb3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKHRtcEZpbGUpIHtcbiAgICAgICAgICAgIHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXNzZXQucGF0aFthc3NldC5wYXRoLmxlbmd0aCAtIDFdICE9PSAnLycpIGFzc2V0LnBhdGggKz0gJy8nO1xuXG5cbiAgICAgICAgYXdhaXQgdGhpcy5maWxlU3RvcmUuY3JlYXRlKGFzc2V0LCBzdHJlYW0sIG9wdGlvbnMpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9ydW5IYW5kbGVycyhhc3NldCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCBydW4gaGFuZGxlciBmb3IgXCIlc1wiLCBnb3QgZXJyb3I6ICVzJywgYXNzZXQubWltZSwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9wdGlvbnMuc2tpcE1ldGEpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5tZXRhU3RvcmUuY3JlYXRlKGFzc2V0LCBvcHRpb25zKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgIGNsZWFuKCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNsZWFuKCk7XG4gICAgICAgIGRlYnVnKCdjcmVhdGUgJWonLCBhc3NldCk7XG4gICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5DcmVhdGUsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcblxuICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgfVxuXG4gICAgLyoqIEdldCBhbiBhc3NldCBieSBpZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBUaGUgaWRcbiAgICAgKiBAcmV0dXJuIFByb21pc2U8QXNzZXQ+XG4gICAgICovXG4gICAgYXN5bmMgZ2V0QnlJZChpZDogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxBc3NldD4ge1xuICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLm1ldGFTdG9yZS5nZXQoaWQsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgIGlmICghKGFzc2V0IGluc3RhbmNlb2YgQXNzZXQpKSBhc3NldCA9IG5ldyBBc3NldChhc3NldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDxBc3NldD5hc3NldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gYXNzZXQgYnkgZnVsbCBwYXRoXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIGZ1bGwgcGF0aCB0byB0aGUgZmlsZVxuICAgICAqIEByZXR1cm4gUHJvbWlzZTxBc3NldD5cbiAgICAgKi9cbiAgICBnZXRCeVBhdGgocGF0aDogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxBc3NldD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRhU3RvcmUuZ2V0QnlQYXRoKHBhdGgsIG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihhc3NldCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKGFzc2V0IGluc3RhbmNlb2YgQXNzZXQpKSBhc3NldCA9IG5ldyBBc3NldChhc3NldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIFxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgZ2l2ZW4gcGF0aCBleGlzdHNcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBwYXRoIHRvIHRoZSBhc3NldCAocGF0aC90by9maWxlbmFtZS5leHQpXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gKGRlc2NyaXB0aW9uKVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fSAoZGVzY3JpcHRpb24pXG4gICAgICovXG4gICAgaGFzKHBhdGg6IHN0cmluZywgb3B0aW9ucz86IGFueSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRCeVBhdGgocGF0aCwgb3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGEgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBhICE9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5KHRlcm06IHN0cmluZywgb3B0aW9ucz86IElGaW5kT3B0aW9ucyk6IFByb21pc2U8QXNzZXRbXT4ge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCA8YW55Pnt9O1xuICAgICAgICBvcHRpb25zLnBhdGggPSB0ZXJtO1xuXG4gICAgICAgIHJldHVybiAoYXdhaXQgdGhpcy5tZXRhU3RvcmUuZmluZChvcHRpb25zKSkubWFwKGEgPT4ge1xuICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBBc3NldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBBc3NldChhKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIGFzeW5jIHJlbW92ZShhc3NldDogQXNzZXQsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBpZiAoKGF3YWl0IHRoaXMuZ2V0QnlJZChhc3NldC5pZCwgb3B0aW9ucykpID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVSZW1vdmUsIGFzc2V0LCBvcHRpb25zKVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgIGF3YWl0IHRoaXMubWV0YVN0b3JlLnJlbW92ZShhc3NldCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLlJlbW92ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpXG5cbiAgICB9XG5cbiAgICBhc3luYyBsaXN0KG9wdGlvbnM/OiBJTGlzdE9wdGlvbnMpOiBQcm9taXNlPEFzc2V0W10+IHtcblxuICAgICAgICBhd2FpdCB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlTGlzdCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG5cbiAgICAgICAgbGV0IGluZm9zID0gYXdhaXQgdGhpcy5tZXRhU3RvcmUubGlzdChvcHRpb25zKTtcblxuICAgICAgICBpZiAoIWluZm9zLmxlbmd0aCkgcmV0dXJuIDxBc3NldFtdPmluZm9zO1xuXG4gICAgICAgIHJldHVybiBpbmZvcy5tYXAobSA9PiB7XG4gICAgICAgICAgICBpZiAoIShtIGluc3RhbmNlb2YgQXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBc3NldChtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiA8QXNzZXQ+bTtcbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIGFzeW5jIHN0cmVhbShhc3NldDogQXNzZXQsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVTdHJlYW0sIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZmlsZVN0b3JlLnN0cmVhbShhc3NldCk7XG4gICAgfVxuXG4gICAgYXN5bmMgY291bnQob3B0aW9ucz86IElGaW5kT3B0aW9ucyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVDb3VudCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1ldGFTdG9yZS5jb3VudChvcHRpb25zKTtcbiAgICB9XG5cbiAgICB1c2UobWltZTogc3RyaW5nIHwgTWltZUZ1bmMsIGZuPzogTWltZUZ1bmMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtaW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBmbiA9IDxNaW1lRnVuYz5taW1lO1xuICAgICAgICAgICAgbWltZSA9ICcuKic7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9taW1lSGFuZGxlcnMucHVzaCh7XG4gICAgICAgICAgICByOiBuZXcgUmVnRXhwKDxzdHJpbmc+bWltZSwgJ2knKSxcbiAgICAgICAgICAgIGY6IGZuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZ2lzdGVySG9vayhob29rOiBIb29rLCBmbjogSG9va0Z1bmMpOiBzdHJpbmcge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSkge1xuICAgICAgICAgICAgdGhpcy5faG9va3Muc2V0KGhvb2ssIFtdKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWQgPSBnZXRJZCgpO1xuICAgICAgICB0aGlzLl9ob29rcy5nZXQoaG9vaykucHVzaChbaWQsIGZuXSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICB1bnJlZ2lzdGVyKGhvb2s6IEhvb2ssIGZuOiBIb29rRnVuYyB8IHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMuX2hvb2tzLmhhcyhob29rKSkgcmV0dXJuO1xuXG4gICAgICAgIGxldCBob29rcyA9IHRoaXMuX2hvb2tzLmdldChob29rKVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGhvb2tzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChob29rc1tpXVswXSA9PT0gZm4gfHwgaG9va3NbaV1bMV0gPT09IGZuKSB7XG4gICAgICAgICAgICAgICAgaG9va3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ydW5Ib29rKGhvb2s6IEhvb2ssIGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPiwgb3B0aW9ucz86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgaG9va3M6IGhvb2tfdHVwbGVbXSA9IHRoaXMuX2hvb2tzLmdldChob29rKTtcbiAgICAgICAgaWYgKCFob29rcykgcmV0dXJuO1xuICAgICAgICBkZWJ1ZyhcInJ1biBob29rICVzICglZClcIiwgSG9va1tob29rXSwgaG9va3MubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gaG9va3MubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZGVidWcoXCJydW4gaG9vayBpZCAlc1wiLCBob29rc1tpXVswXSk7XG4gICAgICAgICAgICBhd2FpdCBob29rc1tpXVsxXShhc3NldCwgZm4sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfcnVuSGFuZGxlcnMoYXNzZXQ6IEFzc2V0LCBmbj86ICgpID0+IFByb21pc2U8UmVhZGFibGU+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IHRoaXMuX21pbWVIYW5kbGVycy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWltZUhhbmRsZXJzW2ldLnIudGVzdChhc3NldC5taW1lKSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX21pbWVIYW5kbGVyc1tpXS5mKGFzc2V0LCBmbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
