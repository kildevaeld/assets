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
var asset_1 = require('../asset');
var utils_1 = require('../utils');
var fs = require('fs');
var Path = require('path');
var gm = require('gm'),
    exec = require('mz/child_process');
function createThumnail(stream) {
    var maxWidth = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];
    var maxHeight = arguments.length <= 2 || arguments[2] === undefined ? 100 : arguments[2];

    return __awaiter(this, void 0, Promise, function* () {
        var tmp = yield utils_1.tmpFile("image.png");
        var rs = gm(stream).resize(maxWidth, maxHeight).stream();
        yield utils_1.writeStream(rs, tmp);
        var stats = yield utils_1.getFileStats(tmp);
        rs = fs.createReadStream(tmp);
        rs.once('end', function () {
            fs.unlink(tmp);
        });
        var info = new asset_1.Asset({
            filename: Path.basename(tmp),
            path: Path.dirname(tmp),
            mime: 'image/png',
            size: stats.size
        });
        return { info: info, stream: rs };
    });
}
function ImageTypeGeneraror(stream) {
    return __awaiter(this, void 0, Promise, function* () {
        return yield createThumnail(stream);
    });
}
exports.ImageTypeGeneraror = ImageTypeGeneraror;
function VideoTypeGeneraror(stream) {
    return __awaiter(this, void 0, Promise, function* () {
        return null;
    });
}
exports.VideoTypeGeneraror = VideoTypeGeneraror;
function PdfTypeGeneraror(stream) {
    return __awaiter(this, void 0, Promise, function* () {
        return null;
    });
}
exports.PdfTypeGeneraror = PdfTypeGeneraror;