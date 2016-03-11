import { Readable } from 'stream';
import { IFile } from '../interface';
export declare function ImageTypeGeneraror(stream: Readable): Promise<{
    info: IFile;
    stream: Readable;
}>;
export declare function VideoTypeGeneraror(stream: Readable): Promise<{
    info: IFile;
    stream: Readable;
}>;
export declare function PdfTypeGeneraror(stream: Readable): Promise<{
    info: IFile;
    stream: Readable;
}>;
