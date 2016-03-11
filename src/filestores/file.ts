import {Readable} from 'stream';
import * as Path from 'path';

import {IFileStore, IFile} from '../interface';
import {registerFileStore} from '../repository';
import {getFileStats} from '../utils';

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
        
        let bn = Path.dirname(asset.path);
        
    }
    
    async remove(asset: IFile): Promise<IFile> {
        
        let path = this._getPath(asset.path);
        
        try {
            let stats = await getFileStats(path);
            if (stats.isFile()) {
                await fs.unlink(path);
            }    
        } catch (e) {
            return null;
        }
        
        return asset;
    }
    
    stream(asset: IFile): Promise<Readable> {}
    has(asset: IFile): Promise<boolean> {}
    
    private _getPath(path: string): string {
        return Path.join(this.opts.path, path);
    }
    
    private async _initPath (path:string): Promise<void> {
        
        if (await fs.exists(path)) return;
        await mkdirp(path);
        
        this.opts.path = Path.resolve(path);
    }
}

registerFileStore('file', FileStoreFileSystem);
