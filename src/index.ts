/// <reference path="../typings/main.d.ts" />

import {EventEmitter} from 'events';
import {Readable} from 'stream';
import {getFileStore, getMetaStore} from './repository';
import {IFile, IMetaStore, IFileStore, IListOptions, IFindOptions} from './interface';
import {Thumbnailer} from './thumbnailer';
import {Asset} from './asset';
import {randomName, getFileStats, getMimeType, writeStream} from './utils';
import * as generators from './generators/index';
import * as Path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as Debug from 'debug';




const sanitize = require('sanitize-filename');
const debug = Debug('assets');

var idCounter = 0;
function getId(): string {
    return ++idCounter + "";
}

export enum Hook {
    BeforeCreate,
    Create,
    BeforeRemove,
    Remove,
    BeforeList,
    BeforeStream,
    BeforeThumbnail,
    BeforeGet,
    BeforeCount
}

function isString(a:any): a is String {
    return typeof a === 'string';
}

export interface HookFunc {
    (asset: Asset, fn?: () => Promise<Readable>, options?:any): Promise<void>;
}

type hook_tuple = [string, HookFunc]; 

export interface MimeFunc {
    (asset: Asset, fn?: () => Promise<Readable>): Promise<void>;
}

interface MimeMap {
    r: RegExp;
    f: MimeFunc;
}

export interface AssetsOptions {
    metaStore?: string|IMetaStore;
    fileStore?: string|IFileStore;
    fileStoreOptions?: any;
    metaStoreOptions?: any;
}

export interface AssetCreateOptions {
    size?: number;
    mime?: string;
    name?: string;
    hidden?:boolean;
    skipMeta?: boolean;
    meta?:{[key: string]: any};
}

export class Assets extends EventEmitter {
    protected _metaStore: IMetaStore;
    public get metaStore(): IMetaStore {
        return this._metaStore
    }
    protected _fileStore: IFileStore;
    public get fileStore(): IFileStore {
        return this._fileStore
    }
    
    protected thumbnailer: Thumbnailer;
     
    private _hooks: Map<Hook, hook_tuple[]>;
    private _mimeHandlers: MimeMap[];
    
    constructor(options: AssetsOptions) {
        super();

        this._hooks = new Map();
        this._mimeHandlers = [];
        
        if (!options) {
            throw new Error('options');
        }

        if (!options.metaStore) {
            options.metaStore = 'file';
        }
        if (!options.fileStore) {
            options.fileStore = 'file';
        }
        
        let meta: IMetaStore, file: IFileStore;
        if (isString(options.metaStore)) {
            meta = getMetaStore(<string>options.metaStore, options.metaStoreOptions);               
        } else {
            meta = <IMetaStore>options.metaStore;
        }

        if (isString(options.fileStore)) {
            file = getFileStore(<string>options.fileStore, options.fileStoreOptions);
        } else {
            file = <IFileStore>options.fileStore;
        }

        if (!meta || !file) {
            
            throw new Error("no file or meta store");
        }
        this.thumbnailer = new Thumbnailer();
        this._metaStore = meta;
        this._fileStore = file;

    }

    async initialize(): Promise<void> {

        await Promise.all([
            this.metaStore.initialize(),
            this.fileStore.initialize(),
            generators.initialize(),
            this.thumbnailer.initialize(this)
        ]);


    }
    
    async thumbnail (asset:Asset, options:any): Promise<Readable> {
        this._runHook(Hook.BeforeThumbnail, asset, options);
        let stream = await this.thumbnailer.request(asset, options);
        return stream;
    }
    
    canThumbnail (asset:Asset): boolean {
        return this.thumbnailer.canThumbnail(asset.mime);
    }
    
    
    async createFromPath(path: string, dest: string, options: AssetCreateOptions = { skipMeta: false }) {
        
        let stat = await getFileStats(path);
        
        if (!stat.isFile()) throw new Error('not a file');
        
        let reader = fs.createReadStream(path);
        
        options.size = stat.size;
        options.mime = getMimeType(path);
        
        return await this.create(reader, dest, options);
        
    }

    async create(stream: Readable, path: string, options: AssetCreateOptions = { skipMeta: false }): Promise<IFile> {

        let tmpFile;

        const clean = () => { if (tmpFile) fs.unlink(tmpFile); };

        
        let filename = Path.basename(path);
        filename = sanitize(filename.replace(/[^a-z0-9\-\.]/gi, '_'));
        

        // If mime or size isnt provided, we have to get it
        // the hard way
        if ((!options.mime || !options.size) || (options.mime === "" || options.size === 0)) {

            tmpFile = await this._createTemp(stream, path);

            let stats = await getFileStats(tmpFile);
            let mime = getMimeType(tmpFile);

            options.mime = mime;
            options.size = stats.size
        }

        let asset = new Asset({
            name: options.name||filename,
            path: Path.dirname(path),
            filename: filename,
            mime: options.mime,
            size: options.size,
            hidden: options.hidden,
            meta: options.meta || {}
        });

        var self = this;
        this._runHook(Hook.BeforeCreate, asset, async function(): Promise<Readable> {
            if (!tmpFile) {
                tmpFile = await self._createTemp(stream, path);
            }
            return fs.createReadStream(tmpFile);
        }, options);

        if (tmpFile) {
            stream = fs.createReadStream(tmpFile);
        }

        await this.fileStore.create(asset, stream, options);

        if (!options.skipMeta) {
            try {
                await this.metaStore.create(asset, options);
            } catch (e) {
                await this.fileStore.remove(asset);
                clean();
                throw e;
            }
        }

        clean();

        this._runHook(Hook.Create, asset, null, options);

        return asset;
    }

