import * as http from 'http';
import * as Path from 'path';
import * as querystring from 'querystring';
import * as Debug from 'debug';
import * as formidable from 'formidable';

import {Assets, AssetCreateOptions} from '../index';

const debug = Debug('assets:http'),
    pathToRegexp = require('path-to-regexp')

function toBoolean(str: string): boolean {
    return !!~['true', 'TRUE','t', 'y','j','yes'].indexOf(str)
}

export interface AssetsRouterOptions {
    prefix?: string
}

interface Route {
    method: string[];
    reg: RegExp;
    fn: string;
}

interface RouteMap {
    list: Route;
    create: RegExp;
}

class HttpError extends Error {
    code: number;
    constructor(msg:string, code:number = 200) {
        super(msg);
        this.message = msg;
        this.code = code;
    }

    toJSON(): any {
        return {
            code: this.code,
            message: this.message
        };
    }
}

export class AssetsRouter {
    private _routes: Route[];

    constructor(private _assets: Assets, private opts: AssetsRouterOptions = {}) {
        let prefix = opts.prefix;
        if (prefix == null || prefix === "") prefix = "/";
        if (prefix !== "/") {
            if (prefix[prefix.length -1] !== "/") prefix += '/';
        }

        this.opts.prefix = prefix;


        this._routes = [{
            method: ['GET', 'DELETE'],
            reg: pathToRegexp(prefix),
            fn: 'list'
        }, {
            method: ['GET'],
            reg: pathToRegexp(prefix + "*"),
            fn: 'getResource'
        }, {
            method: ['POST'],
            reg: pathToRegexp(prefix),
            fn: 'create'
        }, {
            method: ['DELETE'],
            reg: pathToRegexp(prefix + '*'),
            fn: 'removeResource'
        }];

    }

    async middlewareKoa2 (ctx, next): Promise<void> {
        await this.middleware(ctx.req, ctx.res, next);
    }

    * middlewareKoa (ctx, next) {
        yield ctx.middleware(ctx.req, ctx.res, next);
    }

    middleware (req:http.IncomingMessage, res:http.ServerResponse, next?): Promise<any> {
        let {method, url} = req;

        let index = url.indexOf('?');

        if (index > -1) {
            url = url.substr(0, index);
        }

        debug('trying route: "%s"...', url);

        let route: Route, match: string[];

        for (let i = 0, ii = this._routes.length; i < ii; i++) {
            route = this._routes[i];
            match = route.reg.exec(url);
            if (!!~route.method.indexOf(method) && match !== null) {
                break;
            }
            route = null;
        }

        if (route === null) {
            debug('route no match');
            return next ? next() : void 0;
        }
        debug('found route: "%s"', route.fn);
        return this[route.fn].call(this, req, res, match.length == 2 ? decodeURIComponent(match[1]) : undefined)
        .catch( e => {
            console.log('e', e.stack)
            this._writeJSON(res, e, e.code||500);
        })

    }

    async create(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        
        let contentType = req.headers['content-type']
        if (!contentType || contentType.indexOf('multipart/form-data') == -1) {
            //throw new Error('not multiform');
            let query = this._getQuery(req.url);

            if (query.filename) {

                let len = parseInt(req.headers['content-length']),
                    type : string = req.headers['content-type'];

               

                let path = query.path||'/'
                if (path[path.length - 1] != '/') path += '/';
                let asset = await this._assets.create(req, path + query.filename, {
                    mime: type,
                    size: len,
                    skipMeta: false
                });

                return this._writeJSON(res, asset);

            }
            throw new Error('not multiform');
        }

        let {files, fields} = await this._readForm(req);

        let file: formidable.File;
        for (let k in files) {
            file = files[k];
            break;
        }

        if (!file) throw new Error('not file');


        let path = fields['path']|| '/',
            dest = Path.join(path, file.name),
            opts: AssetCreateOptions = {skipMeta:false};

        if (fields['name'] && fields['name'] != "") {
            opts.name = fields['name'];
        }

        if (fields['mime'] && fields['mime'] != "") {
            opts.mime = fields['mime'];
        }
        debug('create file "%s", options "%j"', dest, opts);
        let asset = await this._assets.createFromPath(file.path, dest, opts);

        await this._writeJSON(res, asset, 201);

    }


