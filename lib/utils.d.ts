import * as fs from 'mz/fs';
import { Readable } from 'stream';
export declare function randomName(name?: string, len?: number, algo?: string): Promise<string>;
export declare function tmpFile(name?: string): Promise<string>;
export declare function getFileStats(path: string): Promise<fs.Stats>;
export declare function getMimeType(path: string): string;
export declare function writeStream(stream: Readable, path: string): Promise<void>;
