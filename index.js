'use strict';
require('./lib/metastores/file');
require('./lib/filestores/file');
const fs = require('fs');
const asset = require('./lib/index')

let assets = new asset.Assets({
    metaStore: 'file',
    fileStore: 'file'
})

assets.initialize().then(() => {
    
    
    let stream = fs.createReadStream('./index.js');
    assets.create(stream, "testmig/index.js")
    .then( a => {
        console.log(a)
    }).catch( e => {
        console.log(e.stack);
    })
    
}).catch( e => {
    console.log(e.stack);
})