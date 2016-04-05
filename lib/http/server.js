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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHAvc2VydmVyLmpzIiwiaHR0cC9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7QUFDQSxJQUFJLFlBQVksU0FBQyxJQUFRLFVBQUssU0FBTCxJQUFtQixVQUFVLE9BQVYsRUFBbUIsVUFBbkIsRUFBK0IsQ0FBL0IsRUFBa0MsU0FBbEMsRUFBNkM7QUFDckYsV0FBTyxLQUFLLE1BQU0sSUFBSSxPQUFKLENBQU4sQ0FBTCxDQUF5QixVQUFVLE9BQVYsRUFBbUIsTUFBbkIsRUFBMkI7QUFDdkQsaUJBQVMsU0FBVCxDQUFtQixLQUFuQixFQUEwQjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxJQUFWLENBQWUsS0FBZixDQUFMLEVBQUY7YUFBSixDQUFxQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5QjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxLQUFWLENBQWdCLEtBQWhCLENBQUwsRUFBRjthQUFKLENBQXNDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxJQUFULENBQWMsTUFBZCxFQUFzQjtBQUFFLG1CQUFPLElBQVAsR0FBYyxRQUFRLE9BQU8sS0FBUCxDQUF0QixHQUFzQyxJQUFJLENBQUosQ0FBTSxVQUFVLE9BQVYsRUFBbUI7QUFBRSx3QkFBUSxPQUFPLEtBQVAsQ0FBUixDQUFGO2FBQW5CLENBQU4sQ0FBcUQsSUFBckQsQ0FBMEQsU0FBMUQsRUFBcUUsUUFBckUsQ0FBdEMsQ0FBRjtTQUF0QjtBQUNBLGFBQUssQ0FBQyxZQUFZLFVBQVUsS0FBVixDQUFnQixPQUFoQixFQUF5QixVQUF6QixDQUFaLENBQUQsQ0FBbUQsSUFBbkQsRUFBTCxFQUp1RDtLQUEzQixDQUFoQyxDQURxRjtDQUE3QztBQ0E1QyxJQUFZLE9BQUksUUFBTSxNQUFOLENB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LEdBQUosQ0FGaUk7QUFJM0ksa0JBQU0sSUFBSSxPQUFKLENBQVksTUFBWixJQUFzQixHQUF0QixJQUE4QixJQUFJLE9BQUosQ0FBWSxHQUFaLEtBQW9CLENBQUMsQ0FBRCxHQUFLLEdBQXpCLEdBQStCLEdBQS9CLENBQTlCLEdBQW9FLE9BQXBFLENBSnFJO0FBTTNJLGtCQUFNLFlBQVksR0FBWixDQU5xSTtBQVEzSSxnQkFBSSxTQUFKLENBQWMsTUFBZCxFQUFzQixPQUFPLElBQVAsQ0FBWSxLQUFaLEVBQW1CLEdBQW5CLENBQXVCLFVBQVMsR0FBVCxFQUFZO0FBQ3JELHVCQUFPLE1BQU0sR0FBTixHQUFZLE1BQU0sR0FBTixDQUFaLEdBQXlCLFVBQXpCLEdBQXNDLEdBQXRDLEdBQTRDLEdBQTVDLENBRDhDO2FBQVosQ0FBdkIsQ0FFbkIsSUFGbUIsQ0FFZCxJQUZjLENBQXRCLEVBUjJJOzs7O1dBalVuSjs7O0FBQWEsUUFBQSxZQUFBLEdBQVksWUFBWiIsImZpbGUiOiJodHRwL3NlcnZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IHF1ZXJ5c3RyaW5nID0gcmVxdWlyZSgncXVlcnlzdHJpbmcnKTtcbmNvbnN0IERlYnVnID0gcmVxdWlyZSgnZGVidWcnKTtcbmNvbnN0IGZvcm1pZGFibGUgPSByZXF1aXJlKCdmb3JtaWRhYmxlJyk7XG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHM6aHR0cCcpLCBwYXRoVG9SZWdleHAgPSByZXF1aXJlKCdwYXRoLXRvLXJlZ2V4cCcpO1xuZnVuY3Rpb24gdG9Cb29sZWFuKHN0cikge1xuICAgIHJldHVybiAhIX5bJ3RydWUnLCAnVFJVRScsICd0JywgJ3knLCAnaicsICd5ZXMnXS5pbmRleE9mKHN0cik7XG59XG5jbGFzcyBIdHRwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnLCBjb2RlID0gMjAwKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1zZztcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB9XG4gICAgdG9KU09OKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogdGhpcy5tZXNzYWdlXG4gICAgICAgIH07XG4gICAgfVxufVxuY2xhc3MgQXNzZXRzUm91dGVyIHtcbiAgICBjb25zdHJ1Y3RvcihfYXNzZXRzLCBvcHRzID0ge30pIHtcbiAgICAgICAgdGhpcy5fYXNzZXRzID0gX2Fzc2V0cztcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICAgICAgbGV0IHByZWZpeCA9IG9wdHMucHJlZml4O1xuICAgICAgICBpZiAocHJlZml4ID09IG51bGwgfHwgcHJlZml4ID09PSBcIlwiKVxuICAgICAgICAgICAgcHJlZml4ID0gXCIvXCI7XG4gICAgICAgIGlmIChwcmVmaXggIT09IFwiL1wiKSB7XG4gICAgICAgICAgICBpZiAocHJlZml4W3ByZWZpeC5sZW5ndGggLSAxXSAhPT0gXCIvXCIpXG4gICAgICAgICAgICAgICAgcHJlZml4ICs9ICcvJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdHMucHJlZml4ID0gcHJlZml4O1xuICAgICAgICB0aGlzLl9yb3V0ZXMgPSBbe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogWydHRVQnLCAnREVMRVRFJ10sXG4gICAgICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4KSxcbiAgICAgICAgICAgICAgICBmbjogJ2xpc3QnXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBbJ0dFVCddLFxuICAgICAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCArIFwiKlwiKSxcbiAgICAgICAgICAgICAgICBmbjogJ2dldFJlc291cmNlJ1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogWydQT1NUJ10sXG4gICAgICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4KSxcbiAgICAgICAgICAgICAgICBmbjogJ2NyZWF0ZSdcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFsnREVMRVRFJ10sXG4gICAgICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4ICsgJyonKSxcbiAgICAgICAgICAgICAgICBmbjogJ3JlbW92ZVJlc291cmNlJ1xuICAgICAgICAgICAgfV07XG4gICAgfVxuICAgIG1pZGRsZXdhcmVLb2EyKGN0eCwgbmV4dCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMubWlkZGxld2FyZShjdHgucmVxLCBjdHgucmVzLCBuZXh0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgICptaWRkbGV3YXJlS29hKGN0eCwgbmV4dCkge1xuICAgICAgICB5aWVsZCBjdHgubWlkZGxld2FyZShjdHgucmVxLCBjdHgucmVzLCBuZXh0KTtcbiAgICB9XG4gICAgbWlkZGxld2FyZShyZXEsIHJlcywgbmV4dCkge1xuICAgICAgICBsZXQgeyBtZXRob2QsIHVybCB9ID0gcmVxO1xuICAgICAgICBsZXQgaW5kZXggPSB1cmwuaW5kZXhPZignPycpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdXJsID0gdXJsLnN1YnN0cigwLCBpbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWcoJ3RyeWluZyByb3V0ZTogXCIlc1wiLi4uJywgdXJsKTtcbiAgICAgICAgbGV0IHJvdXRlLCBtYXRjaDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fcm91dGVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHJvdXRlID0gdGhpcy5fcm91dGVzW2ldO1xuICAgICAgICAgICAgbWF0Y2ggPSByb3V0ZS5yZWcuZXhlYyh1cmwpO1xuICAgICAgICAgICAgaWYgKCEhfnJvdXRlLm1ldGhvZC5pbmRleE9mKG1ldGhvZCkgJiYgbWF0Y2ggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvdXRlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocm91dGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlYnVnKCdyb3V0ZSBubyBtYXRjaCcpO1xuICAgICAgICAgICAgcmV0dXJuIG5leHQgPyBuZXh0KCkgOiB2b2lkIDA7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWcoJ2ZvdW5kIHJvdXRlOiBcIiVzXCInLCByb3V0ZS5mbik7XG4gICAgICAgIHJldHVybiB0aGlzW3JvdXRlLmZuXS5jYWxsKHRoaXMsIHJlcSwgcmVzLCBtYXRjaC5sZW5ndGggPT0gMiA/IGRlY29kZVVSSUNvbXBvbmVudChtYXRjaFsxXSkgOiB1bmRlZmluZWQpXG4gICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUuc3RhY2spO1xuICAgICAgICAgICAgdGhpcy5fd3JpdGVKU09OKHJlcywgZSwgZS5jb2RlIHx8IDUwMCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjcmVhdGUocmVxLCByZXMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgY29udGVudFR5cGUgPSByZXEuaGVhZGVyc1snY29udGVudC10eXBlJ107XG4gICAgICAgICAgICBpZiAoIWNvbnRlbnRUeXBlIHx8IGNvbnRlbnRUeXBlLmluZGV4T2YoJ211bHRpcGFydC9mb3JtLWRhdGEnKSA9PSAtMSkge1xuICAgICAgICAgICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKCdub3QgbXVsdGlmb3JtJyk7XG4gICAgICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXJ5LmZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBsZW4gPSBwYXJzZUludChyZXEuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSksIHR5cGUgPSByZXEuaGVhZGVyc1snY29udGVudC10eXBlJ107XG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXRoID0gcXVlcnkucGF0aCB8fCAnLyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXRoW3BhdGgubGVuZ3RoIC0gMV0gIT0gJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCArPSAnLyc7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhc3NldCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5jcmVhdGUocmVxLCBwYXRoICsgcXVlcnkuZmlsZW5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbWU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplOiBsZW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBza2lwTWV0YTogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IG11bHRpZm9ybScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHsgZmlsZXMsIGZpZWxkcyB9ID0geWllbGQgdGhpcy5fcmVhZEZvcm0ocmVxKTtcbiAgICAgICAgICAgIGxldCBmaWxlO1xuICAgICAgICAgICAgZm9yIChsZXQgayBpbiBmaWxlcykge1xuICAgICAgICAgICAgICAgIGZpbGUgPSBmaWxlc1trXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZmlsZSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBmaWxlJyk7XG4gICAgICAgICAgICBsZXQgcGF0aCA9IGZpZWxkc1sncGF0aCddIHx8ICcvJywgZGVzdCA9IFBhdGguam9pbihwYXRoLCBmaWxlLm5hbWUpLCBvcHRzID0geyBza2lwTWV0YTogZmFsc2UgfTtcbiAgICAgICAgICAgIGlmIChmaWVsZHNbJ25hbWUnXSAmJiBmaWVsZHNbJ25hbWUnXSAhPSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5uYW1lID0gZmllbGRzWyduYW1lJ107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmllbGRzWydtaW1lJ10gJiYgZmllbGRzWydtaW1lJ10gIT0gXCJcIikge1xuICAgICAgICAgICAgICAgIG9wdHMubWltZSA9IGZpZWxkc1snbWltZSddO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVidWcoJ2NyZWF0ZSBmaWxlIFwiJXNcIiwgb3B0aW9ucyBcIiVqXCInLCBkZXN0LCBvcHRzKTtcbiAgICAgICAgICAgIGxldCBhc3NldCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5jcmVhdGVGcm9tUGF0aChmaWxlLnBhdGgsIGRlc3QsIG9wdHMpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQsIDIwMSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBsaXN0KHJlcSwgcmVzKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG4gICAgICAgICAgICBpZiAocXVlcnkuaWQpIHtcbiAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLl9hc3NldHMuZ2V0QnlJZChxdWVyeS5pZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnREVMRVRFJykge1xuICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGlzLl9hc3NldHMucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnREVMRVRFJylcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm8gaWRcIik7XG4gICAgICAgICAgICBsZXQgcGFnZSA9IDEsIGxpbWl0ID0gMTAwMDtcbiAgICAgICAgICAgIGlmIChxdWVyeS5wYWdlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGkgPSBwYXJzZUludChxdWVyeS5wYWdlKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKGkpKVxuICAgICAgICAgICAgICAgICAgICBwYWdlID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChxdWVyeS5saW1pdCkge1xuICAgICAgICAgICAgICAgIGxldCBpID0gcGFyc2VJbnQocXVlcnkubGltaXQpO1xuICAgICAgICAgICAgICAgIGlmICghaXNOYU4oaSkpXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0ID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYWdlIDw9IDApXG4gICAgICAgICAgICAgICAgcGFnZSA9IDE7XG4gICAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgICAgaWYgKHF1ZXJ5LnEpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB5aWVsZCB0aGlzLl9hc3NldHMucXVlcnkocXVlcnkucSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgY291bnQgPSB5aWVsZCB0aGlzLl9hc3NldHMubWV0YVN0b3JlLmNvdW50KCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhZ2VzID0gTWF0aC5jZWlsKGNvdW50IC8gbGltaXQpO1xuICAgICAgICAgICAgICAgIGxldCBvZmZzZXQgPSBsaW1pdCAqIChwYWdlIC0gMSk7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA+IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgdGhpcy5fYXNzZXRzLmxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW1pdDogbGltaXRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBsaW5rcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3Q6IDEsXG4gICAgICAgICAgICAgICAgICAgIGxhc3Q6IHBhZ2VzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocGFnZSA+IDEpXG4gICAgICAgICAgICAgICAgICAgIGxpbmtzLnByZXYgPSBwYWdlIC0gMTtcbiAgICAgICAgICAgICAgICBpZiAocGFnZSA8IHBhZ2VzKVxuICAgICAgICAgICAgICAgICAgICBsaW5rcy5uZXh0ID0gcGFnZSArIDE7XG4gICAgICAgICAgICAgICAgdGhpcy5fd3JpdGVMaW5rc0hlYWRlcihyZXEsIHJlcywgbGlua3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFJlc291cmNlKHJlcSwgcmVzLCBwYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG4gICAgICAgICAgICBpZiAocGF0aFswXSAhPT0gJy8nKVxuICAgICAgICAgICAgICAgIHBhdGggPSBcIi9cIiArIHBhdGg7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFhc3NldClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwNCk7XG4gICAgICAgICAgICBpZiAodG9Cb29sZWFuKHF1ZXJ5Lm1ldGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0LCAyMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgYXNzZXQubWltZSk7XG4gICAgICAgICAgICAvL3Jlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgYXNzZXQuc2l6ZSArIFwiXCIpO1xuICAgICAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS5kb3dubG9hZCkpIHtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPScgKyBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgb3V0U3RyZWFtO1xuICAgICAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS50aHVtYm5haWwpKSB7XG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgIG91dFN0cmVhbSA9IHlpZWxkIHRoaXMuX2Fzc2V0cy50aHVtYm5haWwoYXNzZXQpO1xuICAgICAgICAgICAgICAgIGlmIChvdXRTdHJlYW0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKCdDYW5ub3QgZ2VuZXJhdGUgdGh1bWJuYWlsIGZvciBtaW1ldHlwZTogJyArIGFzc2V0Lm1pbWUsIDQwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0U3RyZWFtID0geWllbGQgdGhpcy5fYXNzZXRzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgICAgICBvdXRTdHJlYW0ucGlwZShyZXMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVtb3ZlUmVzb3VyY2UocmVxLCByZXMsIHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcbiAgICAgICAgICAgIGRlYnVnKCdxdWVyaW5nIHBhdGggJXMnLCBwYXRoKTtcbiAgICAgICAgICAgIGlmIChwYXRoWzBdICE9PSAnLycpXG4gICAgICAgICAgICAgICAgcGF0aCA9IFwiL1wiICsgcGF0aDtcbiAgICAgICAgICAgIGxldCBhc3NldCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5nZXRCeVBhdGgocGF0aCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDA0KTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX2Fzc2V0cy5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywge1xuICAgICAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfd3JpdGVKU09OKHJlcywganNvbiwgc3RhdHVzID0gMjAwKSB7XG4gICAgICAgIGxldCBzdHIgPSBKU09OLnN0cmluZ2lmeShqc29uKTtcbiAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXMsIHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAnQ29udGVudC1MZW5ndGgnOiBzdHIubGVuZ3RoICsgXCJcIlxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJlcy53cml0ZShzdHIsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfZ2V0UXVlcnkodXJsKSB7XG4gICAgICAgIGxldCBpbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgc3RyID0gdXJsLnN1YnN0cihpbmRleCArIDEsIHVybC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIHJldHVybiBxdWVyeXN0cmluZy5wYXJzZShzdHIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgX3JlYWRCb2R5KHJlcSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IFtdO1xuICAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBidWZmZXIucHVzaChkYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGJ1ZmZlcikudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlcS5vbignZXJyb3InLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX3JlYWRGb3JtKHJlcSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbGV0IGZvcm0gPSBuZXcgZm9ybWlkYWJsZS5JbmNvbWluZ0Zvcm0oKTtcbiAgICAgICAgICAgIGZvcm0ua2VlcEV4dGVuc2lvbnMgPSB0cnVlO1xuICAgICAgICAgICAgZm9ybS5wYXJzZShyZXEsIChlcnIsIGZpZWxkcywgZmlsZXMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IGZpZWxkczogZmllbGRzLCBmaWxlczogZmlsZXMgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF93cml0ZUxpbmtzSGVhZGVyKHJlcSwgcmVzLCBsaW5rcykge1xuICAgICAgICBsZXQgdXJsID0gcmVxLnVybDtcbiAgICAgICAgdXJsID0gcmVxLmhlYWRlcnNbJ2hvc3QnXSArIHVybCArICh1cmwuaW5kZXhPZignPycpID09IC0xID8gXCI/XCIgOiBcIiZcIikgKyAncGFnZT0nO1xuICAgICAgICB1cmwgPSBcImh0dHA6Ly9cIiArIHVybDtcbiAgICAgICAgcmVzLnNldEhlYWRlcignTGluaycsIE9iamVjdC5rZXlzKGxpbmtzKS5tYXAoZnVuY3Rpb24gKHJlbCkge1xuICAgICAgICAgICAgcmV0dXJuICc8JyArIHVybCArIGxpbmtzW3JlbF0gKyAnPjsgcmVsPVwiJyArIHJlbCArICdcIic7XG4gICAgICAgIH0pLmpvaW4oJywgJykpO1xuICAgIH1cbn1cbmV4cG9ydHMuQXNzZXRzUm91dGVyID0gQXNzZXRzUm91dGVyO1xuIiwiaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBxdWVyeXN0cmluZyBmcm9tICdxdWVyeXN0cmluZyc7XG5pbXBvcnQgKiBhcyBEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgKiBhcyBmb3JtaWRhYmxlIGZyb20gJ2Zvcm1pZGFibGUnO1xuXG5pbXBvcnQge0Fzc2V0cywgQXNzZXRDcmVhdGVPcHRpb25zfSBmcm9tICcuLi9pbmRleCc7XG5cbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czpodHRwJyksXG4gICAgcGF0aFRvUmVnZXhwID0gcmVxdWlyZSgncGF0aC10by1yZWdleHAnKVxuXG5mdW5jdGlvbiB0b0Jvb2xlYW4oc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF+Wyd0cnVlJywgJ1RSVUUnLCd0JywgJ3knLCdqJywneWVzJ10uaW5kZXhPZihzdHIpXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRzUm91dGVyT3B0aW9ucyB7XG4gICAgcHJlZml4Pzogc3RyaW5nXG59XG5cbmludGVyZmFjZSBSb3V0ZSB7XG4gICAgbWV0aG9kOiBzdHJpbmdbXTtcbiAgICByZWc6IFJlZ0V4cDtcbiAgICBmbjogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgUm91dGVNYXAge1xuICAgIGxpc3Q6IFJvdXRlO1xuICAgIGNyZWF0ZTogUmVnRXhwO1xufVxuXG5jbGFzcyBIdHRwRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29kZTogbnVtYmVyO1xuICAgIGNvbnN0cnVjdG9yKG1zZzpzdHJpbmcsIGNvZGU6bnVtYmVyID0gMjAwKSB7XG4gICAgICAgIHN1cGVyKG1zZyk7XG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1zZztcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB9XG5cbiAgICB0b0pTT04oKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMubWVzc2FnZVxuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0c1JvdXRlciB7XG4gICAgcHJpdmF0ZSBfcm91dGVzOiBSb3V0ZVtdO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfYXNzZXRzOiBBc3NldHMsIHByaXZhdGUgb3B0czogQXNzZXRzUm91dGVyT3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIGxldCBwcmVmaXggPSBvcHRzLnByZWZpeDtcbiAgICAgICAgaWYgKHByZWZpeCA9PSBudWxsIHx8IHByZWZpeCA9PT0gXCJcIikgcHJlZml4ID0gXCIvXCI7XG4gICAgICAgIGlmIChwcmVmaXggIT09IFwiL1wiKSB7XG4gICAgICAgICAgICBpZiAocHJlZml4W3ByZWZpeC5sZW5ndGggLTFdICE9PSBcIi9cIikgcHJlZml4ICs9ICcvJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3B0cy5wcmVmaXggPSBwcmVmaXg7XG5cblxuICAgICAgICB0aGlzLl9yb3V0ZXMgPSBbe1xuICAgICAgICAgICAgbWV0aG9kOiBbJ0dFVCcsICdERUxFVEUnXSxcbiAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCksXG4gICAgICAgICAgICBmbjogJ2xpc3QnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIG1ldGhvZDogWydHRVQnXSxcbiAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCArIFwiKlwiKSxcbiAgICAgICAgICAgIGZuOiAnZ2V0UmVzb3VyY2UnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIG1ldGhvZDogWydQT1NUJ10sXG4gICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXgpLFxuICAgICAgICAgICAgZm46ICdjcmVhdGUnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIG1ldGhvZDogWydERUxFVEUnXSxcbiAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCArICcqJyksXG4gICAgICAgICAgICBmbjogJ3JlbW92ZVJlc291cmNlJ1xuICAgICAgICB9XTtcblxuICAgIH1cblxuICAgIGFzeW5jIG1pZGRsZXdhcmVLb2EyIChjdHgsIG5leHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgIH1cblxuICAgICogbWlkZGxld2FyZUtvYSAoY3R4LCBuZXh0KSB7XG4gICAgICAgIHlpZWxkIGN0eC5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgIH1cblxuICAgIG1pZGRsZXdhcmUgKHJlcTpodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOmh0dHAuU2VydmVyUmVzcG9uc2UsIG5leHQ/KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbGV0IHttZXRob2QsIHVybH0gPSByZXE7XG5cbiAgICAgICAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdXJsID0gdXJsLnN1YnN0cigwLCBpbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWJ1ZygndHJ5aW5nIHJvdXRlOiBcIiVzXCIuLi4nLCB1cmwpO1xuXG4gICAgICAgIGxldCByb3V0ZTogUm91dGUsIG1hdGNoOiBzdHJpbmdbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSB0aGlzLl9yb3V0ZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcm91dGUgPSB0aGlzLl9yb3V0ZXNbaV07XG4gICAgICAgICAgICBtYXRjaCA9IHJvdXRlLnJlZy5leGVjKHVybCk7XG4gICAgICAgICAgICBpZiAoISF+cm91dGUubWV0aG9kLmluZGV4T2YobWV0aG9kKSAmJiBtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm91dGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJvdXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWJ1Zygncm91dGUgbm8gbWF0Y2gnKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0ID8gbmV4dCgpIDogdm9pZCAwO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKCdmb3VuZCByb3V0ZTogXCIlc1wiJywgcm91dGUuZm4pO1xuICAgICAgICByZXR1cm4gdGhpc1tyb3V0ZS5mbl0uY2FsbCh0aGlzLCByZXEsIHJlcywgbWF0Y2gubGVuZ3RoID09IDIgPyBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbMV0pIDogdW5kZWZpbmVkKVxuICAgICAgICAuY2F0Y2goIGUgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlLnN0YWNrKVxuICAgICAgICAgICAgdGhpcy5fd3JpdGVKU09OKHJlcywgZSwgZS5jb2RlfHw1MDApO1xuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgYXN5bmMgY3JlYXRlKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBcbiAgICAgICAgbGV0IGNvbnRlbnRUeXBlID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddXG4gICAgICAgIGlmICghY29udGVudFR5cGUgfHwgY29udGVudFR5cGUuaW5kZXhPZignbXVsdGlwYXJ0L2Zvcm0tZGF0YScpID09IC0xKSB7XG4gICAgICAgICAgICAvL3Rocm93IG5ldyBFcnJvcignbm90IG11bHRpZm9ybScpO1xuICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG5cbiAgICAgICAgICAgIGlmIChxdWVyeS5maWxlbmFtZSkge1xuXG4gICAgICAgICAgICAgICAgbGV0IGxlbiA9IHBhcnNlSW50KHJlcS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA6IHN0cmluZyA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcblxuICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IHF1ZXJ5LnBhdGh8fCcvJ1xuICAgICAgICAgICAgICAgIGlmIChwYXRoW3BhdGgubGVuZ3RoIC0gMV0gIT0gJy8nKSBwYXRoICs9ICcvJztcbiAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLl9hc3NldHMuY3JlYXRlKHJlcSwgcGF0aCArIHF1ZXJ5LmZpbGVuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGxlbixcbiAgICAgICAgICAgICAgICAgICAgc2tpcE1ldGE6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBtdWx0aWZvcm0nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB7ZmlsZXMsIGZpZWxkc30gPSBhd2FpdCB0aGlzLl9yZWFkRm9ybShyZXEpO1xuXG4gICAgICAgIGxldCBmaWxlOiBmb3JtaWRhYmxlLkZpbGU7XG4gICAgICAgIGZvciAobGV0IGsgaW4gZmlsZXMpIHtcbiAgICAgICAgICAgIGZpbGUgPSBmaWxlc1trXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFmaWxlKSB0aHJvdyBuZXcgRXJyb3IoJ25vdCBmaWxlJyk7XG5cblxuICAgICAgICBsZXQgcGF0aCA9IGZpZWxkc1sncGF0aCddfHwgJy8nLFxuICAgICAgICAgICAgZGVzdCA9IFBhdGguam9pbihwYXRoLCBmaWxlLm5hbWUpLFxuICAgICAgICAgICAgb3B0czogQXNzZXRDcmVhdGVPcHRpb25zID0ge3NraXBNZXRhOmZhbHNlfTtcblxuICAgICAgICBpZiAoZmllbGRzWyduYW1lJ10gJiYgZmllbGRzWyduYW1lJ10gIT0gXCJcIikge1xuICAgICAgICAgICAgb3B0cy5uYW1lID0gZmllbGRzWyduYW1lJ107XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmllbGRzWydtaW1lJ10gJiYgZmllbGRzWydtaW1lJ10gIT0gXCJcIikge1xuICAgICAgICAgICAgb3B0cy5taW1lID0gZmllbGRzWydtaW1lJ107XG4gICAgICAgIH1cbiAgICAgICAgZGVidWcoJ2NyZWF0ZSBmaWxlIFwiJXNcIiwgb3B0aW9ucyBcIiVqXCInLCBkZXN0LCBvcHRzKTtcbiAgICAgICAgbGV0IGFzc2V0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmNyZWF0ZUZyb21QYXRoKGZpbGUucGF0aCwgZGVzdCwgb3B0cyk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQsIDIwMSk7XG5cbiAgICB9XG5cblxuICAgIGFzeW5jIGxpc3QgKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuXG4gICAgICAgIGlmIChxdWVyeS5pZCkge1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmdldEJ5SWQocXVlcnkuaWQpO1xuICAgICAgICAgICAgaWYgKCFhc3NldCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5fYXNzZXRzLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0RFTEVURScpIHRocm93IG5ldyBIdHRwRXJyb3IoXCJObyBpZFwiKTtcblxuICAgICAgICBsZXQgcGFnZSA9IDEsIGxpbWl0ID0gMTAwMDtcbiAgICAgICAgaWYgKHF1ZXJ5LnBhZ2UpIHtcbiAgICAgICAgICAgIGxldCBpID0gcGFyc2VJbnQocXVlcnkucGFnZSk7XG4gICAgICAgICAgICBpZiAoIWlzTmFOKGkpKSBwYWdlID0gaTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdWVyeS5saW1pdCkge1xuICAgICAgICAgICAgbGV0IGkgPSBwYXJzZUludChxdWVyeS5saW1pdCk7XG4gICAgICAgICAgICBpZiAoIWlzTmFOKGkpKSBsaW1pdCA9IGk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFnZSA8PSAwKSBwYWdlID0gMTtcblxuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICBpZiAocXVlcnkucSkge1xuXG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9hc3NldHMucXVlcnkocXVlcnkucSk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBjb3VudCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5tZXRhU3RvcmUuY291bnQoKTtcbiAgICAgICAgICAgIGxldCBwYWdlcyA9IE1hdGguY2VpbChjb3VudCAvIGxpbWl0KTtcbiAgICAgICAgICAgIGxldCBvZmZzZXQgPSBsaW1pdCAqIChwYWdlIC0gMSk7XG5cbiAgICAgICAgICAgIGlmIChvZmZzZXQgPiBjb3VudCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9hc3NldHMubGlzdCh7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICBsaW1pdDogbGltaXRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGxpbmtzOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgZmlyc3Q6IDEsXG4gICAgICAgICAgICAgICAgbGFzdDogcGFnZXNcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChwYWdlID4gMSkgbGlua3MucHJldiA9IHBhZ2UgLSAxO1xuICAgICAgICAgICAgaWYgKHBhZ2UgPCBwYWdlcykgbGlua3MubmV4dCA9IHBhZ2UgKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl93cml0ZUxpbmtzSGVhZGVyKHJlcSwgcmVzLCBsaW5rcyk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIHJlc3VsdCk7XG5cbiAgICB9XG5cbiAgICBhc3luYyBnZXRSZXNvdXJjZSAocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcblxuICAgICAgICBpZiAocGF0aFswXSAhPT0gJy8nKSBwYXRoID0gXCIvXCIgKyBwYXRoO1xuXG4gICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5nZXRCeVBhdGgocGF0aCk7XG5cbiAgICAgICAgaWYgKCFhc3NldCkgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vdCBGb3VuZFwiLCA0MDQpO1xuXG4gICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkubWV0YSkpIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCwgMjAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGFzc2V0Lm1pbWUpO1xuICAgICAgICAvL3Jlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgYXNzZXQuc2l6ZSArIFwiXCIpO1xuXG4gICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkuZG93bmxvYWQpKSB7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPScgKyBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb3V0U3RyZWFtO1xuICAgICAgICBpZiAodG9Cb29sZWFuKHF1ZXJ5LnRodW1ibmFpbCkpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgIG91dFN0cmVhbSA9IGF3YWl0IHRoaXMuX2Fzc2V0cy50aHVtYm5haWwoYXNzZXQpO1xuICAgICAgICAgICAgaWYgKG91dFN0cmVhbSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcignQ2Fubm90IGdlbmVyYXRlIHRodW1ibmFpbCBmb3IgbWltZXR5cGU6ICcgKyBhc3NldC5taW1lICwgNDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICBvdXRTdHJlYW0gPSBhd2FpdCB0aGlzLl9hc3NldHMuc3RyZWFtKGFzc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgb3V0U3RyZWFtLnBpcGUocmVzKTtcblxuICAgIH1cblxuXG4gICAgYXN5bmMgcmVtb3ZlUmVzb3VyY2UocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG5cblxuICAgICAgICBkZWJ1ZygncXVlcmluZyBwYXRoICVzJywgcGF0aClcbiAgICAgICAgaWYgKHBhdGhbMF0gIT09ICcvJykgcGF0aCA9IFwiL1wiICsgcGF0aDtcblxuICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKHBhdGgpO1xuICAgICAgICBpZiAoIWFzc2V0KSB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwNCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fYXNzZXRzLnJlbW92ZShhc3NldCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIHtcbiAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBfd3JpdGVKU09OKHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwganNvbjphbnksIHN0YXR1czpudW1iZXIgPSAyMDApOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgc3RyID0gSlNPTi5zdHJpbmdpZnkoanNvbik7XG5cbiAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXMsIHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAnQ29udGVudC1MZW5ndGgnOiBzdHIubGVuZ3RoICsgXCJcIlxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgcmVzLndyaXRlKHN0ciwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZSkgcmV0dXJuIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFF1ZXJ5KHVybDpzdHJpbmcpOiBhbnkge1xuICAgICAgIGxldCBpbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG5cbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBzdHIgPSB1cmwuc3Vic3RyKGluZGV4ICsgMSwgdXJsLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5c3RyaW5nLnBhcnNlKHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlYWRCb2R5KHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgIHZhciBidWZmZXIgPSBbXTtcblxuICAgICAgICAgICByZXEub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goZGF0YSk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGJ1ZmZlcikudG9TdHJpbmcoKSk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgIHJlcS5vbignZXJyb3InLCByZWplY3QpO1xuXG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVhZEZvcm0ocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSk6IFByb21pc2U8e2ZpZWxkczpmb3JtaWRhYmxlLkZpZWxkcywgZmlsZXM6Zm9ybWlkYWJsZS5GaWxlc30+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgIGxldCBmb3JtID0gbmV3IGZvcm1pZGFibGUuSW5jb21pbmdGb3JtKCk7XG4gICAgICAgICAgIGZvcm0ua2VlcEV4dGVuc2lvbnMgPSB0cnVlO1xuICAgICAgICAgICBmb3JtLnBhcnNlKHJlcSwgKGVyciwgZmllbGRzOiBmb3JtaWRhYmxlLkZpZWxkcywgZmlsZXM6IGZvcm1pZGFibGUuRmlsZXMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7ZmllbGRzLGZpbGVzfSk7XG4gICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3dyaXRlTGlua3NIZWFkZXIocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBsaW5rczoge3ByZXY/Om51bWJlciwgbmV4dD86bnVtYmVyLCBsYXN0PzpudW1iZXIsIGZpcnN0PzpudW1iZXJ9KSB7XG5cbiAgICAgICAgbGV0IHVybCA9IHJlcS51cmw7XG5cbiAgICAgICAgdXJsID0gcmVxLmhlYWRlcnNbJ2hvc3QnXSArIHVybCArICAodXJsLmluZGV4T2YoJz8nKSA9PSAtMSA/IFwiP1wiIDogXCImXCIpICsgJ3BhZ2U9JztcblxuICAgICAgICB1cmwgPSBcImh0dHA6Ly9cIiArIHVybFxuXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0xpbmsnLCBPYmplY3Qua2V5cyhsaW5rcykubWFwKGZ1bmN0aW9uKHJlbCl7XG4gICAgICAgICAgICByZXR1cm4gJzwnICsgdXJsICsgbGlua3NbcmVsXSArICc+OyByZWw9XCInICsgcmVsICsgJ1wiJztcbiAgICAgICAgfSkuam9pbignLCAnKSk7XG4gICAgfVxuXG59XG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
