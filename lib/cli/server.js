"use strict";

var utils_1 = require('../utils');
var index_1 = require('../index');
var server_1 = require('../http/server');
var http = require('http');
function serverCommand(program) {
    var cmd = program.command('http').action(function () {
        var options = utils_1.pick(cmd, ['port']);
        startServer(options);
    });
    cmd.option("-p, --port <port>", "port to use [default: 5000]", 5000);
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
    router = new server_1.AssetsRouter(assets, {
        prefix: '/'
    });
    server = http.createServer(function (req, res) {
        router.middleware(req, res, function () {
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