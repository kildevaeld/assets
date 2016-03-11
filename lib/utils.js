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
var Path = require('path');
var fs = require('mz/fs');
var os = require('os');
var crypto = require('mz/crypto');
var Mime = require('mime');
function randomName(name) {
    var len = arguments.length <= 1 || arguments[1] === undefined ? 32 : arguments[1];
    var algo = arguments.length <= 2 || arguments[2] === undefined ? 'sha1' : arguments[2];

    return __awaiter(this, void 0, Promise, function* () {
        var rnd = yield crypto.randomBytes(len),
            rndString = crypto.createHash(algo).update(rnd.toString()).digest('hex');
        if (name) rndString += Path.extname(name);
        return rndString;
    });
}
exports.randomName = randomName;
function tmpFile(name) {
    return __awaiter(this, void 0, Promise, function* () {
        var tmpDir = os.tmpdir();
        var rname = yield randomName(name);
        return Path.join(tmpDir, rname);
    });
}
exports.tmpFile = tmpFile;
function getFileStats(path) {
    return fs.stat(path);
}
exports.getFileStats = getFileStats;
function getMimeType(path) {
    return Mime.lookup(path);
}
exports.getMimeType = getMimeType;
function writeStream(stream, path) {
    return new Promise(function (resolve, reject) {
        var ws = fs.createWriteStream(path);
        ws.on('finish', resolve).on('error', reject);
        stream.on('error', reject);
        stream.pipe(ws);
    });
}
exports.writeStream = writeStream;