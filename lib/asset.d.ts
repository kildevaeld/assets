import { IFile } from './interface';
export interface AssetOptions {
    id?: string;
    name?: string;
    filename?: string;
    path?: string;
    mime?: string;
    size?: number;
}
export declare class Asset implements IFile {
    private _attributes;
    id: string;
    name: string;
    filename: string;
    path: string;
    mime: string;
    size: number;
    meta: {
        [key: string]: any;
    };
    get(key: string): any;
    setMeta(key: string, value: any): this;
    toJSON(): any;
    constructor(file?: AssetOptions);
}
