import * as Koa from 'koa';
import { Assets } from '../index';
export interface AssetsRouterOptions {
    prefix?: string;
}
export declare function App(client: Assets, options?: AssetsRouterOptions): Koa;
