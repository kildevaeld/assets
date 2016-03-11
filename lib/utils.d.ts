import * as fs from 'mz/fs';
export declare function randomName(name?: string, len?: number, algo?: string): Promise<string>;
export declare function getFileStats(path: string): Promise<fs.Stats>;
export declare function getMimeType(path: string): string;
