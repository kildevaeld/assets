
import * as generators from './generators';
import {Thumbnailer} from '../thumbnailer';

export async function initialize (): Promise<void> {
    
    Thumbnailer.setGenerator(['image/png', 'image/jpeg', 'image/gif'], generators.ImageTypeGeneraror);
        
}