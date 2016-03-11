import {Readable} from 'stream';
import {Asset} from '../asset';
import {IFile} from '../interface';

import {tmpFile, writeStream, getFileStats} from '../utils';

import * as fs from 'fs';
import * as Path from 'path';

const gm = require('gm'),
    exec = require('mz/child_process')
    
async function createThumnail(stream:Readable, maxWidth:number = 100, maxHeight:number = 100): Promise<{info:IFile, stream:Readable}> {
    
    let tmp = await tmpFile("image.png");
    
    let rs = gm(stream).resize(maxWidth, maxHeight).stream();
    await writeStream(rs, tmp);
    
    let stats = await getFileStats(tmp);
    
    rs = fs.createReadStream(tmp);
    rs.once('end', () => {
        fs.unlink(tmp);
    });
    
    let info: IFile = new Asset({
        filename: Path.basename(tmp),
        path: Path.dirname(tmp),
        mime: 'image/png',
        size: stats.size,
    })
    
    return {info:info,stream:rs};
}

export async function ImageTypeGeneraror (stream:Readable): Promise<{info:IFile, stream:Readable}> {
    return await createThumnail(stream);
}

export async function VideoTypeGeneraror (stream:Readable): Promise<{info:IFile, stream:Readable}> {
    return null;   
}

export async function PdfTypeGeneraror (stream:Readable): Promise<{info:IFile, stream:Readable}> {
    return null;
}

