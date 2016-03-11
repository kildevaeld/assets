/// <reference path="../typings/main.d.ts" />

import {EventEmitter} from 'events';
import {Readable} from 'stream';
import {getFileStore, getMetaStore} from './repository';
import {IFile, IMetaStore, IFileStore, IListOptions} from './interface';
import {Asset} from './asset';
import {randomName, getFileStats, getMimeType} from './utils';
import * as Path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as Debug from 'debug';

const debug = Debug('assets');

export enum Hook {
    BeforeCreate,
    Create
}

export interface HookFunc {
    (asset:Asset, fn?:() => Promise<Readable>): Promise<void>;
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

export class Assets extends EventEmitter {
    metaStore: IMetaStore;
    fileStore: IFileStore;
    _hooks: Map<Hook,HookFunc[]>;
    constructor(options: AssetsOptions) {
        super();
        
        this._hooks = new Map();

        if (!options) {
            throw new Error('options');
        }

        if (!options.metaStore) {
            options.metaStore = 'file';
        }
        if (!options.dataStore) {
            options.dataStore = 'file';
        }

        let meta = getMetaStore(options.metaStore, options.metaStoreOptions);
        let file = getFileStore(options.dataStore, options.dataStoreOptions);

        if (!meta || !file) {
            throw new Error("no file or meta store");
        }

        this.metaStore = meta;
        this.fileStore = file;

    }

    async initialize(): Promise<void> {

        await Promise.all([
            this.metaStore.initialize(),
            this.fileStore.initialize()
        ]);


    }

    async create(stream: Readable, path: string, options: AssetCreateOptions = {skipMeta:false}): Promise<IFile> {

        let tmpFile;
        
        const clean = () => {  if (tmpFile) fs.unlink(tmpFile); };
        
        // If mime or size isnt provided, we have to get it
        // the hard way
        if (!options.mime || !options.size) {
            
            tmpFile = this._createTemp(stream, path);

            let stats = await getFileStats(tmpFile);
            let mime = getMimeType(tmpFile);

            options.mime = mime;
            options.size = stats.size 
        }

        let asset = new Asset({
            name: options.name,
            path: Path.dirname(path),
            filename: Path.basename(path),
            mime: options.mime,
            size: options.size
        });
        
        var self = this;
        this._runHook(Hook.BeforeCreate, asset, async function (): Promise<Readable> {
            if (!tmpFile) {
                tmpFile = self._createTemp(stream, path);
            }
            return fs.createReadStream(tmpFile);
        });
        
        if (tmpFile) {
            stream = fs.createReadStream(tmpFile);
        }
        
        await this.fileStore.create(asset, stream);
        
        if (!options.skipMeta) {
            try {
                await this.metaStore.create(asset);
            } catch (e) {
                await this.fileStore.remove(asset);
                clean();
                throw e;
            }
        }

        clean();
        
        this._runHook(Hook.Create, asset);

        return asset;
    }

    async getById(id: string): Promise<Asset> {
        let info = await this.metaStore.get(id);
        if (!(info instanceof Asset)) {
            info = new Asset(info);
        }
        return <Asset>info;
    }

    async getByPath(path: string): Promise<Asset> {
        
        let info = await this.metaStore.find({
            path: path
        });
        
        if (!info || info.length === 0) return null;
        
        if (!(info[0] instanceof Asset)) {
            info[0] = new Asset(info[0]);
        }
        return <Asset>info[0];
    }

    async remove(asset: Asset): Promise<void> {
        
        if ((await this.getById(asset.id)) == null) {
            return null;
        }
        
        await this.fileStore.remove(asset);
        await this.metaStore.remove(asset);
        
    }

    async list(options?:IListOptions): Promise<Asset[]> {
        
        let infos = await this.metaStore.list(options);
        
        if (!infos.length) return <Asset[]>infos;
        
        return infos.map( m => {
            if (!(m instanceof Asset)) {
                return new Asset(m);
            }
            return <Asset>m;
        })
        
    }

    async stream(asset: IFile): Promise<Readable> {
        return await this.fileStore.stream(asset);
    }

    registerHook(hook: Hook, ...fn: HookFunc[]) {
        if (!this._hooks.has(hook)) {
            this._hooks.set(hook, []);
        }
        for (let i = 0, ii = fn.length; i< ii; i++) {
            this._hooks.get(hook).push(fn[i]);    
        }
        
    }
    
    private async _createTemp (stream: Readable, path: string): Promise<string> {
        let rnd = await randomName(path);
        let tmpFile = Path.join(os.tmpdir(), rnd);
        await this._writeFile(stream, tmpFile);
        return tmpFile
    }

    private async _runHook(hook: Hook, asset: Asset, fn?:() => Promise<Readable>): Promise<void> {
        let hooks: HookFunc[] = this._hooks.get(hook);
        if (!hooks) return;
        
        for (let i = 0, ii = hooks.length; i < ii; i++) {
            await hooks[i](asset, fn);
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