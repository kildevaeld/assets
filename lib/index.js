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
//# sourceMappingURL=data:application/json;base64,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TSxDQUFOLEVBQVMsQ0FBVCxFQUFZLEtBQVosRUFBbUIsRUFBbkIsRUFBdUIsT0FBdkIsQ0FBTixDQUY0QztpQkFBaEQ7YUR2RndDLENBQXhDLENDbUZ3Rjs7OztxQ0FVakUsT0FBYyxJQUE0QjtBRGpGakUsbUJBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7QUNrRnJELHFCQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxLQUFLLGFBQUwsQ0FBbUIsTUFBbkIsRUFBMkIsSUFBSSxFQUFKLEVBQVEsR0FBeEQsRUFBNkQ7QUFDekQsd0JBQUksS0FBSyxhQUFMLENBQW1CLENBQW5CLEVBQXNCLENBQXRCLENBQXdCLElBQXhCLENBQTZCLE1BQU0sSUFBTixDQUFqQyxFQUE4QztBQUMxQyw4QkFBTSxLQUFLLGFBQUwsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsQ0FBd0IsS0FBeEIsRUFBK0IsRUFBL0IsQ0FBTixDQUQwQztxQkFBOUM7aUJBREo7YURsRndDLENBQXhDLENDaUZpRTs7Ozs0QkF0VWpEO0FBQ2hCLG1CQUFPLEtBQUssVUFBTCxDQURTOzs7OzRCQUlBO0FBQ2hCLG1CQUFPLEtBQUssVUFBTCxDQURTOzs7O1dBTnhCO0VBQTRCLFNBQUEsWUFBQTs7QUFBZixRQUFBLE1BQUEsR0FBTSxNQUFOIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvbWFpbi5kLnRzXCIgLz5cblwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgZXZlbnRzXzEgPSByZXF1aXJlKCdldmVudHMnKTtcbmNvbnN0IHJlcG9zaXRvcnlfMSA9IHJlcXVpcmUoJy4vcmVwb3NpdG9yeScpO1xuY29uc3QgdGh1bWJuYWlsZXJfMSA9IHJlcXVpcmUoJy4vdGh1bWJuYWlsZXInKTtcbmNvbnN0IGFzc2V0XzEgPSByZXF1aXJlKCcuL2Fzc2V0Jyk7XG5jb25zdCB1dGlsc18xID0gcmVxdWlyZSgnLi91dGlscycpO1xuY29uc3QgZ2VuZXJhdG9ycyA9IHJlcXVpcmUoJy4vZ2VuZXJhdG9ycy9pbmRleCcpO1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IERlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0cycpO1xudmFyIGlkQ291bnRlciA9IDA7XG5mdW5jdGlvbiBnZXRJZCgpIHtcbiAgICByZXR1cm4gKytpZENvdW50ZXIgKyBcIlwiO1xufVxuKGZ1bmN0aW9uIChIb29rKSB7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlQ3JlYXRlXCJdID0gMF0gPSBcIkJlZm9yZUNyZWF0ZVwiO1xuICAgIEhvb2tbSG9va1tcIkNyZWF0ZVwiXSA9IDFdID0gXCJDcmVhdGVcIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVSZW1vdmVcIl0gPSAyXSA9IFwiQmVmb3JlUmVtb3ZlXCI7XG4gICAgSG9va1tIb29rW1wiUmVtb3ZlXCJdID0gM10gPSBcIlJlbW92ZVwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZUxpc3RcIl0gPSA0XSA9IFwiQmVmb3JlTGlzdFwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZVN0cmVhbVwiXSA9IDVdID0gXCJCZWZvcmVTdHJlYW1cIjtcbiAgICBIb29rW0hvb2tbXCJCZWZvcmVUaHVtYm5haWxcIl0gPSA2XSA9IFwiQmVmb3JlVGh1bWJuYWlsXCI7XG4gICAgSG9va1tIb29rW1wiQmVmb3JlR2V0XCJdID0gN10gPSBcIkJlZm9yZUdldFwiO1xuICAgIEhvb2tbSG9va1tcIkJlZm9yZUNvdW50XCJdID0gOF0gPSBcIkJlZm9yZUNvdW50XCI7XG59KShleHBvcnRzLkhvb2sgfHwgKGV4cG9ydHMuSG9vayA9IHt9KSk7XG52YXIgSG9vayA9IGV4cG9ydHMuSG9vaztcbmZ1bmN0aW9uIGlzU3RyaW5nKGEpIHtcbiAgICByZXR1cm4gdHlwZW9mIGEgPT09ICdzdHJpbmcnO1xufVxuY2xhc3MgQXNzZXRzIGV4dGVuZHMgZXZlbnRzXzEuRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuX2hvb2tzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9taW1lSGFuZGxlcnMgPSBbXTtcbiAgICAgICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMubWV0YVN0b3JlKSB7XG4gICAgICAgICAgICBvcHRpb25zLm1ldGFTdG9yZSA9ICdmaWxlJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMuZmlsZVN0b3JlKSB7XG4gICAgICAgICAgICBvcHRpb25zLmZpbGVTdG9yZSA9ICdmaWxlJztcbiAgICAgICAgfVxuICAgICAgICBsZXQgbWV0YSwgZmlsZTtcbiAgICAgICAgaWYgKGlzU3RyaW5nKG9wdGlvbnMubWV0YVN0b3JlKSkge1xuICAgICAgICAgICAgbWV0YSA9IHJlcG9zaXRvcnlfMS5nZXRNZXRhU3RvcmUob3B0aW9ucy5tZXRhU3RvcmUsIG9wdGlvbnMubWV0YVN0b3JlT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBtZXRhID0gb3B0aW9ucy5tZXRhU3RvcmU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzU3RyaW5nKG9wdGlvbnMuZmlsZVN0b3JlKSkge1xuICAgICAgICAgICAgZmlsZSA9IHJlcG9zaXRvcnlfMS5nZXRGaWxlU3RvcmUob3B0aW9ucy5maWxlU3RvcmUsIG9wdGlvbnMuZmlsZVN0b3JlT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmaWxlID0gb3B0aW9ucy5maWxlU3RvcmU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtZXRhIHx8ICFmaWxlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBmaWxlIG9yIG1ldGEgc3RvcmVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aHVtYm5haWxlciA9IG5ldyB0aHVtYm5haWxlcl8xLlRodW1ibmFpbGVyKCk7XG4gICAgICAgIHRoaXMuX21ldGFTdG9yZSA9IG1ldGE7XG4gICAgICAgIHRoaXMuX2ZpbGVTdG9yZSA9IGZpbGU7XG4gICAgfVxuICAgIGdldCBtZXRhU3RvcmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tZXRhU3RvcmU7XG4gICAgfVxuICAgIGdldCBmaWxlU3RvcmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlU3RvcmU7XG4gICAgfVxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLm1ldGFTdG9yZS5pbml0aWFsaXplKCksXG4gICAgICAgICAgICB0aGlzLmZpbGVTdG9yZS5pbml0aWFsaXplKCksXG4gICAgICAgICAgICBnZW5lcmF0b3JzLmluaXRpYWxpemUoKSxcbiAgICAgICAgICAgIHRoaXMudGh1bWJuYWlsZXIuaW5pdGlhbGl6ZSh0aGlzKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgdGh1bWJuYWlsKGFzc2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVRodW1ibmFpbCwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgbGV0IHN0cmVhbSA9IHlpZWxkIHRoaXMudGh1bWJuYWlsZXIucmVxdWVzdChhc3NldCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY2FuVGh1bWJuYWlsKGFzc2V0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRodW1ibmFpbGVyLmNhblRodW1ibmFpbChhc3NldC5taW1lKTtcbiAgICB9XG4gICAgY3JlYXRlRnJvbVBhdGgocGF0aCwgZGVzdCwgb3B0aW9ucyA9IHsgc2tpcE1ldGE6IGZhbHNlIH0pIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBzdGF0ID0geWllbGQgdXRpbHNfMS5nZXRGaWxlU3RhdHMocGF0aCk7XG4gICAgICAgICAgICBpZiAoIXN0YXQuaXNGaWxlKCkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgYSBmaWxlJyk7XG4gICAgICAgICAgICBsZXQgcmVhZGVyID0gZnMuY3JlYXRlUmVhZFN0cmVhbShwYXRoKTtcbiAgICAgICAgICAgIG9wdGlvbnMuc2l6ZSA9IHN0YXQuc2l6ZTtcbiAgICAgICAgICAgIG9wdGlvbnMubWltZSA9IHV0aWxzXzEuZ2V0TWltZVR5cGUocGF0aCk7XG4gICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5jcmVhdGUocmVhZGVyLCBkZXN0LCBvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBhc3NldFxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWFkYWJsZX0gc3RyZWFtIEEgcmVhZGFibGUgc3RyZWFtXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggVGhlIGZ1bGwgZGVzdGluYXRpb24gcGF0aCAocGF0aCArIGZpbGVuYW1lKVxuICAgICAqIEBwYXJhbSB7QXNzZXRDcmVhdGVPcHRpb25zfSBbb3B0aW9ucz17IHNraXBNZXRhOiBmYWxzZSB9XSAoZGVzY3JpcHRpb24pXG4gICAgICogQHJldHVybnMge1Byb21pc2U8QXNzZXQ+fSAoZGVzY3JpcHRpb24pXG4gICAgICovXG4gICAgY3JlYXRlKHN0cmVhbSwgcGF0aCwgb3B0aW9ucyA9IHsgc2tpcE1ldGE6IGZhbHNlIH0pIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgdG1wRmlsZTtcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuID0gKCkgPT4geyBpZiAodG1wRmlsZSlcbiAgICAgICAgICAgICAgICBmcy51bmxpbmsodG1wRmlsZSk7IH07XG4gICAgICAgICAgICBsZXQgZmlsZW5hbWUgPSBQYXRoLmJhc2VuYW1lKHBhdGgpO1xuICAgICAgICAgICAgZmlsZW5hbWUgPSB1dGlsc18xLm5vcm1hbGl6ZUZpbGVOYW1lKGZpbGVuYW1lKTtcbiAgICAgICAgICAgIC8vIElmIG1pbWUgb3Igc2l6ZSBpc250IHByb3ZpZGVkLCB3ZSBoYXZlIHRvIGdldCBpdFxuICAgICAgICAgICAgLy8gdGhlIGhhcmQgd2F5XG4gICAgICAgICAgICBpZiAoKCFvcHRpb25zLm1pbWUgfHwgIW9wdGlvbnMuc2l6ZSkgfHwgKG9wdGlvbnMubWltZSA9PT0gXCJcIiB8fCBvcHRpb25zLnNpemUgPT09IDApKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoJ2dldHRpbmcgbWltZSBhbmQgc2l6ZSBmb3IgYXNzZXQnKTtcbiAgICAgICAgICAgICAgICB0bXBGaWxlID0geWllbGQgdXRpbHNfMS53cml0ZVRvVGVtcEZpbGUoc3RyZWFtLCBwYXRoKTtcbiAgICAgICAgICAgICAgICBsZXQgc3RhdHMgPSB5aWVsZCB1dGlsc18xLmdldEZpbGVTdGF0cyh0bXBGaWxlKTtcbiAgICAgICAgICAgICAgICBsZXQgbWltZSA9IHV0aWxzXzEuZ2V0TWltZVR5cGUodG1wRmlsZSk7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5taW1lID0gbWltZTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnNpemUgPSBzdGF0cy5zaXplO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGRpclBhdGggPSBQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5wYXRoKVxuICAgICAgICAgICAgICAgIGRpclBhdGggPSBvcHRpb25zLnBhdGg7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSBuZXcgYXNzZXRfMS5Bc3NldCh7XG4gICAgICAgICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lIHx8IGZpbGVuYW1lLFxuICAgICAgICAgICAgICAgIHBhdGg6IHV0aWxzXzEubm9ybWFsaXplUGF0aChkaXJQYXRoKSxcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXG4gICAgICAgICAgICAgICAgbWltZTogb3B0aW9ucy5taW1lLFxuICAgICAgICAgICAgICAgIHNpemU6IG9wdGlvbnMuc2l6ZSxcbiAgICAgICAgICAgICAgICBoaWRkZW46IG9wdGlvbnMuaGlkZGVuLFxuICAgICAgICAgICAgICAgIG1ldGE6IG9wdGlvbnMubWV0YSB8fCB7fVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVGbiA9ICgpID0+IF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0bXBGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRtcEZpbGUgPSB5aWVsZCB1dGlsc18xLndyaXRlVG9UZW1wRmlsZShzdHJlYW0sIHBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gUnVuIGJlZm9yZSBjcmVhdGUgaG9vaywgXG4gICAgICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlQ3JlYXRlLCBhc3NldCwgY3JlYXRlRm4sIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKHRtcEZpbGUpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHRtcEZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFzc2V0LnBhdGhbYXNzZXQucGF0aC5sZW5ndGggLSAxXSAhPT0gJy8nKVxuICAgICAgICAgICAgICAgIGFzc2V0LnBhdGggKz0gJy8nO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5maWxlU3RvcmUuY3JlYXRlKGFzc2V0LCBzdHJlYW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9ydW5IYW5kbGVycyhhc3NldCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdHJlYW0oYXNzZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IHJ1biBoYW5kbGVyIGZvciBcIiVzXCIsIGdvdCBlcnJvcjogJXMnLCBhc3NldC5taW1lLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5za2lwTWV0YSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMubWV0YVN0b3JlLmNyZWF0ZShhc3NldCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFuKCk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgICAgIGRlYnVnKCdjcmVhdGUgJWonLCBhc3NldCk7XG4gICAgICAgICAgICB0aGlzLl9ydW5Ib29rKEhvb2suQ3JlYXRlLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKiogR2V0IGFuIGFzc2V0IGJ5IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBpZFxuICAgICAqIEByZXR1cm4gUHJvbWlzZTxBc3NldD5cbiAgICAgKi9cbiAgICBnZXRCeUlkKGlkLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5tZXRhU3RvcmUuZ2V0KGlkLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgICAgIGlmICghKGFzc2V0IGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkpXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0ID0gbmV3IGFzc2V0XzEuQXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IGFuIGFzc2V0IGJ5IGZ1bGwgcGF0aFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFRoZSBmdWxsIHBhdGggdG8gdGhlIGZpbGVcbiAgICAgKiBAcmV0dXJuIFByb21pc2U8QXNzZXQ+XG4gICAgICovXG4gICAgZ2V0QnlQYXRoKHBhdGgsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWV0YVN0b3JlLmdldEJ5UGF0aChwYXRoLCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oYXNzZXQgPT4ge1xuICAgICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXNzZXQgaW5zdGFuY2VvZiBhc3NldF8xLkFzc2V0KSlcbiAgICAgICAgICAgICAgICAgICAgYXNzZXQgPSBuZXcgYXNzZXRfMS5Bc3NldChhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBhIGdpdmVuIHBhdGggZXhpc3RzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBwYXRoIHRvIHRoZSBhc3NldCAocGF0aC90by9maWxlbmFtZS5leHQpXG4gICAgICogQHBhcmFtIHsqfSBbb3B0aW9uc10gKGRlc2NyaXB0aW9uKVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPGJvb2xlYW4+fSAoZGVzY3JpcHRpb24pXG4gICAgICovXG4gICAgaGFzKHBhdGgsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QnlQYXRoKHBhdGgsIG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihhID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhICE9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBxdWVyeSh0ZXJtLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBvcHRpb25zLnBhdGggPSB0ZXJtO1xuICAgICAgICAgICAgcmV0dXJuICh5aWVsZCB0aGlzLm1ldGFTdG9yZS5maW5kKG9wdGlvbnMpKS5tYXAoYSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBhc3NldF8xLkFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGFzc2V0XzEuQXNzZXQoYSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZShhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmICgoeWllbGQgdGhpcy5nZXRCeUlkKGFzc2V0LmlkLCBvcHRpb25zKSkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVJlbW92ZSwgYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5maWxlU3RvcmUucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMubWV0YVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9ydW5Ib29rKEhvb2suUmVtb3ZlLCBhc3NldCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsaXN0KG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9ydW5Ib29rKEhvb2suQmVmb3JlTGlzdCwgbnVsbCwgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBsZXQgaW5mb3MgPSB5aWVsZCB0aGlzLm1ldGFTdG9yZS5saXN0KG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFpbmZvcy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZm9zO1xuICAgICAgICAgICAgcmV0dXJuIGluZm9zLm1hcChtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIShtIGluc3RhbmNlb2YgYXNzZXRfMS5Bc3NldCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBhc3NldF8xLkFzc2V0KG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgc3RyZWFtKGFzc2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVN0cmVhbSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuZmlsZVN0b3JlLnN0cmVhbShhc3NldCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb3VudChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNvdW50LCBudWxsLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLm1ldGFTdG9yZS5jb3VudChvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHVzZShtaW1lLCBmbikge1xuICAgICAgICBpZiAodHlwZW9mIG1pbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGZuID0gbWltZTtcbiAgICAgICAgICAgIG1pbWUgPSAnLionO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHI6IG5ldyBSZWdFeHAobWltZSwgJ2knKSxcbiAgICAgICAgICAgIGY6IGZuXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVnaXN0ZXJIb29rKGhvb2ssIGZuKSB7XG4gICAgICAgIGlmICghdGhpcy5faG9va3MuaGFzKGhvb2spKSB7XG4gICAgICAgICAgICB0aGlzLl9ob29rcy5zZXQoaG9vaywgW10pO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpZCA9IGdldElkKCk7XG4gICAgICAgIHRoaXMuX2hvb2tzLmdldChob29rKS5wdXNoKFtpZCwgZm5dKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbiAgICB1bnJlZ2lzdGVyKGhvb2ssIGZuKSB7XG4gICAgICAgIGlmICghdGhpcy5faG9va3MuaGFzKGhvb2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgaG9va3MgPSB0aGlzLl9ob29rcy5nZXQoaG9vayk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGhvb2tzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChob29rc1tpXVswXSA9PT0gZm4gfHwgaG9va3NbaV1bMV0gPT09IGZuKSB7XG4gICAgICAgICAgICAgICAgaG9va3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9ydW5Ib29rKGhvb2ssIGFzc2V0LCBmbiwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBob29rcyA9IHRoaXMuX2hvb2tzLmdldChob29rKTtcbiAgICAgICAgICAgIGlmICghaG9va3MpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgZGVidWcoXCJydW4gaG9vayAlcyAoJWQpXCIsIEhvb2tbaG9va10sIGhvb2tzLmxlbmd0aCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoXCJydW4gaG9vayBpZCAlc1wiLCBob29rc1tpXVswXSk7XG4gICAgICAgICAgICAgICAgeWllbGQgaG9va3NbaV1bMV0oYXNzZXQsIGZuLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9ydW5IYW5kbGVycyhhc3NldCwgZm4pIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSB0aGlzLl9taW1lSGFuZGxlcnMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9taW1lSGFuZGxlcnNbaV0uci50ZXN0KGFzc2V0Lm1pbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuX21pbWVIYW5kbGVyc1tpXS5mKGFzc2V0LCBmbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0cyA9IEFzc2V0cztcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL21haW4uZC50c1wiIC8+XG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHtSZWFkYWJsZX0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7Z2V0RmlsZVN0b3JlLCBnZXRNZXRhU3RvcmV9IGZyb20gJy4vcmVwb3NpdG9yeSc7XG5pbXBvcnQge0lGaWxlLCBJTWV0YVN0b3JlLCBJRmlsZVN0b3JlLCBJTGlzdE9wdGlvbnMsIElGaW5kT3B0aW9uc30gZnJvbSAnLi9pbnRlcmZhY2UnO1xuaW1wb3J0IHtUaHVtYm5haWxlcn0gZnJvbSAnLi90aHVtYm5haWxlcic7XG5pbXBvcnQge0Fzc2V0fSBmcm9tICcuL2Fzc2V0JztcbmltcG9ydCB7cmFuZG9tTmFtZSwgZ2V0RmlsZVN0YXRzLCBnZXRNaW1lVHlwZSwgd3JpdGVTdHJlYW0sIG5vcm1hbGl6ZUZpbGVOYW1lLCBub3JtYWxpemVQYXRoLCB3cml0ZVRvVGVtcEZpbGV9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0ICogYXMgZ2VuZXJhdG9ycyBmcm9tICcuL2dlbmVyYXRvcnMvaW5kZXgnO1xuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzJyk7XG5cbnZhciBpZENvdW50ZXIgPSAwO1xuZnVuY3Rpb24gZ2V0SWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKytpZENvdW50ZXIgKyBcIlwiO1xufVxuXG5leHBvcnQgZW51bSBIb29rIHtcbiAgICBCZWZvcmVDcmVhdGUsXG4gICAgQ3JlYXRlLFxuICAgIEJlZm9yZVJlbW92ZSxcbiAgICBSZW1vdmUsXG4gICAgQmVmb3JlTGlzdCxcbiAgICBCZWZvcmVTdHJlYW0sXG4gICAgQmVmb3JlVGh1bWJuYWlsLFxuICAgIEJlZm9yZUdldCxcbiAgICBCZWZvcmVDb3VudFxufVxuXG5mdW5jdGlvbiBpc1N0cmluZyhhOiBhbnkpOiBhIGlzIFN0cmluZyB7XG4gICAgcmV0dXJuIHR5cGVvZiBhID09PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb29rRnVuYyB7XG4gICAgKGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPiwgb3B0aW9ucz86IGFueSk6IFByb21pc2U8dm9pZD47XG59XG5cbnR5cGUgaG9va190dXBsZSA9IFtzdHJpbmcsIEhvb2tGdW5jXTtcblxuZXhwb3J0IGludGVyZmFjZSBNaW1lRnVuYyB7XG4gICAgKGFzc2V0OiBBc3NldCwgZm4/OiAoKSA9PiBQcm9taXNlPFJlYWRhYmxlPik6IFByb21pc2U8dm9pZD47XG59XG5cbmludGVyZmFjZSBNaW1lTWFwIHtcbiAgICByOiBSZWdFeHA7XG4gICAgZjogTWltZUZ1bmM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRzT3B0aW9ucyB7XG4gICAgbWV0YVN0b3JlPzogc3RyaW5nIHwgSU1ldGFTdG9yZTtcbiAgICBmaWxlU3RvcmU/OiBzdHJpbmcgfCBJRmlsZVN0b3JlO1xuICAgIGZpbGVTdG9yZU9wdGlvbnM/OiBhbnk7XG4gICAgbWV0YVN0b3JlT3B0aW9ucz86IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBc3NldENyZWF0ZU9wdGlvbnMge1xuICAgIHNpemU/OiBudW1iZXI7XG4gICAgbWltZT86IHN0cmluZztcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIGhpZGRlbj86IGJvb2xlYW47XG4gICAgc2tpcE1ldGE/OiBib29sZWFuO1xuICAgIG1ldGE/OiB7IFtrZXk6IHN0cmluZ106IGFueSB9O1xuICAgIHBhdGg/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldHMgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIHByb3RlY3RlZCBfbWV0YVN0b3JlOiBJTWV0YVN0b3JlO1xuICAgIHB1YmxpYyBnZXQgbWV0YVN0b3JlKCk6IElNZXRhU3RvcmUge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWV0YVN0b3JlXG4gICAgfVxuICAgIHByb3RlY3RlZCBfZmlsZVN0b3JlOiBJRmlsZVN0b3JlO1xuICAgIHB1YmxpYyBnZXQgZmlsZVN0b3JlKCk6IElGaWxlU3RvcmUge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZVN0b3JlXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHRodW1ibmFpbGVyOiBUaHVtYm5haWxlcjtcblxuICAgIHByaXZhdGUgX2hvb2tzOiBNYXA8SG9vaywgaG9va190dXBsZVtdPjtcbiAgICBwcml2YXRlIF9taW1lSGFuZGxlcnM6IE1pbWVNYXBbXTtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEFzc2V0c09wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9ob29rcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fbWltZUhhbmRsZXJzID0gW107XG5cbiAgICAgICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ29wdGlvbnMnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb3B0aW9ucy5tZXRhU3RvcmUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMubWV0YVN0b3JlID0gJ2ZpbGUnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5maWxlU3RvcmUpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZmlsZVN0b3JlID0gJ2ZpbGUnO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG1ldGE6IElNZXRhU3RvcmUsIGZpbGU6IElGaWxlU3RvcmU7XG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLm1ldGFTdG9yZSkpIHtcbiAgICAgICAgICAgIG1ldGEgPSBnZXRNZXRhU3RvcmUoPHN0cmluZz5vcHRpb25zLm1ldGFTdG9yZSwgb3B0aW9ucy5tZXRhU3RvcmVPcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1ldGEgPSA8SU1ldGFTdG9yZT5vcHRpb25zLm1ldGFTdG9yZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1N0cmluZyhvcHRpb25zLmZpbGVTdG9yZSkpIHtcbiAgICAgICAgICAgIGZpbGUgPSBnZXRGaWxlU3RvcmUoPHN0cmluZz5vcHRpb25zLmZpbGVTdG9yZSwgb3B0aW9ucy5maWxlU3RvcmVPcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGUgPSA8SUZpbGVTdG9yZT5vcHRpb25zLmZpbGVTdG9yZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbWV0YSB8fCAhZmlsZSkge1xuXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBmaWxlIG9yIG1ldGEgc3RvcmVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aHVtYm5haWxlciA9IG5ldyBUaHVtYm5haWxlcigpO1xuICAgICAgICB0aGlzLl9tZXRhU3RvcmUgPSBtZXRhO1xuICAgICAgICB0aGlzLl9maWxlU3RvcmUgPSBmaWxlO1xuXG4gICAgfVxuXG4gICAgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWRbXT4ge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICB0aGlzLm1ldGFTdG9yZS5pbml0aWFsaXplKCksXG4gICAgICAgICAgICB0aGlzLmZpbGVTdG9yZS5pbml0aWFsaXplKCksXG4gICAgICAgICAgICBnZW5lcmF0b3JzLmluaXRpYWxpemUoKSxcbiAgICAgICAgICAgIHRoaXMudGh1bWJuYWlsZXIuaW5pdGlhbGl6ZSh0aGlzKVxuICAgICAgICBdKTtcblxuICAgIH1cblxuICAgIGFzeW5jIHRodW1ibmFpbChhc3NldDogQXNzZXQsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVUaHVtYm5haWwsIGFzc2V0LCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgbGV0IHN0cmVhbSA9IGF3YWl0IHRoaXMudGh1bWJuYWlsZXIucmVxdWVzdChhc3NldCwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgfVxuXG4gICAgY2FuVGh1bWJuYWlsKGFzc2V0OiBBc3NldCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy50aHVtYm5haWxlci5jYW5UaHVtYm5haWwoYXNzZXQubWltZSk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBjcmVhdGVGcm9tUGF0aChwYXRoOiBzdHJpbmcsIGRlc3Q6IHN0cmluZywgb3B0aW9uczogQXNzZXRDcmVhdGVPcHRpb25zID0geyBza2lwTWV0YTogZmFsc2UgfSkge1xuXG4gICAgICAgIGxldCBzdGF0ID0gYXdhaXQgZ2V0RmlsZVN0YXRzKHBhdGgpO1xuICAgICAgICBpZiAoIXN0YXQuaXNGaWxlKCkpIHRocm93IG5ldyBFcnJvcignbm90IGEgZmlsZScpO1xuXG4gICAgICAgIGxldCByZWFkZXIgPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHBhdGgpO1xuXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHN0YXQuc2l6ZTtcbiAgICAgICAgb3B0aW9ucy5taW1lID0gZ2V0TWltZVR5cGUocGF0aCk7XG5cbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlKHJlYWRlciwgZGVzdCwgb3B0aW9ucyk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgYXNzZXRcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1JlYWRhYmxlfSBzdHJlYW0gQSByZWFkYWJsZSBzdHJlYW1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBkZXN0aW5hdGlvbiBwYXRoIChwYXRoICsgZmlsZW5hbWUpXG4gICAgICogQHBhcmFtIHtBc3NldENyZWF0ZU9wdGlvbnN9IFtvcHRpb25zPXsgc2tpcE1ldGE6IGZhbHNlIH1dIChkZXNjcmlwdGlvbilcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBc3NldD59IChkZXNjcmlwdGlvbilcbiAgICAgKi9cbiAgICBhc3luYyBjcmVhdGUoc3RyZWFtOiBSZWFkYWJsZSwgcGF0aDogc3RyaW5nLCBvcHRpb25zOiBBc3NldENyZWF0ZU9wdGlvbnMgPSB7IHNraXBNZXRhOiBmYWxzZSB9KTogUHJvbWlzZTxBc3NldD4ge1xuXG4gICAgICAgIGxldCB0bXBGaWxlO1xuXG4gICAgICAgIGNvbnN0IGNsZWFuID0gKCkgPT4geyBpZiAodG1wRmlsZSkgZnMudW5saW5rKHRtcEZpbGUpOyB9O1xuXG5cbiAgICAgICAgbGV0IGZpbGVuYW1lID0gUGF0aC5iYXNlbmFtZShwYXRoKTtcbiAgICAgICAgZmlsZW5hbWUgPSBub3JtYWxpemVGaWxlTmFtZShmaWxlbmFtZSk7XG5cblxuICAgICAgICAvLyBJZiBtaW1lIG9yIHNpemUgaXNudCBwcm92aWRlZCwgd2UgaGF2ZSB0byBnZXQgaXRcbiAgICAgICAgLy8gdGhlIGhhcmQgd2F5XG4gICAgICAgIGlmICgoIW9wdGlvbnMubWltZSB8fCAhb3B0aW9ucy5zaXplKSB8fCAob3B0aW9ucy5taW1lID09PSBcIlwiIHx8IG9wdGlvbnMuc2l6ZSA9PT0gMCkpIHtcbiAgICAgICAgICAgIGRlYnVnKCdnZXR0aW5nIG1pbWUgYW5kIHNpemUgZm9yIGFzc2V0JylcbiAgICAgICAgICAgIHRtcEZpbGUgPSBhd2FpdCB3cml0ZVRvVGVtcEZpbGUoc3RyZWFtLCBwYXRoKTtcblxuICAgICAgICAgICAgbGV0IHN0YXRzID0gYXdhaXQgZ2V0RmlsZVN0YXRzKHRtcEZpbGUpO1xuICAgICAgICAgICAgbGV0IG1pbWUgPSBnZXRNaW1lVHlwZSh0bXBGaWxlKTtcblxuICAgICAgICAgICAgb3B0aW9ucy5taW1lID0gbWltZTtcbiAgICAgICAgICAgIG9wdGlvbnMuc2l6ZSA9IHN0YXRzLnNpemVcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkaXJQYXRoID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgICAgICBpZiAob3B0aW9ucy5wYXRoKSBkaXJQYXRoID0gb3B0aW9ucy5wYXRoO1xuXG5cbiAgICAgICAgbGV0IGFzc2V0ID0gbmV3IEFzc2V0KHtcbiAgICAgICAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSB8fCBmaWxlbmFtZSxcbiAgICAgICAgICAgIHBhdGg6IG5vcm1hbGl6ZVBhdGgoZGlyUGF0aCksXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXG4gICAgICAgICAgICBtaW1lOiBvcHRpb25zLm1pbWUsXG4gICAgICAgICAgICBzaXplOiBvcHRpb25zLnNpemUsXG4gICAgICAgICAgICBoaWRkZW46IG9wdGlvbnMuaGlkZGVuLFxuICAgICAgICAgICAgbWV0YTogb3B0aW9ucy5tZXRhIHx8IHt9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgY29uc3QgY3JlYXRlRm4gPSBhc3luYyAoKTogUHJvbWlzZTxSZWFkYWJsZT4gPT4ge1xuICAgICAgICAgICAgaWYgKCF0bXBGaWxlKSB7XG4gICAgICAgICAgICAgICAgdG1wRmlsZSA9IGF3YWl0IHdyaXRlVG9UZW1wRmlsZShzdHJlYW0sIHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0odG1wRmlsZSk7XG4gICAgICAgIH07XG5cblxuICAgICAgICAvLyBSdW4gYmVmb3JlIGNyZWF0ZSBob29rLCBcbiAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNyZWF0ZSwgYXNzZXQsIGNyZWF0ZUZuLCBvcHRpb25zKTtcblxuICAgICAgICBpZiAodG1wRmlsZSkge1xuICAgICAgICAgICAgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3NldC5wYXRoW2Fzc2V0LnBhdGgubGVuZ3RoIC0gMV0gIT09ICcvJykgYXNzZXQucGF0aCArPSAnLyc7XG5cblxuICAgICAgICBhd2FpdCB0aGlzLmZpbGVTdG9yZS5jcmVhdGUoYXNzZXQsIHN0cmVhbSwgb3B0aW9ucyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3J1bkhhbmRsZXJzKGFzc2V0LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RyZWFtKGFzc2V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IHJ1biBoYW5kbGVyIGZvciBcIiVzXCIsIGdvdCBlcnJvcjogJXMnLCBhc3NldC5taW1lLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb3B0aW9ucy5za2lwTWV0YSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLm1ldGFTdG9yZS5jcmVhdGUoYXNzZXQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZmlsZVN0b3JlLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2xlYW4oKTtcbiAgICAgICAgZGVidWcoJ2NyZWF0ZSAlaicsIGFzc2V0KTtcbiAgICAgICAgdGhpcy5fcnVuSG9vayhIb29rLkNyZWF0ZSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuXG4gICAgICAgIHJldHVybiBhc3NldDtcbiAgICB9XG5cbiAgICAvKiogR2V0IGFuIGFzc2V0IGJ5IGlkXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBpZFxuICAgICAqIEByZXR1cm4gUHJvbWlzZTxBc3NldD5cbiAgICAgKi9cbiAgICBhc3luYyBnZXRCeUlkKGlkOiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPEFzc2V0PiB7XG4gICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMubWV0YVN0b3JlLmdldChpZCwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChhc3NldCkge1xuICAgICAgICAgICAgaWYgKCEoYXNzZXQgaW5zdGFuY2VvZiBBc3NldCkpIGFzc2V0ID0gbmV3IEFzc2V0KGFzc2V0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gPEFzc2V0PmFzc2V0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbiBhc3NldCBieSBmdWxsIHBhdGhcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgZnVsbCBwYXRoIHRvIHRoZSBmaWxlXG4gICAgICogQHJldHVybiBQcm9taXNlPEFzc2V0PlxuICAgICAqL1xuICAgIGdldEJ5UGF0aChwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPEFzc2V0PiB7XG4gICAgICAgIHJldHVybiB0aGlzLm1ldGFTdG9yZS5nZXRCeVBhdGgocGF0aCwgb3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGFzc2V0ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoYXNzZXQgaW5zdGFuY2VvZiBBc3NldCkpIGFzc2V0ID0gbmV3IEFzc2V0KGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgYSBnaXZlbiBwYXRoIGV4aXN0c1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFRoZSBmdWxsIHBhdGggdG8gdGhlIGFzc2V0IChwYXRoL3RvL2ZpbGVuYW1lLmV4dClcbiAgICAgKiBAcGFyYW0geyp9IFtvcHRpb25zXSAoZGVzY3JpcHRpb24pXG4gICAgICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IChkZXNjcmlwdGlvbilcbiAgICAgKi9cbiAgICBoYXMocGF0aDogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEJ5UGF0aChwYXRoLCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oYSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEgIT0gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnkodGVybTogc3RyaW5nLCBvcHRpb25zPzogSUZpbmRPcHRpb25zKTogUHJvbWlzZTxBc3NldFtdPiB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IDxhbnk+e307XG4gICAgICAgIG9wdGlvbnMucGF0aCA9IHRlcm07XG5cbiAgICAgICAgcmV0dXJuIChhd2FpdCB0aGlzLm1ldGFTdG9yZS5maW5kKG9wdGlvbnMpKS5tYXAoYSA9PiB7XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IEFzc2V0KGEpO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgYXN5bmMgcmVtb3ZlKGFzc2V0OiBBc3NldCwgb3B0aW9ucz86IGFueSk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGlmICgoYXdhaXQgdGhpcy5nZXRCeUlkKGFzc2V0LmlkLCBvcHRpb25zKSkgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVJlbW92ZSwgYXNzZXQsIG9wdGlvbnMpXG5cbiAgICAgICAgYXdhaXQgdGhpcy5maWxlU3RvcmUucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgYXdhaXQgdGhpcy5tZXRhU3RvcmUucmVtb3ZlKGFzc2V0KTtcblxuICAgICAgICBhd2FpdCB0aGlzLl9ydW5Ib29rKEhvb2suUmVtb3ZlLCBhc3NldCwgbnVsbCwgb3B0aW9ucylcblxuICAgIH1cblxuICAgIGFzeW5jIGxpc3Qob3B0aW9ucz86IElMaXN0T3B0aW9ucyk6IFByb21pc2U8QXNzZXRbXT4ge1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX3J1bkhvb2soSG9vay5CZWZvcmVMaXN0LCBudWxsLCBudWxsLCBvcHRpb25zKTtcblxuICAgICAgICBsZXQgaW5mb3MgPSBhd2FpdCB0aGlzLm1ldGFTdG9yZS5saXN0KG9wdGlvbnMpO1xuXG4gICAgICAgIGlmICghaW5mb3MubGVuZ3RoKSByZXR1cm4gPEFzc2V0W10+aW5mb3M7XG5cbiAgICAgICAgcmV0dXJuIGluZm9zLm1hcChtID0+IHtcbiAgICAgICAgICAgIGlmICghKG0gaW5zdGFuY2VvZiBBc3NldCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEFzc2V0KG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDxBc3NldD5tO1xuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgYXN5bmMgc3RyZWFtKGFzc2V0OiBBc3NldCwgb3B0aW9ucz86IGFueSk6IFByb21pc2U8UmVhZGFibGU+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZVN0cmVhbSwgYXNzZXQsIG51bGwsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5maWxlU3RvcmUuc3RyZWFtKGFzc2V0KTtcbiAgICB9XG5cbiAgICBhc3luYyBjb3VudChvcHRpb25zPzogSUZpbmRPcHRpb25zKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5fcnVuSG9vayhIb29rLkJlZm9yZUNvdW50LCBudWxsLCBudWxsLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMubWV0YVN0b3JlLmNvdW50KG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHVzZShtaW1lOiBzdHJpbmcgfCBNaW1lRnVuYywgZm4/OiBNaW1lRnVuYykge1xuICAgICAgICBpZiAodHlwZW9mIG1pbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGZuID0gPE1pbWVGdW5jPm1pbWU7XG4gICAgICAgICAgICBtaW1lID0gJy4qJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX21pbWVIYW5kbGVycy5wdXNoKHtcbiAgICAgICAgICAgIHI6IG5ldyBSZWdFeHAoPHN0cmluZz5taW1lLCAnaScpLFxuICAgICAgICAgICAgZjogZm5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJIb29rKGhvb2s6IEhvb2ssIGZuOiBIb29rRnVuYyk6IHN0cmluZyB7XG4gICAgICAgIGlmICghdGhpcy5faG9va3MuaGFzKGhvb2spKSB7XG4gICAgICAgICAgICB0aGlzLl9ob29rcy5zZXQoaG9vaywgW10pO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpZCA9IGdldElkKCk7XG4gICAgICAgIHRoaXMuX2hvb2tzLmdldChob29rKS5wdXNoKFtpZCwgZm5dKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHVucmVnaXN0ZXIoaG9vazogSG9vaywgZm46IEhvb2tGdW5jIHwgc3RyaW5nKSB7XG4gICAgICAgIGlmICghdGhpcy5faG9va3MuaGFzKGhvb2spKSByZXR1cm47XG5cbiAgICAgICAgbGV0IGhvb2tzID0gdGhpcy5faG9va3MuZ2V0KGhvb2spXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gaG9va3MubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaWYgKGhvb2tzW2ldWzBdID09PSBmbiB8fCBob29rc1tpXVsxXSA9PT0gZm4pIHtcbiAgICAgICAgICAgICAgICBob29rcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX3J1bkhvb2soaG9vazogSG9vaywgYXNzZXQ6IEFzc2V0LCBmbj86ICgpID0+IFByb21pc2U8UmVhZGFibGU+LCBvcHRpb25zPzogYW55KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBob29rczogaG9va190dXBsZVtdID0gdGhpcy5faG9va3MuZ2V0KGhvb2spO1xuICAgICAgICBpZiAoIWhvb2tzKSByZXR1cm47XG4gICAgICAgIGRlYnVnKFwicnVuIGhvb2sgJXMgKCVkKVwiLCBIb29rW2hvb2tdLCBob29rcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBob29rcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInJ1biBob29rIGlkICVzXCIsIGhvb2tzW2ldWzBdKTtcbiAgICAgICAgICAgIGF3YWl0IGhvb2tzW2ldWzFdKGFzc2V0LCBmbiwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ydW5IYW5kbGVycyhhc3NldDogQXNzZXQsIGZuPzogKCkgPT4gUHJvbWlzZTxSZWFkYWJsZT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fbWltZUhhbmRsZXJzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9taW1lSGFuZGxlcnNbaV0uci50ZXN0KGFzc2V0Lm1pbWUpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fbWltZUhhbmRsZXJzW2ldLmYoYXNzZXQsIGZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
