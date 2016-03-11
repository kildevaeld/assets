
import {IMetaStore, IFileStore} from './interface';

var _metaStores: {[key: string]: MetaStoreConstructor} = {};
var _fileStores: {[key: string]: FileStoreContructor} = {};

export interface MetaStoreConstructor {
    new (options?:any): IMetaStore;
}

export interface FileStoreContructor {
    new (options?:any): IFileStore
}

export function registerMetaStore(name:string, store:MetaStoreConstructor) {
    _metaStores[name] = store;
}

export function getMetaStore(name:string, options:any): IMetaStore {
    let MetaStore = _metaStores[name];
    
    if (!MetaStore) return null;
    return new MetaStore(options);
}

export function registerFileStore(name:string, store:FileStoreContructor) {
    _fileStores[name] = store;
}

export function getFileStore(name:string, options?:any): IFileStore {
    let FileStore = _fileStores[name];
    if (!FileStore) return null;
    return new FileStore(options);
}