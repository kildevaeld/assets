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
    console.log('initialized');
    let stream = fs.createReadStream('./index.js');
    assets.list()
    .then( a => {
        console.log(a)
    }).catch( e => {
        console.log(e);
    })
    
}).catch( e => {
    console.log(e.stack);
})