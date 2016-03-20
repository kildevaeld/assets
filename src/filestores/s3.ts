
import {IFileStore, IFile} from '../interface';
import {Readable} from 'stream';
import {registerFileStore} from '../repository';

import * as Path from 'path';
import * as Debug from 'debug';
import * as http from 'http';

const debug = Debug('assets:filestore:s3')


const knox = require('knox');

const MAX_FILE_SIZE = 1024 * 1024 * 10;

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
            bucket: options.bucket,
            region: options.region
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
        
        
        let path = Path.join(asset.path, asset.filename);
        // check to see if we should use multipart
        
        if (asset.size > MAX_FILE_SIZE) {
           console.log("MAX_FILE_SIZE")
        } else {
          
          debug('uploading to "%s": %j', path, headers);  
          let resp = await this._putStream(stream, path, headers);
              
          if (resp.statusCode !== 200) {
              let body = await _readBody(resp)
              throw new Error(body);
          }
          debug('uploaded to "%s", %j', path, headers);
          asset.meta['s3_url'] = this.knox.url(path);
          
        }
        
        return asset;
    
    }
    
    async remove(asset: IFile): Promise<IFile> {
        let path = Path.join(asset.path, asset.filename);
        
        await this._deleteFile(path);
        return asset
        
    }
    
    async stream(asset: IFile): Promise<Readable> {
        let path = Path.join(asset.path, asset.filename)
        return await this._getStream(path)
    }
    
    async has(asset: IFile): Promise<boolean> {
        
    }
    
    
    private async _putStream (stream: Readable, dest:string,  headers?:any): Promise<http.IncomingMessage> {
        return new Promise<http.IncomingMessage>((resolve, reject) => {
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
    
    private async _deleteFile(path: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
           this.knox.deleteFile(path, (err, res) => {
              if (err) return reject(err);
              resolve(null);
           });
        });
    }
    
    
}

registerFileStore('s3', S3FileStore);


function _readBody(req: http.IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {

           var buffer = [];

           req.on('data', (data) => {
               buffer.push(data);
           });

           req.on('end', () => {
               resolve(Buffer.concat(buffer).toString());
           });

           req.on('error', reject);


        });
    }