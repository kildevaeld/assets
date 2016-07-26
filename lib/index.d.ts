import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { IMetaStore, IFileStore, IListOptions, IFindOptions } from './interface';
import { Thumbnailer } from './thumbnailer';
import { Asset } from './asset';
export declare enum Hook {
    BeforeCreate = 0,
    Create = 1,
    BeforeRemove = 2,
    Remove = 3,
    BeforeList = 4,
    BeforeStream = 5,
    BeforeThumbnail = 6,
    BeforeGet = 7,
    BeforeCount = 8,
}
export interface HookFunc {
    (asset: Asset, fn?: () => Promise<Readable>, options?: any): Promise<void>;
}
export interface MimeFunc {
    (asset: Asset, fn?: () => Promise<Readable>): Promise<void>;
}
export interface AssetsOptions {
    metaStore?: string | IMetaStore;
    fileStore?: string | IFileStore;
    fileStoreOptions?: any;
    metaStoreOptions?: any;
}
export interface AssetCreateOptions {
    size?: number;
    mime?: string;
    name?: string;
    hidden?: boolean;
    skipMeta?: boolean;
    meta?: {
        [key: string]: any;
    };
    path?: string;
}
export declare class Assets extends EventEmitter {
    protected _metaStore: IMetaStore;
    metaStore: IMetaStore;
    protected _fileStore: IFileStore;
    fileStore: IFileStore;
    protected thumbnailer: Thumbnailer;
    private _hooks;
    private _mimeHandlers;
    constructor(options: AssetsOptions);
    initialize(): Promise<void[]>;
    thumbnail(asset: Asset, options?: any): Promise<Readable>;
    canThumbnail(asset: Asset): boolean;
    createFromPath(path: string, dest: string, options?: AssetCreateOptions): Promise<Asset>;
    /**
     * Create a new asset
     *
     * @param {Readable} stream A readable stream
     * @param {string} path The full destination path (path + filename)
     * @param {AssetCreateOptions} [options={ skipMeta: false }] (description)
     * @returns {Promise<Asset>} (description)
     */
    create(stream: Readable, path: string, options?: AssetCreateOptions): Promise<Asset>;
    /** Get an asset by id
     * @param {string} id The id
     * @return Promise<Asset>
     */
    getById(id: string, options?: any): Promise<Asset>;
    /**
     * Get an asset by full path
     * @param {string} path The full path to the file
     * @return Promise<Asset>
     */
    getByPath(path: string, options?: any): Promise<Asset>;
    /**
     * Check if a given path exists
     *
     * @param {string} path The full path to the asset (path/to/filename.ext)
     * @param {*} [options] (description)
     * @returns {Promise<boolean>} (description)
     */
    has(path: string, options?: any): Promise<boolean>;
    query(term: string, options?: IFindOptions): Promise<Asset[]>;
    remove(asset: Asset, options?: any): Promise<void>;
    list(options?: IListOptions): Promise<Asset[]>;
    stream(asset: Asset, options?: any): Promise<Readable>;
    count(options?: IFindOptions): Promise<number>;
    use(mime: string | MimeFunc, fn?: MimeFunc): this;
    registerHook(hook: Hook, fn: HookFunc): string;
    unregister(hook: Hook, fn: HookFunc | string): void;
    private _runHook(hook, asset, fn?, options?);
    private _runHandlers(asset, fn?);
}
