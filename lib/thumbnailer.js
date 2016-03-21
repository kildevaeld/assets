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
    dir = dir == '.' ? '' : dir == '/' ? dir : dir + '/';
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
                    var path = thumbName(asset.filename);
                    debug('request %s', path);
                    var stream = yield this._assets.fileStore.stream({
                        filename: path,
                        path: asset.path
                    });
                    return stream;
                }
                return null;
            });
        }
    }, {
        key: 'has',
        value: function has(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                if (!(yield this.canThumbnail(asset.mime))) return false;
                if (asset.meta && asset.meta['thumbnail'] === true) {
                    return false;
                }
                try {
                    var path = thumbName(asset.filename);
                    var fp = Path.join(asset.path, path);
                    debug('thumbname %s', path);
                    if (yield this._assets.has(fp)) {
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
                    console.log(e.stack);
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
        value: function _generateThumbnail(asset, filename) {
            return __awaiter(this, void 0, Promise, function* () {
                var generator = Thumbnailer.getGenerator(asset.mime);
                if (!generator) throw new Error("no thumbnailer");
                var rs = yield this._assets.stream(asset);
                if (!rs) throw new Error('no stream');

                var _ref = yield generator(rs);

                var stream = _ref.stream;
                var info = _ref.info;

                info.path = asset.path;
                info.filename = filename;
                info.hidden = true;
                info.meta['thumbnail'] = true;
                var path = Path.join(info.path, info.filename);
                if (stream && info) {
                    yield this._assets.create(stream, path, info);
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
                if (asset.meta && asset.meta['destroyed']) return;
                var path = thumbName(asset.filename);
                try {
                    var thumbnail = yield this._assets.getByPath(Path.join(asset.path, path));
                    if (thumbnail && thumbnail.meta['thumbnail'] === true) {
                        debug("removing thumbnail associated with %j", asset);
                        yield this._assets.remove({ path: asset.path, filename: path });
                        asset.meta = { 'destroyed': true };
                    }
                } catch (e) {
                    console.log('could not remove thumnail %s', path, e);
                }
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
            return _generators[mime];
        }
    }]);

    return Thumbnailer;
}();

exports.Thumbnailer = Thumbnailer;