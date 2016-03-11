
import {IFile} from './interface';

export interface AssetOptions {
    id?: string;
    name?: string;
    filename?: string;
    path?: string;
    mime?: string;
    size?: number;
}

export class Asset implements IFile {
    private _attributes: {[key:string]: any};
    
    set id (id: string) { this._attributes['id'] = id; }
    get id (): string { return this.get('id'); }
    
    get name(): string { return this.get('name');}
    set name(name:string) {  this._attributes['name'] = name; }
    
    get filename(): string { return this.get('filename');}
    set filename(filename:string) {  this._attributes['filename'] = filename; }
    
    get path(): string { return this.get('path');}
    set path(path:string) {  this._attributes['path'] = path; }
    
    get mime(): string { return this.get('mime');}
    set mime(mime:string) {  this._attributes['mime'] = mime; }
    
    get size(): number { return this.get('size');}
    set size(size:number) {  this._attributes['size'] = size; }
    
    get meta(): {[key: string]: any} {
        return this._attributes['meta'];
    }
    
    get (key: string): any {
        return this._attributes[key];
    }
    
    setMeta(key: string, value: any) {
        this._attributes['meta'][key] = value;
        return this;
    }
    
    toJSON(): any {
        return this._attributes
    }
    
    constructor(file:AssetOptions={}) {
        this._attributes = file;   
        if (!this._attributes['meta']) this._attributes['meta'] = {}; 
    }
}