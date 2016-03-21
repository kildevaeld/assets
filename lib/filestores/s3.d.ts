import { IFileStore, IFile } from '../interface';
import { Readable } from 'stream';
export interface S3FileStoreOptions {
    key: string;
    secret: string;
    bucket: string;
    public?: boolean;
    endpoint?: string;
    region?: string;
    port?: number;
    secure?: boolean;
}
export declare class S3Error extends Error {
}
export declare class S3FileStore implements IFileStore {
    private options;
    knox: any;
    constructor(options: S3FileStoreOptions);
    initialize(): Promise<void>;
    create(asset: IFile, stream: Readable): Promise<IFile>;
    remove(asset: IFile): Promise<IFile>;
    stream(asset: IFile): Promise<Readable>;
    private _putStream(stream, dest, headers?);
    private _getStream(path);
    private _deleteFile(path);
}
