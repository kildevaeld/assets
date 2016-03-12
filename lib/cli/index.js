"use strict";
/// <reference path="../../typings/main.d.ts" />

require('../metastores/file');
require('../filestores/file');
var command = require('commander');
var server_1 = require('./server');
command.version('0.0.1');
server_1.serverCommand(command);
command.parse(process.argv);