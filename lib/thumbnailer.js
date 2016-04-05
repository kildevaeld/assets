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
var asset_1 = require('./asset');
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
        value: function _generateThumbnail(asset, filename, options) {
            return __awaiter(this, void 0, Promise, function* () {
                var generator = Thumbnailer.getGenerator(asset.mime);
                if (!generator) throw new Error("no thumbnailer");
                var rs = yield this._assets.stream(asset);
                if (!rs) throw new Error('no stream');

                var _ref = yield generator(rs);

                var stream = _ref.stream;
                var info = _ref.info;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRodW1ibmFpbGVyLmpzIiwidGh1bWJuYWlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztBQUNBLElBQUksWUFBWSxTQUFDLElBQVEsVUFBSyxTQUFMLElBQW1CLFVBQVUsT0FBVixFQUFtQixVQUFuQixFQUErQixDQUEvQixFQUFrQyxTQUFsQyxFQUE2QztBQUNyRixXQUFPLEtBQUssTUFBTSxJQUFJLE9BQUosQ0FBTixDQUFMLENBQXlCLFVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQjtBQUN2RCxpQkFBUyxTQUFULENBQW1CLEtBQW5CLEVBQTBCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLElBQVYsQ0FBZSxLQUFmLENBQUwsRUFBRjthQUFKLENBQXFDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLEtBQVYsQ0FBZ0IsS0FBaEIsQ0FBTCxFQUFGO2FBQUosQ0FBc0MsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCO0FBQUUsbUJBQU8sSUFBUCxHQUFjLFFBQVEsT0FBTyxLQUFQLENBQXRCLEdBQXNDLElBQUksQ0FBSixDQUFNLFVBQVUsT0FBVixFQUFtQjtBQUFFLHdCQUFRLE9BQU8sS0FBUCxDQUFSLENBQUY7YUFBbkIsQ0FBTixDQUFxRCxJQUFyRCxDQUEwRCxTQUExRCxFQUFxRSxRQUFyRSxDQUF0QyxDQUFGO1NBQXRCO0FBQ0EsYUFBSyxDQUFDLFlBQVksVUFBVSxLQUFWLENBQWdCLE9BQWhCLEVBQXlCLFVBQXpCLENBQVosQ0FBRCxDQUFtRCxJQUFuRCxFQUFMLEVBSnVEO0tBQTNCLENBQWhDLENBRHFGO0NBQTdDO0FDRDVDLElBQVksT0FBSSxRQUFNLE1BQU4sQ0FBSjtB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QUFWLEVBQTVDLENBQU4sQ0FGbUQ7QUFHbkQsOEJBQU0sSUFBTixHQUFhLEVBQUUsYUFBYSxJQUFiLEVBQWYsQ0FIbUQ7cUJBQXZEO2lCQUZKLENBUUUsT0FBTyxDQUFQLEVBQVU7QUFDVCw0QkFBUSxHQUFSLENBQVksOEJBQVosRUFBNEMsSUFBNUMsRUFBa0QsQ0FBbEQsRUFEUztpQkFBVjthRHRDc0MsQ0FBeEMsQ0N5QnFDOzs7O3FDQS9HckIsTUFBeUIsV0FBNkI7QUFDdEUsZ0JBQUksQ0FBQyxNQUFNLE9BQU4sQ0FBYyxJQUFkLENBQUQsRUFBc0IsT0FBTyxDQUFTLElBQVQsQ0FBUCxDQUExQjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxLQUFLLE1BQUwsRUFBYSxJQUFJLEVBQUosRUFBUSxHQUExQyxFQUErQztBQUMzQyxzQkFBTSxrQkFBTixFQUEwQixLQUFLLENBQUwsQ0FBMUIsRUFEMkM7QUFFM0MsNEJBQVksS0FBSyxDQUFMLENBQVosSUFBdUIsU0FBdkIsQ0FGMkM7YUFBL0M7Ozs7cUNBTWdCLE1BQVc7QUFFM0IsbUJBQU8sWUFBWSxJQUFaLENBQVAsQ0FGMkI7Ozs7V0FWbkM7OztBQUFhLFFBQUEsV0FBQSxHQUFXLFdBQVgiLCJmaWxlIjoidGh1bWJuYWlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNvbnN0IFBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBpbmRleF8xID0gcmVxdWlyZSgnLi9pbmRleCcpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgYXNzZXRfMSA9IHJlcXVpcmUoJy4vYXNzZXQnKTtcbmNvbnN0IGRlYnVnID0gRGVidWcoXCJhc3NldHM6dGh1bWJuYWlsZXJcIik7XG5jb25zdCBfZ2VuZXJhdG9ycyA9IHt9O1xuZnVuY3Rpb24gdGh1bWJOYW1lKHBhdGgpIHtcbiAgICBsZXQgZXh0ID0gUGF0aC5leHRuYW1lKHBhdGgpLCBiYXNlbmFtZSA9IFBhdGguYmFzZW5hbWUocGF0aCwgZXh0KSwgZGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgIGRpciA9IGRpciA9PSAnLicgPyAnJyA6IGRpciA9PSAnLycgPyBkaXIgOiBkaXIgKyAnLyc7XG4gICAgbGV0IHRodW1ibmFpbCA9IGRpciArIGJhc2VuYW1lICsgJy50aHVtYm5haWwucG5nJztcbiAgICByZXR1cm4gdGh1bWJuYWlsO1xufVxuY2xhc3MgVGh1bWJuYWlsZXIge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fb25Bc3NldFJlbW92ZSA9IHRoaXMuX29uQXNzZXRSZW1vdmUuYmluZCh0aGlzKTtcbiAgICB9XG4gICAgc3RhdGljIHNldEdlbmVyYXRvcihtaW1lLCBnZW5lcmF0b3IpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG1pbWUpKVxuICAgICAgICAgICAgbWltZSA9IFttaW1lXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gbWltZS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInNldCBnZW5lcmF0b3IgJXNcIiwgbWltZVtpXSk7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yc1ttaW1lW2ldXSA9IGdlbmVyYXRvcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgZ2V0R2VuZXJhdG9yKG1pbWUpIHtcbiAgICAgICAgcmV0dXJuIF9nZW5lcmF0b3JzW21pbWVdO1xuICAgIH1cbiAgICBpbml0aWFsaXplKGFzc2V0cykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2Fzc2V0cyA9IGFzc2V0cztcbiAgICAgICAgICAgIGFzc2V0cy5yZWdpc3Rlckhvb2soaW5kZXhfMS5Ib29rLlJlbW92ZSwgdGhpcy5fb25Bc3NldFJlbW92ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXF1ZXN0KGFzc2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgaWYgKCh5aWVsZCB0aGlzLmhhcyhhc3NldCwgb3B0aW9ucykpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSB0aHVtYk5hbWUoYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIGRlYnVnKCdyZXF1ZXN0ICVzJywgcGF0aCk7XG4gICAgICAgICAgICAgICAgbGV0IHN0cmVhbSA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5zdHJlYW0oe1xuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogYXNzZXQucGF0aFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhcyhhc3NldCwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmICghKHlpZWxkIHRoaXMuY2FuVGh1bWJuYWlsKGFzc2V0Lm1pbWUpKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoYXNzZXQubWV0YSAmJiBhc3NldC5tZXRhWyd0aHVtYm5haWwnXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSB0aHVtYk5hbWUoYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgIGxldCBmcCA9IFBhdGguam9pbihhc3NldC5wYXRoLCBwYXRoKTtcbiAgICAgICAgICAgICAgICBkZWJ1ZygndGh1bWJuYW1lICVzJywgcGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKHlpZWxkIHRoaXMuX2Fzc2V0cy5oYXMoZnAsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKCdhbHJlYWR5IGhhdmUgdGh1bWJuYWlsJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgaW5mbyA9IHlpZWxkIHRoaXMuX2dlbmVyYXRlVGh1bWJuYWlsKGFzc2V0LCBwYXRoLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBpZiAoaW5mbyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnKCdpbmZvIGlzIG51bGwnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCBnZW5lcmF0ZSB0aHVtYm5haWwgJywgZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlLnN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjYW5UaHVtYm5haWwobWltZSkge1xuICAgICAgICBkZWJ1ZygnY2FuIHRodW1uYWlsICVzOiAlcycsIG1pbWUsICEhX2dlbmVyYXRvcnNbbWltZV0pO1xuICAgICAgICByZXR1cm4gISFfZ2VuZXJhdG9yc1ttaW1lXTtcbiAgICB9XG4gICAgX2dlbmVyYXRlVGh1bWJuYWlsKGFzc2V0LCBmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBnZW5lcmF0b3IgPSBUaHVtYm5haWxlci5nZXRHZW5lcmF0b3IoYXNzZXQubWltZSk7XG4gICAgICAgICAgICBpZiAoIWdlbmVyYXRvcilcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyB0aHVtYm5haWxlclwiKTtcbiAgICAgICAgICAgIGxldCBycyA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5zdHJlYW0oYXNzZXQpO1xuICAgICAgICAgICAgaWYgKCFycylcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHN0cmVhbScpO1xuICAgICAgICAgICAgbGV0IHsgc3RyZWFtLCBpbmZvIH0gPSB5aWVsZCBnZW5lcmF0b3IocnMpO1xuICAgICAgICAgICAgaWYgKGluZm8gaW5zdGFuY2VvZiBhc3NldF8xLkFzc2V0KSB7XG4gICAgICAgICAgICAgICAgaW5mbyA9IGluZm8udG9KU09OKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmZvLnBhdGggPSBhc3NldC5wYXRoO1xuICAgICAgICAgICAgaW5mby5maWxlbmFtZSA9IGZpbGVuYW1lO1xuICAgICAgICAgICAgaW5mby5oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgaW5mby5tZXRhWyd0aHVtYm5haWwnXSA9IHRydWU7XG4gICAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGluZm8gPSBPYmplY3QuYXNzaWduKHt9LCBpbmZvLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBwYXRoID0gUGF0aC5qb2luKGluZm8ucGF0aCwgaW5mby5maWxlbmFtZSk7XG4gICAgICAgICAgICBpZiAoc3RyZWFtICYmIGluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5fYXNzZXRzLmNyZWF0ZShzdHJlYW0sIHBhdGgsIGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfb25Bc3NldFJlbW92ZShhc3NldCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmIChhc3NldC5tZXRhICYmIGFzc2V0Lm1ldGFbJ2Rlc3Ryb3llZCddKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGxldCBwYXRoID0gdGh1bWJOYW1lKGFzc2V0LmZpbGVuYW1lKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IHRodW1ibmFpbCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5nZXRCeVBhdGgoUGF0aC5qb2luKGFzc2V0LnBhdGgsIHBhdGgpKTtcbiAgICAgICAgICAgICAgICBpZiAodGh1bWJuYWlsICYmIHRodW1ibmFpbC5tZXRhWyd0aHVtYm5haWwnXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1ZyhcInJlbW92aW5nIHRodW1ibmFpbCBhc3NvY2lhdGVkIHdpdGggJWpcIiwgYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9hc3NldHMucmVtb3ZlKHsgcGF0aDogYXNzZXQucGF0aCwgZmlsZW5hbWU6IHBhdGggfSk7XG4gICAgICAgICAgICAgICAgICAgIGFzc2V0Lm1ldGEgPSB7ICdkZXN0cm95ZWQnOiB0cnVlIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnY291bGQgbm90IHJlbW92ZSB0aHVtbmFpbCAlcycsIHBhdGgsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLlRodW1ibmFpbGVyID0gVGh1bWJuYWlsZXI7XG4iLCJpbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtSZWFkYWJsZX0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7SUZpbGV9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7QXNzZXRzLCBIb29rfSBmcm9tICcuL2luZGV4JztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCB7QXNzZXR9IGZyb20gJy4vYXNzZXQnO1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKFwiYXNzZXRzOnRodW1ibmFpbGVyXCIpO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRodW1ibmFpbEdlbmVyYXRvciB7XG4gICAgKHN0cmVhbTogUmVhZGFibGUpOiBQcm9taXNlPHsgc3RyZWFtOiBSZWFkYWJsZSwgaW5mbzogSUZpbGUgfT5cbn1cblxuY29uc3QgX2dlbmVyYXRvcnM6IHsgW2tleTogc3RyaW5nXTogVGh1bWJuYWlsR2VuZXJhdG9yIH0gPSB7fTtcblxuXG5mdW5jdGlvbiB0aHVtYk5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBsZXQgZXh0ID0gUGF0aC5leHRuYW1lKHBhdGgpLCBiYXNlbmFtZSA9IFBhdGguYmFzZW5hbWUocGF0aCwgZXh0KSxcbiAgICAgICAgZGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpXG4gICAgZGlyID0gZGlyID09ICcuJyA/ICcnIDogZGlyID09ICcvJyA/IGRpciA6IGRpciArICcvJztcbiAgICBsZXQgdGh1bWJuYWlsID0gZGlyICsgYmFzZW5hbWUgKyAnLnRodW1ibmFpbC5wbmcnO1xuXG4gICAgcmV0dXJuIHRodW1ibmFpbDtcbn1cblxuXG5leHBvcnQgaW50ZXJmYWNlIFRodW1ibmFpbGVyT3B0aW9ucyB7XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRodW1ibmFpbGVyIHtcbiAgICBwcml2YXRlIF9hc3NldHM6IEFzc2V0cztcbiAgICBzdGF0aWMgc2V0R2VuZXJhdG9yKG1pbWU6IHN0cmluZyB8IHN0cmluZ1tdLCBnZW5lcmF0b3I6IFRodW1ibmFpbEdlbmVyYXRvcikge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkobWltZSkpIG1pbWUgPSBbPHN0cmluZz5taW1lXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gbWltZS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcInNldCBnZW5lcmF0b3IgJXNcIiwgbWltZVtpXSk7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yc1ttaW1lW2ldXSA9IGdlbmVyYXRvcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBzdGF0aWMgZ2V0R2VuZXJhdG9yKG1pbWU6c3RyaW5nKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gX2dlbmVyYXRvcnNbbWltZV07XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBUaHVtYm5haWxlck9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fb25Bc3NldFJlbW92ZSA9IHRoaXMuX29uQXNzZXRSZW1vdmUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0aWFsaXplKGFzc2V0czogQXNzZXRzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuX2Fzc2V0cyA9IGFzc2V0cztcbiAgICAgICAgYXNzZXRzLnJlZ2lzdGVySG9vayhIb29rLlJlbW92ZSwgdGhpcy5fb25Bc3NldFJlbW92ZSk7XG4gICAgfVxuXG5cblxuICAgIGFzeW5jIHJlcXVlc3QoYXNzZXQ6IElGaWxlLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIGlmICgoYXdhaXQgdGhpcy5oYXMoYXNzZXQsIG9wdGlvbnMpKSkge1xuICAgICAgICAgICAgbGV0IHBhdGggPSB0aHVtYk5hbWUoYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgZGVidWcoJ3JlcXVlc3QgJXMnLCBwYXRoKVxuICAgICAgICAgICAgbGV0IHN0cmVhbSA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5zdHJlYW0oPGFueT57XG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHBhdGgsXG4gICAgICAgICAgICAgICAgcGF0aDogYXNzZXQucGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBhc3luYyBoYXMoYXNzZXQ6IElGaWxlLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5jYW5UaHVtYm5haWwoYXNzZXQubWltZSkpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICBpZiAoYXNzZXQubWV0YSAmJiBhc3NldC5tZXRhWyd0aHVtYm5haWwnXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBwYXRoID0gdGh1bWJOYW1lKGFzc2V0LmZpbGVuYW1lKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsZXQgZnAgPSBQYXRoLmpvaW4oYXNzZXQucGF0aCwgcGF0aCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRlYnVnKCd0aHVtYm5hbWUgJXMnLCBwYXRoKVxuICAgICAgICAgICAgaWYgKGF3YWl0IHRoaXMuX2Fzc2V0cy5oYXMoZnAsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoJ2FscmVhZHkgaGF2ZSB0aHVtYm5haWwnKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsZXQgaW5mbyA9IGF3YWl0IHRoaXMuX2dlbmVyYXRlVGh1bWJuYWlsKGFzc2V0LCBwYXRoLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKGluZm8gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlYnVnKCdpbmZvIGlzIG51bGwnKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZGVidWcoJ2NvdWxkIG5vdCBnZW5lcmF0ZSB0aHVtYm5haWwgJywgZS5tZXNzYWdlKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUuc3RhY2spXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYW5UaHVtYm5haWwobWltZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGRlYnVnKCdjYW4gdGh1bW5haWwgJXM6ICVzJywgbWltZSwgISFfZ2VuZXJhdG9yc1ttaW1lXSk7XG4gICAgICAgIHJldHVybiAhIV9nZW5lcmF0b3JzW21pbWVdO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2dlbmVyYXRlVGh1bWJuYWlsKGFzc2V0OiBJRmlsZSwgZmlsZW5hbWU6IHN0cmluZywgb3B0aW9ucz86YW55KTogUHJvbWlzZTxJRmlsZT4ge1xuXG4gICAgICAgIGxldCBnZW5lcmF0b3IgPSBUaHVtYm5haWxlci5nZXRHZW5lcmF0b3IoYXNzZXQubWltZSk7XG5cbiAgICAgICAgaWYgKCFnZW5lcmF0b3IpIHRocm93IG5ldyBFcnJvcihcIm5vIHRodW1ibmFpbGVyXCIpO1xuXG4gICAgICAgIGxldCBycyA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5zdHJlYW0oPGFueT5hc3NldCk7XG5cbiAgICAgICAgaWYgKCFycykgdGhyb3cgbmV3IEVycm9yKCdubyBzdHJlYW0nKTtcblxuICAgICAgICBsZXQge3N0cmVhbSwgaW5mb30gPSBhd2FpdCBnZW5lcmF0b3IocnMpO1xuXG4gICAgICAgIGlmIChpbmZvIGluc3RhbmNlb2YgQXNzZXQpIHtcbiAgICAgICAgICAgIGluZm8gPSAoPGFueT5pbmZvKS50b0pTT04oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluZm8ucGF0aCA9IGFzc2V0LnBhdGg7XG4gICAgICAgIGluZm8uZmlsZW5hbWUgPSBmaWxlbmFtZVxuICAgICAgICBpbmZvLmhpZGRlbiA9IHRydWU7XG4gICAgICAgIGluZm8ubWV0YVsndGh1bWJuYWlsJ10gPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgaW5mbyA9IE9iamVjdC5hc3NpZ24oe30sIGluZm8sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgcGF0aCA9IFBhdGguam9pbihpbmZvLnBhdGgsIGluZm8uZmlsZW5hbWUpXG4gICAgICAgIFxuICAgICAgICBpZiAoc3RyZWFtICYmIGluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9hc3NldHMuY3JlYXRlKHN0cmVhbSwgcGF0aCwgaW5mbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfb25Bc3NldFJlbW92ZShhc3NldDogSUZpbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKGFzc2V0Lm1ldGEgJiYgYXNzZXQubWV0YVsnZGVzdHJveWVkJ10pIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGxldCBwYXRoID0gdGh1bWJOYW1lKGFzc2V0LmZpbGVuYW1lKTtcbiAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCB0aHVtYm5haWwgPSBhd2FpdCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKFBhdGguam9pbihhc3NldC5wYXRoLHBhdGgpKTtcbiAgICAgICAgICAgIGlmICh0aHVtYm5haWwgJiYgdGh1bWJuYWlsLm1ldGFbJ3RodW1ibmFpbCddID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZGVidWcoXCJyZW1vdmluZyB0aHVtYm5haWwgYXNzb2NpYXRlZCB3aXRoICVqXCIsIGFzc2V0KVxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2Fzc2V0cy5yZW1vdmUoPGFueT57cGF0aDogYXNzZXQucGF0aCwgZmlsZW5hbWU6IHBhdGh9KTsgICAgXG4gICAgICAgICAgICAgICAgYXNzZXQubWV0YSA9IHsgJ2Rlc3Ryb3llZCc6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9IGNhdGNoIChlKSB7IFxuICAgICAgICAgICBjb25zb2xlLmxvZygnY291bGQgbm90IHJlbW92ZSB0aHVtbmFpbCAlcycsIHBhdGgsIGUpIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
