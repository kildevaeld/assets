/// <reference path="../../typings/main.d.ts" />
"use strict";

var Path = require('path');
var grpc = require('grpc');
var PROTO_PATH = Path.join(__dirname, '../rpc/messages', 'file.proto');
function initClient() {
    var messages = grpc.load(PROTO_PATH).messages;
    var client = new messages.FileService('localhost:5000', grpc.credentials.createInsecure());
    var call = client.list({ offset: 0 });
    call.on('data', function (data) {
        console.log('data', data);
    });
    call.on('error', function (e) {
        console.log('error', e);
    });
    call.on('end', function () {
        console.log('done');
    });
}
initClient();