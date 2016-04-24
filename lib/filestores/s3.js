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
var repository_1 = require('../repository');
var Path = require('path');
var Debug = require('debug');
var debug = Debug('assets:filestore:s3');
var knox = require('knox');
var MAX_FILE_SIZE = 1024 * 1024 * 10;

var S3Error = function (_Error) {
    _inherits(S3Error, _Error);

    function S3Error() {
        _classCallCheck(this, S3Error);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(S3Error).apply(this, arguments));
    }

    return S3Error;
}(Error);

exports.S3Error = S3Error;

var S3FileStore = function () {
    function S3FileStore(options) {
        _classCallCheck(this, S3FileStore);

        this.options = options;
        if (!options) throw new S3Error('you must specify options');
        this.knox = knox.createClient({
            key: options.key,
            secret: options.secret,
            bucket: options.bucket,
            region: options.region
        });
    }

    _createClass(S3FileStore, [{
        key: 'initialize',
        value: function initialize() {
            return __awaiter(this, void 0, Promise, function* () {});
        }
    }, {
        key: 'create',
        value: function create(asset, stream, options) {
            return __awaiter(this, void 0, Promise, function* () {
                var headers = {
                    'Content-Type': asset.mime,
                    'Content-Length': asset.size,
                    'x-amz-acl': this.options.public ? 'public-read' : 'private'
                };
                var path = Path.join(asset.path, asset.filename);
                // check to see if we should use multipart
                if (asset.size > MAX_FILE_SIZE) {
                    console.log("MAX_FILE_SIZE");
                } else {
                    debug('uploading to "%s": %j', path, headers);
                    var resp = yield this._putStream(stream, path, headers);
                    if (resp.statusCode !== 200) {
                        var body = yield _readBody(resp);
                        throw new Error(body);
                    }
                    debug('uploaded to "%s", %j', path, headers);
                    asset.meta['s3_url'] = this.knox.url(path);
                }
                return asset;
            });
        }
    }, {
        key: 'remove',
        value: function remove(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                var path = Path.join(asset.path, asset.filename);
                yield this._deleteFile(path);
                return asset;
            });
        }
    }, {
        key: 'stream',
        value: function stream(asset) {
            return __awaiter(this, void 0, Promise, function* () {
                var path = Path.join(asset.path, asset.filename);
                return yield this._getStream(path);
            });
        }
    }, {
        key: '_putStream',
        value: function _putStream(stream, dest, headers) {
            return __awaiter(this, void 0, Promise, function* () {
                var _this2 = this;

                return new Promise(function (resolve, reject) {
                    _this2.knox.putStream(stream, dest, headers, function (err, resp) {
                        if (err) return reject(err);
                        resolve(resp);
                    });
                });
            });
        }
    }, {
        key: '_getStream',
        value: function _getStream(path) {
            return __awaiter(this, void 0, Promise, function* () {
                var _this3 = this;

                return new Promise(function (resolve, reject) {
                    _this3.knox.getFile(path, function (err, res) {
                        if (err) return reject(err);
                        resolve(res);
                    });
                });
            });
        }
    }, {
        key: '_deleteFile',
        value: function _deleteFile(path) {
            return __awaiter(this, void 0, Promise, function* () {
                var _this4 = this;

                return new Promise(function (resolve, reject) {
                    _this4.knox.deleteFile(path, function (err, res) {
                        if (err) return reject(err);
                        resolve(null);
                    });
                });
            });
        }
    }]);

    return S3FileStore;
}();

