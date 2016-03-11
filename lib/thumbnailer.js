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
var index_1 = require('./index');
var Debug = require('debug');
var debug = Debug("assets:thumbnailer");
var _generators = {};
function thumbName(path) {
    var ext = Path.extname(path),
        basename = Path.basename(path, ext),
        dir = Path.dirname(path);
    dir = dir == '.' ? '' : dir + '/';
    var thumbnail = dir + basename + '.thumbnail.png';
    return thumbnail;
}

var Thumbnailer = function () {
    function Thumbnailer(options) {
        _classCallCheck(this, Thumbnailer);

        this._onAssetRemove = this._onAssetRemove.bind(this);
    }

    _createClass(Thumbnailer, [{
        key: 'initialize',
        value: function initialize(assets) {
            return __awaiter(this, void 0, Promise, function* () {
                this._assets = assets;
                assets.registerHook(index_1.Hook.Remove, this._onAssetRemove);
            });
        }
    }, {
        key: 'request',
        value: function request(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                if (yield this.has(asset)) {
                    var path = thumbName(asset.path);
                    return this._assets.fileStore.stream({
                        path: path
                    });
                }
                return null;
            });
        }
    }, {
        key: 'has',
        value: function has(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                if (!(yield this.canThumbnail(asset.mime))) return false;
                try {
                    var path = thumbName(asset.path);
                    if (yield this._assets.fileStore.has({ path: path })) {
                        debug('already have thumbnail');
                        return true;
                    }
                    var info = yield this._generateThumbnail(asset, path);
                    if (info == null) {
                        debug('info is null');
                        return false;
                    }
                    return true;
                } catch (e) {
                    debug('could not generate thumbnail ', e.message);
                    return false;
                }
            });
        }
    }, {
        key: 'canThumbnail',
        value: function canThumbnail(mime) {
            debug('can thumnail %s: %s', mime, !!_generators[mime]);
            return !!_generators[mime];
        }
    }, {
        key: '_generateThumbnail',
        value: function _generateThumbnail(asset, path) {
            return __awaiter(this, void 0, Promise, function* () {
                var generator = Thumbnailer.getGenerator(asset.mime);
                if (!generator) throw new Error("no thumbnailer");
                var rs = yield this._assets.stream(asset);
                if (!rs) throw new Error('no stream');

                var _ref = yield generator(rs);

                var stream = _ref.stream;
                var info = _ref.info;

                info.path = path;
                info.filename = Path.basename(path);
                if (stream && info) {
                    yield this._assets.fileStore.create(info, stream);
                    return info;
                } else {
                    return null;
                }
            });
        }
    }, {
        key: '_onAssetRemove',
        value: function _onAssetRemove(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                var path = thumbName(asset.path);
                try {
                    yield this._assets.fileStore.remove({ path: path });
                } catch (e) {}
            });
        }
    }], [{
        key: 'setGenerator',
        value: function setGenerator(mime, generator) {
            if (!Array.isArray(mime)) mime = [mime];
            for (var i = 0, ii = mime.length; i < ii; i++) {
                debug("set generator %s", mime[i]);
                _generators[mime[i]] = generator;
            }
        }
    }, {
        key: 'getGenerator',
        value: function getGenerator(mime) {
            debug("generator %s : %s", mime, _generators[mime]);
            return _generators[mime];
        }
    }]);

    return Thumbnailer;
}();

exports.Thumbnailer = Thumbnailer;