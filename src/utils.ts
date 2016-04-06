import * as Path from 'path';
import * as fs from 'mz/fs';
import * as os from 'os';
import {Readable} from 'stream';

const crypto = require('mz/crypto');
const Mime = require('mime-types');
const sanitize = require('sanitize-filename');


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
    let mime = Mime.lookup(path);
    if (mime === false) {
        mime = "application/octet-stream";
    }
    return mime;
}

export function writeStream(stream: Readable, path: string): Promise<void> {
    return new Promise<void>(function(resolve, reject) {
        var ws = fs.createWriteStream(path);
        ws.on('finish', resolve)
            .on('error', reject);

        stream.on('error', reject);
        stream.pipe(ws);
    });
}

export function pick(obj: any, args: string[]): any {
    let out = {};
    for (let i = 0, ii = args.length; i < ii; i++) {
        if (obj[args[i]]) out[args[i]] = obj[args[i]];
    }
    return out;
}

export function normalizePath(path: string) {
    if (path[path.length - 1] !== '/') path += '/';
    if (path[0] !== '/') path = '/' + path;
    return path;
}

export function normalizeFileName(filename: string) {
    filename = sanitize(filename.replace(/[^a-z0-9\-\.]/gi, '_'));
    if (filename[0] === '/') filename = filename.substr(1);
    return filename;
}

export function writeFile(stream: Readable, path: string): Promise<void> {
    return new Promise<void>(function(resolve, reject) {
        var ws = fs.createWriteStream(path);
        ws.on('finish', resolve)
        .on('error', reject);

        stream.on('error', reject);
        stream.pipe(ws);
    });
}

export async function createTemp(stream: Readable, path: string): Promise<string> {
    let rnd = await randomName(path);
    let tmpFile = Path.join(os.tmpdir(), rnd);
    await writeFile(stream, tmpFile);
    return tmpFile;
}