import * as Path from 'path';
import * as fs from 'mz/fs';

const crypto = require('mz/crypto');
const Mime = require('mime');

export async function randomName(name?: string, len: number = 32, algo: string = 'sha1'): Promise<string> {

    let rnd = await crypto.randomBytes(len),
        rndString: string = crypto.createHash(algo).update(rnd.toString()).digest('hex');

    if (name) rndString += Path.extname(name);

    return rndString;
}

export function getFileStats(path: string): Promise<fs.Stats> {
    return fs.stat(path);
}

export function getMimeType(path: string): string {
    return Mime.lookup(path);
}