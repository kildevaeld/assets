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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHAvc2VydmVyLmpzIiwiaHR0cC9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7QUFDQSxJQUFJLFlBQVksU0FBQyxJQUFRLFVBQUssU0FBTCxJQUFtQixVQUFVLE9BQVYsRUFBbUIsVUFBbkIsRUFBK0IsQ0FBL0IsRUFBa0MsU0FBbEMsRUFBNkM7QUFDckYsV0FBTyxLQUFLLE1BQU0sSUFBSSxPQUFKLENBQU4sQ0FBTCxDQUF5QixVQUFVLE9BQVYsRUFBbUIsTUFBbkIsRUFBMkI7QUFDdkQsaUJBQVMsU0FBVCxDQUFtQixLQUFuQixFQUEwQjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxJQUFWLENBQWUsS0FBZixDQUFMLEVBQUY7YUFBSixDQUFxQyxPQUFPLENBQVAsRUFBVTtBQUFFLHVCQUFPLENBQVAsRUFBRjthQUFWO1NBQWpFO0FBQ0EsaUJBQVMsUUFBVCxDQUFrQixLQUFsQixFQUF5QjtBQUFFLGdCQUFJO0FBQUUscUJBQUssVUFBVSxLQUFWLENBQWdCLEtBQWhCLENBQUwsRUFBRjthQUFKLENBQXNDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxJQUFULENBQWMsTUFBZCxFQUFzQjtBQUFFLG1CQUFPLElBQVAsR0FBYyxRQUFRLE9BQU8sS0FBUCxDQUF0QixHQUFzQyxJQUFJLENBQUosQ0FBTSxVQUFVLE9BQVYsRUFBbUI7QUFBRSx3QkFBUSxPQUFPLEtBQVAsQ0FBUixDQUFGO2FBQW5CLENBQU4sQ0FBcUQsSUFBckQsQ0FBMEQsU0FBMUQsRUFBcUUsUUFBckUsQ0FBdEMsQ0FBRjtTQUF0QjtBQUNBLGFBQUssQ0FBQyxZQUFZLFVBQVUsS0FBVixDQUFnQixPQUFoQixFQUF5QixVQUF6QixDQUFaLENBQUQsQ0FBbUQsSUFBbkQsRUFBTCxFQUp1RDtLQUEzQixDQUFoQyxDQURxRjtDQUE3QztBQ0E1QyxJQUFZLE9BQUksUUFBTSxNQUFOLENB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SixDQUZpSTtBQU0zSSxrQkFBTSxJQUFJLE9BQUosQ0FBWSxNQUFaLElBQXNCLEdBQXRCO0FBTnFJLGVBUTNJLEdBQU0sWUFBWSxHQUFaLENBUnFJO0FBUzNJLGdCQUFJLElBQUksSUFBSSxLQUFKLENBQVUsR0FBVixFQUFlLElBQWYsQ0FBSixDQVR1STtBQVczSSxnQkFBSSxFQUFFLEtBQUYsRUFBUzs7QUFFVCxvQkFBSSxFQUFFLEtBQUYsQ0FBUSxJQUFSLEVBQWM7QUFDZCwyQkFBTyxFQUFFLEtBQUYsQ0FBUSxJQUFSLENBRE87aUJBQWxCOztBQUZTLGlCQU9ULENBQUUsTUFBRixHQUFXLElBQVgsQ0FQUztBQVFULHNCQUFNLElBQUksTUFBSixDQUFXLENBQVgsQ0FBTixDQVJTO0FBU1QsdUJBQU8sUUFBUCxDQVRTO2FBQWIsTUFXTztBQUNILHVCQUFPLFFBQVAsQ0FERzthQVhQO0FBZUEsZ0JBQUksU0FBSixDQUFjLE1BQWQsRUFBc0IsT0FBTyxJQUFQLENBQVksS0FBWixFQUFtQixHQUFuQixDQUF1QixVQUFTLEdBQVQsRUFBWTtBQUNyRCx1QkFBTyxNQUFNLEdBQU4sR0FBWSxNQUFNLEdBQU4sQ0FBWixHQUF5QixVQUF6QixHQUFzQyxHQUF0QyxHQUE0QyxHQUE1QyxDQUQ4QzthQUFaLENBQXZCLENBRW5CLElBRm1CLENBRWQsSUFGYyxDQUF0QixFQTFCMkk7Ozs7V0FuVW5KOzs7QUFBYSxRQUFBLFlBQUEsR0FBWSxZQUFaIiwiZmlsZSI6Imh0dHAvc2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci50aHJvdyh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZShyZXN1bHQudmFsdWUpOyB9KS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jb25zdCBQYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuY29uc3QgRGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpO1xuY29uc3QgZm9ybWlkYWJsZSA9IHJlcXVpcmUoJ2Zvcm1pZGFibGUnKTtcbmNvbnN0IFVSTCA9IHJlcXVpcmUoJ3VybCcpO1xuY29uc3QgZGVidWcgPSBEZWJ1ZygnYXNzZXRzOmh0dHAnKSwgcGF0aFRvUmVnZXhwID0gcmVxdWlyZSgncGF0aC10by1yZWdleHAnKTtcbmZ1bmN0aW9uIHRvQm9vbGVhbihzdHIpIHtcbiAgICByZXR1cm4gISF+Wyd0cnVlJywgJ1RSVUUnLCAndCcsICd5JywgJ2onLCAneWVzJ10uaW5kZXhPZihzdHIpO1xufVxuY2xhc3MgSHR0cEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1zZywgY29kZSA9IDIwMCkge1xuICAgICAgICBzdXBlcihtc2cpO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG4gICAgICAgIHRoaXMuY29kZSA9IGNvZGU7XG4gICAgfVxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHRoaXMubWVzc2FnZVxuICAgICAgICB9O1xuICAgIH1cbn1cbmNsYXNzIEFzc2V0c1JvdXRlciB7XG4gICAgY29uc3RydWN0b3IoX2Fzc2V0cywgb3B0cyA9IHt9KSB7XG4gICAgICAgIHRoaXMuX2Fzc2V0cyA9IF9hc3NldHM7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdHM7XG4gICAgICAgIGxldCBwcmVmaXggPSBvcHRzLnByZWZpeDtcbiAgICAgICAgaWYgKHByZWZpeCA9PSBudWxsIHx8IHByZWZpeCA9PT0gXCJcIilcbiAgICAgICAgICAgIHByZWZpeCA9IFwiL1wiO1xuICAgICAgICBpZiAocHJlZml4ICE9PSBcIi9cIikge1xuICAgICAgICAgICAgaWYgKHByZWZpeFtwcmVmaXgubGVuZ3RoIC0gMV0gIT09IFwiL1wiKVxuICAgICAgICAgICAgICAgIHByZWZpeCArPSAnLyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRzLnByZWZpeCA9IHByZWZpeDtcbiAgICAgICAgdGhpcy5fcm91dGVzID0gW3tcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFsnR0VUJywgJ0RFTEVURSddLFxuICAgICAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCksXG4gICAgICAgICAgICAgICAgZm46ICdsaXN0J1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogWydHRVQnXSxcbiAgICAgICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXggKyBcIipcIiksXG4gICAgICAgICAgICAgICAgZm46ICdnZXRSZXNvdXJjZSdcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFsnUE9TVCddLFxuICAgICAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCksXG4gICAgICAgICAgICAgICAgZm46ICdjcmVhdGUnXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBbJ0RFTEVURSddLFxuICAgICAgICAgICAgICAgIHJlZzogcGF0aFRvUmVnZXhwKHByZWZpeCArICcqJyksXG4gICAgICAgICAgICAgICAgZm46ICdyZW1vdmVSZXNvdXJjZSdcbiAgICAgICAgICAgIH1dO1xuICAgIH1cbiAgICBtaWRkbGV3YXJlS29hMihjdHgsIG5leHQpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB5aWVsZCB0aGlzLm1pZGRsZXdhcmUoY3R4LnJlcSwgY3R4LnJlcywgbmV4dCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAqbWlkZGxld2FyZUtvYShjdHgsIG5leHQpIHtcbiAgICAgICAgeWllbGQgY3R4Lm1pZGRsZXdhcmUoY3R4LnJlcSwgY3R4LnJlcywgbmV4dCk7XG4gICAgfVxuICAgIG1pZGRsZXdhcmUocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgbGV0IHsgbWV0aG9kLCB1cmwgfSA9IHJlcTtcbiAgICAgICAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHVybCA9IHVybC5zdWJzdHIoMCwgaW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKCd0cnlpbmcgcm91dGU6IFwiJXNcIi4uLicsIHVybCk7XG4gICAgICAgIGxldCByb3V0ZSwgbWF0Y2g7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IHRoaXMuX3JvdXRlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICByb3V0ZSA9IHRoaXMuX3JvdXRlc1tpXTtcbiAgICAgICAgICAgIG1hdGNoID0gcm91dGUucmVnLmV4ZWModXJsKTtcbiAgICAgICAgICAgIGlmICghIX5yb3V0ZS5tZXRob2QuaW5kZXhPZihtZXRob2QpICYmIG1hdGNoICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb3V0ZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJvdXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICBkZWJ1Zygncm91dGUgbm8gbWF0Y2gnKTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0ID8gbmV4dCgpIDogdm9pZCAwO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKCdmb3VuZCByb3V0ZTogXCIlc1wiJywgcm91dGUuZm4pO1xuICAgICAgICByZXR1cm4gdGhpc1tyb3V0ZS5mbl0uY2FsbCh0aGlzLCByZXEsIHJlcywgbWF0Y2gubGVuZ3RoID09IDIgPyBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbMV0pIDogdW5kZWZpbmVkKVxuICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2UnLCBlLnN0YWNrKTtcbiAgICAgICAgICAgIHRoaXMuX3dyaXRlSlNPTihyZXMsIGUsIGUuY29kZSB8fCA1MDApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlKHJlcSwgcmVzKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IGNvbnRlbnRUeXBlID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddO1xuICAgICAgICAgICAgaWYgKCFjb250ZW50VHlwZSB8fCBjb250ZW50VHlwZS5pbmRleE9mKCdtdWx0aXBhcnQvZm9ybS1kYXRhJykgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvL3Rocm93IG5ldyBFcnJvcignbm90IG11bHRpZm9ybScpO1xuICAgICAgICAgICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuICAgICAgICAgICAgICAgIGlmIChxdWVyeS5maWxlbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbGVuID0gcGFyc2VJbnQocmVxLmhlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ10pLCB0eXBlID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IHF1ZXJ5LnBhdGggfHwgJy8nO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aFtwYXRoLmxlbmd0aCAtIDFdICE9ICcvJylcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggKz0gJy8nO1xuICAgICAgICAgICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLl9hc3NldHMuY3JlYXRlKHJlcSwgcGF0aCArIHF1ZXJ5LmZpbGVuYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW1lOiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogbGVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2tpcE1ldGE6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vdCBtdWx0aWZvcm0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB7IGZpbGVzLCBmaWVsZHMgfSA9IHlpZWxkIHRoaXMuX3JlYWRGb3JtKHJlcSk7XG4gICAgICAgICAgICBsZXQgZmlsZTtcbiAgICAgICAgICAgIGZvciAobGV0IGsgaW4gZmlsZXMpIHtcbiAgICAgICAgICAgICAgICBmaWxlID0gZmlsZXNba107XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWZpbGUpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgZmlsZScpO1xuICAgICAgICAgICAgbGV0IHBhdGggPSBmaWVsZHNbJ3BhdGgnXSB8fCAnLycsIGRlc3QgPSBQYXRoLmpvaW4ocGF0aCwgZmlsZS5uYW1lKSwgb3B0cyA9IHsgc2tpcE1ldGE6IGZhbHNlIH07XG4gICAgICAgICAgICBpZiAoZmllbGRzWyduYW1lJ10gJiYgZmllbGRzWyduYW1lJ10gIT0gXCJcIikge1xuICAgICAgICAgICAgICAgIG9wdHMubmFtZSA9IGZpZWxkc1snbmFtZSddO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpZWxkc1snbWltZSddICYmIGZpZWxkc1snbWltZSddICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBvcHRzLm1pbWUgPSBmaWVsZHNbJ21pbWUnXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlYnVnKCdjcmVhdGUgZmlsZSBcIiVzXCIsIG9wdGlvbnMgXCIlalwiJywgZGVzdCwgb3B0cyk7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLl9hc3NldHMuY3JlYXRlRnJvbVBhdGgoZmlsZS5wYXRoLCBkZXN0LCBvcHRzKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0LCAyMDEpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGlzdChyZXEsIHJlcykge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuICAgICAgICAgICAgaWYgKHF1ZXJ5LmlkKSB7XG4gICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0geWllbGQgdGhpcy5fYXNzZXRzLmdldEJ5SWQocXVlcnkuaWQpO1xuICAgICAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vdCBGb3VuZFwiLCA0MDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0RFTEVURScpIHtcbiAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhpcy5fYXNzZXRzLnJlbW92ZShhc3NldCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLl93cml0ZUpTT04ocmVzLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdvaydcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0RFTEVURScpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vIGlkXCIpO1xuICAgICAgICAgICAgbGV0IHBhZ2UgPSAxLCBsaW1pdCA9IDEwMDtcbiAgICAgICAgICAgIGlmIChxdWVyeS5wYWdlKSB7XG4gICAgICAgICAgICAgICAgbGV0IGkgPSBwYXJzZUludChxdWVyeS5wYWdlKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKGkpKVxuICAgICAgICAgICAgICAgICAgICBwYWdlID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChxdWVyeS5saW1pdCkge1xuICAgICAgICAgICAgICAgIGxldCBpID0gcGFyc2VJbnQocXVlcnkubGltaXQpO1xuICAgICAgICAgICAgICAgIGlmICghaXNOYU4oaSkpXG4gICAgICAgICAgICAgICAgICAgIGxpbWl0ID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYWdlIDw9IDApXG4gICAgICAgICAgICAgICAgcGFnZSA9IDE7XG4gICAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgICAgaWYgKHF1ZXJ5LnEpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB5aWVsZCB0aGlzLl9hc3NldHMucXVlcnkocXVlcnkucSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgY291bnQgPSB5aWVsZCB0aGlzLl9hc3NldHMubWV0YVN0b3JlLmNvdW50KCk7XG4gICAgICAgICAgICAgICAgbGV0IHBhZ2VzID0gTWF0aC5jZWlsKGNvdW50IC8gbGltaXQpO1xuICAgICAgICAgICAgICAgIGxldCBvZmZzZXQgPSBsaW1pdCAqIChwYWdlIC0gMSk7XG4gICAgICAgICAgICAgICAgaWYgKG9mZnNldCA+IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geWllbGQgdGhpcy5fYXNzZXRzLmxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW1pdDogbGltaXRcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBsaW5rcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3Q6IDEsXG4gICAgICAgICAgICAgICAgICAgIGxhc3Q6IHBhZ2VzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocGFnZSA+IDEpXG4gICAgICAgICAgICAgICAgICAgIGxpbmtzLnByZXYgPSBwYWdlIC0gMTtcbiAgICAgICAgICAgICAgICBpZiAocGFnZSA8IHBhZ2VzKVxuICAgICAgICAgICAgICAgICAgICBsaW5rcy5uZXh0ID0gcGFnZSArIDE7XG4gICAgICAgICAgICAgICAgdGhpcy5fd3JpdGVMaW5rc0hlYWRlcihyZXEsIHJlcywgbGlua3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywgcmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGdldFJlc291cmNlKHJlcSwgcmVzLCBwYXRoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG4gICAgICAgICAgICBpZiAocGF0aFswXSAhPT0gJy8nKVxuICAgICAgICAgICAgICAgIHBhdGggPSBcIi9cIiArIHBhdGg7XG4gICAgICAgICAgICBsZXQgYXNzZXQgPSB5aWVsZCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKCFhc3NldClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwNCk7XG4gICAgICAgICAgICBpZiAodG9Cb29sZWFuKHF1ZXJ5Lm1ldGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0LCAyMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgYXNzZXQubWltZSk7XG4gICAgICAgICAgICAvL3Jlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgYXNzZXQuc2l6ZSArIFwiXCIpO1xuICAgICAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS5kb3dubG9hZCkpIHtcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPScgKyBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgb3V0U3RyZWFtO1xuICAgICAgICAgICAgaWYgKHRvQm9vbGVhbihxdWVyeS50aHVtYm5haWwpKSB7XG4gICAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2ltYWdlL3BuZycpO1xuICAgICAgICAgICAgICAgIG91dFN0cmVhbSA9IHlpZWxkIHRoaXMuX2Fzc2V0cy50aHVtYm5haWwoYXNzZXQpO1xuICAgICAgICAgICAgICAgIGlmIChvdXRTdHJlYW0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKCdDYW5ub3QgZ2VuZXJhdGUgdGh1bWJuYWlsIGZvciBtaW1ldHlwZTogJyArIGFzc2V0Lm1pbWUsIDQwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0U3RyZWFtID0geWllbGQgdGhpcy5fYXNzZXRzLnN0cmVhbShhc3NldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgICAgICBvdXRTdHJlYW0ucGlwZShyZXMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmVtb3ZlUmVzb3VyY2UocmVxLCByZXMsIHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcbiAgICAgICAgICAgIGRlYnVnKCdxdWVyaW5nIHBhdGggJXMnLCBwYXRoKTtcbiAgICAgICAgICAgIGlmIChwYXRoWzBdICE9PSAnLycpXG4gICAgICAgICAgICAgICAgcGF0aCA9IFwiL1wiICsgcGF0aDtcbiAgICAgICAgICAgIGxldCBhc3NldCA9IHlpZWxkIHRoaXMuX2Fzc2V0cy5nZXRCeVBhdGgocGF0aCk7XG4gICAgICAgICAgICBpZiAoIWFzc2V0KVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBIdHRwRXJyb3IoXCJOb3QgRm91bmRcIiwgNDA0KTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMuX2Fzc2V0cy5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgeWllbGQgdGhpcy5fd3JpdGVKU09OKHJlcywge1xuICAgICAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfd3JpdGVKU09OKHJlcywganNvbiwgc3RhdHVzID0gMjAwKSB7XG4gICAgICAgIGxldCBzdHIgPSBKU09OLnN0cmluZ2lmeShqc29uKTtcbiAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXMsIHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgcmVzLndyaXRlKHN0ciwgKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2dldFF1ZXJ5KHVybCkge1xuICAgICAgICBsZXQgaW5kZXggPSB1cmwuaW5kZXhPZignPycpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGV0IHN0ciA9IHVybC5zdWJzdHIoaW5kZXggKyAxLCB1cmwubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnlzdHJpbmcucGFyc2Uoc3RyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuICAgIF9yZWFkQm9keShyZXEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHZhciBidWZmZXIgPSBbXTtcbiAgICAgICAgICAgIHJlcS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoQnVmZmVyLmNvbmNhdChidWZmZXIpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXEub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIF9yZWFkRm9ybShyZXEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCBmb3JtID0gbmV3IGZvcm1pZGFibGUuSW5jb21pbmdGb3JtKCk7XG4gICAgICAgICAgICBmb3JtLmtlZXBFeHRlbnNpb25zID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvcm0ucGFyc2UocmVxLCAoZXJyLCBmaWVsZHMsIGZpbGVzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBmaWVsZHM6IGZpZWxkcywgZmlsZXM6IGZpbGVzIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfd3JpdGVMaW5rc0hlYWRlcihyZXEsIHJlcywgbGlua3MpIHtcbiAgICAgICAgbGV0IHVybCA9IHJlcS51cmw7XG4gICAgICAgIHVybCA9IHJlcS5oZWFkZXJzWydob3N0J10gKyB1cmw7IC8vICsgICh1cmwuaW5kZXhPZignPycpID09IC0xID8gXCI/XCIgOiBcIiZcIikgKyAncGFnZT0nO1xuICAgICAgICB1cmwgPSBcImh0dHA6Ly9cIiArIHVybDtcbiAgICAgICAgbGV0IHUgPSBVUkwucGFyc2UodXJsLCB0cnVlKTtcbiAgICAgICAgaWYgKHUucXVlcnkpIHtcbiAgICAgICAgICAgIC8qbGV0IHF1ZXJ5ID0gUXMucGFyc2UodS5xdWVyeSk7Ki9cbiAgICAgICAgICAgIGlmICh1LnF1ZXJ5LnBhZ2UpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdS5xdWVyeS5wYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy91LnF1ZXJ5ID0gUXMuc3RyaW5naWZ5KHF1ZXJ5KTtcbiAgICAgICAgICAgIHUuc2VhcmNoID0gbnVsbDtcbiAgICAgICAgICAgIHVybCA9IFVSTC5mb3JtYXQodSk7XG4gICAgICAgICAgICB1cmwgKz0gXCImcGFnZT1cIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHVybCArPSAnP3BhZ2U9JztcbiAgICAgICAgfVxuICAgICAgICByZXMuc2V0SGVhZGVyKCdMaW5rJywgT2JqZWN0LmtleXMobGlua3MpLm1hcChmdW5jdGlvbiAocmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gJzwnICsgdXJsICsgbGlua3NbcmVsXSArICc+OyByZWw9XCInICsgcmVsICsgJ1wiJztcbiAgICAgICAgfSkuam9pbignLCAnKSk7XG4gICAgfVxufVxuZXhwb3J0cy5Bc3NldHNSb3V0ZXIgPSBBc3NldHNSb3V0ZXI7XG4iLCJpbXBvcnQgKiBhcyBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0ICogYXMgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHF1ZXJ5c3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCAqIGFzIERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCAqIGFzIGZvcm1pZGFibGUgZnJvbSAnZm9ybWlkYWJsZSc7XG5pbXBvcnQgKiBhcyBVUkwgZnJvbSAndXJsJztcbmltcG9ydCAqIGFzIFFzIGZyb20gJ3F1ZXJ5c3RyaW5nJztcblxuaW1wb3J0IHtBc3NldHMsIEFzc2V0Q3JlYXRlT3B0aW9uc30gZnJvbSAnLi4vaW5kZXgnO1xuXG5jb25zdCBkZWJ1ZyA9IERlYnVnKCdhc3NldHM6aHR0cCcpLFxuICAgIHBhdGhUb1JlZ2V4cCA9IHJlcXVpcmUoJ3BhdGgtdG8tcmVnZXhwJylcblxuZnVuY3Rpb24gdG9Cb29sZWFuKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICEhflsndHJ1ZScsICdUUlVFJywndCcsICd5JywnaicsJ3llcyddLmluZGV4T2Yoc3RyKVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc2V0c1JvdXRlck9wdGlvbnMge1xuICAgIHByZWZpeD86IHN0cmluZ1xufVxuXG5pbnRlcmZhY2UgUm91dGUge1xuICAgIG1ldGhvZDogc3RyaW5nW107XG4gICAgcmVnOiBSZWdFeHA7XG4gICAgZm46IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFJvdXRlTWFwIHtcbiAgICBsaXN0OiBSb3V0ZTtcbiAgICBjcmVhdGU6IFJlZ0V4cDtcbn1cblxuY2xhc3MgSHR0cEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvZGU6IG51bWJlcjtcbiAgICBjb25zdHJ1Y3Rvcihtc2c6c3RyaW5nLCBjb2RlOm51bWJlciA9IDIwMCkge1xuICAgICAgICBzdXBlcihtc2cpO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG4gICAgICAgIHRoaXMuY29kZSA9IGNvZGU7XG4gICAgfVxuXG4gICAgdG9KU09OKCk6IGFueSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBtZXNzYWdlOiB0aGlzLm1lc3NhZ2VcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldHNSb3V0ZXIge1xuICAgIHByaXZhdGUgX3JvdXRlczogUm91dGVbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2Fzc2V0czogQXNzZXRzLCBwcml2YXRlIG9wdHM6IEFzc2V0c1JvdXRlck9wdGlvbnMgPSB7fSkge1xuICAgICAgICBsZXQgcHJlZml4ID0gb3B0cy5wcmVmaXg7XG4gICAgICAgIGlmIChwcmVmaXggPT0gbnVsbCB8fCBwcmVmaXggPT09IFwiXCIpIHByZWZpeCA9IFwiL1wiO1xuICAgICAgICBpZiAocHJlZml4ICE9PSBcIi9cIikge1xuICAgICAgICAgICAgaWYgKHByZWZpeFtwcmVmaXgubGVuZ3RoIC0xXSAhPT0gXCIvXCIpIHByZWZpeCArPSAnLyc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdHMucHJlZml4ID0gcHJlZml4O1xuXG5cbiAgICAgICAgdGhpcy5fcm91dGVzID0gW3tcbiAgICAgICAgICAgIG1ldGhvZDogWydHRVQnLCAnREVMRVRFJ10sXG4gICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXgpLFxuICAgICAgICAgICAgZm46ICdsaXN0J1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBtZXRob2Q6IFsnR0VUJ10sXG4gICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXggKyBcIipcIiksXG4gICAgICAgICAgICBmbjogJ2dldFJlc291cmNlJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBtZXRob2Q6IFsnUE9TVCddLFxuICAgICAgICAgICAgcmVnOiBwYXRoVG9SZWdleHAocHJlZml4KSxcbiAgICAgICAgICAgIGZuOiAnY3JlYXRlJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBtZXRob2Q6IFsnREVMRVRFJ10sXG4gICAgICAgICAgICByZWc6IHBhdGhUb1JlZ2V4cChwcmVmaXggKyAnKicpLFxuICAgICAgICAgICAgZm46ICdyZW1vdmVSZXNvdXJjZSdcbiAgICAgICAgfV07XG5cbiAgICB9XG5cbiAgICBhc3luYyBtaWRkbGV3YXJlS29hMiAoY3R4LCBuZXh0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMubWlkZGxld2FyZShjdHgucmVxLCBjdHgucmVzLCBuZXh0KTtcbiAgICB9XG5cbiAgICAqIG1pZGRsZXdhcmVLb2EgKGN0eCwgbmV4dCkge1xuICAgICAgICB5aWVsZCBjdHgubWlkZGxld2FyZShjdHgucmVxLCBjdHgucmVzLCBuZXh0KTtcbiAgICB9XG5cbiAgICBtaWRkbGV3YXJlIChyZXE6aHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczpodHRwLlNlcnZlclJlc3BvbnNlLCBuZXh0Pyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGxldCB7bWV0aG9kLCB1cmx9ID0gcmVxO1xuXG4gICAgICAgIGxldCBpbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG5cbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHVybCA9IHVybC5zdWJzdHIoMCwgaW5kZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVidWcoJ3RyeWluZyByb3V0ZTogXCIlc1wiLi4uJywgdXJsKTtcblxuICAgICAgICBsZXQgcm91dGU6IFJvdXRlLCBtYXRjaDogc3RyaW5nW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gdGhpcy5fcm91dGVzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHJvdXRlID0gdGhpcy5fcm91dGVzW2ldO1xuICAgICAgICAgICAgbWF0Y2ggPSByb3V0ZS5yZWcuZXhlYyh1cmwpO1xuICAgICAgICAgICAgaWYgKCEhfnJvdXRlLm1ldGhvZC5pbmRleE9mKG1ldGhvZCkgJiYgbWF0Y2ggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvdXRlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb3V0ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgZGVidWcoJ3JvdXRlIG5vIG1hdGNoJyk7XG4gICAgICAgICAgICByZXR1cm4gbmV4dCA/IG5leHQoKSA6IHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZygnZm91bmQgcm91dGU6IFwiJXNcIicsIHJvdXRlLmZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXNbcm91dGUuZm5dLmNhbGwodGhpcywgcmVxLCByZXMsIG1hdGNoLmxlbmd0aCA9PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzFdKSA6IHVuZGVmaW5lZClcbiAgICAgICAgLmNhdGNoKCBlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlJywgZS5zdGFjaylcbiAgICAgICAgICAgIHRoaXMuX3dyaXRlSlNPTihyZXMsIGUsIGUuY29kZXx8NTAwKTtcbiAgICAgICAgfSlcblxuICAgIH1cblxuICAgIGFzeW5jIGNyZWF0ZShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgXG4gICAgICAgIGxldCBjb250ZW50VHlwZSA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXVxuICAgICAgICBpZiAoIWNvbnRlbnRUeXBlIHx8IGNvbnRlbnRUeXBlLmluZGV4T2YoJ211bHRpcGFydC9mb3JtLWRhdGEnKSA9PSAtMSkge1xuICAgICAgICAgICAgLy90aHJvdyBuZXcgRXJyb3IoJ25vdCBtdWx0aWZvcm0nKTtcbiAgICAgICAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2dldFF1ZXJ5KHJlcS51cmwpO1xuXG4gICAgICAgICAgICBpZiAocXVlcnkuZmlsZW5hbWUpIHtcblxuICAgICAgICAgICAgICAgIGxldCBsZW4gPSBwYXJzZUludChyZXEuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSksXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgOiBzdHJpbmcgPSByZXEuaGVhZGVyc1snY29udGVudC10eXBlJ107XG5cbiAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBxdWVyeS5wYXRofHwnLydcbiAgICAgICAgICAgICAgICBpZiAocGF0aFtwYXRoLmxlbmd0aCAtIDFdICE9ICcvJykgcGF0aCArPSAnLyc7XG4gICAgICAgICAgICAgICAgbGV0IGFzc2V0ID0gYXdhaXQgdGhpcy5fYXNzZXRzLmNyZWF0ZShyZXEsIHBhdGggKyBxdWVyeS5maWxlbmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBtaW1lOiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBsZW4sXG4gICAgICAgICAgICAgICAgICAgIHNraXBNZXRhOiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0KTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgbXVsdGlmb3JtJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQge2ZpbGVzLCBmaWVsZHN9ID0gYXdhaXQgdGhpcy5fcmVhZEZvcm0ocmVxKTtcblxuICAgICAgICBsZXQgZmlsZTogZm9ybWlkYWJsZS5GaWxlO1xuICAgICAgICBmb3IgKGxldCBrIGluIGZpbGVzKSB7XG4gICAgICAgICAgICBmaWxlID0gZmlsZXNba107XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZmlsZSkgdGhyb3cgbmV3IEVycm9yKCdub3QgZmlsZScpO1xuXG5cbiAgICAgICAgbGV0IHBhdGggPSBmaWVsZHNbJ3BhdGgnXXx8ICcvJyxcbiAgICAgICAgICAgIGRlc3QgPSBQYXRoLmpvaW4ocGF0aCwgZmlsZS5uYW1lKSxcbiAgICAgICAgICAgIG9wdHM6IEFzc2V0Q3JlYXRlT3B0aW9ucyA9IHtza2lwTWV0YTpmYWxzZX07XG5cbiAgICAgICAgaWYgKGZpZWxkc1snbmFtZSddICYmIGZpZWxkc1snbmFtZSddICE9IFwiXCIpIHtcbiAgICAgICAgICAgIG9wdHMubmFtZSA9IGZpZWxkc1snbmFtZSddO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpZWxkc1snbWltZSddICYmIGZpZWxkc1snbWltZSddICE9IFwiXCIpIHtcbiAgICAgICAgICAgIG9wdHMubWltZSA9IGZpZWxkc1snbWltZSddO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKCdjcmVhdGUgZmlsZSBcIiVzXCIsIG9wdGlvbnMgXCIlalwiJywgZGVzdCwgb3B0cyk7XG4gICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5jcmVhdGVGcm9tUGF0aChmaWxlLnBhdGgsIGRlc3QsIG9wdHMpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIGFzc2V0LCAyMDEpO1xuXG4gICAgfVxuXG5cbiAgICBhc3luYyBsaXN0IChyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXM6IGh0dHAuU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcblxuICAgICAgICBpZiAocXVlcnkuaWQpIHtcbiAgICAgICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5nZXRCeUlkKHF1ZXJ5LmlkKTtcbiAgICAgICAgICAgIGlmICghYXNzZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnREVMRVRFJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2Fzc2V0cy5yZW1vdmUoYXNzZXQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fd3JpdGVKU09OKHJlcywgYXNzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdERUxFVEUnKSB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm8gaWRcIik7XG5cbiAgICAgICAgbGV0IHBhZ2UgPSAxLCBsaW1pdCA9IDEwMDtcbiAgICAgICAgaWYgKHF1ZXJ5LnBhZ2UpIHtcbiAgICAgICAgICAgIGxldCBpID0gcGFyc2VJbnQocXVlcnkucGFnZSk7XG4gICAgICAgICAgICBpZiAoIWlzTmFOKGkpKSBwYWdlID0gaTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChxdWVyeS5saW1pdCkge1xuICAgICAgICAgICAgbGV0IGkgPSBwYXJzZUludChxdWVyeS5saW1pdCk7XG4gICAgICAgICAgICBpZiAoIWlzTmFOKGkpKSBsaW1pdCA9IGk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFnZSA8PSAwKSBwYWdlID0gMTtcblxuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICBpZiAocXVlcnkucSkge1xuXG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9hc3NldHMucXVlcnkocXVlcnkucSk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBjb3VudCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5tZXRhU3RvcmUuY291bnQoKTtcbiAgICAgICAgICAgIGxldCBwYWdlcyA9IE1hdGguY2VpbChjb3VudCAvIGxpbWl0KTtcbiAgICAgICAgICAgIGxldCBvZmZzZXQgPSBsaW1pdCAqIChwYWdlIC0gMSk7XG5cbiAgICAgICAgICAgIGlmIChvZmZzZXQgPiBjb3VudCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9hc3NldHMubGlzdCh7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICBsaW1pdDogbGltaXRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGxpbmtzOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgZmlyc3Q6IDEsXG4gICAgICAgICAgICAgICAgbGFzdDogcGFnZXNcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChwYWdlID4gMSkgbGlua3MucHJldiA9IHBhZ2UgLSAxO1xuICAgICAgICAgICAgaWYgKHBhZ2UgPCBwYWdlcykgbGlua3MubmV4dCA9IHBhZ2UgKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl93cml0ZUxpbmtzSGVhZGVyKHJlcSwgcmVzLCBsaW5rcyk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIHJlc3VsdCk7XG5cbiAgICB9XG5cbiAgICBhc3luYyBnZXRSZXNvdXJjZSAocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLl9nZXRRdWVyeShyZXEudXJsKTtcblxuICAgICAgICBpZiAocGF0aFswXSAhPT0gJy8nKSBwYXRoID0gXCIvXCIgKyBwYXRoO1xuXG4gICAgICAgIGxldCBhc3NldCA9IGF3YWl0IHRoaXMuX2Fzc2V0cy5nZXRCeVBhdGgocGF0aCk7XG5cbiAgICAgICAgaWYgKCFhc3NldCkgdGhyb3cgbmV3IEh0dHBFcnJvcihcIk5vdCBGb3VuZFwiLCA0MDQpO1xuXG4gICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkubWV0YSkpIHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl93cml0ZUpTT04ocmVzLCBhc3NldCwgMjAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGFzc2V0Lm1pbWUpO1xuICAgICAgICAvL3Jlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgYXNzZXQuc2l6ZSArIFwiXCIpO1xuXG4gICAgICAgIGlmICh0b0Jvb2xlYW4ocXVlcnkuZG93bmxvYWQpKSB7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPScgKyBhc3NldC5maWxlbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb3V0U3RyZWFtO1xuICAgICAgICBpZiAodG9Cb29sZWFuKHF1ZXJ5LnRodW1ibmFpbCkpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdpbWFnZS9wbmcnKTtcbiAgICAgICAgICAgIG91dFN0cmVhbSA9IGF3YWl0IHRoaXMuX2Fzc2V0cy50aHVtYm5haWwoYXNzZXQpO1xuICAgICAgICAgICAgaWYgKG91dFN0cmVhbSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEh0dHBFcnJvcignQ2Fubm90IGdlbmVyYXRlIHRodW1ibmFpbCBmb3IgbWltZXR5cGU6ICcgKyBhc3NldC5taW1lICwgNDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICBvdXRTdHJlYW0gPSBhd2FpdCB0aGlzLl9hc3NldHMuc3RyZWFtKGFzc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgb3V0U3RyZWFtLnBpcGUocmVzKTtcblxuICAgIH1cblxuXG4gICAgYXN5bmMgcmVtb3ZlUmVzb3VyY2UocmVxOiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzOiBodHRwLlNlcnZlclJlc3BvbnNlLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5fZ2V0UXVlcnkocmVxLnVybCk7XG5cblxuICAgICAgICBkZWJ1ZygncXVlcmluZyBwYXRoICVzJywgcGF0aClcbiAgICAgICAgaWYgKHBhdGhbMF0gIT09ICcvJykgcGF0aCA9IFwiL1wiICsgcGF0aDtcblxuICAgICAgICBsZXQgYXNzZXQgPSBhd2FpdCB0aGlzLl9hc3NldHMuZ2V0QnlQYXRoKHBhdGgpO1xuICAgICAgICBpZiAoIWFzc2V0KSB0aHJvdyBuZXcgSHR0cEVycm9yKFwiTm90IEZvdW5kXCIsIDQwNCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5fYXNzZXRzLnJlbW92ZShhc3NldCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX3dyaXRlSlNPTihyZXMsIHtcbiAgICAgICAgICAgIHN0YXR1czogJ29rJ1xuICAgICAgICB9KTtcblxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBfd3JpdGVKU09OKHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwganNvbjphbnksIHN0YXR1czpudW1iZXIgPSAyMDApOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgc3RyID0gSlNPTi5zdHJpbmdpZnkoanNvbik7XG5cbiAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXMsIHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAvLydDb250ZW50LUxlbmd0aCc6IHN0ci5sZW5ndGggKyBcIlwiXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXMud3JpdGUoc3RyLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlKSByZXR1cm4gcmVqZWN0KGUpO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH0pXG5cbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRRdWVyeSh1cmw6c3RyaW5nKTogYW55IHtcbiAgICAgICBsZXQgaW5kZXggPSB1cmwuaW5kZXhPZignPycpO1xuXG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBsZXQgc3RyID0gdXJsLnN1YnN0cihpbmRleCArIDEsIHVybC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIHJldHVybiBxdWVyeXN0cmluZy5wYXJzZShzdHIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWFkQm9keShyZXE6IGh0dHAuSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICB2YXIgYnVmZmVyID0gW107XG5cbiAgICAgICAgICAgcmVxLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGRhdGEpO1xuICAgICAgICAgICB9KTtcblxuICAgICAgICAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgIHJlc29sdmUoQnVmZmVyLmNvbmNhdChidWZmZXIpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICB9KTtcblxuICAgICAgICAgICByZXEub24oJ2Vycm9yJywgcmVqZWN0KTtcblxuXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlYWRGb3JtKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPHtmaWVsZHM6Zm9ybWlkYWJsZS5GaWVsZHMsIGZpbGVzOmZvcm1pZGFibGUuRmlsZXN9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHtcblxuICAgICAgICAgICBsZXQgZm9ybSA9IG5ldyBmb3JtaWRhYmxlLkluY29taW5nRm9ybSgpO1xuICAgICAgICAgICBmb3JtLmtlZXBFeHRlbnNpb25zID0gdHJ1ZTtcbiAgICAgICAgICAgZm9ybS5wYXJzZShyZXEsIChlcnIsIGZpZWxkczogZm9ybWlkYWJsZS5GaWVsZHMsIGZpbGVzOiBmb3JtaWRhYmxlLkZpbGVzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe2ZpZWxkcyxmaWxlc30pO1xuICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF93cml0ZUxpbmtzSGVhZGVyKHJlcTogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlczogaHR0cC5TZXJ2ZXJSZXNwb25zZSwgbGlua3M6IHtwcmV2PzpudW1iZXIsIG5leHQ/Om51bWJlciwgbGFzdD86bnVtYmVyLCBmaXJzdD86bnVtYmVyfSkge1xuXG4gICAgICAgIGxldCB1cmwgPSByZXEudXJsO1xuXG5cblxuICAgICAgICB1cmwgPSByZXEuaGVhZGVyc1snaG9zdCddICsgdXJsIC8vICsgICh1cmwuaW5kZXhPZignPycpID09IC0xID8gXCI/XCIgOiBcIiZcIikgKyAncGFnZT0nO1xuXG4gICAgICAgIHVybCA9IFwiaHR0cDovL1wiICsgdXJsXG4gICAgICAgIGxldCB1ID0gVVJMLnBhcnNlKHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKHUucXVlcnkpIHtcbiAgICAgICAgICAgIC8qbGV0IHF1ZXJ5ID0gUXMucGFyc2UodS5xdWVyeSk7Ki9cbiAgICAgICAgICAgIGlmICh1LnF1ZXJ5LnBhZ2UpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdS5xdWVyeS5wYWdlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3UucXVlcnkgPSBRcy5zdHJpbmdpZnkocXVlcnkpO1xuICAgICAgICAgICAgdS5zZWFyY2ggPSBudWxsO1xuICAgICAgICAgICAgdXJsID0gVVJMLmZvcm1hdCh1KTtcbiAgICAgICAgICAgIHVybCArPSBcIiZwYWdlPVwiO1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cmwgKz0gJz9wYWdlPSc7XG4gICAgICAgIH1cblxuICAgICAgICByZXMuc2V0SGVhZGVyKCdMaW5rJywgT2JqZWN0LmtleXMobGlua3MpLm1hcChmdW5jdGlvbihyZWwpe1xuICAgICAgICAgICAgcmV0dXJuICc8JyArIHVybCArIGxpbmtzW3JlbF0gKyAnPjsgcmVsPVwiJyArIHJlbCArICdcIic7XG4gICAgICAgIH0pLmpvaW4oJywgJykpO1xuICAgIH1cblxufVxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
