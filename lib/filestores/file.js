"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var repository_1 = require('../repository');

var FileStoreFileSystem = function () {
    function FileStoreFileSystem() {
        _classCallCheck(this, FileStoreFileSystem);
    }

    _createClass(FileStoreFileSystem, [{
        key: 'initialize',
        value: function initialize() {}
    }, {
        key: 'create',
        value: function create(asset, stream) {}
    }, {
        key: 'remove',
        value: function remove(asset) {}
    }, {
        key: 'stream',
        value: function stream(asset) {}
    }, {
        key: 'has',
        value: function has(asset) {}
    }]);

    return FileStoreFileSystem;
}();

exports.FileStoreFileSystem = FileStoreFileSystem;
repository_1.registerFileStore('file', FileStoreFileSystem);