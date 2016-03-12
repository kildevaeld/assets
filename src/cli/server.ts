import {pick} from '../utils';
import {Assets} from '../index';
import {AssetsRouter} from '../http/server';
import * as http from 'http';

export function serverCommand(program) {
    
    var cmd: commander.ICommand = program.command('http')
    .action(function () {
        let options = pick(cmd, ['port']);
    
        startServer(options);
    });
    
    cmd.option("-p, --port <port>", "port to use [default: 5000]", 5000)
    

    
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
    
    
    let assets = new Assets({});
    
    router = new AssetsRouter(assets, {
        prefix: '/'
    });
    
    server = http.createServer((req, res) => {
       
       router.middleware(req, res, () => {
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