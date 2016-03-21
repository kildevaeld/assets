
import {Readable, Writable} from 'stream';


export interface IFile {
    /** File id */
    id: string;
    name?: string;
    filename: string;
    path: string;
    mime: string;
    size: number;
    meta: {[key: string]: any};
    ctime: number;
    mtime: number;
    hidden: boolean;
}
export interface IListOptions {
    offset?: number;
    limit?: number;
    hidden?: boolean;
}

export interface ICreateOptions {
    overwrite?: boolean;
}

export interface IFindOptions extends IListOptions {
    path: string;
}

export interface IMetaStore {
    initialize(): Promise<void>
    create(asset: IFile, options?: ICreateOptions): Promise<IFile>;
    remove(asset: IFile, options?: any): Promise<IFile>;
    list(options?: IListOptions): Promise<IFile[]>;
    find(options?: IFindOptions): Promise<IFile[]>;
    get(id: string, options?:any): Promise<IFile>;
    removeAll(): Promise<void>;
    count (): Promise<number>;
}

export interface IFileStore {
    initialize(): Promise<void>
    create(asset: IFile, stream: Readable, options?:any): Promise<IFile>;
    remove(asset: IFile): Promise<IFile>;
    stream(asset: IFile, options?:any): Promise<Readable>;
    has(asset: IFile): Promise<boolean>;
}