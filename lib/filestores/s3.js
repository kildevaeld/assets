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
    }, {
        key: 'has',
        value: function has(asset) {
            return __awaiter(this, void 0, Promise, function* () {});
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