exports.S3FileStore = S3FileStore;
repository_1.registerFileStore('s3', S3FileStore);
function _readBody(req) {
    return new Promise(function (resolve, reject) {
        var buffer = [];
        req.on('data', function (data) {
            buffer.push(data);
        });
        req.on('end', function () {
            resolve(Buffer.concat(buffer).toString());
        });
        req.on('error', reject);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGVzdG9yZXMvczMuanMiLCJmaWxlc3RvcmVzL3MzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7O0FBQ0EsSUFBSSxZQUFZLFNBQUMsSUFBUSxVQUFLLFNBQUwsSUFBbUIsVUFBVSxPQUFWLEVBQW1CLFVBQW5CLEVBQStCLENBQS9CLEVBQWtDLFNBQWxDLEVBQTZDO0FBQ3JGLFdBQU8sS0FBSyxNQUFNLElBQUksT0FBSixDQUFOLENBQUwsQ0FBeUIsVUFBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCO0FBQ3ZELGlCQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsSUFBVixDQUFlLEtBQWYsQ0FBTCxFQUFGO2FBQUosQ0FBcUMsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsS0FBVixDQUFnQixLQUFoQixDQUFMLEVBQUY7YUFBSixDQUFzQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0I7QUFBRSxtQkFBTyxJQUFQLEdBQWMsUUFBUSxPQUFPLEtBQVAsQ0FBdEIsR0FBc0MsSUFBSSxDQUFKLENBQU0sVUFBVSxPQUFWLEVBQW1CO0FBQUUsd0JBQVEsT0FBTyxLQUFQLENBQVIsQ0FBRjthQUFuQixDQUFOLENBQXFELElBQXJELENBQTBELFNBQTFELEVBQXFFLFFBQXJFLENBQXRDLENBQUY7U0FBdEI7QUFDQSxhQUFLLENBQUMsWUFBWSxVQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsRUFBeUIsVUFBekIsQ0FBWixDQUFELENBQW1ELElBQW5ELEVBQUwsRUFKdUQ7S0FBM0IsQ0FBaEMsQ0FEcUY7Q0FBN0M7QUNFNUMsSUFBQSxlQUFBLFFBQWdDLGVBQWhDLENBQUE7QUFFQSxJQUFZLE9BQUksUUFBTSxNQUFOLENBQUo7QUFDWixJQUFZLFFBQUssUUFBTSxPQUFOLENBQUw7QUFHWixJQUFNLFFBQVEsTUFBTSxxQkFBTixDQUFSO0FBR04sSUFBTSxPQUFPLFFBQVEsTUFBUixDQUFQO0FBRU4sSUFBTSxnQkFBZ0IsT0FBTyxJQUFQLEdBQWMsRUFBZDs7SUFhdEI7Ozs7Ozs7Ozs7RUFBNkI7O0FBQWhCLFFBQUEsT0FBQSxHQUFPLE9BQVA7O0lBR2I7QUFFSSxhQUZKLFdBRUksQ0FBb0IsT0FBcEIsRUFBOEM7OEJBRmxELGFBRWtEOztBQUExQixhQUFBLE9BQUEsR0FBQSxPQUFBLENBQTBCO0FBQzFDLFlBQUksQ0FBQyxPQUFELEVBQVUsTUFBTSxJQUFJLE9BQUosQ0FBWSwwQkFBWixDQUFOLENBQWQ7QUFFQSxhQUFLLElBQUwsR0FBWSxLQUFLLFlBQUwsQ0FBa0I7QUFDMUIsaUJBQUssUUFBUSxHQUFSO0FBQ0wsb0JBQVEsUUFBUSxNQUFSO0FBQ1Isb0JBQVEsUUFBUSxNQUFSO0FBQ1Isb0JBQVEsUUFBUSxNQUFSO1NBSkEsQ0FBWixDQUgwQztLQUE5Qzs7aUJBRko7O3FDQWVvQjtBRGRaLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhLEVBQWIsQ0FBeEMsQ0NjWTs7OzsrQkFJSCxPQUFjLFFBQWtCLFNBQVk7QURkckQsbUJBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7QUNnQnJELG9CQUFJLFVBQVU7QUFDVixvQ0FBZ0IsTUFBTSxJQUFOO0FBQ2hCLHNDQUFrQixNQUFNLElBQU47QUFDbEIsaUNBQWMsS0FBSyxPQUFMLENBQWEsTUFBYixHQUF1QixhQUF2QixHQUF1QyxTQUF2QztpQkFIZCxDRGhCaUQ7QUN1QnJELG9CQUFJLE9BQU8sS0FBSyxJQUFMLENBQVUsTUFBTSxJQUFOLEVBQVksTUFBTSxRQUFOLENBQTdCOztBRHZCaUQsb0JDMEJqRCxNQUFNLElBQU4sR0FBYSxhQUFiLEVBQTRCO0FBQzdCLDRCQUFRLEdBQVIsQ0FBWSxlQUFaLEVBRDZCO2lCQUFoQyxNQUVPO0FBRUwsMEJBQU0sdUJBQU4sRUFBK0IsSUFBL0IsRUFBcUMsT0FBckMsRUFGSztBQUdMLHdCQUFJLE9BQU8sTUFBTSxLQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsRUFBd0IsSUFBeEIsRUFBOEIsT0FBOUIsQ0FBTixDQUhOO0FBS0wsd0JBQUksS0FBSyxVQUFMLEtBQW9CLEdBQXBCLEVBQXlCO0FBQ3pCLDRCQUFJLE9BQU8sTUFBTSxVQUFVLElBQVYsQ0FBTixDQURjO0FBRXpCLDhCQUFNLElBQUksS0FBSixDQUFVLElBQVYsQ0FBTixDQUZ5QjtxQkFBN0I7QUFJQSwwQkFBTSxzQkFBTixFQUE4QixJQUE5QixFQUFvQyxPQUFwQyxFQVRLO0FBVUwsMEJBQU0sSUFBTixDQUFXLFFBQVgsSUFBdUIsS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLElBQWQsQ0FBdkIsQ0FWSztpQkFGUDtBQWdCQSx1QkFBTyxLQUFQLENEMUNxRDthQUFiLENBQXhDLENDY3FEOzs7OytCQWdDNUMsT0FBWTtBRHJCckIsbUJBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7QUNzQnJELG9CQUFJLE9BQU8sS0FBSyxJQUFMLENBQVUsTUFBTSxJQUFOLEVBQVksTUFBTSxRQUFOLENBQTdCLENEdEJpRDtBQ3dCckQsc0JBQU0sS0FBSyxXQUFMLENBQWlCLElBQWpCLENBQU4sQ0R4QnFEO0FDeUJyRCx1QkFBTyxLQUFQLENEekJxRDthQUFiLENBQXhDLENDcUJxQjs7OzsrQkFRWixPQUFZO0FEdEJyQixtQkFBTyxVQUFVLElBQVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTtBQ3VCckQsb0JBQUksT0FBTyxLQUFLLElBQUwsQ0FBVSxNQUFNLElBQU4sRUFBWSxNQUFNLFFBQU4sQ0FBN0IsQ0R2QmlEO0FDd0JyRCx1QkFBTyxNQUFNLEtBQUssVUFBTCxDQUFnQixJQUFoQixDQUFOLENEeEI4QzthQUFiLENBQXhDLENDc0JxQjs7OzttQ0FNQyxRQUFrQixNQUFjLFNBQVk7QUR0QmxFLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhOzs7QUN1QnJELHVCQUFPLElBQUksT0FBSixDQUFrQyxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQWdCO0FBQ3JELDJCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLE1BQXBCLEVBQTRCLElBQTVCLEVBQWtDLE9BQWxDLEVBQTJDLFVBQUMsR0FBRCxFQUFNLElBQU4sRUFBVTtBQUNqRCw0QkFBSSxHQUFKLEVBQVMsT0FBTyxPQUFPLEdBQVAsQ0FBUCxDQUFUO0FBQ0EsZ0NBQVEsSUFBUixFQUZpRDtxQkFBVixDQUEzQyxDQURxRDtpQkFBaEIsQ0FBekMsQ0R2QnFEO2FBQWIsQ0FBeEMsQ0NzQmtFOzs7O21DQVU3QyxNQUFXO0FEckJoQyxtQkFBTyxVQUFVLElBQVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTs7O0FDc0JyRCx1QkFBTyxJQUFJLE9BQUosQ0FBc0IsVUFBQyxPQUFELEVBQVUsTUFBVixFQUFnQjtBQUMxQywyQkFBSyxJQUFMLENBQVUsT0FBVixDQUFrQixJQUFsQixFQUF3QixVQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVM7QUFDOUIsNEJBQUksR0FBSixFQUFTLE9BQU8sT0FBTyxHQUFQLENBQVAsQ0FBVDtBQUNBLGdDQUFRLEdBQVIsRUFGOEI7cUJBQVQsQ0FBeEIsQ0FEMEM7aUJBQWhCLENBQTdCLENEdEJxRDthQUFiLENBQXhDLENDcUJnQzs7OztvQ0FTVixNQUFZO0FEbkJsQyxtQkFBTyxVQUFVLElBQVYsRUFBZ0IsS0FBSyxDQUFMLEVBQVEsT0FBeEIsRUFBaUMsYUFBYTs7O0FDb0JyRCx1QkFBTyxJQUFJLE9BQUosQ0FBa0IsVUFBQyxPQUFELEVBQVUsTUFBVixFQUFnQjtBQUN0QywyQkFBSyxJQUFMLENBQVUsVUFBVixDQUFxQixJQUFyQixFQUEyQixVQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVM7QUFDakMsNEJBQUksR0FBSixFQUFTLE9BQU8sT0FBTyxHQUFQLENBQVAsQ0FBVDtBQUNBLGdDQUFRLElBQVIsRUFGaUM7cUJBQVQsQ0FBM0IsQ0FEc0M7aUJBQWhCLENBQXpCLENEcEJxRDthQUFiLENBQXhDLENDbUJrQzs7OztXQXBGMUM7OztBQUFhLFFBQUEsV0FBQSxHQUFXLFdBQVg7QUFnR2IsYUFBQSxpQkFBQSxDQUFrQixJQUFsQixFQUF3QixXQUF4QjtBQUdBLFNBQUEsU0FBQSxDQUFtQixHQUFuQixFQUE0QztBQUNwQyxXQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBZ0I7QUFFaEMsWUFBSSxTQUFTLEVBQVQsQ0FGNEI7QUFJaEMsWUFBSSxFQUFKLENBQU8sTUFBUCxFQUFlLFVBQUMsSUFBRCxFQUFLO0FBQ2hCLG1CQUFPLElBQVAsQ0FBWSxJQUFaLEVBRGdCO1NBQUwsQ0FBZixDQUpnQztBQVFoQyxZQUFJLEVBQUosQ0FBTyxLQUFQLEVBQWMsWUFBQTtBQUNWLG9CQUFRLE9BQU8sTUFBUCxDQUFjLE1BQWQsRUFBc0IsUUFBdEIsRUFBUixFQURVO1NBQUEsQ0FBZCxDQVJnQztBQVloQyxZQUFJLEVBQUosQ0FBTyxPQUFQLEVBQWdCLE1BQWhCLEVBWmdDO0tBQWhCLENBQW5CLENBRG9DO0NBQTVDIiwiZmlsZSI6ImZpbGVzdG9yZXMvczMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLnRocm93KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHJlc3VsdC52YWx1ZSk7IH0pLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMpKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNvbnN0IHJlcG9zaXRvcnlfMSA9IHJlcXVpcmUoJy4uL3JlcG9zaXRvcnknKTtcbmNvbnN0IFBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBEZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHM6ZmlsZXN0b3JlOnMzJyk7XG5jb25zdCBrbm94ID0gcmVxdWlyZSgna25veCcpO1xuY29uc3QgTUFYX0ZJTEVfU0laRSA9IDEwMjQgKiAxMDI0ICogMTA7XG5jbGFzcyBTM0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xufVxuZXhwb3J0cy5TM0Vycm9yID0gUzNFcnJvcjtcbmNsYXNzIFMzRmlsZVN0b3JlIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIGlmICghb3B0aW9ucylcbiAgICAgICAgICAgIHRocm93IG5ldyBTM0Vycm9yKCd5b3UgbXVzdCBzcGVjaWZ5IG9wdGlvbnMnKTtcbiAgICAgICAgdGhpcy5rbm94ID0ga25veC5jcmVhdGVDbGllbnQoe1xuICAgICAgICAgICAga2V5OiBvcHRpb25zLmtleSxcbiAgICAgICAgICAgIHNlY3JldDogb3B0aW9ucy5zZWNyZXQsXG4gICAgICAgICAgICBidWNrZXQ6IG9wdGlvbnMuYnVja2V0LFxuICAgICAgICAgICAgcmVnaW9uOiBvcHRpb25zLnJlZ2lvblxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGUoYXNzZXQsIHN0cmVhbSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiBhc3NldC5taW1lLFxuICAgICAgICAgICAgICAgICdDb250ZW50LUxlbmd0aCc6IGFzc2V0LnNpemUsXG4gICAgICAgICAgICAgICAgJ3gtYW16LWFjbCc6IHRoaXMub3B0aW9ucy5wdWJsaWMgPyAncHVibGljLXJlYWQnIDogJ3ByaXZhdGUnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IHBhdGggPSBQYXRoLmpvaW4oYXNzZXQucGF0aCwgYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHdlIHNob3VsZCB1c2UgbXVsdGlwYXJ0XG4gICAgICAgICAgICBpZiAoYXNzZXQuc2l6ZSA+IE1BWF9GSUxFX1NJWkUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1BWF9GSUxFX1NJWkVcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWJ1ZygndXBsb2FkaW5nIHRvIFwiJXNcIjogJWonLCBwYXRoLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzcCA9IHlpZWxkIHRoaXMuX3B1dFN0cmVhbShzdHJlYW0sIHBhdGgsIGhlYWRlcnMpO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9IHlpZWxkIF9yZWFkQm9keShyZXNwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGJvZHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWJ1ZygndXBsb2FkZWQgdG8gXCIlc1wiLCAlaicsIHBhdGgsIGhlYWRlcnMpO1xuICAgICAgICAgICAgICAgIGFzc2V0Lm1ldGFbJ3MzX3VybCddID0gdGhpcy5rbm94LnVybChwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZShhc3NldCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBwYXRoID0gUGF0aC5qb2luKGFzc2V0LnBhdGgsIGFzc2V0LmZpbGVuYW1lKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX2RlbGV0ZUZpbGUocGF0aCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXQ7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzdHJlYW0oYXNzZXQpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgcGF0aCA9IFBhdGguam9pbihhc3NldC5wYXRoLCBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5fZ2V0U3RyZWFtKHBhdGgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX3B1dFN0cmVhbShzdHJlYW0sIGRlc3QsIGhlYWRlcnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMua25veC5wdXRTdHJlYW0oc3RyZWFtLCBkZXN0LCBoZWFkZXJzLCAoZXJyLCByZXNwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9nZXRTdHJlYW0ocGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5rbm94LmdldEZpbGUocGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2RlbGV0ZUZpbGUocGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5rbm94LmRlbGV0ZUZpbGUocGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TM0ZpbGVTdG9yZSA9IFMzRmlsZVN0b3JlO1xucmVwb3NpdG9yeV8xLnJlZ2lzdGVyRmlsZVN0b3JlKCdzMycsIFMzRmlsZVN0b3JlKTtcbmZ1bmN0aW9uIF9yZWFkQm9keShyZXEpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgYnVmZmVyID0gW107XG4gICAgICAgIHJlcS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICBidWZmZXIucHVzaChkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGJ1ZmZlcikudG9TdHJpbmcoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXEub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICB9KTtcbn1cbiIsIlxuaW1wb3J0IHtJRmlsZVN0b3JlLCBJRmlsZX0gZnJvbSAnLi4vaW50ZXJmYWNlJztcbmltcG9ydCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQge3JlZ2lzdGVyRmlsZVN0b3JlfSBmcm9tICcuLi9yZXBvc2l0b3J5JztcblxuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czpmaWxlc3RvcmU6czMnKVxuXG5cbmNvbnN0IGtub3ggPSByZXF1aXJlKCdrbm94Jyk7XG5cbmNvbnN0IE1BWF9GSUxFX1NJWkUgPSAxMDI0ICogMTAyNCAqIDEwO1xuXG5leHBvcnQgaW50ZXJmYWNlIFMzRmlsZVN0b3JlT3B0aW9ucyB7XG4gICAga2V5OiBzdHJpbmc7XG4gICAgc2VjcmV0OiBzdHJpbmc7XG4gICAgYnVja2V0OiBzdHJpbmc7XG4gICAgcHVibGljPzogYm9vbGVhbjtcbiAgICBlbmRwb2ludD86IHN0cmluZztcbiAgICByZWdpb24/OiBzdHJpbmc7XG4gICAgcG9ydD86bnVtYmVyO1xuICAgIHNlY3VyZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBTM0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xufVxuXG5leHBvcnQgY2xhc3MgUzNGaWxlU3RvcmUgaW1wbGVtZW50cyBJRmlsZVN0b3JlIHtcbiAgICBrbm94OiBhbnk7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOlMzRmlsZVN0b3JlT3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBTM0Vycm9yKCd5b3UgbXVzdCBzcGVjaWZ5IG9wdGlvbnMnKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMua25veCA9IGtub3guY3JlYXRlQ2xpZW50KHtcbiAgICAgICAgICAgIGtleTogb3B0aW9ucy5rZXksXG4gICAgICAgICAgICBzZWNyZXQ6IG9wdGlvbnMuc2VjcmV0LFxuICAgICAgICAgICAgYnVja2V0OiBvcHRpb25zLmJ1Y2tldCxcbiAgICAgICAgICAgIHJlZ2lvbjogb3B0aW9ucy5yZWdpb25cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgY3JlYXRlKGFzc2V0OiBJRmlsZSwgc3RyZWFtOiBSZWFkYWJsZSwgb3B0aW9ucz86YW55KTogUHJvbWlzZTxJRmlsZT4ge1xuICAgICAgICBcbiAgICAgICAgbGV0IGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogYXNzZXQubWltZSxcbiAgICAgICAgICAgICdDb250ZW50LUxlbmd0aCc6IGFzc2V0LnNpemUsXG4gICAgICAgICAgICAneC1hbXotYWNsJzogIHRoaXMub3B0aW9ucy5wdWJsaWMgPyAgJ3B1YmxpYy1yZWFkJyA6ICdwcml2YXRlJ1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGxldCBwYXRoID0gUGF0aC5qb2luKGFzc2V0LnBhdGgsIGFzc2V0LmZpbGVuYW1lKTtcbiAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHdlIHNob3VsZCB1c2UgbXVsdGlwYXJ0XG4gICAgICAgIFxuICAgICAgICBpZiAoYXNzZXQuc2l6ZSA+IE1BWF9GSUxFX1NJWkUpIHtcbiAgICAgICAgICAgY29uc29sZS5sb2coXCJNQVhfRklMRV9TSVpFXCIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgXG4gICAgICAgICAgZGVidWcoJ3VwbG9hZGluZyB0byBcIiVzXCI6ICVqJywgcGF0aCwgaGVhZGVycyk7ICBcbiAgICAgICAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuX3B1dFN0cmVhbShzdHJlYW0sIHBhdGgsIGhlYWRlcnMpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICBpZiAocmVzcC5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICAgICAgbGV0IGJvZHkgPSBhd2FpdCBfcmVhZEJvZHkocmVzcClcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGJvZHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZWJ1ZygndXBsb2FkZWQgdG8gXCIlc1wiLCAlaicsIHBhdGgsIGhlYWRlcnMpO1xuICAgICAgICAgIGFzc2V0Lm1ldGFbJ3MzX3VybCddID0gdGhpcy5rbm94LnVybChwYXRoKTtcbiAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgIFxuICAgIH1cbiAgICBcbiAgICBhc3luYyByZW1vdmUoYXNzZXQ6IElGaWxlKTogUHJvbWlzZTxJRmlsZT4ge1xuICAgICAgICBsZXQgcGF0aCA9IFBhdGguam9pbihhc3NldC5wYXRoLCBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgIFxuICAgICAgICBhd2FpdCB0aGlzLl9kZWxldGVGaWxlKHBhdGgpO1xuICAgICAgICByZXR1cm4gYXNzZXRcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIHN0cmVhbShhc3NldDogSUZpbGUpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIGxldCBwYXRoID0gUGF0aC5qb2luKGFzc2V0LnBhdGgsIGFzc2V0LmZpbGVuYW1lKVxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fZ2V0U3RyZWFtKHBhdGgpXG4gICAgfVxuICAgIFxuICAgIFxuICAgIHByaXZhdGUgYXN5bmMgX3B1dFN0cmVhbSAoc3RyZWFtOiBSZWFkYWJsZSwgZGVzdDpzdHJpbmcsICBoZWFkZXJzPzphbnkpOiBQcm9taXNlPGh0dHAuSW5jb21pbmdNZXNzYWdlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxodHRwLkluY29taW5nTWVzc2FnZT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5rbm94LnB1dFN0cmVhbShzdHJlYW0sIGRlc3QsIGhlYWRlcnMsIChlcnIsIHJlc3ApID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgICAgIH0pOyBcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBhc3luYyBfZ2V0U3RyZWFtKHBhdGg6c3RyaW5nKTogUHJvbWlzZTxSZWFkYWJsZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8UmVhZGFibGU+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgdGhpcy5rbm94LmdldEZpbGUocGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXMpO1xuICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHByaXZhdGUgYXN5bmMgX2RlbGV0ZUZpbGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgIHRoaXMua25veC5kZWxldGVGaWxlKHBhdGgsIChlcnIsIHJlcykgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgXG59XG5cbnJlZ2lzdGVyRmlsZVN0b3JlKCdzMycsIFMzRmlsZVN0b3JlKTtcblxuXG5mdW5jdGlvbiBfcmVhZEJvZHkocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgdmFyIGJ1ZmZlciA9IFtdO1xuXG4gICAgICAgICAgIHJlcS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICBidWZmZXIucHVzaChkYXRhKTtcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICByZXNvbHZlKEJ1ZmZlci5jb25jYXQoYnVmZmVyKS50b1N0cmluZygpKTtcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdCk7XG5cblxuICAgICAgICB9KTtcbiAgICB9Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
