import * as http from 'http';
import { Assets } from '../index';
export interface AssetsRouterOptions {
    prefix?: string;
}
export declare class AssetsRouter {
    private _assets;
    private opts;
    private _routes;
    constructor(_assets: Assets, opts?: AssetsRouterOptions);
    middleware(req: http.IncomingMessage, res: http.ServerResponse, next?: any): Promise<any>;
    create(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
    list(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
    getResource(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void>;
    removeResource(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void>;
    private _writeJSON(res, json, status?);
    private _getQuery(url);
    private _readBody(req);
    private _readForm(req);
}
