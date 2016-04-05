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
        value: function create(asset, stream) {
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
        /*async has(asset: IFile): Promise<boolean> {
            
        }*/

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGVzdG9yZXMvczMuanMiLCJmaWxlc3RvcmVzL3MzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7O0FBQ0EsSUFBSSxZQUFZLFNBQUMsSUFBUSxVQUFLLFNBQUwsSUFBbUIsVUFBVSxPQUFWLEVBQW1CLFVBQW5CLEVBQStCLENBQS9CLEVBQWtDLFNBQWxDLEVBQTZDO0FBQ3JGLFdBQU8sS0FBSyxNQUFNLElBQUksT0FBSixDQUFOLENBQUwsQ0FBeUIsVUFBVSxPQUFWLEVBQW1CLE1BQW5CLEVBQTJCO0FBQ3ZELGlCQUFTLFNBQVQsQ0FBbUIsS0FBbkIsRUFBMEI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsSUFBVixDQUFlLEtBQWYsQ0FBTCxFQUFGO2FBQUosQ0FBcUMsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLFFBQVQsQ0FBa0IsS0FBbEIsRUFBeUI7QUFBRSxnQkFBSTtBQUFFLHFCQUFLLFVBQVUsS0FBVixDQUFnQixLQUFoQixDQUFMLEVBQUY7YUFBSixDQUFzQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0I7QUFBRSxtQkFBTyxJQUFQLEdBQWMsUUFBUSxPQUFPLEtBQVAsQ0FBdEIsR0FBc0MsSUFBSSxDQUFKLENBQU0sVUFBVSxPQUFWLEVBQW1CO0FBQUUsd0JBQVEsT0FBTyxLQUFQLENBQVIsQ0FBRjthQUFuQixDQUFOLENBQXFELElBQXJELENBQTBELFNBQTFELEVBQXFFLFFBQXJFLENBQXRDLENBQUY7U0FBdEI7QUFDQSxhQUFLLENBQUMsWUFBWSxVQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsRUFBeUIsVUFBekIsQ0FBWixDQUFELENBQW1ELElBQW5ELEVBQUwsRUFKdUQ7S0FBM0IsQ0FBaEMsQ0FEcUY7Q0FBN0M7QUNFNUMsSUFBQSxlQUFBLFFBQWdDLGVBQWhDLENBQUE7QUFFQSxJQUFZLE9BQUksUUFBTSxNQUFOLENBQUo7QUFDWixJQUFZLFFBQUssUUFBTSxPQUFOLENBQUw7QUFHWixJQUFNLFFBQVEsTUFBTSxxQkFBTixDQUFSO0FBR04sSUFBTSxPQUFPLFFBQVEsTUFBUixDQUFQO0FBRU4sSUFBTSxnQkFBZ0IsT0FBTyxJQUFQLEdBQWMsRUFBZDs7SUFhdEI7Ozs7Ozs7Ozs7RUFBNkI7O0FBQWhCLFFBQUEsT0FBQSxHQUFPLE9BQVA7O0lBR2I7QUFFSSxhQUZKLFdBRUksQ0FBb0IsT0FBcEIsRUFBOEM7OEJBRmxELGFBRWtEOztBQUExQixhQUFBLE9BQUEsR0FBQSxPQUFBLENBQTBCO0FBQzFDLFlBQUksQ0FBQyxPQUFELEVBQVUsTUFBTSxJQUFJLE9BQUosQ0FBWSwwQkFBWixDQUFOLENBQWQ7QUFFQSxhQUFLLElBQUwsR0FBWSxLQUFLLFlBQUwsQ0FBa0I7QUFDMUIsaUJBQUssUUFBUSxHQUFSO0FBQ0wsb0JBQVEsUUFBUSxNQUFSO0FBQ1Isb0JBQVEsUUFBUSxNQUFSO0FBQ1Isb0JBQVEsUUFBUSxNQUFSO1NBSkEsQ0FBWixDQUgwQztLQUE5Qzs7aUJBRko7O3FDQWVvQjtBRGRaLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhLEVBQWIsQ0FBeEMsQ0NjWTs7OzsrQkFJSCxPQUFjLFFBQWdCO0FEZHZDLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhO0FDZ0JyRCxvQkFBSSxVQUFVO0FBQ1Ysb0NBQWdCLE1BQU0sSUFBTjtBQUNoQixzQ0FBa0IsTUFBTSxJQUFOO0FBQ2xCLGlDQUFjLEtBQUssT0FBTCxDQUFhLE1BQWIsR0FBdUIsYUFBdkIsR0FBdUMsU0FBdkM7aUJBSGQsQ0RoQmlEO0FDdUJyRCxvQkFBSSxPQUFPLEtBQUssSUFBTCxDQUFVLE1BQU0sSUFBTixFQUFZLE1BQU0sUUFBTixDQUE3Qjs7QUR2QmlELG9CQzBCakQsTUFBTSxJQUFOLEdBQWEsYUFBYixFQUE0QjtBQUM3Qiw0QkFBUSxHQUFSLENBQVksZUFBWixFQUQ2QjtpQkFBaEMsTUFFTztBQUVMLDBCQUFNLHVCQUFOLEVBQStCLElBQS9CLEVBQXFDLE9BQXJDLEVBRks7QUFHTCx3QkFBSSxPQUFPLE1BQU0sS0FBSyxVQUFMLENBQWdCLE1BQWhCLEVBQXdCLElBQXhCLEVBQThCLE9BQTlCLENBQU4sQ0FITjtBQUtMLHdCQUFJLEtBQUssVUFBTCxLQUFvQixHQUFwQixFQUF5QjtBQUN6Qiw0QkFBSSxPQUFPLE1BQU0sVUFBVSxJQUFWLENBQU4sQ0FEYztBQUV6Qiw4QkFBTSxJQUFJLEtBQUosQ0FBVSxJQUFWLENBQU4sQ0FGeUI7cUJBQTdCO0FBSUEsMEJBQU0sc0JBQU4sRUFBOEIsSUFBOUIsRUFBb0MsT0FBcEMsRUFUSztBQVVMLDBCQUFNLElBQU4sQ0FBVyxRQUFYLElBQXVCLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxJQUFkLENBQXZCLENBVks7aUJBRlA7QUFnQkEsdUJBQU8sS0FBUCxDRDFDcUQ7YUFBYixDQUF4QyxDQ2N1Qzs7OzsrQkFnQzlCLE9BQVk7QURyQnJCLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhO0FDc0JyRCxvQkFBSSxPQUFPLEtBQUssSUFBTCxDQUFVLE1BQU0sSUFBTixFQUFZLE1BQU0sUUFBTixDQUE3QixDRHRCaUQ7QUN3QnJELHNCQUFNLEtBQUssV0FBTCxDQUFpQixJQUFqQixDQUFOLENEeEJxRDtBQ3lCckQsdUJBQU8sS0FBUCxDRHpCcUQ7YUFBYixDQUF4QyxDQ3FCcUI7Ozs7K0JBUVosT0FBWTtBRHRCckIsbUJBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7QUN1QnJELG9CQUFJLE9BQU8sS0FBSyxJQUFMLENBQVUsTUFBTSxJQUFOLEVBQVksTUFBTSxRQUFOLENBQTdCLENEdkJpRDtBQ3dCckQsdUJBQU8sTUFBTSxLQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBTixDRHhCOEM7YUFBYixDQUF4QyxDQ3NCcUI7Ozs7Ozs7O21DQVVDLFFBQWtCLE1BQWMsU0FBWTtBRHZCbEUsbUJBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7OztBQ3dCckQsdUJBQU8sSUFBSSxPQUFKLENBQWtDLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBZ0I7QUFDckQsMkJBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsTUFBcEIsRUFBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkMsVUFBQyxHQUFELEVBQU0sSUFBTixFQUFVO0FBQ2pELDRCQUFJLEdBQUosRUFBUyxPQUFPLE9BQU8sR0FBUCxDQUFQLENBQVQ7QUFDQSxnQ0FBUSxJQUFSLEVBRmlEO3FCQUFWLENBQTNDLENBRHFEO2lCQUFoQixDQUF6QyxDRHhCcUQ7YUFBYixDQUF4QyxDQ3VCa0U7Ozs7bUNBVTdDLE1BQVc7QUR0QmhDLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhOzs7QUN1QnJELHVCQUFPLElBQUksT0FBSixDQUFzQixVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQWdCO0FBQzFDLDJCQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLElBQWxCLEVBQXdCLFVBQUMsR0FBRCxFQUFNLEdBQU4sRUFBUztBQUM5Qiw0QkFBSSxHQUFKLEVBQVMsT0FBTyxPQUFPLEdBQVAsQ0FBUCxDQUFUO0FBQ0EsZ0NBQVEsR0FBUixFQUY4QjtxQkFBVCxDQUF4QixDQUQwQztpQkFBaEIsQ0FBN0IsQ0R2QnFEO2FBQWIsQ0FBeEMsQ0NzQmdDOzs7O29DQVNWLE1BQVk7QURwQmxDLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhOzs7QUNxQnJELHVCQUFPLElBQUksT0FBSixDQUFrQixVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQWdCO0FBQ3RDLDJCQUFLLElBQUwsQ0FBVSxVQUFWLENBQXFCLElBQXJCLEVBQTJCLFVBQUMsR0FBRCxFQUFNLEdBQU4sRUFBUztBQUNqQyw0QkFBSSxHQUFKLEVBQVMsT0FBTyxPQUFPLEdBQVAsQ0FBUCxDQUFUO0FBQ0EsZ0NBQVEsSUFBUixFQUZpQztxQkFBVCxDQUEzQixDQURzQztpQkFBaEIsQ0FBekIsQ0RyQnFEO2FBQWIsQ0FBeEMsQ0NvQmtDOzs7O1dBeEYxQzs7O0FBQWEsUUFBQSxXQUFBLEdBQVcsV0FBWDtBQW9HYixhQUFBLGlCQUFBLENBQWtCLElBQWxCLEVBQXdCLFdBQXhCO0FBR0EsU0FBQSxTQUFBLENBQW1CLEdBQW5CLEVBQTRDO0FBQ3BDLFdBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFELEVBQVUsTUFBVixFQUFnQjtBQUVoQyxZQUFJLFNBQVMsRUFBVCxDQUY0QjtBQUloQyxZQUFJLEVBQUosQ0FBTyxNQUFQLEVBQWUsVUFBQyxJQUFELEVBQUs7QUFDaEIsbUJBQU8sSUFBUCxDQUFZLElBQVosRUFEZ0I7U0FBTCxDQUFmLENBSmdDO0FBUWhDLFlBQUksRUFBSixDQUFPLEtBQVAsRUFBYyxZQUFBO0FBQ1Ysb0JBQVEsT0FBTyxNQUFQLENBQWMsTUFBZCxFQUFzQixRQUF0QixFQUFSLEVBRFU7U0FBQSxDQUFkLENBUmdDO0FBWWhDLFlBQUksRUFBSixDQUFPLE9BQVAsRUFBZ0IsTUFBaEIsRUFaZ0M7S0FBaEIsQ0FBbkIsQ0FEb0M7Q0FBNUMiLCJmaWxlIjoiZmlsZXN0b3Jlcy9zMy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgcmVwb3NpdG9yeV8xID0gcmVxdWlyZSgnLi4vcmVwb3NpdG9yeScpO1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IERlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czpmaWxlc3RvcmU6czMnKTtcbmNvbnN0IGtub3ggPSByZXF1aXJlKCdrbm94Jyk7XG5jb25zdCBNQVhfRklMRV9TSVpFID0gMTAyNCAqIDEwMjQgKiAxMDtcbmNsYXNzIFMzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG59XG5leHBvcnRzLlMzRXJyb3IgPSBTM0Vycm9yO1xuY2xhc3MgUzNGaWxlU3RvcmUge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgaWYgKCFvcHRpb25zKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFMzRXJyb3IoJ3lvdSBtdXN0IHNwZWNpZnkgb3B0aW9ucycpO1xuICAgICAgICB0aGlzLmtub3ggPSBrbm94LmNyZWF0ZUNsaWVudCh7XG4gICAgICAgICAgICBrZXk6IG9wdGlvbnMua2V5LFxuICAgICAgICAgICAgc2VjcmV0OiBvcHRpb25zLnNlY3JldCxcbiAgICAgICAgICAgIGJ1Y2tldDogb3B0aW9ucy5idWNrZXQsXG4gICAgICAgICAgICByZWdpb246IG9wdGlvbnMucmVnaW9uXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZShhc3NldCwgc3RyZWFtKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IGFzc2V0Lm1pbWUsXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogYXNzZXQuc2l6ZSxcbiAgICAgICAgICAgICAgICAneC1hbXotYWNsJzogdGhpcy5vcHRpb25zLnB1YmxpYyA/ICdwdWJsaWMtcmVhZCcgOiAncHJpdmF0ZSdcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgcGF0aCA9IFBhdGguam9pbihhc3NldC5wYXRoLCBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICAvLyBjaGVjayB0byBzZWUgaWYgd2Ugc2hvdWxkIHVzZSBtdWx0aXBhcnRcbiAgICAgICAgICAgIGlmIChhc3NldC5zaXplID4gTUFYX0ZJTEVfU0laRSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTUFYX0ZJTEVfU0laRVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlYnVnKCd1cGxvYWRpbmcgdG8gXCIlc1wiOiAlaicsIHBhdGgsIGhlYWRlcnMpO1xuICAgICAgICAgICAgICAgIGxldCByZXNwID0geWllbGQgdGhpcy5fcHV0U3RyZWFtKHN0cmVhbSwgcGF0aCwgaGVhZGVycyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0geWllbGQgX3JlYWRCb2R5KHJlc3ApO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYm9keSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlYnVnKCd1cGxvYWRlZCB0byBcIiVzXCIsICVqJywgcGF0aCwgaGVhZGVycyk7XG4gICAgICAgICAgICAgICAgYXNzZXQubWV0YVsnczNfdXJsJ10gPSB0aGlzLmtub3gudXJsKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFzc2V0O1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVtb3ZlKGFzc2V0KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHBhdGggPSBQYXRoLmpvaW4oYXNzZXQucGF0aCwgYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fZGVsZXRlRmlsZShwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBhc3NldDtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHN0cmVhbShhc3NldCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBwYXRoID0gUGF0aC5qb2luKGFzc2V0LnBhdGgsIGFzc2V0LmZpbGVuYW1lKTtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLl9nZXRTdHJlYW0ocGF0aCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKmFzeW5jIGhhcyhhc3NldDogSUZpbGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgXG4gICAgfSovXG4gICAgX3B1dFN0cmVhbShzdHJlYW0sIGRlc3QsIGhlYWRlcnMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMua25veC5wdXRTdHJlYW0oc3RyZWFtLCBkZXN0LCBoZWFkZXJzLCAoZXJyLCByZXNwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9nZXRTdHJlYW0ocGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5rbm94LmdldEZpbGUocGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2RlbGV0ZUZpbGUocGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5rbm94LmRlbGV0ZUZpbGUocGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TM0ZpbGVTdG9yZSA9IFMzRmlsZVN0b3JlO1xucmVwb3NpdG9yeV8xLnJlZ2lzdGVyRmlsZVN0b3JlKCdzMycsIFMzRmlsZVN0b3JlKTtcbmZ1bmN0aW9uIF9yZWFkQm9keShyZXEpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB2YXIgYnVmZmVyID0gW107XG4gICAgICAgIHJlcS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICBidWZmZXIucHVzaChkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGJ1ZmZlcikudG9TdHJpbmcoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXEub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICB9KTtcbn1cbiIsIlxuaW1wb3J0IHtJRmlsZVN0b3JlLCBJRmlsZX0gZnJvbSAnLi4vaW50ZXJmYWNlJztcbmltcG9ydCB7UmVhZGFibGV9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQge3JlZ2lzdGVyRmlsZVN0b3JlfSBmcm9tICcuLi9yZXBvc2l0b3J5JztcblxuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czpmaWxlc3RvcmU6czMnKVxuXG5cbmNvbnN0IGtub3ggPSByZXF1aXJlKCdrbm94Jyk7XG5cbmNvbnN0IE1BWF9GSUxFX1NJWkUgPSAxMDI0ICogMTAyNCAqIDEwO1xuXG5leHBvcnQgaW50ZXJmYWNlIFMzRmlsZVN0b3JlT3B0aW9ucyB7XG4gICAga2V5OiBzdHJpbmc7XG4gICAgc2VjcmV0OiBzdHJpbmc7XG4gICAgYnVja2V0OiBzdHJpbmc7XG4gICAgcHVibGljPzogYm9vbGVhbjtcbiAgICBlbmRwb2ludD86IHN0cmluZztcbiAgICByZWdpb24/OiBzdHJpbmc7XG4gICAgcG9ydD86bnVtYmVyO1xuICAgIHNlY3VyZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBTM0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xufVxuXG5leHBvcnQgY2xhc3MgUzNGaWxlU3RvcmUgaW1wbGVtZW50cyBJRmlsZVN0b3JlIHtcbiAgICBrbm94OiBhbnk7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOlMzRmlsZVN0b3JlT3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBTM0Vycm9yKCd5b3UgbXVzdCBzcGVjaWZ5IG9wdGlvbnMnKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMua25veCA9IGtub3guY3JlYXRlQ2xpZW50KHtcbiAgICAgICAgICAgIGtleTogb3B0aW9ucy5rZXksXG4gICAgICAgICAgICBzZWNyZXQ6IG9wdGlvbnMuc2VjcmV0LFxuICAgICAgICAgICAgYnVja2V0OiBvcHRpb25zLmJ1Y2tldCxcbiAgICAgICAgICAgIHJlZ2lvbjogb3B0aW9ucy5yZWdpb25cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgY3JlYXRlKGFzc2V0OiBJRmlsZSwgc3RyZWFtOiBSZWFkYWJsZSk6IFByb21pc2U8SUZpbGU+IHtcbiAgICAgICAgXG4gICAgICAgIGxldCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IGFzc2V0Lm1pbWUsXG4gICAgICAgICAgICAnQ29udGVudC1MZW5ndGgnOiBhc3NldC5zaXplLFxuICAgICAgICAgICAgJ3gtYW16LWFjbCc6ICB0aGlzLm9wdGlvbnMucHVibGljID8gICdwdWJsaWMtcmVhZCcgOiAncHJpdmF0ZSdcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBsZXQgcGF0aCA9IFBhdGguam9pbihhc3NldC5wYXRoLCBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiB3ZSBzaG91bGQgdXNlIG11bHRpcGFydFxuICAgICAgICBcbiAgICAgICAgaWYgKGFzc2V0LnNpemUgPiBNQVhfRklMRV9TSVpFKSB7XG4gICAgICAgICAgIGNvbnNvbGUubG9nKFwiTUFYX0ZJTEVfU0laRVwiKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIFxuICAgICAgICAgIGRlYnVnKCd1cGxvYWRpbmcgdG8gXCIlc1wiOiAlaicsIHBhdGgsIGhlYWRlcnMpOyAgXG4gICAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLl9wdXRTdHJlYW0oc3RyZWFtLCBwYXRoLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgaWYgKHJlc3Auc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG4gICAgICAgICAgICAgIGxldCBib2R5ID0gYXdhaXQgX3JlYWRCb2R5KHJlc3ApXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihib2R5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVidWcoJ3VwbG9hZGVkIHRvIFwiJXNcIiwgJWonLCBwYXRoLCBoZWFkZXJzKTtcbiAgICAgICAgICBhc3NldC5tZXRhWydzM191cmwnXSA9IHRoaXMua25veC51cmwocGF0aCk7XG4gICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhc3NldDtcbiAgICBcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgcmVtb3ZlKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8SUZpbGU+IHtcbiAgICAgICAgbGV0IHBhdGggPSBQYXRoLmpvaW4oYXNzZXQucGF0aCwgYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICBcbiAgICAgICAgYXdhaXQgdGhpcy5fZGVsZXRlRmlsZShwYXRoKTtcbiAgICAgICAgcmV0dXJuIGFzc2V0XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBhc3luYyBzdHJlYW0oYXNzZXQ6IElGaWxlKTogUHJvbWlzZTxSZWFkYWJsZT4ge1xuICAgICAgICBsZXQgcGF0aCA9IFBhdGguam9pbihhc3NldC5wYXRoLCBhc3NldC5maWxlbmFtZSlcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2dldFN0cmVhbShwYXRoKVxuICAgIH1cbiAgICBcbiAgICAvKmFzeW5jIGhhcyhhc3NldDogSUZpbGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgXG4gICAgfSovXG4gICAgXG4gICAgXG4gICAgcHJpdmF0ZSBhc3luYyBfcHV0U3RyZWFtIChzdHJlYW06IFJlYWRhYmxlLCBkZXN0OnN0cmluZywgIGhlYWRlcnM/OmFueSk6IFByb21pc2U8aHR0cC5JbmNvbWluZ01lc3NhZ2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGh0dHAuSW5jb21pbmdNZXNzYWdlPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmtub3gucHV0U3RyZWFtKHN0cmVhbSwgZGVzdCwgaGVhZGVycywgKGVyciwgcmVzcCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICAgICAgfSk7IFxuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBwcml2YXRlIGFzeW5jIF9nZXRTdHJlYW0ocGF0aDpzdHJpbmcpOiBQcm9taXNlPFJlYWRhYmxlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxSZWFkYWJsZT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICB0aGlzLmtub3guZ2V0RmlsZShwYXRoLCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICByZXNvbHZlKHJlcyk7XG4gICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBhc3luYyBfZGVsZXRlRmlsZShwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgdGhpcy5rbm94LmRlbGV0ZUZpbGUocGF0aCwgKGVyciwgcmVzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBcbn1cblxucmVnaXN0ZXJGaWxlU3RvcmUoJ3MzJywgUzNGaWxlU3RvcmUpO1xuXG5cbmZ1bmN0aW9uIF9yZWFkQm9keShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICB2YXIgYnVmZmVyID0gW107XG5cbiAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGRhdGEpO1xuICAgICAgICAgICB9KTtcblxuICAgICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgIHJlc29sdmUoQnVmZmVyLmNvbmNhdChidWZmZXIpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICB9KTtcblxuICAgICAgICAgICByZXEub24oJ2Vycm9yJywgcmVqZWN0KTtcblxuXG4gICAgICAgIH0pO1xuICAgIH0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
