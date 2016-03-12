import * as Path from 'path';
import * as fs from 'mz/fs';
import * as os from 'os';
import {Readable} from 'stream';

const crypto = require('mz/crypto');
const Mime = require('mime-types');

export async function randomName(name?: string, len: number = 32, algo: string = 'sha1'): Promise<string> {

    let rnd = await crypto.randomBytes(len),
        rndString: string = crypto.createHash(algo).update(rnd.toString()).digest('hex');

    if (name) rndString += Path.extname(name);

    return rndString;
}

export async function tmpFile(name?: string): Promise<string> {
    let tmpDir = os.tmpdir();
    let rname = await randomName(name);
    
    return Path.join(tmpDir, rname);
}

export function getFileStats(path: string): Promise<fs.Stats> {
    return fs.stat(path);
}

export function getMimeType(path: string): string {
    return Mime.lookup(path);
}

export function writeStream(stream:Readable, path: string): Promise<void> {
    return new Promise<void>(function(resolve, reject) {
        var ws = fs.createWriteStream(path);
        ws.on('finish', resolve)
        .on('error', reject);

        stream.on('error', reject);

        stream.pipe(ws);
    });
}

export function pick(obj: any, args:string[]): any {
    let out = {};
    for (let i = 0, ii = args.length; i < ii; i++ ) {
        if (obj[args[i]]) out[args[i]] = obj[args[i]];
    }
    return out;
}