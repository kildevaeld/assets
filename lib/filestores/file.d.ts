import { Readable } from 'stream';
import { IFileStore, IFile } from '../interface';
export declare class FileStoreFileSystem implements IFileStore {
    initialize(): Promise<void>;
    create(asset: IFile, stream: Readable): Promise<IFile>;
    remove(asset: IFile): Promise<IFile>;
    stream(asset: IFile): Promise<Readable>;
    has(asset: IFile): Promise<boolean>;
}
