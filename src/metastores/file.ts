declare var require:any;
import * as Path from 'path';
import * as fs from 'mz/fs';
const mkdirp = require('mkdirp-promise');
import {IMetaStore, IFile, IListOptions, IFindOptions, ICreateOptions} from '../interface';
import {registerMetaStore} from '../repository'
import * as Debug from 'debug';

const debug = Debug('assets:metastore:filesystem')

export interface FileMetaStoreOptions {
    path?: string;
}

export class FileMetaStore implements IMetaStore {
    private opts: FileMetaStoreOptions;
    private files: {[key: string]: IFile };
    private _currentID: number;
    private get _configFile (): string {
        return Path.join(this.opts.path, '__config.json');
    }
    
    constructor (options:FileMetaStoreOptions = {}) {
        if (!options.path) options.path = "assets.uploads";
        this.opts = options;
        
    }
    
    async initialize(): Promise<void> {
        await this._initPath(this.opts.path);
        await this._load();
    }
    
    async create(asset:IFile, options:ICreateOptions={}): Promise<IFile> {
        
        asset.id = (++this._currentID) + "";
        debug('create asset "%s", id: "%s"', asset.path, asset.id)
        this.files[asset.id] = asset;
        
        await this._save();
        
        return asset;
    }
    
    async remove(asset:IFile): Promise<IFile> {
        debug('remove asset "%s", id: "%s"', asset.path, asset.id)
        delete this.files[asset.id];
        await this._save()
        return asset;
    }
    
    async list(options:IListOptions= {}): Promise<IFile[]> {
        let offset = options.offset||0,
            limit = options.limit||100;
            
        let out: IFile[] = [];
        let index = 0, found = 0;
        for (let key in this.files) {
            
            if (++index < options.offset || (this.files[key].hidden && !options.hidden)) continue;
            out.push(this.files[key]);
            found++;
            if (found === limit) break;
        }
        
        return out;
    }
    
    async find(options:IFindOptions): Promise<IFile[]> {
        let reg = new RegExp(options.path, 'i');
        let out = [];
        for (let key in this.files) {
            if (reg.test(Path.join(this.files[key].path, this.files[key].filename))) {
                out.push(this.files[key]);
            }
        }
        return out;
    }
    
    async get(id:string): Promise<IFile> {
        return this.files[id];
    }
    
    getByPath (path: string): Promise<IFile> {
        for (let key in this.files) {
            let fp = Path.join(this.files[key].path, this.files[key].filename);
            if (fp === path) return Promise.resolve(this.files[key]);
        }
        return Promise.resolve(null);
    }
    
    async removeAll(): Promise<void> {
        this.files = {};
        await this._save();
    }
    
    async count(): Promise<number> {
        return Object.keys(this.files).length;
    }
    
    
    private async _initPath (path:string): Promise<void> {
        
        if (await fs.exists(path)) return;
        await mkdirp(path);
        
        this.opts.path = Path.resolve(path);
    }
    
    async _load (): Promise<void> {
        let configFile = this._configFile;
        
        let data = {};
        let currentID = 0;
        try {
            let str = await fs.readFile(configFile, 'utf8');
            let json = JSON.parse(<string>str);
            currentID = json.currentID||0;
            data = json.files||{};
            if (Array.isArray(data)) {
                data = {};
                json.files.forEach((f) => {
                    data[f.id] = f;
                })
            }
            
            
        } catch (e) { 
           
        }
        this._currentID = currentID;
        this.files = <any>data;
    }
    
    async _save (): Promise<void> {
        let configFile = this._configFile; 
        let json = {
            currentID: this._currentID,
            files: this.files
        }
        await fs.writeFile(configFile, JSON.stringify(json));
    }
    
}

registerMetaStore('file', FileMetaStore);
