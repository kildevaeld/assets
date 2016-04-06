import { Readable } from 'stream';
import { IFile } from './interface';
import { Assets } from './index';
export declare const ThumbnailMetaKey: string;
export interface ThumbnailGenerator {
    (stream: Readable): Promise<{
        stream: Readable;
        info: IFile;
    }>;
}
export interface ThumbnailerOptions {
}
export declare class Thumbnailer {
    private _assets;
    static setGenerator(mime: string | string[], generator: ThumbnailGenerator): void;
    static getGenerator(mime: string): ThumbnailGenerator;
    constructor(options?: ThumbnailerOptions);
    initialize(assets: Assets): Promise<void>;
    request(asset: IFile, options?: any): Promise<Readable>;
    has(asset: IFile, options?: any): Promise<boolean>;
    generateThumbnail(asset: IFile, options?: any): Promise<IFile>;
    canThumbnail(mime: string): boolean;
    private _generateThumbnail(asset, filename, options?);
    private _onAssetRemove(asset);
}
