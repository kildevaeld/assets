/// <reference path="../../src/rpc/messages/file.d.ts" />
import { Assets } from '../index';
export declare class RpcServer {
    private _assets;
    server: any;
    constructor(_assets: Assets);
    initialize(): Promise<void>;
    listen(): void;
    stop(): void;
}
