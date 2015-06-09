var r         = require('../src');
var util      = require('util');
var logger    = require('yocto-logger');
var express   = require('express');

var app = express();


r.config.set('base', './example/config/');
r.set('base', './example/routes/');
r.set('app', app);
r.set('ctrl', './example/ctrl/'); 
if (!r.configure()) {
  logger.error('Cannot process express. some errors occured. fix it before run');
} else {
}
