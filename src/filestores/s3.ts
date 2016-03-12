
import {IFileStore, IFile} from '../interface';
import {Readable} from 'stream';
import * as Path from 'path';

const knox = require('knox');

const MAX_FILE_SIZE = 1024 * 10;

export interface S3FileStoreOptions {
    key: string;
    secret: string;
    bucket: string;
    public?: boolean;
    endpoint?: string;
    region?: string;
    port?:number;
    secure?: boolean;
}

export class S3Error extends Error {
}

export class S3FileStore implements IFileStore {
    knox: any;
    constructor(private options:S3FileStoreOptions) {
        if (!options) throw new S3Error('you must specify options');
        
        this.knox = knox.createClient({
            key: options.key,
            secret: options.secret,
            bucket: options.bucket
        });
        
        
    }
    
    async initialize(): Promise<void> {
        
    }
    
    async create(asset: IFile, stream: Readable): Promise<IFile> {
        
        let headers = {
            'Content-Type': asset.mime,
            'Content-Length': asset.size,
            'x-amz-acl':  this.options.public ?  'public-read' : 'private'
        };
        
        // check to see if we should use multipart
        if (asset.size > MAX_FILE_SIZE) {
            
        } else {
          
          let resp = await this._putStream(stream, Path.join(asset.path, asset.filename), headers);
          
            
        }
        
    }
    
    async remove(asset: IFile): Promise<IFile> {
        
    }
    
    async stream(asset: IFile): Promise<Readable> {
        
    }
    
    async has(asset: IFile): Promise<boolean> {
        
    }
    
    
    private async _putStream (stream: Readable, dest:string,  headers?:any): Promise<any> {
        return new Promise((resolve, reject) => {
            
            this.knox.putStream(stream, dest, headers, (err, resp) => {
                if (err) return reject(err);
                resolve(resp);
            }); 
            
        });
    }
    
    private async _getStream(path:string): Promise<Readable> {
        return new Promise<Readable>((resolve, reject) => {
           this.knox.getFile(path, (err, res) => {
              if (err) return reject(err);
              resolve(res);
           });
        });
    }
    
}