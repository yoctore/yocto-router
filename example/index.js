var logger    = require('yocto-logger');
var r         = require('../src')();
var express   = require('express');

var app = express();

r.setRoutes('./example/routes/');
r.useApp(app);
r.setEndPoint('./example/ctrl/'); 
if (!r.configure()) {
  // error
} else {
  // nothing to do
}
