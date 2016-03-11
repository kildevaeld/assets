import { Readable } from 'stream';
import { IFileStore, IFile } from '../interface';
export interface FileStoreFileSystemOptions {
    path?: string;
}
export declare class FileStoreFileSystem implements IFileStore {
    opts: FileStoreFileSystemOptions;
    constructor(opts?: FileStoreFileSystemOptions);
    initialize(): Promise<void>;
    create(asset: IFile, stream: Readable): Promise<IFile>;
    remove(asset: IFile): Promise<IFile>;
    stream(asset: IFile): Promise<Readable>;
    has(asset: IFile): Promise<boolean>;
    private _getPath(path);
    private _initPath(path);
}
