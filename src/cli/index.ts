/// <reference path="../../typings/main.d.ts" />
require('../metastores/file');
require('../filestores/file');
import * as command from 'commander';
import * as Path from 'path';
import {serverCommand} from './server';

command.version('0.0.1')
serverCommand(command);
command.parse(process.argv);
