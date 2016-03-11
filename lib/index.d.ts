/// <reference path="../typings/main.d.ts" />
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { IFile, IMetaStore, IFileStore, IListOptions } from './interface';
import { Asset } from './asset';
export declare enum Hook {
    BeforeCreate = 0,
    Create = 1,
}
export interface HookFunc {
    (asset: Asset, fn?: () => Promise<Readable>): Promise<void>;
}
export interface AssetsOptions {
    metaStore: string;
    dataStore: string;
    dataStoreOptions?: any;
    metaStoreOptions?: any;
}
export interface AssetCreateOptions {
    size?: number;
    mime?: string;
    name?: string;
    skipMeta: boolean;
}
export declare class Assets extends EventEmitter {
    metaStore: IMetaStore;
    fileStore: IFileStore;
    _hooks: Map<Hook, HookFunc[]>;
    constructor(options: AssetsOptions);
    initialize(): Promise<void>;
    create(stream: Readable, path: string, options?: AssetCreateOptions): Promise<IFile>;
    getById(id: string): Promise<Asset>;
    getByPath(path: string): Promise<Asset>;
    remove(asset: Asset): Promise<void>;
    list(options?: IListOptions): Promise<Asset[]>;
    stream(asset: IFile): Promise<Readable>;
    registerHook(hook: Hook, ...fn: HookFunc[]): void;
    private _createTemp(stream, path);
    private _runHook(hook, asset, fn?);
    private _writeFile(stream, path);
}
