/// <reference path="./messages/file.d.ts" />
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
var PROTO_PATH = Path.join(__dirname, 'messages', 'file.proto');
var grpc = require('grpc');
function bindAll(obj, attr) {
    for (var i = 0, ii = attr.length; i < ii; i++) {
        obj[attr[i]] = obj[attr[i]].bind(obj);
    }
}

var FileServiceImpl = function () {
    function FileServiceImpl(assets) {
        _classCallCheck(this, FileServiceImpl);

        this.assets = assets;
        bindAll(this, ['list', 'createRequest', 'create', 'get', 'remove', 'stream']);
    }

    _createClass(FileServiceImpl, [{
        key: 'list',
        value: function list(call) {
            this.assets.list(call.request).then(function (list) {
                for (var i = 0, ii = list.length; i < ii; i++) {
                    var a = list[i];
                    call.write({
                        filename: a.filename,
                        path: a.path,
                        mime: a.mime,
                        size: a.size,
                        id: a.id
                    });
                }
                call.end();
            });
        }
    }, {
        key: 'createRequest',
        value: function createRequest(call, cb) {}
    }, {
        key: 'create',
        value: function create(call, cb) {}
    }, {
        key: 'get',
        value: function get(call, cb) {}
    }, {
        key: 'remove',
        value: function remove(call, cb) {}
    }, {
        key: 'stream',
        value: function stream(call, cb) {}
    }]);

    return FileServiceImpl;
}();

var RpcServer = function () {
    function RpcServer(_assets) {
        _classCallCheck(this, RpcServer);

        this._assets = _assets;
        var server = new grpc.Server();
        this.server = server;
    }

    _createClass(RpcServer, [{
        key: 'initialize',
        value: function initialize() {
            return __awaiter(this, void 0, Promise, function* () {
                var proto = grpc.load(PROTO_PATH).messages;
                //
                this.server.addProtoService(proto.FileService.service, new FileServiceImpl(this._assets));
                console.log('init service');
            });
        }
    }, {
        key: 'listen',
        value: function listen() {
            var addr = "0.0.0.0",
                port = '5000';
            var cred = grpc.ServerCredentials.createInsecure();
            this.server.bind(addr + ':' + port, cred);
            this.server.start();
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.server.stop();
        }
    }]);

    return RpcServer;
}();

exports.RpcServer = RpcServer;