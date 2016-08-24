declare var require;

import * as Koa from 'koa';
import * as Router from 'koa-router';

import {Assets, AssetCreateOptions} from '../index';
import * as Path from 'path';
import * as URL from 'url';

const convert = require('koa-convert'),
	cors = require('koa-cors'),
	body = require('koa-body');

export interface AssetsRouterOptions {
    prefix?: string
}

function toBoolean(str: string): boolean {
    return !!~['true', 'TRUE','t', 'y','j','yes'].indexOf(str)
}

export function App(client:Assets, options: AssetsRouterOptions = {}	) {

	let app = new Koa();

	let router = new Router();

	let p = options.prefix|| '/'

	
	router.post(p, convert(body({multipart:true})), createAsset);
	router.get(p, listAssets);
	router.get(Path.join(p, '*'), getAsset);
	
	router.del(Path.join(p, '*'), deleteAsset);

	app.use(convert(cors({
		origin: '*',
		expose: ['Link']
		//expose: 'Content-Type'
	})))

	
	app.use(router.routes());
	//app.use(router.allowedMethods())
	//router.put('/')
	return app;



	async function listAssets(ctx: Koa.Context) {
		ctx.type = 'json';
		let query = ctx.query;

		if (query.id) {
			let asset = await client.getById(query.id);

			if (!asset) {
				ctx.throw(404, {message:'not found'});
			}

			ctx.body = asset;
		}

		let page = 1, limit = 100;
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
            result = await client.query(query.q);
        } else {
            let count = await client.metaStore.count();
            let pages = Math.ceil(count / limit);
            let offset = limit * (page - 1);

            if (offset > count) {
                result = [];
            } else {
                result = await client.list({
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

            _writeLinksHeader(ctx, links);

        }
		
        ctx.body = result;
	
	}


	async function getAsset(ctx: Koa.Context) {
		let query = ctx.query

		let path = ctx.path;

        if (path[0] !== '/') path = "/" + path;
        
        let asset = (await client.getByPath(path));
        console.log(asset)
        if (!asset) ctx.throw(404);

        if (toBoolean(query.meta)) {
            ctx.body = asset;
            return;
            //return await this._writeJSON(res, asset, 200);
        }

        ctx.type = asset.mime;

        //res.setHeader('Content-Type', asset.mime);
        //res.setHeader('Content-Length', asset.size + "");

        if (toBoolean(query.download)) {

            ctx.set('Content-Disposition', 'attachment; filename=' + asset.filename);
        }

        let outStream;
        if (toBoolean(query.thumbnail)) {
            ctx.set('Content-Type', 'image/png');
            outStream = await client.thumbnail(asset);
            console.log(outStream)
            if (outStream == null) {
                ctx.throw(400, {
                	message: 'Cannot generate thumbnail for mimetype: ' + asset.mime
                })
                //throw new HttpError('Cannot generate thumbnail for mimetype: ' + asset.mime , 400);
            }
        } else {
             outStream = await client.stream(asset);
        }

        ctx.status = 200;
        ctx.body = outStream;
	}

	async function createAsset(ctx: Koa.Context) {

		/*let contentType = ctx.get('content-type')
        if (!contentType || contentType.indexOf('multipart/form-data') == -1) {
            //throw new Error('not multiform');
            let query = ctx.query

            if (query.filename) {

                let len = parseInt(ctx.get('content-length')),
                    type : string = contentType;

               

                let path = query.path||'/'
                if (path[path.length - 1] != '/') path += '/';
                let asset = await this._assets.create(req, path + query.filename, {
                    mime: type,
                    size: len,
                    skipMeta: false
                });

                ctx.type = 'json';
                ctx.body = asset;

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

        await this._writeJSON(res, asset, 201);*/
        
        let contentType = ctx.req.headers['content-type'];
        if (!contentType || contentType.indexOf('multipart/form-data') == -1) {
            //throw new Error('not multiform');
            let query = ctx.query

            if (query.filename) {

                let len = parseInt(ctx.get('content-length')),
                    type : string = contentType;

                let path = query.path||'/'
                if (path[path.length - 1] != '/') path += '/';
                let asset = await client.create(ctx.req, path + query.filename, {
                    mime: type,
                    size: len,
                    skipMeta: false
                });

                ctx.type = 'json';
                ctx.body = asset;
                return

            }
            ctx.throw(400, 'No name spcified');
        }



        ctx.type = "json";

       	let body = (ctx.request as any).body;

       	let file = body.files.file;
        if (file == null) {
        	ctx.throw(403);
        }
        let fields = body.fields;

       	let path = body.fields.path|| '/',
       		dest = Path.join(path, file.name),
       		opts: AssetCreateOptions = {skipMeta: false};

       	if (fields.name && fields.name != "") {
       		opts.name = fields.name;
       	}

       	if (fields.mime && fields.mime != "") {
       		opts.mime = fields.mime;
       	}

        let asset = await client.createFromPath(file.path, dest, opts);

        ctx.status = 201;
        ctx.body = asset;

	}

	function updateAsset(ctx: Koa.Context) {

	}

	function deleteAsset(ctx:Koa.Context) {

	}

	function _writeLinksHeader(ctx: Koa.Context, links: {prev?:number, next?:number, last?:number, first?:number}) {

        let url = ctx.url;

        url = ctx.get('host') + url // +  (url.indexOf('?') == -1 ? "?" : "&") + 'page=';

        url = "http://" + url
        let u = URL.parse(url, true);

        if (u.query) {
            /*let query = Qs.parse(u.query);*/
            if (u.query.page) {
                delete u.query.page;
            }

            //u.query = Qs.stringify(query);
            u.search = null;
            url = URL.format(u);
            url += "&page=";
            
        } else {
            url += '?page=';
        }

        ctx.set('Link', Object.keys(links).map(function(rel){
            return '<' + url + links[rel] + '>; rel="' + rel + '"';
        }).join(', '));
        
    }


}

