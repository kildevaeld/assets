import { Readable } from 'stream';
import { IFile } from './interface';
import { Assets } from './index';
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
    request(asset: IFile): Promise<Readable>;
    has(asset: IFile): Promise<boolean>;
    canThumbnail(mime: string): boolean;
    private _generateThumbnail(asset, filename);
    private _onAssetRemove(asset);
}
