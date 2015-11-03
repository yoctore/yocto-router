## Overview

This module is a part of yocto node modules for NodeJS.

Please see [our NPM repository](https://www.npmjs.com/~yocto) for complete list of available tools (completed day after day).

This module manage routes configuration & mapping for an express app.

## Motivation

Create a simple and ready to use router manager from a json file configuration.

## How to use

```javascript
var logger    = require('yocto-logger');
var r         = require('yocto-router')(logger);
var express   = require('express');

var app = express();
// set path into app
r.useApp(app);
// set routes path
r.setRoutes('./example/routes/');
// set controller endpoint
r.setEndPoint('./example/ctrl/'); 
// process configure
if (!r.configure()) {
  // error
} else {
  // your valid process here
}
```

## Routes Json configuration files syntax

Your json configuration for routes must be follow these syntax : 

```javascript
[
  {
    "method"  : "YOUR_VALID_HTTP_METHOD_NAME_HERE",
    "path"    : "YOUR_ROUTE_PATTERN_HERE",
    "controller" : {
      "name"  : "YOUR_CONTROLLER_NAME_HERE",
      "fn"  : "YOUR_CONTROLLER_FN_NAME_HERE"
    }
  }
]
```
See Below an example : 

```javascript
[
  {
    "method"  : "post",
    "path"    : "/foo/bar",
    "controller" : {
      "name"  : "controllerFoo",
      "fn"  : "methodBar"
    }
  }  
]
```

## Controller Javascript files syntax

If you are here, it's because you have already define a least one route.

So controller syntax is a same than express export syntax.

```javascript
exports.methodBar = function(req, res, next) {
  // your code here
};
```

## Context in your controller enpoint

In your controller endpoint you can use `this` keywords to access on your express app

## Logging in tool

By Default this module include [yocto-logger](https://www.npmjs.com/package/yocto-logger) for logging.
It's possible to inject in your router instance your current logger instance if is another `yocto-logger` instance.

For example : 

```javascript 
var logger = require('yocto-logger');
// EXTRA CODE HERE FOR YOUR APP
// AGAIN & AGAIN
var router = require('yocto-router')(logger);
```

## Changelog

All history is [here](https://gitlab.com/yocto-node-modules/yocto-router/blob/master/CHANGELOG.md)