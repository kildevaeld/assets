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
var interface_1 = require('./interface');
var index_1 = require('./index');
var Debug = require('debug');
var asset_1 = require('./asset');
var debug = Debug("assets:thumbnailer");
exports.ThumbnailMetaKey = "$thumbnail";
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
        value: function request(asset, options) {
            return __awaiter(this, void 0, Promise, function* () {
                if (yield this.has(asset, options)) {
                    var path = thumbName(asset.filename);
                    debug('request %s', path);
                    var stream = yield this._assets.stream({
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
        value: function has(asset, options) {
            return __awaiter(this, void 0, Promise, function* () {
                if (!(yield this.canThumbnail(asset.mime))) return false;
                if (asset.meta && asset.meta['thumbnail'] === true) {
                    return false;
                }
                try {
                    var path = thumbName(asset.filename);
                    var fp = Path.join(asset.path, path);
                    debug('thumbname %s', path);
                    if (yield this._assets.has(fp, options)) {
                        debug('already have thumbnail');
                        return true;
                    }
                    var info = yield this._generateThumbnail(asset, path, options);
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
        key: 'generateThumbnail',
        value: function generateThumbnail(asset, options) {
            return __awaiter(this, void 0, Promise, function* () {
                var tFileName = thumbName(asset.filename);
                if (asset.meta[exports.ThumbnailMetaKey]) {
                    throw new interface_1.ThumbnailError('Cannot not make a thumbnail of another thumbnail');
                }
                var generator = Thumbnailer.getGenerator(asset.mime);
                if (!generator) throw new interface_1.ThumbnailError('No generator for mimetype ' + asset.mime);
                var rs = yield this._assets.stream(asset);
                if (rs) throw new interface_1.ThumbnailError('Could not stream ' + asset.id);

                var _ref = yield generator(rs);

                var stream = _ref.stream;
                var info = _ref.info;

                if (!stream || !info) {
                    throw new interface_1.ThumbnailError('Could not generate thumbnail for ' + info.mime + ' ');
                }
                if (info instanceof asset_1.Asset) {
                    info = info.toJSON();
                }
                info.path = asset.path;
                info.filename = tFileName;
                info.hidden = true;
                info.meta[exports.ThumbnailMetaKey] = true;
                if (options) {
                    info = Object.assign({}, info, options);
                }
                var fp = Path.join(info.path, info.filename);
                return yield this._assets.create(stream, fp, info);
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
        value: function _generateThumbnail(asset, filename, options) {
            return __awaiter(this, void 0, Promise, function* () {
                var generator = Thumbnailer.getGenerator(asset.mime);
                if (!generator) throw new Error("no thumbnailer");
                var rs = yield this._assets.stream(asset);
                if (!rs) throw new Error('no stream');

                var _ref2 = yield generator(rs);

                var stream = _ref2.stream;
                var info = _ref2.info;

                if (info instanceof asset_1.Asset) {
                    info = info.toJSON();
                }
                info.path = asset.path;
                info.filename = filename;
                info.hidden = true;
                info.meta['thumbnail'] = true;
                if (options) {
                    info = Object.assign({}, info, options);
                }
                var path = Path.join(info.path, info.filename);
                if (stream && info) {
                    return yield this._assets.create(stream, path, info);
                } else {
                    return null;
                }
            });
        }
    }, {
        key: '_onAssetRemove',
        value: function _onAssetRemove(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                if (!asset) return;
                if (asset.meta && asset.meta['destroyed'] === true) return;
                var path = thumbName(asset.filename);
                try {
                    var thumbnail = yield this._assets.getByPath(Path.join(asset.path, path));
                    if (thumbnail && thumbnail.meta[exports.ThumbnailMetaKey] === true) {
                        debug("removing thumbnail associated with %j", asset);
                        yield this._assets.remove({ path: asset.path, filename: path });
                        asset.meta = { 'destroyed': true };
                    }
                } catch (e) {
                    debug('could not remove thumnail %s', path, e);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRodW1ibmFpbGVyLmpzIiwidGh1bWJuYWlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztBQUNBLElBQUksWUFBWSxTQUFDLElBQVEsVUFBSyxTQUFMLElBQW1CLFVBQVUsT0FBVixFQUFtQixVQUFuQixFQUErQixDQUEvQixFQUFrQyxTQUFsQyxFQUE2QztBQUNyRixXQUFPLEtBQUssTUFBTSxJQUFJLE9BQUosQ0FBTixDQUFMLENBQXlCLFVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQjtBQUN2RCxpQkFBUyxTQUFULENBQW1CLEtBQW5CLEVBQTBCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLElBQVYsQ0FBZSxLQUFmLENBQUwsRUFBRjthQUFKLENBQXFDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLEtBQVYsQ0FBZ0IsS0FBaEIsQ0FBTCxFQUFGO2FBQUosQ0FBc0MsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCO0FBQUUsbUJBQU8sSUFBUCxHQUFjLFFBQVEsT0FBTyxLQUFQLENBQXRCLEdBQXNDLElBQUksQ0FBSixDQUFNLFVBQVUsT0FBVixFQUFtQjtBQUFFLHdCQUFRLE9BQU8sS0FBUCxDQUFSLENBQUY7YUFBbkIsQ0FBTixDQUFxRCxJQUFyRCxDQUEwRCxTQUExRCxFQUFxRSxRQUFyRSxDQUF0QyxDQUFGO1NBQXRCO0FBQ0EsYUFBSyxDQUFDLFlBQVksVUFBVSxLQUFWLENBQWdCLE9BQWhCLEVBQXlCLFVBQXpCLENBQVosQ0FBRCxDQUFtRCxJQUFuRCxFQUFMLEVBSnVEO0tBQTNCLENBQWhDLENBRHFGO0NBQTdDO0FDRDVDLElBQVksT0FBSSxRQUFNLE1BQU4sQ0FBSjtB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bWJuYWlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNvbnN0IFBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBpbnRlcmZhY2VfMSA9IHJlcXVpcmUoJy4vaW50ZXJmYWNlJyk7XG5jb25zdCBpbmRleF8xID0gcmVxdWlyZSgnLi9pbmRleCcpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgYXNzZXRfMSA9IHJlcXVpcmUoJy4vYXNzZXQnKTtcbmNvbnN0IGRlYnVnID0gRGVidWcoXCJhc3NldHM6dGh1bWJuYWlsZXJcIik7XG5leHBvcnRzLlRodW1ibmFpbE1ldGFLZXkgPSBcIiR0aHVtYm5haWxcIjtcbmNvbnN0IF9nZW5lcmF0b3JzID0ge307XG5mdW5jdGlvbiB0aHVtYk5hbWUocGF0aCkge1xuICAgIGxldCBleHQgPSBQYXRoLmV4dG5hbWUocGF0aCksIGJhc2VuYW1lID0gUGF0aC5iYXNlbmFtZShwYXRoLCBleHQpLCBkaXIgPSBQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgZGlyID0gZGlyID09ICcuJyA/ICcnIDogZGlyID09ICcvJyA/IGRpciA6IGRpciArICcvJztcbiAgICBsZXQgdGh1bWJuYWlsID0gZGlyICsgYmFzZW5hbWUgKyAnLnRodW1ibmFpbC5wbmcnO1xuICAgIHJldHVybiB0aHVtYm5haWw7XG59XG5jbGFzcyBUaHVtYm5haWxlciB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLl9vbkFzc2V0UmVtb3ZlID0gdGhpcy5fb25Bc3NldFJlbW92ZS5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBzdGF0aWMgc2V0R2VuZXJhdG9yKG1pbWUsIGdlbmVyYXRvcikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkobWltZSkpXG4gICAgICAgICAgICBtaW1lID0gW21pbWVdO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBtaW1lLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGRlYnVnKFwic2V0IGdlbmVyYXRvciAlc1wiLCBtaW1lW2ldKTtcbiAgICAgICAgICAgIF9nZW5lcmF0b3JzW21pbWVbaV1dID0gZ2VuZXJhdG9yO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZXRHZW5lcmF0b3IobWltZSkge1xuICAgICAgICByZXR1cm4gX2dlbmVyYXRvcnNbbWltZV07XG4gICAgfVxuICAgIGluaXRpYWxpemUoYXNzZXRzKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5fYXNzZXRzID0gYXNzZXRzO1xuICAgICAgICAgICAgYXNzZXRzLnJlZ2lzdGVySG9vayhpbmRleF8xLkhvb2suUmVtb3ZlLCB0aGlzLl9vbkFzc2V0UmVtb3ZlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlcXVlc3QoYXNzZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBpZiAoKHlpZWxkIHRoaXMuaGFzKGFzc2V0LCBvcHRpb25zKSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IHRodW1iTmFtZShhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgZGVidWcoJ3JlcXVlc3QgJXMnLCBwYXRoKTtcbiAgICAgICAgICAgICAgICBsZXQgc3RyZWFtID0geWllbGQgdGhpcy5fYXNzZXRzLnN0cmVhbSh7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBwYXRoOiBhc3NldC5wYXRoXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaGFzKGFzc2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKCEoeWllbGQgdGhpcy5jYW5UaHVtYm5haWwoYXNzZXQubWltZSkpKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmIChhc3NldC5tZXRhICYmIGFzc2V0Lm1ldGFbJ3RodW1ibmFpbCddID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IHRodW1iTmFtZShhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgbGV0IGZwID0gUGF0aC5qb2luKGFzc2V0LnBhdGgsIHBhdGgpO1xuICAgICAgICAgICAgICAgIGRlYnVnKCd0aHVtYm5hbWUgJXMnLCBwYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoeWllbGQgdGhpcy5fYXNzZXRzLmhhcyhmcCwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoJ2FscmVhZHkgaGF2ZSB0aHVtYm5haWwnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpbmZvID0geWllbGQgdGhpcy5fZ2VuZXJhdGVUaHVtYm5haWwoYXNzZXQsIHBhdGgsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGlmIChpbmZvID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWcoJ2luZm8gaXMgbnVsbCcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IGdlbmVyYXRlIHRodW1ibmFpbCAnLCBlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdlbmVyYXRlVGh1bWJuYWlsKGFzc2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHRGaWxlTmFtZSA9IHRodW1iTmFtZShhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICBpZiAoYXNzZXQubWV0YVtleHBvcnRzLlRodW1ibmFpbE1ldGFLZXldKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IGludGVyZmFjZV8xLlRodW1ibmFpbEVycm9yKCdDYW5ub3Qgbm90IG1ha2UgYSB0aHVtYm5haWwgb2YgYW5vdGhlciB0aHVtYm5haWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBnZW5lcmF0b3IgPSBUaHVtYm5haWxlci5nZXRHZW5lcmF0b3IoYXNzZXQubWltZSk7XG4gICAgICAgICAgICBpZiAoIWdlbmVyYXRvcilcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgaW50ZXJmYWNlXzEuVGh1bWJuYWlsRXJyb3IoYE5vIGdlbmVyYXRvciBmb3IgbWltZXR5cGUgJHthc3NldC5taW1lfWApO1xuICAgICAgICAgICAgbGV0IHJzID0geWllbGQgdGhpcy5fYXNzZXRzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICBpZiAocnMpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IGludGVyZmFjZV8xLlRodW1ibmFpbEVycm9yKGBDb3VsZCBub3Qgc3RyZWFtICR7YXNzZXQuaWR9YCk7XG4gICAgICAgICAgICBsZXQgeyBzdHJlYW0sIGluZm8gfSA9IHlpZWxkIGdlbmVyYXRvcihycyk7XG4gICAgICAgICAgICBpZiAoIXN0cmVhbSB8fCAhaW5mbykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBpbnRlcmZhY2VfMS5UaHVtYm5haWxFcnJvcihgQ291bGQgbm90IGdlbmVyYXRlIHRodW1ibmFpbCBmb3IgJHtpbmZvLm1pbWV9IGApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGluZm8gaW5zdGFuY2VvZiBhc3NldF8xLkFzc2V0KSB7XG4gICAgICAgICAgICAgICAgaW5mbyA9IGluZm8udG9KU09OKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmZvLnBhdGggPSBhc3NldC5wYXRoO1xuICAgICAgICAgICAgaW5mby5maWxlbmFtZSA9IHRGaWxlTmFtZTtcbiAgICAgICAgICAgIGluZm8uaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIGluZm8ubWV0YVtleHBvcnRzLlRodW1ibmFpbE1ldGFLZXldID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaW5mbyA9IE9iamVjdC5hc3NpZ24oe30sIGluZm8sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZwID0gUGF0aC5qb2luKGluZm8ucGF0aCwgaW5mby5maWxlbmFtZSk7XG4gICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5fYXNzZXRzLmNyZWF0ZShzdHJlYW0sIGZwLCBpbmZvKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNhblRodW1ibmFpbChtaW1lKSB7XG4gICAgICAgIGRlYnVnKCdjYW4gdGh1bW5haWwgJXM6ICVzJywgbWltZSwgISFfZ2VuZXJhdG9yc1ttaW1lXSk7XG4gICAgICAgIHJldHVybiAhIV9nZW5lcmF0b3JzW21pbWVdO1xuICAgIH1cbiAgICBfZ2VuZXJhdGVUaHVtYm5haWwoYXNzZXQsIGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IGdlbmVyYXRvciA9IFRodW1ibmFpbGVyLmdldEdlbmVyYXRvcihhc3NldC5taW1lKTtcbiAgICAgICAgICAgIGlmICghZ2VuZXJhdG9yKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIHRodW1ibmFpbGVyXCIpO1xuICAgICAgICAgICAgbGV0IHJzID0geWllbGQgdGhpcy5fYXNzZXRzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICBpZiAoIXJzKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gc3RyZWFtJyk7XG4gICAgICAgICAgICBsZXQgeyBzdHJlYW0sIGluZm8gfSA9IHlpZWxkIGdlbmVyYXRvcihycyk7XG4gICAgICAgICAgICBpZiAoaW5mbyBpbnN0YW5jZW9mIGFzc2V0XzEuQXNzZXQpIHtcbiAgICAgICAgICAgICAgICBpbmZvID0gaW5mby50b0pTT04oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZm8ucGF0aCA9IGFzc2V0LnBhdGg7XG4gICAgICAgICAgICBpbmZvLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gICAgICAgICAgICBpbmZvLmhpZGRlbiA9IHRydWU7XG4gICAgICAgICAgICBpbmZvLm1ldGFbJ3RodW1ibmFpbCddID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaW5mbyA9IE9iamVjdC5hc3NpZ24oe30sIGluZm8sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHBhdGggPSBQYXRoLmpvaW4oaW5mby5wYXRoLCBpbmZvLmZpbGVuYW1lKTtcbiAgICAgICAgICAgIGlmIChzdHJlYW0gJiYgaW5mbykge1xuICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLl9hc3NldHMuY3JlYXRlKHN0cmVhbSwgcGF0aCwgaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9vbkFzc2V0UmVtb3ZlKGFzc2V0KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKCFhc3NldClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoYXNzZXQubWV0YSAmJiBhc3NldC5tZXRhWydkZXN0cm95ZWQnXSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBsZXQgcGF0aCA9IHRodW1iTmFtZShhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCB0aHVtYm5haWwgPSB5aWVsZCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKFBhdGguam9pbihhc3NldC5wYXRoLCBwYXRoKSk7XG4gICAgICAgICAgICAgICAgaWYgKHRodW1ibmFpbCAmJiB0aHVtYm5haWwubWV0YVtleHBvcnRzLlRodW1ibmFpbE1ldGFLZXldID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKFwicmVtb3ZpbmcgdGh1bWJuYWlsIGFzc29jaWF0ZWQgd2l0aCAlalwiLCBhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuX2Fzc2V0cy5yZW1vdmUoeyBwYXRoOiBhc3NldC5wYXRoLCBmaWxlbmFtZTogcGF0aCB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXQubWV0YSA9IHsgJ2Rlc3Ryb3llZCc6IHRydWUgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdjb3VsZCBub3QgcmVtb3ZlIHRodW1uYWlsICVzJywgcGF0aCwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuVGh1bWJuYWlsZXIgPSBUaHVtYm5haWxlcjtcbiIsImltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge1JlYWRhYmxlfSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHtJRmlsZSwgVGh1bWJuYWlsRXJyb3J9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7QXNzZXRzLCBIb29rfSBmcm9tICcuL2luZGV4JztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7QXNzZXR9IGZyb20gJy4vYXNzZXQnO1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKFwiYXNzZXRzOnRodW1ibmFpbGVyXCIpO1xuXG5leHBvcnQgY29uc3QgVGh1bWJuYWlsTWV0YUtleSA9IFwiJHRodW1ibmFpbFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRodW1ibmFpbEdlbmVyYXRvciB7XG4gICAgKHN0cmVhbTogUmVhZGFibGUpOiBQcm9taXNlPHsgc3RyZWFtOiBSZWFkYWJsZSwgaW5mbzogSUZpbGUgfT5cbn1cblxuY29uc3QgX2dlbmVyYXRvcnM6IHsgW2tleTogc3RyaW5nXTogVGh1bWJuYWlsR2VuZXJhdG9yIH0gPSB7fTtcblxuXG5mdW5jdGlvbiB0aHVtYk5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgZXh0ID0gUGF0aC5leHRuYW1lKHBhdGgpLCBiYXNlbmFtZSA9IFBhdGguYmFzZW5hbWUocGF0aCwgZXh0KSxcbiAgICAgICAgZGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpXG4gICAgZGlyID0gZGlyID09ICcuJyA/ICcnIDogZGlyID09ICcvJyA/IGRpciA6IGRpciArICcvJztcbiAgICBsZXQgdGh1bWJuYWlsID0gZGlyICsgYmFzZW5hbWUgKyAnLnRodW1ibmFpbC5wbmcnO1xuXG4gICAgcmV0dXJuIHRodW1ibmFpbDtcbn1cblxuXG5leHBvcnQgaW50ZXJmYWNlIFRodW1ibmFpbGVyT3B0aW9ucyB7XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRodW1ibmFpbGVyIHtcbiAgICBwcml2YXRlIF9hc3NldHM6IEFzc2V0cztcbiAgICBzdGF0aWMgc2V0R2VuZXJhdG9yKG1pbWU6IHN0cmluZyB8IHN0cmluZ1tdLCBnZW5lcmF0b3I6IFRodW1ibmFpbEdlbmVyYXRvcikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkobWltZSkpIG1pbWUgPSBbPHN0cmluZz5taW1lXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gbWltZS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInNldCBnZW5lcmF0b3IgJXNcIiwgbWltZVtpXSk7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yc1ttaW1lW2ldXSA9IGdlbmVyYXRvcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBzdGF0aWMgZ2V0R2VuZXJhdG9yKG1pbWU6c3RyaW5nKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gX2dlbmVyYXRvcnNbbWltZV07XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBUaHVtYm5haWxlck9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fb25Bc3NldFJlbW92ZSA9IHRoaXMuX29uQXNzZXRSZW1vdmUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0aWFsaXplKGFzc2V0czogQXNzZXRzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuX2Fzc2V0cyA9IGFzc2V0cztcbiAgICAgICAgYXNzZXRzLnJlZ2lzdGVySG9vayhIb29rLlJlbW92ZSwgdGhpcy5fb25Bc3NldFJlbW92ZSk7XG4gICAgfVxuXG4gICAgXG5cblxuICAgIGFzeW5jIHJlcXVlc3QoYXNzZXQ6IElGaWxlLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIGlmICgoYXdhaXQgdGhpcy5oYXMoYXNzZXQsIG9wdGlvbnMpKSkge1xuICAgICAgICAgICAgbGV0IHBhdGggPSB0aHVtYk5hbWUoYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgZGVidWcoJ3JlcXVlc3QgJXMnLCBwYXRoKVxuICAgICAgICAgICAgbGV0IHN0cmVhbSA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5zdHJlYW0oPGFueT57XG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHBhdGgsXG4gICAgICAgICAgICAgICAgcGF0aDogYXNzZXQucGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBhc3luYyBoYXMoYXNzZXQ6IElGaWxlLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5jYW5UaHVtYm5haWwoYXNzZXQubWltZSkpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICBpZiAoYXNzZXQubWV0YSAmJiBhc3NldC5tZXRhWyd0aHVtYm5haWwnXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBwYXRoID0gdGh1bWJOYW1lKGFzc2V0LmZpbGVuYW1lKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsZXQgZnAgPSBQYXRoLmpvaW4oYXNzZXQucGF0aCwgcGF0aCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRlYnVnKCd0aHVtYm5hbWUgJXMnLCBwYXRoKVxuICAgICAgICAgICAgaWYgKGF3YWl0IHRoaXMuX2Fzc2V0cy5oYXMoZnAsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoJ2FscmVhZHkgaGF2ZSB0aHVtYm5haWwnKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsZXQgaW5mbyA9IGF3YWl0IHRoaXMuX2dlbmVyYXRlVGh1bWJuYWlsKGFzc2V0LCBwYXRoLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKGluZm8gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdpbmZvIGlzIG51bGwnKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCBnZW5lcmF0ZSB0aHVtYm5haWwgJywgZS5tZXNzYWdlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBhc3luYyBnZW5lcmF0ZVRodW1ibmFpbChhc3NldDpJRmlsZSwgb3B0aW9ucz86YW55KTogUHJvbWlzZTxJRmlsZT4ge1xuICAgICAgICBsZXQgdEZpbGVOYW1lID0gdGh1bWJOYW1lKGFzc2V0LmZpbGVuYW1lKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChhc3NldC5tZXRhW1RodW1ibmFpbE1ldGFLZXldKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVGh1bWJuYWlsRXJyb3IoJ0Nhbm5vdCBub3QgbWFrZSBhIHRodW1ibmFpbCBvZiBhbm90aGVyIHRodW1ibmFpbCcpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgZ2VuZXJhdG9yID0gVGh1bWJuYWlsZXIuZ2V0R2VuZXJhdG9yKGFzc2V0Lm1pbWUpO1xuICAgICAgICBpZiAoIWdlbmVyYXRvcikgdGhyb3cgbmV3IFRodW1ibmFpbEVycm9yKGBObyBnZW5lcmF0b3IgZm9yIG1pbWV0eXBlICR7YXNzZXQubWltZX1gKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBycyA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5zdHJlYW0oPGFueT5hc3NldCk7XG4gICAgICAgIFxuICAgICAgICBpZiAocnMpIHRocm93IG5ldyBUaHVtYm5haWxFcnJvcihgQ291bGQgbm90IHN0cmVhbSAke2Fzc2V0LmlkfWApO1xuICAgICAgICBcbiAgICAgICAgbGV0IHtzdHJlYW0sIGluZm99ID0gYXdhaXQgZ2VuZXJhdG9yKHJzKTtcbiAgICAgICAgXG4gICAgICAgIGlmICghc3RyZWFtIHx8ICFpbmZvKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVGh1bWJuYWlsRXJyb3IoYENvdWxkIG5vdCBnZW5lcmF0ZSB0aHVtYm5haWwgZm9yICR7aW5mby5taW1lfSBgKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaW5mbyBpbnN0YW5jZW9mIEFzc2V0KSB7XG4gICAgICAgICAgICBpbmZvID0gKDxhbnk+aW5mbykudG9KU09OKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGluZm8ucGF0aCA9IGFzc2V0LnBhdGg7XG4gICAgICAgIGluZm8uZmlsZW5hbWUgPSB0RmlsZU5hbWU7XG4gICAgICAgIGluZm8uaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgaW5mby5tZXRhW1RodW1ibmFpbE1ldGFLZXldID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpbmZvID0gT2JqZWN0LmFzc2lnbih7fSwgaW5mbywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBmcCA9IFBhdGguam9pbihpbmZvLnBhdGgsIGluZm8uZmlsZW5hbWUpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2Fzc2V0cy5jcmVhdGUoc3RyZWFtLCBmcCwgaW5mbyk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIGNhblRodW1ibmFpbChtaW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgZGVidWcoJ2NhbiB0aHVtbmFpbCAlczogJXMnLCBtaW1lLCAhIV9nZW5lcmF0b3JzW21pbWVdKTtcbiAgICAgICAgcmV0dXJuICEhX2dlbmVyYXRvcnNbbWltZV07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2VuZXJhdGVUaHVtYm5haWwoYXNzZXQ6IElGaWxlLCBmaWxlbmFtZTogc3RyaW5nLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPElGaWxlPiB7XG5cbiAgICAgICAgbGV0IGdlbmVyYXRvciA9IFRodW1ibmFpbGVyLmdldEdlbmVyYXRvcihhc3NldC5taW1lKTtcblxuICAgICAgICBpZiAoIWdlbmVyYXRvcikgdGhyb3cgbmV3IEVycm9yKFwibm8gdGh1bWJuYWlsZXJcIik7XG5cbiAgICAgICAgbGV0IHJzID0gYXdhaXQgdGhpcy5fYXNzZXRzLnN0cmVhbSg8YW55PmFzc2V0KTtcblxuICAgICAgICBpZiAoIXJzKSB0aHJvdyBuZXcgRXJyb3IoJ25vIHN0cmVhbScpO1xuXG4gICAgICAgIGxldCB7c3RyZWFtLCBpbmZvfSA9IGF3YWl0IGdlbmVyYXRvcihycyk7XG5cbiAgICAgICAgaWYgKGluZm8gaW5zdGFuY2VvZiBBc3NldCkge1xuICAgICAgICAgICAgaW5mbyA9ICg8YW55PmluZm8pLnRvSlNPTigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5mby5wYXRoID0gYXNzZXQucGF0aDtcbiAgICAgICAgaW5mby5maWxlbmFtZSA9IGZpbGVuYW1lXG4gICAgICAgIGluZm8uaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgaW5mby5tZXRhWyd0aHVtYm5haWwnXSA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpbmZvID0gT2JqZWN0LmFzc2lnbih7fSwgaW5mbywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGxldCBwYXRoID0gUGF0aC5qb2luKGluZm8ucGF0aCwgaW5mby5maWxlbmFtZSlcbiAgICAgICAgXG4gICAgICAgIGlmIChzdHJlYW0gJiYgaW5mbykge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2Fzc2V0cy5jcmVhdGUoc3RyZWFtLCBwYXRoLCBpbmZvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9vbkFzc2V0UmVtb3ZlKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAoIWFzc2V0KSByZXR1cm47XG4gICAgICAgIGlmIChhc3NldC5tZXRhICYmIGFzc2V0Lm1ldGFbJ2Rlc3Ryb3llZCddID09PSB0cnVlKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBsZXQgcGF0aCA9IHRodW1iTmFtZShhc3NldC5maWxlbmFtZSk7XG4gICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgdGh1bWJuYWlsID0gYXdhaXQgdGhpcy5fYXNzZXRzLmdldEJ5UGF0aChQYXRoLmpvaW4oYXNzZXQucGF0aCxwYXRoKSk7XG4gICAgICAgICAgICBpZiAodGh1bWJuYWlsICYmIHRodW1ibmFpbC5tZXRhW1RodW1ibmFpbE1ldGFLZXldID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoXCJyZW1vdmluZyB0aHVtYm5haWwgYXNzb2NpYXRlZCB3aXRoICVqXCIsIGFzc2V0KVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2Fzc2V0cy5yZW1vdmUoPGFueT57cGF0aDogYXNzZXQucGF0aCwgZmlsZW5hbWU6IHBhdGh9KTsgICAgXG4gICAgICAgICAgICAgICAgYXNzZXQubWV0YSA9IHsgJ2Rlc3Ryb3llZCc6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlKSB7IFxuICAgICAgICAgICBkZWJ1ZygnY291bGQgbm90IHJlbW92ZSB0aHVtbmFpbCAlcycsIHBhdGgsIGUpIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
