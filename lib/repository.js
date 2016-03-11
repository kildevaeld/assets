"use strict";

var _metaStores = {};
var _fileStores = {};
function registerMetaStore(name, store) {
    _metaStores[name] = store;
}
exports.registerMetaStore = registerMetaStore;
function getMetaStore(name, options) {
    var MetaStore = _metaStores[name];
    if (!MetaStore) return null;
    return new MetaStore(options);
}
exports.getMetaStore = getMetaStore;
function registerFileStore(name, store) {
    _fileStores[name] = store;
}
exports.registerFileStore = registerFileStore;
function getFileStore(name, options) {
    var FileStore = _fileStores[name];
    if (!FileStore) return null;
    return new FileStore(options);
}
exports.getFileStore = getFileStore;