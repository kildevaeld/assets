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
var generators = require('./generators');
var thumbnailer_1 = require('../thumbnailer');
function initialize() {
    return __awaiter(this, void 0, Promise, function* () {
        thumbnailer_1.Thumbnailer.setGenerator(['image/png', 'image/jpeg', 'image/gif'], generators.ImageTypeGeneraror);
    });
}
exports.initialize = initialize;