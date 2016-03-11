import { IMetaStore, IFile, IListOptions, IFindOptions, ICreateOptions } from '../interface';
export interface FileMetaStoreOptions {
    path?: string;
}
export declare class FileMetaStore implements IMetaStore {
    private opts;
    private files;
    private _currentID;
    private _configFile;
    constructor(options?: FileMetaStoreOptions);
    initialize(): Promise<void>;
    create(asset: IFile, options?: ICreateOptions): Promise<IFile>;
    remove(asset: IFile): Promise<IFile>;
    list(options?: IListOptions): Promise<IFile[]>;
    find(options: IFindOptions): Promise<IFile[]>;
    get(id: string): Promise<IFile>;
    removeAll(): Promise<void>;
    count(): Promise<number>;
    private _initPath(path);
    _load(): Promise<void>;
    _save(): Promise<void>;
}
