/// <reference path="./messages/file.d.ts" />

import * as Path from 'path';
import {Assets} from '../index';

const PROTO_PATH = Path.join(__dirname, 'messages', 'file.proto');

const grpc = require('grpc');

function bindAll (obj:any, attr: string[]) {
    for (let i = 0, ii = attr.length; i<ii;i++) {
        obj[attr[i]] = obj[attr[i]].bind(obj);
    }
} 

class FileServiceImpl {
    constructor (private assets:Assets) {
        bindAll(this, ['list', 'createRequest', 'create', 'get', 'remove', 'stream']);
    }
 
    list(call) {
        
        this.assets.list(call.request)
        .then( list => {
            
            for (let i = 0, ii = list.length; i < ii; i++) {
                let a = list[i];
                call.write({
                    filename: a.filename,
                    path: a.path,
                    mime: a.mime,
                    size: a.size,
                    id: a.id
                });
            }
            
            call.end();    
        });
        
    }
    
    createRequest(call, cb) {
        
    }
    
    create(call, cb) {
        
    }
    
    get(call, cb) {
        
    }
    
    remove (call, cb) {
        
    }
    
    stream (call, cb) {
        
    }
    
}

export class RpcServer {
    server: any;
    constructor (private _assets:Assets) {
        
        var server = new grpc.Server();
        this.server = server;
        
    }
    
    async initialize (): Promise<void> {
        let proto = grpc.load(PROTO_PATH).messages;
        // 
        this.server.addProtoService(proto.FileService.service, new FileServiceImpl(this._assets));
        console.log('init service')
    }
    
    listen () {
        let addr = "0.0.0.0", port = '5000';
        let cred = grpc.ServerCredentials.createInsecure();
        this.server.bind(`${addr}:${port}`, cred);
        this.server.start();    
    }
    
    stop () {
        this.server.stop();
    }
}