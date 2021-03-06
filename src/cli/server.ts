import {pick} from '../utils';
import {Assets} from '../index';
import {AssetsRouter} from '../http/server';
import {App} from '../http/server2';
import * as http from 'http';
import * as fs from 'mz/fs';
import * as Path from 'path';
import * as Debug from 'debug';

const debug = Debug('assets:cli:server');


const etag = require('etag');

export function serverCommand(program) {
    
    var cmd: commander.ICommand = program.command('http')
    .action(function () {
        let options = pick(cmd, ['port', 'web', 'config']);
        
        try {
            startServer2(options);    
        } catch (e) {
            console.log('Could not start server: %s', e.message);
            process.exit(-1);
        }
        
    });
    
    cmd.option("-p, --port <port>", "port to use [default: 5000]", 5000)
    .option('-w, --web', 'web client')
    .option('-c, --config <path>');
    
      
}

function startServer2(options) {

    let config = {};
    if (options.config) {
        let configPath = options.config; 
        if (!Path.isAbsolute(configPath))
            configPath = Path.resolve(options.config);
        config = require(configPath);
        console.log('Using config file: %s', configPath);
    }

    let assets = new Assets(config);

    let app = App(assets);

    var server;

    const clean = () => {
        process.stdout.write("Exiting ... ");
        if (server) server.close();
        process.stdout.write('done\n');
        process.exit(0);
    } 

    
    assets.initialize().then(() => {
        console.log('Starting server on port %s', options.port);
        server = app.listen(options.port);
    }).catch( e => {
        console.error('Error: ', e);
        process.exit(-1);
    });
    
    process.on('SIGINT', clean);
}

function startServer (options) {
    
    let server: http.Server;
    let router: AssetsRouter;
    
    const clean = () => {
        process.stdout.write("Exiting ... ");
        if (server) server.close();
        process.stdout.write('done\n');
        process.exit(0);
    } 
    
    let config = {};
    if (options.config) {
        let configPath = options.config; 
        if (!Path.isAbsolute(configPath))
            configPath = Path.resolve(options.config);
        config = require(configPath);
        console.log('Using config file: %s', configPath);
    }
    
    let assets = new Assets(config);
    

   
    let prefix = options.web ? '/files' : '/';
    
    router = new AssetsRouter(assets, {
        prefix: prefix
    });
    
    server = http.createServer((req, res) => {
       
       router.middleware(req, res, () => {
           
           if (options.web) {
               debug('handle client');
               return handleClient(assets, req, res).catch( e => {
                   console.error(e.stack);
                   process.exit(-1)
               });
           }
           
           res.writeHead(404);
           res.end();
           
       });
        
    });
    
    assets.initialize().then(() => {
        console.log('Starting server on port %s', options.port);
        server.listen(options.port);
    }).catch( e => {
        console.error('Error: ', e);
        process.exit(-1);
    });
    
    process.on('SIGINT', clean);
    
    
}

const ASSETS_PATH = Path.resolve(__dirname, '../..' ,'node_modules/assets.gallery/dist');

async function handleClient(assets:Assets, req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    
    let stream, mime = "text/html", stats;
    let path: string;
    
    switch (req.url) {
        case '/js/assets-gallery.js':
            path = Path.join(ASSETS_PATH, 'js', 'assets-gallery.js')
            mime = 'application/javascript';
            break;
        case '/css/assets-gallery.css':
            path = Path.join(ASSETS_PATH, 'css', 'assets-gallery.css');
            mime = 'text/css';
            break;
        case '/images/assets-mimetypes.png':
            path = Path.join(ASSETS_PATH, 'images', 'assets-mimetypes.png')
            mime = 'image/png';
            break;
        case '/images/assets-mimetypes@2x.png':
            path = Path.join(ASSETS_PATH, 'images', 'assets-mimetypes@2x.png')
            mime = 'image/png';
            break;
        case '/images/assets-loader.gif':
            path = Path.join(ASSETS_PATH, 'images', 'assets-loader.gif');
            mime = 'image/gif';
            break;
        case '/images/assets-remove.png':
            path = Path.join(ASSETS_PATH, 'images', 'assets-remove.png');
            mime = 'image/png';
            break;
        default:
            path = Path.resolve(__dirname, '../../resources/index.html');
            mime = 'text/html';       
    }
    
    stats = await fs.stat(path);
    
    stream = fs.createReadStream(path);
    
    res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stats.size,
        //'ETag': etag(stats)
    });
    
    stream.pipe(res);    
}