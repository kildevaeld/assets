"use strict";

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
var utils_1 = require('../utils');
var index_1 = require('../index');
var server_1 = require('../http/server');
var http = require('http');
var fs = require('mz/fs');
var Path = require('path');
var Debug = require('debug');
var debug = Debug('assets:cli:server');
var etag = require('etag');
function serverCommand(program) {
    var cmd = program.command('http').action(function () {
        var options = utils_1.pick(cmd, ['port', 'client']);
        startServer(options);
    });
    cmd.option("-p, --port <port>", "port to use [default: 5000]", 5000).option('-c, --client', 'client');
}
exports.serverCommand = serverCommand;
function startServer(options) {
    var server = void 0;
    var router = void 0;
    var clean = function clean() {
        process.stdout.write("Exiting ... ");
        if (server) server.close();
        process.stdout.write('done\n');
        process.exit(0);
    };
    var assets = new index_1.Assets({});
    var prefix = options.client ? '/files' : '/';
    router = new server_1.AssetsRouter(assets, {
        prefix: prefix
    });
    server = http.createServer(function (req, res) {
        router.middleware(req, res, function () {
            if (options.client) {
                debug('handle client');
                return handleClient(assets, req, res).catch(function (e) {
                    console.error(e.stack);
                    process.exit(-1);
                });
            }
            res.writeHead(404);
            res.end();
        });
    });
    assets.initialize().then(function () {
        console.log('Starting server on port %s', options.port);
        server.listen(options.port);
    }).catch(function (e) {
        console.error('Error: ', e);
        process.exit(-1);
    });
    process.on('SIGINT', clean);
}
var ASSETS_PATH = Path.resolve(__dirname, '../..', 'node_modules/assets.gallery/dist');
function handleClient(assets, req, res) {
    return __awaiter(this, void 0, Promise, function* () {
        var stream = void 0,
            mime = "text/html",
            stats = void 0;
        var path = void 0;
        switch (req.url) {
            case '/js/assets-gallery.js':
                path = Path.join(ASSETS_PATH, 'js', 'assets-gallery.js');
                mime = 'application/javascript';
                break;
            case '/css/assets-gallery.css':
                path = Path.join(ASSETS_PATH, 'css', 'assets-gallery.css');
                mime = 'text/css';
                break;
            case '/images/assets-mimetypes.png':
                path = Path.join(ASSETS_PATH, 'images', 'assets-mimetypes.png');
                mime = 'image/png';
                break;
            case '/images/assets-mimetypes@2x.png':
                path = Path.join(ASSETS_PATH, 'images', 'assets-mimetypes@2x.png');
                mime = 'image/png';
                break;
            case '/images/assets-loader.gif':
                path = Path.join(ASSETS_PATH, 'images', 'assets-loader.gif');
                mime = 'image/gif';
                break;
            case '/images/assets-remove.png':
                path = Path.join(ASSETS_PATH, 'images', 'assets-remove.png');
                mime = 'image/png';
                break;
            default:
                path = Path.resolve(__dirname, '../../resources/index.html');
                mime = 'text/html';
        }
        stats = yield fs.stat(path);
        stream = fs.createReadStream(path);
        res.writeHead(200, {
            'Content-Type': mime,
            'Content-Length': stats.size
        });
        stream.pipe(res);
    });
}