    /** Get an asset by id
     * @param {string} id The id
     * @return Promise<Asset>
     */
    async getById(id: string, options?:any): Promise<Asset> {
        let info = await this.metaStore.get(id, options);
        if (!(info instanceof Asset)) {
            info = new Asset(info);
        }
        return <Asset>info;
    }

    /**
     * Get an asset by full path
     * @param {string} path The full path to the file
     * @return Promise<Asset>
     */
    getByPath(path: string, options?:any): Promise<Asset> {
        
        return this.metaStore.getByPath(path, options)
        .then( asset => {
            if (asset) {
                if (!(asset instanceof Asset)) asset = new Asset(asset);
            }
            return asset;    
        });
        
        
    }
    
    has(path: string, options?:any): Promise<boolean> {
        return this.getByPath(path, options)
        .then( a => {
            return a != null;
        });
    }
    
    async query(term: string, options?: IFindOptions): Promise<Asset[]> {
        options = options||<any>{};
        options.path = term;
        
        return (await this.metaStore.find(options)).map( a => {
            if (a instanceof Asset) {
                return a;
            }
            return new Asset(a); 
        });
    }
    
   

    async remove(asset: Asset, options?: any): Promise<void> {
        
        if ((await this.getById(asset.id, options)) == null) {
            return null;
        }
        await this._runHook(Hook.BeforeRemove, asset, options)
        await this.fileStore.remove(asset);
        await this.metaStore.remove(asset);
        this._runHook(Hook.Remove, asset, null, options)

    }

    async list(options?: IListOptions): Promise<Asset[]> {
        await this._runHook(Hook.BeforeList, null, null, options);
        let infos = await this.metaStore.list(options);

        if (!infos.length) return <Asset[]>infos;

        return infos.map(m => {
            if (!(m instanceof Asset)) {
                return new Asset(m);
            }
            return <Asset>m;
        })

    }

    async stream(asset: Asset, options?:any): Promise<Readable> {
        await this._runHook(Hook.BeforeStream, asset, null, options);
        return await this.fileStore.stream(asset);
    }
    
    async count(options?:IFindOptions): Promise<number> {
       await this._runHook(Hook.BeforeCount, null, null, options);
       return await this.metaStore.count(options);
    }

    use(mime:string|MimeFunc, fn?:MimeFunc) {
        if (typeof mime === 'function') {
            fn = <MimeFunc>mime;
            mime = '.*';
        }
        
        this._mimeHandlers.push({
            r: new RegExp(<string>mime, 'i'),
            f: fn
        });
        return this;
    }

    registerHook(hook: Hook, fn: HookFunc): string {
        if (!this._hooks.has(hook)) {
            this._hooks.set(hook, []);
        }
        let id = getId();
        this._hooks.get(hook).push([id, fn]);
        return id;
    }
    
    unregister(hook: Hook, fn: HookFunc|string) {
        if (!this._hooks.has(hook)) return;
        
        let hooks = this._hooks.get(hook)
        
        for (let i = 0, ii = hooks.length; i < ii; i++) {
            if (hooks[i][0] === fn || hooks[i][1] === fn) {
                hooks.splice(i, 1);
                break;
            }
        }
        
    }

    private async _createTemp(stream: Readable, path: string): Promise<string> {
        let rnd = await randomName(path);
        let tmpFile = Path.join(os.tmpdir(), rnd);
        await this._writeFile(stream, tmpFile);
        return tmpFile
    }

    private async _runHook(hook: Hook, asset: Asset, fn?: () => Promise<Readable>, options?:any): Promise<void> {
        let hooks: hook_tuple[] = this._hooks.get(hook);
        if (!hooks) return;
        debug("run hook %s (%d)", Hook[hook], hooks.length);
        for (let i = 0, ii = hooks.length; i < ii; i++) {
            debug("run hook id %s", hooks[i][0]);
            await hooks[i][1](asset, fn, options);
        }
    }
    
    private async _runHandlers(asset:Asset): Promise<void> {
        for (let i = 0, ii = this._mimeHandlers.length; i < ii; i++ ) {
            if (this._mimeHandlers[i].r.test(asset.mime)) {
                await this._mimeHandlers[i].f(asset);
            }
        }
    }

    private async _writeFile(stream: Readable, path: string): Promise<void> {
        return new Promise<void>(function(resolve, reject) {
            var ws = fs.createWriteStream(path);
            ws.on('finish', resolve)
                .on('error', reject);

            stream.on('error', reject);

            stream.pipe(ws);
        });
    }
}