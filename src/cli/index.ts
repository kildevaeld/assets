/// <reference path="../../typings/main.d.ts" />

import * as command from 'commander';
import * as Path from 'path';

const grpc = require('grpc');


const PROTO_PATH = Path.join(__dirname, '../rpc/messages', 'file.proto');


function initClient () {
    var messages = grpc.load(PROTO_PATH).messages;

    var client = new messages.FileService('localhost:5000',
                                       grpc.credentials.createInsecure());
                               
    let call = client.list({offset: 0});
    
    call.on('data', (data) => {
        console.log('data', data);
    });
    
    call.on('error', (e) => {
        console.log('error', e)
    })
    
    call.on('end', () => {
        console.log('done')
    })
}


initClient();