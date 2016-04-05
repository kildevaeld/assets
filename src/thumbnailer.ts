import * as Path from 'path';
import {Readable} from 'stream';
import {IFile} from './interface';
import {Assets, Hook} from './index';
import * as Debug from 'debug';

const debug = Debug("assets:thumbnailer");

export interface ThumbnailGenerator {
    (stream: Readable): Promise<{ stream: Readable, info: IFile }>
}

const _generators: { [key: string]: ThumbnailGenerator } = {};


function thumbName(path: string): string {
    let ext = Path.extname(path), basename = Path.basename(path, ext),
        dir = Path.dirname(path)
    dir = dir == '.' ? '' : dir == '/' ? dir : dir + '/';
    let thumbnail = dir + basename + '.thumbnail.png';

    return thumbnail;
}


export interface ThumbnailerOptions {

}

export class Thumbnailer {
    private _assets: Assets;
    static setGenerator(mime: string | string[], generator: ThumbnailGenerator) {
        if (!Array.isArray(mime)) mime = [<string>mime];
        for (let i = 0, ii = mime.length; i < ii; i++) {
            debug("set generator %s", mime[i]);
            _generators[mime[i]] = generator;
        }
    }
    
    static getGenerator(mime:string) {
        
        return _generators[mime];
    }
    constructor(options?: ThumbnailerOptions) {
        this._onAssetRemove = this._onAssetRemove.bind(this);
    }

    async initialize(assets: Assets): Promise<void> {
        this._assets = assets;
        assets.registerHook(Hook.Remove, this._onAssetRemove);
    }



    async request(asset: IFile, options?:any): Promise<Readable> {
        if ((await this.has(asset))) {
            let path = thumbName(asset.filename);
            debug('request %s', path)
            let stream = await this._assets.stream(<any>{
                filename: path,
                path: asset.path
            });
           
            return stream;
        }
        return null;
    }

    async has(asset: IFile, options?:any): Promise<boolean> {
        if (!(await this.canThumbnail(asset.mime))) return false;
        
        if (asset.meta && asset.meta['thumbnail'] === true) {
            return false;
        }

        try {
            let path = thumbName(asset.filename)
            
            let fp = Path.join(asset.path, path);
            
            debug('thumbname %s', path)
            if (await this._assets.has(fp)) {
                debug('already have thumbnail')
                return true;
            }
            
            let info = await this._generateThumbnail(asset, path, options);

            if (info == null) {
                debug('info is null')
                return false;
            }
            return true;


        } catch (e) {
            debug('could not generate thumbnail ', e.message);
            console.log(e.stack)
            return false;
        }
    }

    canThumbnail(mime: string): boolean {
        debug('can thumnail %s: %s', mime, !!_generators[mime]);
        return !!_generators[mime];
    }

    private async _generateThumbnail(asset: IFile, filename: string, options?:any): Promise<IFile> {

        let generator = Thumbnailer.getGenerator(asset.mime);

        if (!generator) throw new Error("no thumbnailer");

        let rs = await this._assets.stream(<any>asset);

        if (!rs) throw new Error('no stream');

        let {stream, info} = await generator(rs);

        info.path = asset.path;
        info.filename = filename
        info.hidden = true;
        info.meta['thumbnail'] = true
        
        if (options) {
            info = Object.assign({}, info, options);
        }
        
        let path = Path.join(info.path, info.filename)
        
        if (stream && info) {
            await this._assets.create(stream, path, info);
            return info;
        } else {
            return null;
        }

    }

    private async _onAssetRemove(asset: IFile): Promise<void> {
        if (asset.meta && asset.meta['destroyed']) return;
        
        let path = thumbName(asset.filename);
    
        try {
            let thumbnail = await this._assets.getByPath(Path.join(asset.path,path));
            if (thumbnail && thumbnail.meta['thumbnail'] === true) {
                debug("removing thumbnail associated with %j", asset)
                await this._assets.remove(<any>{path: asset.path, filename: path});    
                asset.meta = { 'destroyed': true };
            }
            
        } catch (e) { 
           console.log('could not remove thumnail %s', path, e) 
        }
        
    }
}