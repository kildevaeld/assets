'use strict';
require('./lib/metastores/file');
require('./lib/filestores/file');
const fs = require('fs');
const asset = require('./lib/index')

let assets = new asset.Assets({
    metaStore: 'file',
    fileStore: 'file'
})

assets.registerHook(asset.Hook.BeforeCreate, (asset, getStream) => {
    console.log('before hook');
})

assets.registerHook(asset.Hook.Create, (asset) => {
    console.log('after hook')
})



var r = require('./lib/rpc');

var server = new r.RpcServer(assets);

server.initialize().then( e => {
    server.listen();
}).catch(e => {
    console.log(e);
})


assets.initialize().then(() => {
    
    /*let stream = fs.createReadStream('./distortion.jpg');
    return assets.create(stream, "images/distortion.jpg")
    .then( a => {
        console.log(a)
        
        return assets.thumbnail(a).then( s => {
            let ws = fs.createWriteStream('distortion.thumbnail.png')
            s.pipe(ws)
        }) 
        
    })/*.catch( e => {
        console.log(e.stack);
    })*/
    
    return assets.list({limit: 1, offset: 10}).then( e => {
        console.log(e)
    })
    
}).catch( e => {
    console.log(e.stack);
})