    async list (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {

        let query = this._getQuery(req.url);

        if (query.id) {
            let asset = await this._assets.getById(query.id);
            if (!asset) {
                throw new HttpError("Not Found", 400);
            }

            if (req.method === 'DELETE') {
                await this._assets.remove(asset);
                return await this._writeJSON(res, {
                    status: 'ok'
                });
            }

            return await this._writeJSON(res, asset);
        }

        if (req.method === 'DELETE') throw new HttpError("No id");

        let page = 1, limit = 1000;
        if (query.page) {
            let i = parseInt(query.page);
            if (!isNaN(i)) page = i;
        }

        if (query.limit) {
            let i = parseInt(query.limit);
            if (!isNaN(i)) limit = i;
        }

        if (page <= 0) page = 1;

        let result;
        if (query.q) {

            result = await this._assets.query(query.q);

        } else {
            let count = await this._assets.metaStore.count();
            let pages = Math.ceil(count / limit);
            let offset = limit * (page - 1);

            if (offset > count) {
                result = [];
            } else {
                result = await this._assets.list({
                    offset: offset,
                    limit: limit
                });
            }

            let links: any = {
                first: 1,
                last: pages
            };

            if (page > 1) links.prev = page - 1;
            if (page < pages) links.next = page + 1;

            this._writeLinksHeader(req, res, links);

        }

        await this._writeJSON(res, result);

    }

    async getResource (req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {

        let query = this._getQuery(req.url);

        if (path[0] !== '/') path = "/" + path;

        let asset = await this._assets.getByPath(path);

        if (!asset) throw new HttpError("Not Found", 404);

        if (toBoolean(query.meta)) {
            return await this._writeJSON(res, asset, 200);
        }

        res.setHeader('Content-Type', asset.mime);
        //res.setHeader('Content-Length', asset.size + "");

        if (toBoolean(query.download)) {
            res.setHeader('Content-Disposition', 'attachment; filename=' + asset.filename);
        }

        let outStream;
        if (toBoolean(query.thumbnail)) {
            res.setHeader('Content-Type', 'image/png');
            outStream = await this._assets.thumbnail(asset);
            if (outStream == null) {
                throw new HttpError('Cannot generate thumbnail for mimetype: ' + asset.mime , 400);
            }
        } else {
             outStream = await this._assets.stream(asset);
        }

        res.writeHead(200);
        outStream.pipe(res);

    }


    async removeResource(req: http.IncomingMessage, res: http.ServerResponse, path: string): Promise<void> {
        let query = this._getQuery(req.url);


        debug('quering path %s', path)
        if (path[0] !== '/') path = "/" + path;

        let asset = await this._assets.getByPath(path);
        if (!asset) throw new HttpError("Not Found", 404);

        await this._assets.remove(asset);
        await this._writeJSON(res, {
            status: 'ok'
        });

    }


    private _writeJSON(res: http.ServerResponse, json:any, status:number = 200): Promise<void> {

        let str = JSON.stringify(json);

        res.writeHead(status, {
            'Content-Type': 'application/json',
            //'Content-Length': str.length + ""
        });

        return new Promise<void>((resolve, reject) => {
            res.write(str, (e) => {
                if (e) return reject(e);
                res.end();
                resolve();
                
            });
            //
        })

    }

    private _getQuery(url:string): any {
       let index = url.indexOf('?');

        if (index > -1) {
            let str = url.substr(index + 1, url.length - 1);
            return querystring.parse(str);
        }
        return {};
    }

    private _readBody(req: http.IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {

           var buffer = [];

           req.on('data', (data) => {
               buffer.push(data);
           });

           req.on('end', () => {
               resolve(Buffer.concat(buffer).toString());
           });

           req.on('error', reject);


        });
    }

    private _readForm(req: http.IncomingMessage): Promise<{fields:formidable.Fields, files:formidable.Files}> {
        return new Promise((resolve,reject) => {

           let form = new formidable.IncomingForm();
           form.keepExtensions = true;
           form.parse(req, (err, fields: formidable.Fields, files: formidable.Files) => {
                if (err) return reject(err);
                resolve({fields,files});
           });

        });
    }

    private _writeLinksHeader(req: http.IncomingMessage, res: http.ServerResponse, links: {prev?:number, next?:number, last?:number, first?:number}) {

        let url = req.url;

        url = req.headers['host'] + url +  (url.indexOf('?') == -1 ? "?" : "&") + 'page=';

        url = "http://" + url

        res.setHeader('Link', Object.keys(links).map(function(rel){
            return '<' + url + links[rel] + '>; rel="' + rel + '"';
        }).join(', '));
    }

}

