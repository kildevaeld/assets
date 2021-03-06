import {Readable} from 'stream';
import * as Path from 'path';

import {IFileStore, IFile} from '../interface';
import {registerFileStore} from '../repository';
import {getFileStats, writeStream} from '../utils';
import * as Debug from 'debug';

const debug = Debug('assets:filestore:filesystem');

const fs = require('mz/fs'),
    mkdirp = require('mkdirp-promise');
export interface FileStoreFileSystemOptions {
    path?: string;
}

export class FileStoreFileSystem implements IFileStore {
    
    constructor(public opts:FileStoreFileSystemOptions = {}) {
        if (!this.opts.path) this.opts.path = "assets.uploads";
        
    }
    
    
    async initialize(): Promise<void> {
        await this._initPath(this.opts.path);
    }
    
    async create(asset: IFile, stream: Readable): Promise<IFile> {
        
        let bnF = this._getPath(asset.path);
        try {
            let stats = await getFileStats(bnF);
            if (stats.isFile()) {
                throw new Error("A files called " + asset.path + " already exists")
            }
        } catch (e) {
            debug("path %s does not exist, creating...", bnF)
            await mkdirp(bnF);
        }
        
        let fp = this._getPath(asset);
        debug('create %s', fp)
        await writeStream(stream, fp);
         
        return asset;
    }
    
    async remove(asset: IFile): Promise<IFile> {
        
        let path = this._getPath(asset);
        
        try {
            let stats = await getFileStats(path);
            if (stats.isFile()) {
                await fs.unlink(path);
            }    
        } catch (e) {
            debug('could not remove file at path: %s. Got error: %s', path, e.message);
            return null;
        }
        
        return asset;
    }
    
    async stream(asset: IFile): Promise<Readable> {
        if (!(await this.has(asset))) {
            return null; 
        }
        let fp = this._getPath(asset);
        debug('stream %s', fp);
        return fs.createReadStream(fp);
    }
    async has(asset: IFile): Promise<boolean> {
        let path = this._getPath(asset);
        
        try {
            let stats = await getFileStats(path);
            return stats.isFile();       
        } catch (e) {
            return false;
        }
        
    }
    
    private _getPath(asset: IFile|string): string {
        if (typeof asset === 'string') {
            return Path.join(this.opts.path, asset);
        }
        let a = <IFile>asset;
        
        return Path.join(this.opts.path, a.path, a.filename);
    }
    
    private async _initPath (path:string): Promise<void> {
        
        if (await fs.exists(path)) return;
        await mkdirp(path);
        
        this.opts.path = Path.resolve(path);
    }
}

registerFileStore('file', FileStoreFileSystem);
