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
var URL = require('url');
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
                    limit = 100;
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
                'Content-Type': 'application/json'
            });
            return new Promise(function (resolve, reject) {
                res.write(str, function (e) {
                    if (e) return reject(e);
                    res.end();
                    resolve();
                });
                //
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
            url = req.headers['host'] + url; // +  (url.indexOf('?') == -1 ? "?" : "&") + 'page=';
            url = "http://" + url;
            var u = URL.parse(url, true);
            if (u.query) {
                /*let query = Qs.parse(u.query);*/
                if (u.query.page) {
                    delete u.query.page;
                }
                //u.query = Qs.stringify(query);
                u.search = null;
                url = URL.format(u);
                url += "&page=";
                console.log(url, u);
            } else {
                url += '?page=';
            }
            res.setHeader('Link', Object.keys(links).map(function (rel) {
                return '<' + url + links[rel] + '>; rel="' + rel + '"';
            }).join(', '));
        }
    }]);

    return AssetsRouter;
}();

exports.AssetsRouter = AssetsRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHAvc2VydmVyLmpzIiwiaHR0cC9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7QUFDQSxJQUFJLFlBQVksU0FBQyxJQUFRLFVBQUssU0FBTCxJQUFtQixVQUFVLE9BQVYsRUFBbUIsVUFBbkIsRUFBK0IsQ0FBL0IsRUFBa0MsU0FBbEMsRUFBNkM7QUFDckYsV0FBTyxLQUFLLE1BQU0sSUFBSSxPQUFKLENBQU4sQ0FBTCxDQUF5QixVQUFVLE9BQVYsRUFBbUIsTUFBbkIsRUFBMkI7QUFDdkQsaUJBQVMsU0FBVCxDQUFtQixLQUFuQixFQUEwQjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxJQUFWLENBQWUsS0FBZixDQUFMLEVBQUY7YUFBSixDQUFxQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5QjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxLQUFWLENBQWdCLEtBQWhCLENBQUwsRUFBRjthQUFKLENBQXNDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxJQUFULENBQWMsTUFBZCxFQUFzQjtBQUFFLG1CQUFPLElBQVAsR0FBYyxRQUFRLE9BQU8sS0FBUCxDQUF0QixHQUFzQyxJQUFJLENBQUosQ0FBTSxVQUFVLE9BQVYsRUFBbUI7QUFBRSx3QkFBUSxPQUFPLEtBQVAsQ0FBUixDQUFGO2FBQW5CLENBQU4sQ0FBcUQsSUFBckQsQ0FBMEQsU0FBMUQsRUFBcUUsUUFBckUsQ0FBdEMsQ0FBRjtTQUF0QjtBQUNBLGFBQUssQ0FBQyxZQUFZLFVBQVUsS0FBVixDQUFnQixPQUFoQixFQUF5QixVQUF6QixDQUFaLENBQUQsQ0FBbUQsSUFBbkQsRUFBTCxFQUp1RDtLQUEzQixDQUFoQyxDQURxRjtDQUE3QztBQ0E1QyxJQUFZLE9BQUksUUFBTSxNQUFOLENB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SixDQUZpSTtBQU0zSSxrQkFBTSxJQUFJLE9BQUosQ0FBWSxNQUFaLElBQXNCLEdBQXRCO0FBTnFJLGVBUTNJLEdBQU0sWUFBWSxHQUFaLENBUnFJO0FBUzNJLGdCQUFJLElBQUksSUFBSSxLQUFKLENBQVUsR0FBVixFQUFlLElBQWYsQ0FBSixDQVR1STtBQVczSSxnQkFBSSxFQUFFLEtBQUYsRUFBUzs7QUFFVCxvQkFBSSxFQUFFLEtBQUYsQ0FBUSxJQUFSLEVBQWM7QUFDZCwyQkFBTyxFQUFFLEtBQUYsQ0FBUSxJQUFSLENBRE87aUJBQWxCOztBQUZTLGlCQU9ULENBQUUsTUFBRixHQUFXLElBQVgsQ0FQUztBQVFULHNCQUFNLElBQUksTUFBSixDQUFXLENBQVgsQ0FBTixDQVJTO0FBU1QsdUJBQU8sUUFBUCxDQVRTO0FBVVQsd0JBQVEsR0FBUixDQUFZLEdBQVosRUFBaUIsQ0FBakIsRUFWUzthQUFiLE1BV087QUFDSCx1QkFBTyxRQUFQLENBREc7YUFYUDtBQWVBLGdCQUFJLFNBQUosQ0FBYyxNQUFkLEVBQXNCLE9BQU8sSUFBUCxDQUFZLEtBQVosRUFBbUIsR0FBbkIsQ0FBdUIsVUFBUyxHQUFULEVBQVk7QUFDckQsdUJBQU8sTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFOLENBQVosR0FBeUIsVUFBekIsR0FBc0MsR0FBdEMsR0FBNEMsR0FBNUMsQ0FEOEM7YUFBWixDQUF2QixDQUVuQixJQUZtQixDQUVkLElBRmMsQ0FBdEIsRUExQjJJOzs7O1dBblVuSjs7O0FBQWEsUUFBQSxZQUFBLEdBQVksWUFBWiIsImZpbGUiOiJodHRwL3NlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IHF1ZXJ5c3RyaW5nID0gcmVxdWlyZSgncXVlcnlzdHJpbmcnKTtcbmNvbnN0IERlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbmNvbnN0IGZvcm1pZGFibGUgPSByZXF1aXJlKCdmb3JtaWRhYmxlJyk7XG5jb25zdCBVUkwgPSByZXF1aXJlKCd1cmwnKTtcbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czpodHRwJyksIHBhdGhUb1JlZ2V4cCA9IHJlcXVpcmUoJ3BhdGgtdG8tcmVnZXhwJyk7XG5mdW5jdGlvbiB0b0Jvb2xlYW4oc3RyKSB7XG4gICAgcmV0dXJuICEhflsndHJ1ZScsICdUUlVFJywgJ3QnLCAneScsICdqJywgJ3llcyddLmluZGV4T2Yoc3RyKTtcbn1cbmNsYXNzIEh0dHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2csIGNvZGUgPSAyMDApIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbXNnO1xuICAgICAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBtZXNzYWdlOiB0aGlzLm1lc3NhZ2VcbiAgICAgICAgfTtcbiAgICB9XG59XG5jbGFzcyBBc3NldHNSb3V0ZXIge1xuICAgIGNvbnN0cnVjdG9yKF9hc3NldHMsIG9wdHMgPSB7fSkge1xuICAgICAgICB0aGlzLl9hc3NldHMgPSBfYXNzZXRzO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICBsZXQgcHJlZml4ID0gb3B0cy5wcmVmaXg7XG4gICAgICAgIGlmIChwcmVmaXggPT0gbnVsbCB8fCBwcmVmaXggPT09IFwiXCIpXG4gICAgICAgICAgICBwcmVmaXggPSBcIi9cIjtcbiAgICAgICAgaWYgKHByZWZpeCAhPT0gXCIvXCIpIHtcbiAgICAgICAgICAgIGlmIChwcmVmaXhbcHJlZml4Lmxlbmd0aCAtIDFdICE9PSBcIi9cIilcbiAgICAgICAgICAgICAgICBwcmVmaXggKz0gJy8nO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0cy5wcmVmaXggPSBwcmVmaXg7XG4gICAgICAgIHRoaXMuX3JvdXRlcyA9IFt7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBbJ0dFVCcsICdERUxFVEUnXSxcbiAgICAgICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXgpLFxuICAgICAgICAgICAgICAgIGZuOiAnbGlzdCdcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFsnR0VUJ10sXG4gICAgICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4ICsgXCIqXCIpLFxuICAgICAgICAgICAgICAgIGZuOiAnZ2V0UmVzb3VyY2UnXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBbJ1BPU1QnXSxcbiAgICAgICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXgpLFxuICAgICAgICAgICAgICAgIGZuOiAnY3JlYXRlJ1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogWydERUxFVEUnXSxcbiAgICAgICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXggKyAnKicpLFxuICAgICAgICAgICAgICAgIGZuOiAncmVtb3ZlUmVzb3VyY2UnXG4gICAgICAgICAgICB9XTtcbiAgICB9XG4gICAgbWlkZGxld2FyZUtvYTIoY3R4LCBuZXh0KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgKm1pZGRsZXdhcmVLb2EoY3R4LCBuZXh0KSB7XG4gICAgICAgIHlpZWxkIGN0eC5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgIH1cbiAgICBtaWRkbGV3YXJlKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgIGxldCB7IG1ldGhvZCwgdXJsIH0gPSByZXE7XG4gICAgICAgIGxldCBpbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwuc3Vic3RyKDAsIGluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZygndHJ5aW5nIHJvdXRlOiBcIiVzXCIuLi4nLCB1cmwpO1xuICAgICAgICBsZXQgcm91dGUsIG1hdGNoO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSB0aGlzLl9yb3V0ZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcm91dGUgPSB0aGlzLl9yb3V0ZXNbaV07XG4gICAgICAgICAgICBtYXRjaCA9IHJvdXRlLnJlZy5leGVjKHVybCk7XG4gICAgICAgICAgICBpZiAoISF+cm91dGUubWV0aG9kLmluZGV4T2YobWV0aG9kKSAmJiBtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm91dGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyb3V0ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVidWcoJ3JvdXRlIG5vIG1hdGNoJyk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCA/IG5leHQoKSA6IHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZygnZm91bmQgcm91dGU6IFwiJXNcIicsIHJvdXRlLmZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbcm91dGUuZm5dLmNhbGwodGhpcywgcmVxLCByZXMsIG1hdGNoLmxlbmd0aCA9PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzFdKSA6IHVuZGVmaW5lZClcbiAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlJywgZS5zdGFjayk7XG4gICAgICAgICAgICB0aGlzLl93cml0ZUpTT04ocmVzLCBlLCBlLmNvZGUgfHwgNTAwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZShyZXEsIHJlcykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBjb250ZW50VHlwZSA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcbiAgICAgICAgICAgIGlmICghY29udGVudFR5cGUgfHwgY29udGVudFR5cGUuaW5kZXhPZignbXVsdGlwYXJ0L2Zvcm0tZGF0YScpID09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoJ25vdCBtdWx0aWZvcm0nKTtcbiAgICAgICAgICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnkuZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxlbiA9IHBhcnNlSW50KHJlcS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSwgdHlwZSA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhdGggPSBxdWVyeS5wYXRoIHx8ICcvJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhbcGF0aC5sZW5ndGggLSAxXSAhPSAnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoICs9ICcvJztcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5fYXNzZXRzLmNyZWF0ZShyZXEsIHBhdGggKyBxdWVyeS5maWxlbmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWltZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IGxlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNraXBNZXRhOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgbXVsdGlmb3JtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgeyBmaWxlcywgZmllbGRzIH0gPSB5aWVsZCB0aGlzLl9yZWFkRm9ybShyZXEpO1xuICAgICAgICAgICAgbGV0IGZpbGU7XG4gICAgICAgICAgICBmb3IgKGxldCBrIGluIGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgZmlsZSA9IGZpbGVzW2tdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFmaWxlKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGZpbGUnKTtcbiAgICAgICAgICAgIGxldCBwYXRoID0gZmllbGRzWydwYXRoJ10gfHwgJy8nLCBkZXN0ID0gUGF0aC5qb2luKHBhdGgsIGZpbGUubmFtZSksIG9wdHMgPSB7IHNraXBNZXRhOiBmYWxzZSB9O1xuICAgICAgICAgICAgaWYgKGZpZWxkc1snbmFtZSddICYmIGZpZWxkc1snbmFtZSddICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBvcHRzLm5hbWUgPSBmaWVsZHNbJ25hbWUnXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWVsZHNbJ21pbWUnXSAmJiBmaWVsZHNbJ21pbWUnXSAhPSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5taW1lID0gZmllbGRzWydtaW1lJ107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1ZygnY3JlYXRlIGZpbGUgXCIlc1wiLCBvcHRpb25zIFwiJWpcIicsIGRlc3QsIG9wdHMpO1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5fYXNzZXRzLmNyZWF0ZUZyb21QYXRoKGZpbGUucGF0aCwgZGVzdCwgb3B0cyk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCwgMjAxKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxpc3QocmVxLCByZXMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcbiAgICAgICAgICAgIGlmIChxdWVyeS5pZCkge1xuICAgICAgICAgICAgICAgIGxldCBhc3NldCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5nZXRCeUlkKHF1ZXJ5LmlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuX2Fzc2V0cy5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdERUxFVEUnKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJObyBpZFwiKTtcbiAgICAgICAgICAgIGxldCBwYWdlID0gMSwgbGltaXQgPSAxMDA7XG4gICAgICAgICAgICBpZiAocXVlcnkucGFnZSkge1xuICAgICAgICAgICAgICAgIGxldCBpID0gcGFyc2VJbnQocXVlcnkucGFnZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihpKSlcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocXVlcnkubGltaXQpIHtcbiAgICAgICAgICAgICAgICBsZXQgaSA9IHBhcnNlSW50KHF1ZXJ5LmxpbWl0KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKGkpKVxuICAgICAgICAgICAgICAgICAgICBsaW1pdCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFnZSA8PSAwKVxuICAgICAgICAgICAgICAgIHBhZ2UgPSAxO1xuICAgICAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgICAgIGlmIChxdWVyeS5xKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgdGhpcy5fYXNzZXRzLnF1ZXJ5KHF1ZXJ5LnEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvdW50ID0geWllbGQgdGhpcy5fYXNzZXRzLm1ldGFTdG9yZS5jb3VudCgpO1xuICAgICAgICAgICAgICAgIGxldCBwYWdlcyA9IE1hdGguY2VpbChjb3VudCAvIGxpbWl0KTtcbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gbGltaXQgKiAocGFnZSAtIDEpO1xuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPiBjb3VudCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5saXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGltaXQ6IGxpbWl0XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgbGlua3MgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0OiAxLFxuICAgICAgICAgICAgICAgICAgICBsYXN0OiBwYWdlc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHBhZ2UgPiAxKVxuICAgICAgICAgICAgICAgICAgICBsaW5rcy5wcmV2ID0gcGFnZSAtIDE7XG4gICAgICAgICAgICAgICAgaWYgKHBhZ2UgPCBwYWdlcylcbiAgICAgICAgICAgICAgICAgICAgbGlua3MubmV4dCA9IHBhZ2UgKyAxO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dyaXRlTGlua3NIZWFkZXIocmVxLCByZXMsIGxpbmtzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRSZXNvdXJjZShyZXEsIHJlcywgcGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuICAgICAgICAgICAgaWYgKHBhdGhbMF0gIT09ICcvJylcbiAgICAgICAgICAgICAgICBwYXRoID0gXCIvXCIgKyBwYXRoO1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5fYXNzZXRzLmdldEJ5UGF0aChwYXRoKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vdCBGb3VuZFwiLCA0MDQpO1xuICAgICAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS5tZXRhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCwgMjAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGFzc2V0Lm1pbWUpO1xuICAgICAgICAgICAgLy9yZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGFzc2V0LnNpemUgKyBcIlwiKTtcbiAgICAgICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkuZG93bmxvYWQpKSB7XG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdhdHRhY2htZW50OyBmaWxlbmFtZT0nICsgYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG91dFN0cmVhbTtcbiAgICAgICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkudGh1bWJuYWlsKSkge1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICBvdXRTdHJlYW0gPSB5aWVsZCB0aGlzLl9hc3NldHMudGh1bWJuYWlsKGFzc2V0KTtcbiAgICAgICAgICAgICAgICBpZiAob3V0U3RyZWFtID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcignQ2Fubm90IGdlbmVyYXRlIHRodW1ibmFpbCBmb3IgbWltZXR5cGU6ICcgKyBhc3NldC5taW1lLCA0MDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dFN0cmVhbSA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5zdHJlYW0oYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgb3V0U3RyZWFtLnBpcGUocmVzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZVJlc291cmNlKHJlcSwgcmVzLCBwYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG4gICAgICAgICAgICBkZWJ1ZygncXVlcmluZyBwYXRoICVzJywgcGF0aCk7XG4gICAgICAgICAgICBpZiAocGF0aFswXSAhPT0gJy8nKVxuICAgICAgICAgICAgICAgIHBhdGggPSBcIi9cIiArIHBhdGg7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFhc3NldClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwNCk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9hc3NldHMucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdvaydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX3dyaXRlSlNPTihyZXMsIGpzb24sIHN0YXR1cyA9IDIwMCkge1xuICAgICAgICBsZXQgc3RyID0gSlNPTi5zdHJpbmdpZnkoanNvbik7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJlcy53cml0ZShzdHIsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy9cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9nZXRRdWVyeSh1cmwpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBzdHIgPSB1cmwuc3Vic3RyKGluZGV4ICsgMSwgdXJsLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5c3RyaW5nLnBhcnNlKHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgICBfcmVhZEJvZHkocmVxKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB2YXIgYnVmZmVyID0gW107XG4gICAgICAgICAgICByZXEub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKEJ1ZmZlci5jb25jYXQoYnVmZmVyKS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcmVhZEZvcm0ocmVxKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgZm9ybSA9IG5ldyBmb3JtaWRhYmxlLkluY29taW5nRm9ybSgpO1xuICAgICAgICAgICAgZm9ybS5rZWVwRXh0ZW5zaW9ucyA9IHRydWU7XG4gICAgICAgICAgICBmb3JtLnBhcnNlKHJlcSwgKGVyciwgZmllbGRzLCBmaWxlcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgZmllbGRzOiBmaWVsZHMsIGZpbGVzOiBmaWxlcyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX3dyaXRlTGlua3NIZWFkZXIocmVxLCByZXMsIGxpbmtzKSB7XG4gICAgICAgIGxldCB1cmwgPSByZXEudXJsO1xuICAgICAgICB1cmwgPSByZXEuaGVhZGVyc1snaG9zdCddICsgdXJsOyAvLyArICAodXJsLmluZGV4T2YoJz8nKSA9PSAtMSA/IFwiP1wiIDogXCImXCIpICsgJ3BhZ2U9JztcbiAgICAgICAgdXJsID0gXCJodHRwOi8vXCIgKyB1cmw7XG4gICAgICAgIGxldCB1ID0gVVJMLnBhcnNlKHVybCwgdHJ1ZSk7XG4gICAgICAgIGlmICh1LnF1ZXJ5KSB7XG4gICAgICAgICAgICAvKmxldCBxdWVyeSA9IFFzLnBhcnNlKHUucXVlcnkpOyovXG4gICAgICAgICAgICBpZiAodS5xdWVyeS5wYWdlKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHUucXVlcnkucGFnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vdS5xdWVyeSA9IFFzLnN0cmluZ2lmeShxdWVyeSk7XG4gICAgICAgICAgICB1LnNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgICB1cmwgPSBVUkwuZm9ybWF0KHUpO1xuICAgICAgICAgICAgdXJsICs9IFwiJnBhZ2U9XCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1cmwsIHUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdXJsICs9ICc/cGFnZT0nO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0xpbmsnLCBPYmplY3Qua2V5cyhsaW5rcykubWFwKGZ1bmN0aW9uIChyZWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnPCcgKyB1cmwgKyBsaW5rc1tyZWxdICsgJz47IHJlbD1cIicgKyByZWwgKyAnXCInO1xuICAgICAgICB9KS5qb2luKCcsICcpKTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0c1JvdXRlciA9IEFzc2V0c1JvdXRlcjtcbiIsImltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgcXVlcnlzdHJpbmcgZnJvbSAncXVlcnlzdHJpbmcnO1xuaW1wb3J0ICogYXMgRGVidWcgZnJvbSAnZGVidWcnO1xuaW1wb3J0ICogYXMgZm9ybWlkYWJsZSBmcm9tICdmb3JtaWRhYmxlJztcbmltcG9ydCAqIGFzIFVSTCBmcm9tICd1cmwnO1xuaW1wb3J0ICogYXMgUXMgZnJvbSAncXVlcnlzdHJpbmcnO1xuXG5pbXBvcnQge0Fzc2V0cywgQXNzZXRDcmVhdGVPcHRpb25zfSBmcm9tICcuLi9pbmRleCc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czpodHRwJyksXG4gICAgcGF0aFRvUmVnZXhwID0gcmVxdWlyZSgncGF0aC10by1yZWdleHAnKVxuXG5mdW5jdGlvbiB0b0Jvb2xlYW4oc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF+Wyd0cnVlJywgJ1RSVUUnLCd0JywgJ3knLCdqJywneWVzJ10uaW5kZXhPZihzdHIpXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRzUm91dGVyT3B0aW9ucyB7XG4gICAgcHJlZml4Pzogc3RyaW5nXG59XG5cbmludGVyZmFjZSBSb3V0ZSB7XG4gICAgbWV0aG9kOiBzdHJpbmdbXTtcbiAgICByZWc6IFJlZ0V4cDtcbiAgICBmbjogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgUm91dGVNYXAge1xuICAgIGxpc3Q6IFJvdXRlO1xuICAgIGNyZWF0ZTogUmVnRXhwO1xufVxuXG5jbGFzcyBIdHRwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29kZTogbnVtYmVyO1xuICAgIGNvbnN0cnVjdG9yKG1zZzpzdHJpbmcsIGNvZGU6bnVtYmVyID0gMjAwKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1zZztcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB9XG5cbiAgICB0b0pTT04oKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMubWVzc2FnZVxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0c1JvdXRlciB7XG4gICAgcHJpdmF0ZSBfcm91dGVzOiBSb3V0ZVtdO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXNzZXRzOiBBc3NldHMsIHByaXZhdGUgb3B0czogQXNzZXRzUm91dGVyT3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIGxldCBwcmVmaXggPSBvcHRzLnByZWZpeDtcbiAgICAgICAgaWYgKHByZWZpeCA9PSBudWxsIHx8IHByZWZpeCA9PT0gXCJcIikgcHJlZml4ID0gXCIvXCI7XG4gICAgICAgIGlmIChwcmVmaXggIT09IFwiL1wiKSB7XG4gICAgICAgICAgICBpZiAocHJlZml4W3ByZWZpeC5sZW5ndGggLTFdICE9PSBcIi9cIikgcHJlZml4ICs9ICcvJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0cy5wcmVmaXggPSBwcmVmaXg7XG5cblxuICAgICAgICB0aGlzLl9yb3V0ZXMgPSBbe1xuICAgICAgICAgICAgbWV0aG9kOiBbJ0dFVCcsICdERUxFVEUnXSxcbiAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCksXG4gICAgICAgICAgICBmbjogJ2xpc3QnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIG1ldGhvZDogWydHRVQnXSxcbiAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCArIFwiKlwiKSxcbiAgICAgICAgICAgIGZuOiAnZ2V0UmVzb3VyY2UnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIG1ldGhvZDogWydQT1NUJ10sXG4gICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXgpLFxuICAgICAgICAgICAgZm46ICdjcmVhdGUnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIG1ldGhvZDogWydERUxFVEUnXSxcbiAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCArICcqJyksXG4gICAgICAgICAgICBmbjogJ3JlbW92ZVJlc291cmNlJ1xuICAgICAgICB9XTtcblxuICAgIH1cblxuICAgIGFzeW5jIG1pZGRsZXdhcmVLb2EyIChjdHgsIG5leHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgIH1cblxuICAgICogbWlkZGxld2FyZUtvYSAoY3R4LCBuZXh0KSB7XG4gICAgICAgIHlpZWxkIGN0eC5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgIH1cblxuICAgIG1pZGRsZXdhcmUgKHJlcTpodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOmh0dHAuU2VydmVyUmVzcG9uc2UsIG5leHQ/KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbGV0IHttZXRob2QsIHVybH0gPSByZXE7XG5cbiAgICAgICAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdXJsID0gdXJsLnN1YnN0cigwLCBpbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1ZygndHJ5aW5nIHJvdXRlOiBcIiVzXCIuLi4nLCB1cmwpO1xuXG4gICAgICAgIGxldCByb3V0ZTogUm91dGUsIG1hdGNoOiBzdHJpbmdbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSB0aGlzLl9yb3V0ZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcm91dGUgPSB0aGlzLl9yb3V0ZXNbaV07XG4gICAgICAgICAgICBtYXRjaCA9IHJvdXRlLnJlZy5leGVjKHVybCk7XG4gICAgICAgICAgICBpZiAoISF+cm91dGUubWV0aG9kLmluZGV4T2YobWV0aG9kKSAmJiBtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm91dGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJvdXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWJ1Zygncm91dGUgbm8gbWF0Y2gnKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0ID8gbmV4dCgpIDogdm9pZCAwO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKCdmb3VuZCByb3V0ZTogXCIlc1wiJywgcm91dGUuZm4pO1xuICAgICAgICByZXR1cm4gdGhpc1tyb3V0ZS5mbl0uY2FsbCh0aGlzLCByZXEsIHJlcywgbWF0Y2gubGVuZ3RoID09IDIgPyBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbMV0pIDogdW5kZWZpbmVkKVxuICAgICAgICAuY2F0Y2goIGUgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlLnN0YWNrKVxuICAgICAgICAgICAgdGhpcy5fd3JpdGVKU09OKHJlcywgZSwgZS5jb2RlfHw1MDApO1xuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgYXN5bmMgY3JlYXRlKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBcbiAgICAgICAgbGV0IGNvbnRlbnRUeXBlID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddXG4gICAgICAgIGlmICghY29udGVudFR5cGUgfHwgY29udGVudFR5cGUuaW5kZXhPZignbXVsdGlwYXJ0L2Zvcm0tZGF0YScpID09IC0xKSB7XG4gICAgICAgICAgICAvL3Rocm93IG5ldyBFcnJvcignbm90IG11bHRpZm9ybScpO1xuICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG5cbiAgICAgICAgICAgIGlmIChxdWVyeS5maWxlbmFtZSkge1xuXG4gICAgICAgICAgICAgICAgbGV0IGxlbiA9IHBhcnNlSW50KHJlcS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA6IHN0cmluZyA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcblxuICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IHF1ZXJ5LnBhdGh8fCcvJ1xuICAgICAgICAgICAgICAgIGlmIChwYXRoW3BhdGgubGVuZ3RoIC0gMV0gIT0gJy8nKSBwYXRoICs9ICcvJztcbiAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLl9hc3NldHMuY3JlYXRlKHJlcSwgcGF0aCArIHF1ZXJ5LmZpbGVuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGxlbixcbiAgICAgICAgICAgICAgICAgICAgc2tpcE1ldGE6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBtdWx0aWZvcm0nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB7ZmlsZXMsIGZpZWxkc30gPSBhd2FpdCB0aGlzLl9yZWFkRm9ybShyZXEpO1xuXG4gICAgICAgIGxldCBmaWxlOiBmb3JtaWRhYmxlLkZpbGU7XG4gICAgICAgIGZvciAobGV0IGsgaW4gZmlsZXMpIHtcbiAgICAgICAgICAgIGZpbGUgPSBmaWxlc1trXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFmaWxlKSB0aHJvdyBuZXcgRXJyb3IoJ25vdCBmaWxlJyk7XG5cblxuICAgICAgICBsZXQgcGF0aCA9IGZpZWxkc1sncGF0aCddfHwgJy8nLFxuICAgICAgICAgICAgZGVzdCA9IFBhdGguam9pbihwYXRoLCBmaWxlLm5hbWUpLFxuICAgICAgICAgICAgb3B0czogQXNzZXRDcmVhdGVPcHRpb25zID0ge3NraXBNZXRhOmZhbHNlfTtcblxuICAgICAgICBpZiAoZmllbGRzWyduYW1lJ10gJiYgZmllbGRzWyduYW1lJ10gIT0gXCJcIikge1xuICAgICAgICAgICAgb3B0cy5uYW1lID0gZmllbGRzWyduYW1lJ107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmllbGRzWydtaW1lJ10gJiYgZmllbGRzWydtaW1lJ10gIT0gXCJcIikge1xuICAgICAgICAgICAgb3B0cy5taW1lID0gZmllbGRzWydtaW1lJ107XG4gICAgICAgIH1cbiAgICAgICAgZGVidWcoJ2NyZWF0ZSBmaWxlIFwiJXNcIiwgb3B0aW9ucyBcIiVqXCInLCBkZXN0LCBvcHRzKTtcbiAgICAgICAgbGV0IGFzc2V0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmNyZWF0ZUZyb21QYXRoKGZpbGUucGF0aCwgZGVzdCwgb3B0cyk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQsIDIwMSk7XG5cbiAgICB9XG5cblxuICAgIGFzeW5jIGxpc3QgKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuXG4gICAgICAgIGlmIChxdWVyeS5pZCkge1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmdldEJ5SWQocXVlcnkuaWQpO1xuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fYXNzZXRzLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0RFTEVURScpIHRocm93IG5ldyBIdHRwRXJyb3IoXCJObyBpZFwiKTtcblxuICAgICAgICBsZXQgcGFnZSA9IDEsIGxpbWl0ID0gMTAwO1xuICAgICAgICBpZiAocXVlcnkucGFnZSkge1xuICAgICAgICAgICAgbGV0IGkgPSBwYXJzZUludChxdWVyeS5wYWdlKTtcbiAgICAgICAgICAgIGlmICghaXNOYU4oaSkpIHBhZ2UgPSBpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHF1ZXJ5LmxpbWl0KSB7XG4gICAgICAgICAgICBsZXQgaSA9IHBhcnNlSW50KHF1ZXJ5LmxpbWl0KTtcbiAgICAgICAgICAgIGlmICghaXNOYU4oaSkpIGxpbWl0ID0gaTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlIDw9IDApIHBhZ2UgPSAxO1xuXG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIGlmIChxdWVyeS5xKSB7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5xdWVyeShxdWVyeS5xKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IGNvdW50ID0gYXdhaXQgdGhpcy5fYXNzZXRzLm1ldGFTdG9yZS5jb3VudCgpO1xuICAgICAgICAgICAgbGV0IHBhZ2VzID0gTWF0aC5jZWlsKGNvdW50IC8gbGltaXQpO1xuICAgICAgICAgICAgbGV0IG9mZnNldCA9IGxpbWl0ICogKHBhZ2UgLSAxKTtcblxuICAgICAgICAgICAgaWYgKG9mZnNldCA+IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5saXN0KHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0OiBsaW1pdFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgbGlua3M6IGFueSA9IHtcbiAgICAgICAgICAgICAgICBmaXJzdDogMSxcbiAgICAgICAgICAgICAgICBsYXN0OiBwYWdlc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHBhZ2UgPiAxKSBsaW5rcy5wcmV2ID0gcGFnZSAtIDE7XG4gICAgICAgICAgICBpZiAocGFnZSA8IHBhZ2VzKSBsaW5rcy5uZXh0ID0gcGFnZSArIDE7XG5cbiAgICAgICAgICAgIHRoaXMuX3dyaXRlTGlua3NIZWFkZXIocmVxLCByZXMsIGxpbmtzKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fd3JpdGVKU09OKHJlcywgcmVzdWx0KTtcblxuICAgIH1cblxuICAgIGFzeW5jIGdldFJlc291cmNlIChyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuXG4gICAgICAgIGlmIChwYXRoWzBdICE9PSAnLycpIHBhdGggPSBcIi9cIiArIHBhdGg7XG5cbiAgICAgICAgbGV0IGFzc2V0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmdldEJ5UGF0aChwYXRoKTtcblxuICAgICAgICBpZiAoIWFzc2V0KSB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwNCk7XG5cbiAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS5tZXRhKSkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0LCAyMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgYXNzZXQubWltZSk7XG4gICAgICAgIC8vcmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBhc3NldC5zaXplICsgXCJcIik7XG5cbiAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS5kb3dubG9hZCkpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCAnYXR0YWNobWVudDsgZmlsZW5hbWU9JyArIGFzc2V0LmZpbGVuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvdXRTdHJlYW07XG4gICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkudGh1bWJuYWlsKSkge1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgb3V0U3RyZWFtID0gYXdhaXQgdGhpcy5fYXNzZXRzLnRodW1ibmFpbChhc3NldCk7XG4gICAgICAgICAgICBpZiAob3V0U3RyZWFtID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKCdDYW5ub3QgZ2VuZXJhdGUgdGh1bWJuYWlsIGZvciBtaW1ldHlwZTogJyArIGFzc2V0Lm1pbWUgLCA0MDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgIG91dFN0cmVhbSA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5zdHJlYW0oYXNzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICBvdXRTdHJlYW0ucGlwZShyZXMpO1xuXG4gICAgfVxuXG5cbiAgICBhc3luYyByZW1vdmVSZXNvdXJjZShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcblxuXG4gICAgICAgIGRlYnVnKCdxdWVyaW5nIHBhdGggJXMnLCBwYXRoKVxuICAgICAgICBpZiAocGF0aFswXSAhPT0gJy8nKSBwYXRoID0gXCIvXCIgKyBwYXRoO1xuXG4gICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5nZXRCeVBhdGgocGF0aCk7XG4gICAgICAgIGlmICghYXNzZXQpIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDA0KTtcblxuICAgICAgICBhd2FpdCB0aGlzLl9hc3NldHMucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgYXdhaXQgdGhpcy5fd3JpdGVKU09OKHJlcywge1xuICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG5cbiAgICBwcml2YXRlIF93cml0ZUpTT04ocmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBqc29uOmFueSwgc3RhdHVzOm51bWJlciA9IDIwMCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBzdHIgPSBKU09OLnN0cmluZ2lmeShqc29uKTtcblxuICAgICAgICByZXMud3JpdGVIZWFkKHN0YXR1cywge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIC8vJ0NvbnRlbnQtTGVuZ3RoJzogc3RyLmxlbmd0aCArIFwiXCJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJlcy53cml0ZShzdHIsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUpIHJldHVybiByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy9cbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFF1ZXJ5KHVybDpzdHJpbmcpOiBhbnkge1xuICAgICAgIGxldCBpbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG5cbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBzdHIgPSB1cmwuc3Vic3RyKGluZGV4ICsgMSwgdXJsLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5c3RyaW5nLnBhcnNlKHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlYWRCb2R5KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgIHZhciBidWZmZXIgPSBbXTtcblxuICAgICAgICAgICByZXEub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goZGF0YSk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGJ1ZmZlcikudG9TdHJpbmcoKSk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgIHJlcS5vbignZXJyb3InLCByZWplY3QpO1xuXG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVhZEZvcm0ocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSk6IFByb21pc2U8e2ZpZWxkczpmb3JtaWRhYmxlLkZpZWxkcywgZmlsZXM6Zm9ybWlkYWJsZS5GaWxlc30+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgIGxldCBmb3JtID0gbmV3IGZvcm1pZGFibGUuSW5jb21pbmdGb3JtKCk7XG4gICAgICAgICAgIGZvcm0ua2VlcEV4dGVuc2lvbnMgPSB0cnVlO1xuICAgICAgICAgICBmb3JtLnBhcnNlKHJlcSwgKGVyciwgZmllbGRzOiBmb3JtaWRhYmxlLkZpZWxkcywgZmlsZXM6IGZvcm1pZGFibGUuRmlsZXMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7ZmllbGRzLGZpbGVzfSk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3dyaXRlTGlua3NIZWFkZXIocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBsaW5rczoge3ByZXY/Om51bWJlciwgbmV4dD86bnVtYmVyLCBsYXN0PzpudW1iZXIsIGZpcnN0PzpudW1iZXJ9KSB7XG5cbiAgICAgICAgbGV0IHVybCA9IHJlcS51cmw7XG5cblxuXG4gICAgICAgIHVybCA9IHJlcS5oZWFkZXJzWydob3N0J10gKyB1cmwgLy8gKyAgKHVybC5pbmRleE9mKCc/JykgPT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArICdwYWdlPSc7XG5cbiAgICAgICAgdXJsID0gXCJodHRwOi8vXCIgKyB1cmxcbiAgICAgICAgbGV0IHUgPSBVUkwucGFyc2UodXJsLCB0cnVlKTtcblxuICAgICAgICBpZiAodS5xdWVyeSkge1xuICAgICAgICAgICAgLypsZXQgcXVlcnkgPSBRcy5wYXJzZSh1LnF1ZXJ5KTsqL1xuICAgICAgICAgICAgaWYgKHUucXVlcnkucGFnZSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB1LnF1ZXJ5LnBhZ2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vdS5xdWVyeSA9IFFzLnN0cmluZ2lmeShxdWVyeSk7XG4gICAgICAgICAgICB1LnNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgICB1cmwgPSBVUkwuZm9ybWF0KHUpO1xuICAgICAgICAgICAgdXJsICs9IFwiJnBhZ2U9XCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1cmwsIHUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXJsICs9ICc/cGFnZT0nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLnNldEhlYWRlcignTGluaycsIE9iamVjdC5rZXlzKGxpbmtzKS5tYXAoZnVuY3Rpb24ocmVsKXtcbiAgICAgICAgICAgIHJldHVybiAnPCcgKyB1cmwgKyBsaW5rc1tyZWxdICsgJz47IHJlbD1cIicgKyByZWwgKyAnXCInO1xuICAgICAgICB9KS5qb2luKCcsICcpKTtcbiAgICB9XG5cbn1cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
