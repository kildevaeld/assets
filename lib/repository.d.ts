import { IMetaStore, IFileStore } from './interface';
export interface MetaStoreConstructor {
    new (options?: any): IMetaStore;
}
export interface FileStoreContructor {
    new (options?: any): IFileStore;
}
export declare function registerMetaStore(name: string, store: MetaStoreConstructor): void;
export declare function getMetaStore(name: string, options: any): IMetaStore;
export declare function registerFileStore(name: string, store: FileStoreContructor): void;
export declare function getFileStore(name: string, options?: any): IFileStore;
