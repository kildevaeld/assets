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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHAvc2VydmVyLmpzIiwiaHR0cC9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7QUFDQSxJQUFJLFlBQVksU0FBQyxJQUFRLFVBQUssU0FBTCxJQUFtQixVQUFVLE9BQVYsRUFBbUIsVUFBbkIsRUFBK0IsQ0FBL0IsRUFBa0MsU0FBbEMsRUFBNkM7QUFDckYsV0FBTyxLQUFLLE1BQU0sSUFBSSxPQUFKLENBQU4sQ0FBTCxDQUF5QixVQUFVLE9BQVYsRUFBbUIsTUFBbkIsRUFBMkI7QUFDdkQsaUJBQVMsU0FBVCxDQUFtQixLQUFuQixFQUEwQjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxJQUFWLENBQWUsS0FBZixDQUFMLEVBQUY7YUFBSixDQUFxQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5QjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxLQUFWLENBQWdCLEtBQWhCLENBQUwsRUFBRjthQUFKLENBQXNDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxJQUFULENBQWMsTUFBZCxFQUFzQjtBQUFFLG1CQUFPLElBQVAsR0FBYyxRQUFRLE9BQU8sS0FBUCxDQUF0QixHQUFzQyxJQUFJLENBQUosQ0FBTSxVQUFVLE9BQVYsRUFBbUI7QUFBRSx3QkFBUSxPQUFPLEtBQVAsQ0FBUixDQUFGO2FBQW5CLENBQU4sQ0FBcUQsSUFBckQsQ0FBMEQsU0FBMUQsRUFBcUUsUUFBckUsQ0FBdEMsQ0FBRjtTQUF0QjtBQUNBLGFBQUssQ0FBQyxZQUFZLFVBQVUsS0FBVixDQUFnQixPQUFoQixFQUF5QixVQUF6QixDQUFaLENBQUQsQ0FBbUQsSUFBbkQsRUFBTCxFQUp1RDtLQUEzQixDQUFoQyxDQURxRjtDQUE3QztBQ0E1QyxJQUFZLE9BQUksUUFBTSxNQUFOLENB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Q0FBWSxNQUFaLElBQXNCLEdBQXRCLElBQThCLElBQUksT0FBSixDQUFZLEdBQVosS0FBb0IsQ0FBQyxDQUFELEdBQUssR0FBekIsR0FBK0IsR0FBL0IsQ0FBOUIsR0FBb0UsT0FBcEUsQ0FKcUk7QUFNM0ksa0JBQU0sWUFBWSxHQUFaLENBTnFJO0FBUTNJLGdCQUFJLFNBQUosQ0FBYyxNQUFkLEVBQXNCLE9BQU8sSUFBUCxDQUFZLEtBQVosRUFBbUIsR0FBbkIsQ0FBdUIsVUFBUyxHQUFULEVBQVk7QUFDckQsdUJBQU8sTUFBTSxHQUFOLEdBQVksTUFBTSxHQUFOLENBQVosR0FBeUIsVUFBekIsR0FBc0MsR0FBdEMsR0FBNEMsR0FBNUMsQ0FEOEM7YUFBWixDQUF2QixDQUVuQixJQUZtQixDQUVkLElBRmMsQ0FBdEIsRUFSMkk7Ozs7V0FuVW5KOzs7QUFBYSxRQUFBLFlBQUEsR0FBWSxZQUFaIiwiZmlsZSI6Imh0dHAvc2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci50aHJvdyh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jb25zdCBQYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgZm9ybWlkYWJsZSA9IHJlcXVpcmUoJ2Zvcm1pZGFibGUnKTtcbmNvbnN0IGRlYnVnID0gRGVidWcoJ2Fzc2V0czpodHRwJyksIHBhdGhUb1JlZ2V4cCA9IHJlcXVpcmUoJ3BhdGgtdG8tcmVnZXhwJyk7XG5mdW5jdGlvbiB0b0Jvb2xlYW4oc3RyKSB7XG4gICAgcmV0dXJuICEhflsndHJ1ZScsICdUUlVFJywgJ3QnLCAneScsICdqJywgJ3llcyddLmluZGV4T2Yoc3RyKTtcbn1cbmNsYXNzIEh0dHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2csIGNvZGUgPSAyMDApIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbXNnO1xuICAgICAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBtZXNzYWdlOiB0aGlzLm1lc3NhZ2VcbiAgICAgICAgfTtcbiAgICB9XG59XG5jbGFzcyBBc3NldHNSb3V0ZXIge1xuICAgIGNvbnN0cnVjdG9yKF9hc3NldHMsIG9wdHMgPSB7fSkge1xuICAgICAgICB0aGlzLl9hc3NldHMgPSBfYXNzZXRzO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICBsZXQgcHJlZml4ID0gb3B0cy5wcmVmaXg7XG4gICAgICAgIGlmIChwcmVmaXggPT0gbnVsbCB8fCBwcmVmaXggPT09IFwiXCIpXG4gICAgICAgICAgICBwcmVmaXggPSBcIi9cIjtcbiAgICAgICAgaWYgKHByZWZpeCAhPT0gXCIvXCIpIHtcbiAgICAgICAgICAgIGlmIChwcmVmaXhbcHJlZml4Lmxlbmd0aCAtIDFdICE9PSBcIi9cIilcbiAgICAgICAgICAgICAgICBwcmVmaXggKz0gJy8nO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0cy5wcmVmaXggPSBwcmVmaXg7XG4gICAgICAgIHRoaXMuX3JvdXRlcyA9IFt7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBbJ0dFVCcsICdERUxFVEUnXSxcbiAgICAgICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXgpLFxuICAgICAgICAgICAgICAgIGZuOiAnbGlzdCdcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFsnR0VUJ10sXG4gICAgICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4ICsgXCIqXCIpLFxuICAgICAgICAgICAgICAgIGZuOiAnZ2V0UmVzb3VyY2UnXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBbJ1BPU1QnXSxcbiAgICAgICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXgpLFxuICAgICAgICAgICAgICAgIGZuOiAnY3JlYXRlJ1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogWydERUxFVEUnXSxcbiAgICAgICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXggKyAnKicpLFxuICAgICAgICAgICAgICAgIGZuOiAncmVtb3ZlUmVzb3VyY2UnXG4gICAgICAgICAgICB9XTtcbiAgICB9XG4gICAgbWlkZGxld2FyZUtvYTIoY3R4LCBuZXh0KSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgeWllbGQgdGhpcy5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgKm1pZGRsZXdhcmVLb2EoY3R4LCBuZXh0KSB7XG4gICAgICAgIHlpZWxkIGN0eC5taWRkbGV3YXJlKGN0eC5yZXEsIGN0eC5yZXMsIG5leHQpO1xuICAgIH1cbiAgICBtaWRkbGV3YXJlKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgIGxldCB7IG1ldGhvZCwgdXJsIH0gPSByZXE7XG4gICAgICAgIGxldCBpbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwuc3Vic3RyKDAsIGluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZygndHJ5aW5nIHJvdXRlOiBcIiVzXCIuLi4nLCB1cmwpO1xuICAgICAgICBsZXQgcm91dGUsIG1hdGNoO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWkgPSB0aGlzLl9yb3V0ZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcm91dGUgPSB0aGlzLl9yb3V0ZXNbaV07XG4gICAgICAgICAgICBtYXRjaCA9IHJvdXRlLnJlZy5leGVjKHVybCk7XG4gICAgICAgICAgICBpZiAoISF+cm91dGUubWV0aG9kLmluZGV4T2YobWV0aG9kKSAmJiBtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm91dGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyb3V0ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVidWcoJ3JvdXRlIG5vIG1hdGNoJyk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCA/IG5leHQoKSA6IHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZygnZm91bmQgcm91dGU6IFwiJXNcIicsIHJvdXRlLmZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbcm91dGUuZm5dLmNhbGwodGhpcywgcmVxLCByZXMsIG1hdGNoLmxlbmd0aCA9PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzFdKSA6IHVuZGVmaW5lZClcbiAgICAgICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlJywgZS5zdGFjayk7XG4gICAgICAgICAgICB0aGlzLl93cml0ZUpTT04ocmVzLCBlLCBlLmNvZGUgfHwgNTAwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZShyZXEsIHJlcykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBjb250ZW50VHlwZSA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcbiAgICAgICAgICAgIGlmICghY29udGVudFR5cGUgfHwgY29udGVudFR5cGUuaW5kZXhPZignbXVsdGlwYXJ0L2Zvcm0tZGF0YScpID09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoJ25vdCBtdWx0aWZvcm0nKTtcbiAgICAgICAgICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcbiAgICAgICAgICAgICAgICBpZiAocXVlcnkuZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxlbiA9IHBhcnNlSW50KHJlcS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSwgdHlwZSA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhdGggPSBxdWVyeS5wYXRoIHx8ICcvJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhbcGF0aC5sZW5ndGggLSAxXSAhPSAnLycpXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoICs9ICcvJztcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5fYXNzZXRzLmNyZWF0ZShyZXEsIHBhdGggKyBxdWVyeS5maWxlbmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWltZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IGxlbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNraXBNZXRhOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgbXVsdGlmb3JtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgeyBmaWxlcywgZmllbGRzIH0gPSB5aWVsZCB0aGlzLl9yZWFkRm9ybShyZXEpO1xuICAgICAgICAgICAgbGV0IGZpbGU7XG4gICAgICAgICAgICBmb3IgKGxldCBrIGluIGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgZmlsZSA9IGZpbGVzW2tdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFmaWxlKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IGZpbGUnKTtcbiAgICAgICAgICAgIGxldCBwYXRoID0gZmllbGRzWydwYXRoJ10gfHwgJy8nLCBkZXN0ID0gUGF0aC5qb2luKHBhdGgsIGZpbGUubmFtZSksIG9wdHMgPSB7IHNraXBNZXRhOiBmYWxzZSB9O1xuICAgICAgICAgICAgaWYgKGZpZWxkc1snbmFtZSddICYmIGZpZWxkc1snbmFtZSddICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBvcHRzLm5hbWUgPSBmaWVsZHNbJ25hbWUnXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWVsZHNbJ21pbWUnXSAmJiBmaWVsZHNbJ21pbWUnXSAhPSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5taW1lID0gZmllbGRzWydtaW1lJ107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWJ1ZygnY3JlYXRlIGZpbGUgXCIlc1wiLCBvcHRpb25zIFwiJWpcIicsIGRlc3QsIG9wdHMpO1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5fYXNzZXRzLmNyZWF0ZUZyb21QYXRoKGZpbGUucGF0aCwgZGVzdCwgb3B0cyk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCwgMjAxKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxpc3QocmVxLCByZXMpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcbiAgICAgICAgICAgIGlmIChxdWVyeS5pZCkge1xuICAgICAgICAgICAgICAgIGxldCBhc3NldCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5nZXRCeUlkKHF1ZXJ5LmlkKTtcbiAgICAgICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdERUxFVEUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHlpZWxkIHRoaXMuX2Fzc2V0cy5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnb2snXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdERUxFVEUnKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJObyBpZFwiKTtcbiAgICAgICAgICAgIGxldCBwYWdlID0gMSwgbGltaXQgPSAxMDA7XG4gICAgICAgICAgICBpZiAocXVlcnkucGFnZSkge1xuICAgICAgICAgICAgICAgIGxldCBpID0gcGFyc2VJbnQocXVlcnkucGFnZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihpKSlcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocXVlcnkubGltaXQpIHtcbiAgICAgICAgICAgICAgICBsZXQgaSA9IHBhcnNlSW50KHF1ZXJ5LmxpbWl0KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKGkpKVxuICAgICAgICAgICAgICAgICAgICBsaW1pdCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFnZSA8PSAwKVxuICAgICAgICAgICAgICAgIHBhZ2UgPSAxO1xuICAgICAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgICAgIGlmIChxdWVyeS5xKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgdGhpcy5fYXNzZXRzLnF1ZXJ5KHF1ZXJ5LnEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvdW50ID0geWllbGQgdGhpcy5fYXNzZXRzLm1ldGFTdG9yZS5jb3VudCgpO1xuICAgICAgICAgICAgICAgIGxldCBwYWdlcyA9IE1hdGguY2VpbChjb3VudCAvIGxpbWl0KTtcbiAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gbGltaXQgKiAocGFnZSAtIDEpO1xuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPiBjb3VudCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5saXN0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGltaXQ6IGxpbWl0XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgbGlua3MgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0OiAxLFxuICAgICAgICAgICAgICAgICAgICBsYXN0OiBwYWdlc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHBhZ2UgPiAxKVxuICAgICAgICAgICAgICAgICAgICBsaW5rcy5wcmV2ID0gcGFnZSAtIDE7XG4gICAgICAgICAgICAgICAgaWYgKHBhZ2UgPCBwYWdlcylcbiAgICAgICAgICAgICAgICAgICAgbGlua3MubmV4dCA9IHBhZ2UgKyAxO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dyaXRlTGlua3NIZWFkZXIocmVxLCByZXMsIGxpbmtzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRSZXNvdXJjZShyZXEsIHJlcywgcGF0aCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuICAgICAgICAgICAgaWYgKHBhdGhbMF0gIT09ICcvJylcbiAgICAgICAgICAgICAgICBwYXRoID0gXCIvXCIgKyBwYXRoO1xuICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5fYXNzZXRzLmdldEJ5UGF0aChwYXRoKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vdCBGb3VuZFwiLCA0MDQpO1xuICAgICAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS5tZXRhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCwgMjAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGFzc2V0Lm1pbWUpO1xuICAgICAgICAgICAgLy9yZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGFzc2V0LnNpemUgKyBcIlwiKTtcbiAgICAgICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkuZG93bmxvYWQpKSB7XG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdhdHRhY2htZW50OyBmaWxlbmFtZT0nICsgYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG91dFN0cmVhbTtcbiAgICAgICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkudGh1bWJuYWlsKSkge1xuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgICAgICBvdXRTdHJlYW0gPSB5aWVsZCB0aGlzLl9hc3NldHMudGh1bWJuYWlsKGFzc2V0KTtcbiAgICAgICAgICAgICAgICBpZiAob3V0U3RyZWFtID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcignQ2Fubm90IGdlbmVyYXRlIHRodW1ibmFpbCBmb3IgbWltZXR5cGU6ICcgKyBhc3NldC5taW1lLCA0MDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dFN0cmVhbSA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5zdHJlYW0oYXNzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgb3V0U3RyZWFtLnBpcGUocmVzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbW92ZVJlc291cmNlKHJlcSwgcmVzLCBwYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG4gICAgICAgICAgICBkZWJ1ZygncXVlcmluZyBwYXRoICVzJywgcGF0aCk7XG4gICAgICAgICAgICBpZiAocGF0aFswXSAhPT0gJy8nKVxuICAgICAgICAgICAgICAgIHBhdGggPSBcIi9cIiArIHBhdGg7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFhc3NldClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwNCk7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLl9hc3NldHMucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIHtcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdvaydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX3dyaXRlSlNPTihyZXMsIGpzb24sIHN0YXR1cyA9IDIwMCkge1xuICAgICAgICBsZXQgc3RyID0gSlNPTi5zdHJpbmdpZnkoanNvbik7XG4gICAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJlcy53cml0ZShzdHIsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy9cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9nZXRRdWVyeSh1cmwpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGxldCBzdHIgPSB1cmwuc3Vic3RyKGluZGV4ICsgMSwgdXJsLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5c3RyaW5nLnBhcnNlKHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgICBfcmVhZEJvZHkocmVxKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB2YXIgYnVmZmVyID0gW107XG4gICAgICAgICAgICByZXEub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKEJ1ZmZlci5jb25jYXQoYnVmZmVyKS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfcmVhZEZvcm0ocmVxKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgZm9ybSA9IG5ldyBmb3JtaWRhYmxlLkluY29taW5nRm9ybSgpO1xuICAgICAgICAgICAgZm9ybS5rZWVwRXh0ZW5zaW9ucyA9IHRydWU7XG4gICAgICAgICAgICBmb3JtLnBhcnNlKHJlcSwgKGVyciwgZmllbGRzLCBmaWxlcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgZmllbGRzOiBmaWVsZHMsIGZpbGVzOiBmaWxlcyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX3dyaXRlTGlua3NIZWFkZXIocmVxLCByZXMsIGxpbmtzKSB7XG4gICAgICAgIGxldCB1cmwgPSByZXEudXJsO1xuICAgICAgICB1cmwgPSByZXEuaGVhZGVyc1snaG9zdCddICsgdXJsICsgKHVybC5pbmRleE9mKCc/JykgPT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArICdwYWdlPSc7XG4gICAgICAgIHVybCA9IFwiaHR0cDovL1wiICsgdXJsO1xuICAgICAgICByZXMuc2V0SGVhZGVyKCdMaW5rJywgT2JqZWN0LmtleXMobGlua3MpLm1hcChmdW5jdGlvbiAocmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gJzwnICsgdXJsICsgbGlua3NbcmVsXSArICc+OyByZWw9XCInICsgcmVsICsgJ1wiJztcbiAgICAgICAgfSkuam9pbignLCAnKSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldHNSb3V0ZXIgPSBBc3NldHNSb3V0ZXI7XG4iLCJpbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHF1ZXJ5c3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCAqIGFzIGZvcm1pZGFibGUgZnJvbSAnZm9ybWlkYWJsZSc7XG5cbmltcG9ydCB7QXNzZXRzLCBBc3NldENyZWF0ZU9wdGlvbnN9IGZyb20gJy4uL2luZGV4JztcblxuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzOmh0dHAnKSxcbiAgICBwYXRoVG9SZWdleHAgPSByZXF1aXJlKCdwYXRoLXRvLXJlZ2V4cCcpXG5cbmZ1bmN0aW9uIHRvQm9vbGVhbihzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIX5bJ3RydWUnLCAnVFJVRScsJ3QnLCAneScsJ2onLCd5ZXMnXS5pbmRleE9mKHN0cilcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBc3NldHNSb3V0ZXJPcHRpb25zIHtcbiAgICBwcmVmaXg/OiBzdHJpbmdcbn1cblxuaW50ZXJmYWNlIFJvdXRlIHtcbiAgICBtZXRob2Q6IHN0cmluZ1tdO1xuICAgIHJlZzogUmVnRXhwO1xuICAgIGZuOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBSb3V0ZU1hcCB7XG4gICAgbGlzdDogUm91dGU7XG4gICAgY3JlYXRlOiBSZWdFeHA7XG59XG5cbmNsYXNzIEh0dHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb2RlOiBudW1iZXI7XG4gICAgY29uc3RydWN0b3IobXNnOnN0cmluZywgY29kZTpudW1iZXIgPSAyMDApIHtcbiAgICAgICAgc3VwZXIobXNnKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbXNnO1xuICAgICAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIH1cblxuICAgIHRvSlNPTigpOiBhbnkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogdGhpcy5tZXNzYWdlXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRzUm91dGVyIHtcbiAgICBwcml2YXRlIF9yb3V0ZXM6IFJvdXRlW107XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9hc3NldHM6IEFzc2V0cywgcHJpdmF0ZSBvcHRzOiBBc3NldHNSb3V0ZXJPcHRpb25zID0ge30pIHtcbiAgICAgICAgbGV0IHByZWZpeCA9IG9wdHMucHJlZml4O1xuICAgICAgICBpZiAocHJlZml4ID09IG51bGwgfHwgcHJlZml4ID09PSBcIlwiKSBwcmVmaXggPSBcIi9cIjtcbiAgICAgICAgaWYgKHByZWZpeCAhPT0gXCIvXCIpIHtcbiAgICAgICAgICAgIGlmIChwcmVmaXhbcHJlZml4Lmxlbmd0aCAtMV0gIT09IFwiL1wiKSBwcmVmaXggKz0gJy8nO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcHRzLnByZWZpeCA9IHByZWZpeDtcblxuXG4gICAgICAgIHRoaXMuX3JvdXRlcyA9IFt7XG4gICAgICAgICAgICBtZXRob2Q6IFsnR0VUJywgJ0RFTEVURSddLFxuICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4KSxcbiAgICAgICAgICAgIGZuOiAnbGlzdCdcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbWV0aG9kOiBbJ0dFVCddLFxuICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4ICsgXCIqXCIpLFxuICAgICAgICAgICAgZm46ICdnZXRSZXNvdXJjZSdcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbWV0aG9kOiBbJ1BPU1QnXSxcbiAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCksXG4gICAgICAgICAgICBmbjogJ2NyZWF0ZSdcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbWV0aG9kOiBbJ0RFTEVURSddLFxuICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4ICsgJyonKSxcbiAgICAgICAgICAgIGZuOiAncmVtb3ZlUmVzb3VyY2UnXG4gICAgICAgIH1dO1xuXG4gICAgfVxuXG4gICAgYXN5bmMgbWlkZGxld2FyZUtvYTIgKGN0eCwgbmV4dCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLm1pZGRsZXdhcmUoY3R4LnJlcSwgY3R4LnJlcywgbmV4dCk7XG4gICAgfVxuXG4gICAgKiBtaWRkbGV3YXJlS29hIChjdHgsIG5leHQpIHtcbiAgICAgICAgeWllbGQgY3R4Lm1pZGRsZXdhcmUoY3R4LnJlcSwgY3R4LnJlcywgbmV4dCk7XG4gICAgfVxuXG4gICAgbWlkZGxld2FyZSAocmVxOmh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6aHR0cC5TZXJ2ZXJSZXNwb25zZSwgbmV4dD8pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsZXQge21ldGhvZCwgdXJsfSA9IHJlcTtcblxuICAgICAgICBsZXQgaW5kZXggPSB1cmwuaW5kZXhPZignPycpO1xuXG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB1cmwgPSB1cmwuc3Vic3RyKDAsIGluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlYnVnKCd0cnlpbmcgcm91dGU6IFwiJXNcIi4uLicsIHVybCk7XG5cbiAgICAgICAgbGV0IHJvdXRlOiBSb3V0ZSwgbWF0Y2g6IHN0cmluZ1tdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IHRoaXMuX3JvdXRlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICByb3V0ZSA9IHRoaXMuX3JvdXRlc1tpXTtcbiAgICAgICAgICAgIG1hdGNoID0gcm91dGUucmVnLmV4ZWModXJsKTtcbiAgICAgICAgICAgIGlmICghIX5yb3V0ZS5tZXRob2QuaW5kZXhPZihtZXRob2QpICYmIG1hdGNoICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb3V0ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm91dGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGRlYnVnKCdyb3V0ZSBubyBtYXRjaCcpO1xuICAgICAgICAgICAgcmV0dXJuIG5leHQgPyBuZXh0KCkgOiB2b2lkIDA7XG4gICAgICAgIH1cbiAgICAgICAgZGVidWcoJ2ZvdW5kIHJvdXRlOiBcIiVzXCInLCByb3V0ZS5mbik7XG4gICAgICAgIHJldHVybiB0aGlzW3JvdXRlLmZuXS5jYWxsKHRoaXMsIHJlcSwgcmVzLCBtYXRjaC5sZW5ndGggPT0gMiA/IGRlY29kZVVSSUNvbXBvbmVudChtYXRjaFsxXSkgOiB1bmRlZmluZWQpXG4gICAgICAgIC5jYXRjaCggZSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZScsIGUuc3RhY2spXG4gICAgICAgICAgICB0aGlzLl93cml0ZUpTT04ocmVzLCBlLCBlLmNvZGV8fDUwMCk7XG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBhc3luYyBjcmVhdGUocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIFxuICAgICAgICBsZXQgY29udGVudFR5cGUgPSByZXEuaGVhZGVyc1snY29udGVudC10eXBlJ11cbiAgICAgICAgaWYgKCFjb250ZW50VHlwZSB8fCBjb250ZW50VHlwZS5pbmRleE9mKCdtdWx0aXBhcnQvZm9ybS1kYXRhJykgPT0gLTEpIHtcbiAgICAgICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKCdub3QgbXVsdGlmb3JtJyk7XG4gICAgICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcblxuICAgICAgICAgICAgaWYgKHF1ZXJ5LmZpbGVuYW1lKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgbGVuID0gcGFyc2VJbnQocmVxLmhlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ10pLFxuICAgICAgICAgICAgICAgICAgICB0eXBlIDogc3RyaW5nID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddO1xuXG4gICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgIGxldCBwYXRoID0gcXVlcnkucGF0aHx8Jy8nXG4gICAgICAgICAgICAgICAgaWYgKHBhdGhbcGF0aC5sZW5ndGggLSAxXSAhPSAnLycpIHBhdGggKz0gJy8nO1xuICAgICAgICAgICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5jcmVhdGUocmVxLCBwYXRoICsgcXVlcnkuZmlsZW5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgbWltZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogbGVuLFxuICAgICAgICAgICAgICAgICAgICBza2lwTWV0YTogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm90IG11bHRpZm9ybScpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHtmaWxlcywgZmllbGRzfSA9IGF3YWl0IHRoaXMuX3JlYWRGb3JtKHJlcSk7XG5cbiAgICAgICAgbGV0IGZpbGU6IGZvcm1pZGFibGUuRmlsZTtcbiAgICAgICAgZm9yIChsZXQgayBpbiBmaWxlcykge1xuICAgICAgICAgICAgZmlsZSA9IGZpbGVzW2tdO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZpbGUpIHRocm93IG5ldyBFcnJvcignbm90IGZpbGUnKTtcblxuXG4gICAgICAgIGxldCBwYXRoID0gZmllbGRzWydwYXRoJ118fCAnLycsXG4gICAgICAgICAgICBkZXN0ID0gUGF0aC5qb2luKHBhdGgsIGZpbGUubmFtZSksXG4gICAgICAgICAgICBvcHRzOiBBc3NldENyZWF0ZU9wdGlvbnMgPSB7c2tpcE1ldGE6ZmFsc2V9O1xuXG4gICAgICAgIGlmIChmaWVsZHNbJ25hbWUnXSAmJiBmaWVsZHNbJ25hbWUnXSAhPSBcIlwiKSB7XG4gICAgICAgICAgICBvcHRzLm5hbWUgPSBmaWVsZHNbJ25hbWUnXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWVsZHNbJ21pbWUnXSAmJiBmaWVsZHNbJ21pbWUnXSAhPSBcIlwiKSB7XG4gICAgICAgICAgICBvcHRzLm1pbWUgPSBmaWVsZHNbJ21pbWUnXTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZygnY3JlYXRlIGZpbGUgXCIlc1wiLCBvcHRpb25zIFwiJWpcIicsIGRlc3QsIG9wdHMpO1xuICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLl9hc3NldHMuY3JlYXRlRnJvbVBhdGgoZmlsZS5wYXRoLCBkZXN0LCBvcHRzKTtcblxuICAgICAgICBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCwgMjAxKTtcblxuICAgIH1cblxuXG4gICAgYXN5bmMgbGlzdCAocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG5cbiAgICAgICAgaWYgKHF1ZXJ5LmlkKSB7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLl9hc3NldHMuZ2V0QnlJZChxdWVyeS5pZCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vdCBGb3VuZFwiLCA0MDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0RFTEVURScpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9hc3NldHMucmVtb3ZlKGFzc2V0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fd3JpdGVKU09OKHJlcywge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdvaydcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnREVMRVRFJykgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vIGlkXCIpO1xuXG4gICAgICAgIGxldCBwYWdlID0gMSwgbGltaXQgPSAxMDA7XG4gICAgICAgIGlmIChxdWVyeS5wYWdlKSB7XG4gICAgICAgICAgICBsZXQgaSA9IHBhcnNlSW50KHF1ZXJ5LnBhZ2UpO1xuICAgICAgICAgICAgaWYgKCFpc05hTihpKSkgcGFnZSA9IGk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocXVlcnkubGltaXQpIHtcbiAgICAgICAgICAgIGxldCBpID0gcGFyc2VJbnQocXVlcnkubGltaXQpO1xuICAgICAgICAgICAgaWYgKCFpc05hTihpKSkgbGltaXQgPSBpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2UgPD0gMCkgcGFnZSA9IDE7XG5cbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgaWYgKHF1ZXJ5LnEpIHtcblxuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLnF1ZXJ5KHF1ZXJ5LnEpO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgY291bnQgPSBhd2FpdCB0aGlzLl9hc3NldHMubWV0YVN0b3JlLmNvdW50KCk7XG4gICAgICAgICAgICBsZXQgcGFnZXMgPSBNYXRoLmNlaWwoY291bnQgLyBsaW1pdCk7XG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gbGltaXQgKiAocGFnZSAtIDEpO1xuXG4gICAgICAgICAgICBpZiAob2Zmc2V0ID4gY291bnQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAgICAgICAgICAgICAgICAgbGltaXQ6IGxpbWl0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBsaW5rczogYW55ID0ge1xuICAgICAgICAgICAgICAgIGZpcnN0OiAxLFxuICAgICAgICAgICAgICAgIGxhc3Q6IHBhZ2VzXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAocGFnZSA+IDEpIGxpbmtzLnByZXYgPSBwYWdlIC0gMTtcbiAgICAgICAgICAgIGlmIChwYWdlIDwgcGFnZXMpIGxpbmtzLm5leHQgPSBwYWdlICsgMTtcblxuICAgICAgICAgICAgdGhpcy5fd3JpdGVMaW5rc0hlYWRlcihyZXEsIHJlcywgbGlua3MpO1xuXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCByZXN1bHQpO1xuXG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0UmVzb3VyY2UgKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG5cbiAgICAgICAgaWYgKHBhdGhbMF0gIT09ICcvJykgcGF0aCA9IFwiL1wiICsgcGF0aDtcblxuICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKHBhdGgpO1xuXG4gICAgICAgIGlmICghYXNzZXQpIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDA0KTtcblxuICAgICAgICBpZiAodG9Cb29sZWFuKHF1ZXJ5Lm1ldGEpKSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQsIDIwMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBhc3NldC5taW1lKTtcbiAgICAgICAgLy9yZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGFzc2V0LnNpemUgKyBcIlwiKTtcblxuICAgICAgICBpZiAodG9Cb29sZWFuKHF1ZXJ5LmRvd25sb2FkKSkge1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdhdHRhY2htZW50OyBmaWxlbmFtZT0nICsgYXNzZXQuZmlsZW5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG91dFN0cmVhbTtcbiAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS50aHVtYm5haWwpKSB7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnaW1hZ2UvcG5nJyk7XG4gICAgICAgICAgICBvdXRTdHJlYW0gPSBhd2FpdCB0aGlzLl9hc3NldHMudGh1bWJuYWlsKGFzc2V0KTtcbiAgICAgICAgICAgIGlmIChvdXRTdHJlYW0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoJ0Nhbm5vdCBnZW5lcmF0ZSB0aHVtYm5haWwgZm9yIG1pbWV0eXBlOiAnICsgYXNzZXQubWltZSAsIDQwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgb3V0U3RyZWFtID0gYXdhaXQgdGhpcy5fYXNzZXRzLnN0cmVhbShhc3NldCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXMud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgIG91dFN0cmVhbS5waXBlKHJlcyk7XG5cbiAgICB9XG5cblxuICAgIGFzeW5jIHJlbW92ZVJlc291cmNlKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgcGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuXG5cbiAgICAgICAgZGVidWcoJ3F1ZXJpbmcgcGF0aCAlcycsIHBhdGgpXG4gICAgICAgIGlmIChwYXRoWzBdICE9PSAnLycpIHBhdGggPSBcIi9cIiArIHBhdGg7XG5cbiAgICAgICAgbGV0IGFzc2V0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmdldEJ5UGF0aChwYXRoKTtcbiAgICAgICAgaWYgKCFhc3NldCkgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vdCBGb3VuZFwiLCA0MDQpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX2Fzc2V0cy5yZW1vdmUoYXNzZXQpO1xuICAgICAgICBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCB7XG4gICAgICAgICAgICBzdGF0dXM6ICdvaydcbiAgICAgICAgfSk7XG5cbiAgICB9XG5cblxuICAgIHByaXZhdGUgX3dyaXRlSlNPTihyZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIGpzb246YW55LCBzdGF0dXM6bnVtYmVyID0gMjAwKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgbGV0IHN0ciA9IEpTT04uc3RyaW5naWZ5KGpzb24pO1xuXG4gICAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgLy8nQ29udGVudC1MZW5ndGgnOiBzdHIubGVuZ3RoICsgXCJcIlxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgcmVzLndyaXRlKHN0ciwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZSkgcmV0dXJuIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0UXVlcnkodXJsOnN0cmluZyk6IGFueSB7XG4gICAgICAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IHN0ciA9IHVybC5zdWJzdHIoaW5kZXggKyAxLCB1cmwubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnlzdHJpbmcucGFyc2Uoc3RyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVhZEJvZHkocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgdmFyIGJ1ZmZlciA9IFtdO1xuXG4gICAgICAgICAgIHJlcS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICBidWZmZXIucHVzaChkYXRhKTtcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICByZXNvbHZlKEJ1ZmZlci5jb25jYXQoYnVmZmVyKS50b1N0cmluZygpKTtcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdCk7XG5cblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWFkRm9ybShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTx7ZmllbGRzOmZvcm1pZGFibGUuRmllbGRzLCBmaWxlczpmb3JtaWRhYmxlLkZpbGVzfT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgbGV0IGZvcm0gPSBuZXcgZm9ybWlkYWJsZS5JbmNvbWluZ0Zvcm0oKTtcbiAgICAgICAgICAgZm9ybS5rZWVwRXh0ZW5zaW9ucyA9IHRydWU7XG4gICAgICAgICAgIGZvcm0ucGFyc2UocmVxLCAoZXJyLCBmaWVsZHM6IGZvcm1pZGFibGUuRmllbGRzLCBmaWxlczogZm9ybWlkYWJsZS5GaWxlcykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtmaWVsZHMsZmlsZXN9KTtcbiAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfd3JpdGVMaW5rc0hlYWRlcihyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UsIGxpbmtzOiB7cHJldj86bnVtYmVyLCBuZXh0PzpudW1iZXIsIGxhc3Q/Om51bWJlciwgZmlyc3Q/Om51bWJlcn0pIHtcblxuICAgICAgICBsZXQgdXJsID0gcmVxLnVybDtcblxuICAgICAgICB1cmwgPSByZXEuaGVhZGVyc1snaG9zdCddICsgdXJsICsgICh1cmwuaW5kZXhPZignPycpID09IC0xID8gXCI/XCIgOiBcIiZcIikgKyAncGFnZT0nO1xuXG4gICAgICAgIHVybCA9IFwiaHR0cDovL1wiICsgdXJsXG5cbiAgICAgICAgcmVzLnNldEhlYWRlcignTGluaycsIE9iamVjdC5rZXlzKGxpbmtzKS5tYXAoZnVuY3Rpb24ocmVsKXtcbiAgICAgICAgICAgIHJldHVybiAnPCcgKyB1cmwgKyBsaW5rc1tyZWxdICsgJz47IHJlbD1cIicgKyByZWwgKyAnXCInO1xuICAgICAgICB9KS5qb2luKCcsICcpKTtcbiAgICB9XG5cbn1cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
