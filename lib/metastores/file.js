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