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
var Path = require('path');
var querystring = require('querystring');
var Debug = require('debug');
var formidable = require('formidable');
var debug = Debug('assets:http'),
    pathToRegexp = require('path-to-regexp');
function toBoolean(str) {
    return !! ~['true', 'TRUE', 't', 'y', 'j', 'yes'].indexOf(str);
}

var HttpError = function (_Error) {
    _inherits(HttpError, _Error);

    function HttpError(msg) {
        var code = arguments.length <= 1 || arguments[1] === undefined ? 200 : arguments[1];

        _classCallCheck(this, HttpError);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HttpError).call(this, msg));

        _this.message = msg;
        _this.code = code;
        return _this;
    }

    _createClass(HttpError, [{
        key: 'toJSON',
        value: function toJSON() {
            return {
                code: this.code,
                message: this.message
            };
        }
    }]);

    return HttpError;
}(Error);

var AssetsRouter = function () {
    function AssetsRouter(_assets) {
        var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, AssetsRouter);

        this._assets = _assets;
        this.opts = opts;
        var prefix = opts.prefix;
        if (prefix == null || prefix === "") prefix = "/";
        if (prefix !== "/") {
            if (prefix[prefix.length - 1] !== "/") prefix += '/';
        }
        this.opts.prefix = prefix;
        this._routes = [{
            method: ['GET', 'DELETE'],
            reg: pathToRegexp(prefix),
            fn: 'list'
        }, {
            method: ['GET'],
            reg: pathToRegexp(prefix + "*"),
            fn: 'getResource'
        }, {
            method: ['POST'],
            reg: pathToRegexp(prefix),
            fn: 'create'
        }, {
            method: ['DELETE'],
            reg: pathToRegexp(prefix + '*'),
            fn: 'removeResource'
        }];
    }

    _createClass(AssetsRouter, [{
        key: 'middlewareKoa2',
        value: function middlewareKoa2(ctx, next) {
            return __awaiter(this, void 0, Promise, function* () {
                yield this.middleware(ctx.req, ctx.res, next);
            });
        }
    }, {
        key: 'middlewareKoa',
        value: function* middlewareKoa(ctx, next) {
            yield ctx.middleware(ctx.req, ctx.res, next);
        }
    }, {
        key: 'middleware',
        value: function middleware(req, res, next) {
            var _this2 = this;

            var method = req.method;
            var url = req.url;

            var index = url.indexOf('?');
            if (index > -1) {
                url = url.substr(0, index);
            }
            debug('trying route: "%s"...', url);
            var route = void 0,
                match = void 0;
            for (var i = 0, ii = this._routes.length; i < ii; i++) {
                route = this._routes[i];
                match = route.reg.exec(url);
                if (!! ~route.method.indexOf(method) && match !== null) {
                    break;
                }
                route = null;
            }
            if (route === null) {
                debug('route no match');
                return next ? next() : void 0;
            }
            debug('found route: "%s"', route.fn);
            return this[route.fn].call(this, req, res, match.length == 2 ? decodeURIComponent(match[1]) : undefined).catch(function (e) {
                console.log('e', e.stack);
                _this2._writeJSON(res, e, e.code || 500);
            });
        }
    }, {
        key: 'create',
        value: function create(req, res) {
            return __awaiter(this, void 0, Promise, function* () {
                var contentType = req.headers['content-type'];
                if (!contentType || contentType.indexOf('multipart/form-data') == -1) {
                    //throw new Error('not multiform');
                    var query = this._getQuery(req.url);
                    if (query.filename) {
                        var len = parseInt(req.headers['content-length']),
                            type = req.headers['content-type'];
                        var _path = query.path || '/';
                        if (_path[_path.length - 1] != '/') _path += '/';
                        var _asset = yield this._assets.create(req, _path + query.filename, {
                            mime: type,
                            size: len,
                            skipMeta: false
                        });
                        return this._writeJSON(res, _asset);
                    }
                    throw new Error('not multiform');
                }

                var _ref = yield this._readForm(req);

                var files = _ref.files;
                var fields = _ref.fields;

                var file = void 0;
                for (var k in files) {
                    file = files[k];
                    break;
                }
                if (!file) throw new Error('not file');
                var path = fields['path'] || '/',
                    dest = Path.join(path, file.name),
                    opts = { skipMeta: false };
                if (fields['name'] && fields['name'] != "") {
                    opts.name = fields['name'];
                }
                if (fields['mime'] && fields['mime'] != "") {
                    opts.mime = fields['mime'];
                }
                debug('create file "%s", options "%j"', dest, opts);
                var asset = yield this._assets.createFromPath(file.path, dest, opts);
                yield this._writeJSON(res, asset, 201);
            });
        }
    }, {
        key: 'list',
        value: function list(req, res) {
            return __awaiter(this, void 0, Promise, function* () {
                var query = this._getQuery(req.url);
                if (query.id) {
                    var asset = yield this._assets.getById(query.id);
                    if (!asset) {
                        throw new HttpError("Not Found", 400);
                    }
                    if (req.method === 'DELETE') {
                        yield this._assets.remove(asset);
                        return yield this._writeJSON(res, {
                            status: 'ok'
                        });
                    }
                    return yield this._writeJSON(res, asset);
                }
                if (req.method === 'DELETE') throw new HttpError("No id");
                var page = 1,
                    limit = 1000;
                if (query.page) {
                    var i = parseInt(query.page);
                    if (!isNaN(i)) page = i;
                }
                if (query.limit) {
                    var _i = parseInt(query.limit);
                    if (!isNaN(_i)) limit = _i;
                }
                if (page <= 0) page = 1;
                var result = void 0;
                if (query.q) {
                    result = yield this._assets.query(query.q);
                } else {
                    var count = yield this._assets.metaStore.count();
                    var pages = Math.ceil(count / limit);
                    var offset = limit * (page - 1);
                    if (offset > count) {
                        result = [];
                    } else {
                        result = yield this._assets.list({
                            offset: offset,
                            limit: limit
                        });
                    }
                    var links = {
                        first: 1,
                        last: pages
                    };
                    if (page > 1) links.prev = page - 1;
                    if (page < pages) links.next = page + 1;
                    this._writeLinksHeader(req, res, links);
                }
                yield this._writeJSON(res, result);
            });
        }
    }, {
        key: 'getResource',
        value: function getResource(req, res, path) {
            return __awaiter(this, void 0, Promise, function* () {
                var query = this._getQuery(req.url);
                if (path[0] !== '/') path = "/" + path;
                var asset = yield this._assets.getByPath(path);
                if (!asset) throw new HttpError("Not Found", 404);
                if (toBoolean(query.meta)) {
                    return yield this._writeJSON(res, asset, 200);
                }
                res.setHeader('Content-Type', asset.mime);
                //res.setHeader('Content-Length', asset.size + "");
                if (toBoolean(query.download)) {
                    res.setHeader('Content-Disposition', 'attachment; filename=' + asset.filename);
                }
                var outStream = void 0;
                if (toBoolean(query.thumbnail)) {
                    res.setHeader('Content-Type', 'image/png');
                    outStream = yield this._assets.thumbnail(asset);
                    if (outStream == null) {
                        throw new HttpError('Cannot generate thumbnail for mimetype: ' + asset.mime, 400);
                    }
                } else {
                    outStream = yield this._assets.stream(asset);
                }
                res.writeHead(200);
                outStream.pipe(res);
            });
        }
    }, {
        key: 'removeResource',
        value: function removeResource(req, res, path) {
            return __awaiter(this, void 0, Promise, function* () {
                var query = this._getQuery(req.url);
                debug('quering path %s', path);
                if (path[0] !== '/') path = "/" + path;
                var asset = yield this._assets.getByPath(path);
                if (!asset) throw new HttpError("Not Found", 404);
                yield this._assets.remove(asset);
                yield this._writeJSON(res, {
                    status: 'ok'
                });
            });
        }
    }, {
        key: '_writeJSON',
        value: function _writeJSON(res, json) {
            var status = arguments.length <= 2 || arguments[2] === undefined ? 200 : arguments[2];

            var str = JSON.stringify(json);
            res.writeHead(status, {
                'Content-Type': 'application/json',
                'Content-Length': str.length + ""
            });
            return new Promise(function (resolve, reject) {
                res.write(str, function (e) {
                    if (e) return reject(e);
                    resolve();
                });
                res.end();
            });
        }
    }, {
        key: '_getQuery',
        value: function _getQuery(url) {
            var index = url.indexOf('?');
            if (index > -1) {
                var str = url.substr(index + 1, url.length - 1);
                return querystring.parse(str);
            }
            return {};
        }
    }, {
        key: '_readBody',
        value: function _readBody(req) {
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
    }, {
        key: '_readForm',
        value: function _readForm(req) {
            return new Promise(function (resolve, reject) {
                var form = new formidable.IncomingForm();
                form.keepExtensions = true;
                form.parse(req, function (err, fields, files) {
                    if (err) return reject(err);
                    resolve({ fields: fields, files: files });
                });
            });
        }
    }, {
        key: '_writeLinksHeader',
        value: function _writeLinksHeader(req, res, links) {
            var url = req.url;
            url = req.headers['host'] + url + (url.indexOf('?') == -1 ? "?" : "&") + 'page=';
            url = "http://" + url;
            res.setHeader('Link', Object.keys(links).map(function (rel) {
                return '<' + url + links[rel] + '>; rel="' + rel + '"';
            }).join(', '));
        }
    }]);

    return AssetsRouter;
}();

exports.AssetsRouter = AssetsRouter;