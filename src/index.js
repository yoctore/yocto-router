'use strict';

var logger        = require('yocto-logger');
var glob          = require('glob');
var _             = require('lodash');
var path          = require('path');
var joi           = require('joi');
var utils         = require('yocto-utils');
var fs            = require('fs');

/**
 * Manage route for node js app
 *
 * @class Router
 * @param {Object} logger Logger instance
 */
function Router (logger) {
  /**
   * Default logger instance
   *
   * @property logger
   * @type Object
   */
  this.logger = logger;

  /**
   * Default base path for routes
   *
   * @property routes
   * @type String
   */
  this.routes = process.cwd();

  /**
   * Default base path for controller assign on routes
   *
   * @property ctrl
   * @type String
   */
  this.ctrl = process.cwd();

  /**
   * Default app value must be an express app
   *
   * @property app
   * @type String
   * @default Null
   */
  this.app = null;
}

/**
 * Default configure method, use for main process of module
 *
 * @method configure
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.configure = function () {
  // Default list of routes
  var routesList = [];

  // Base message
  this.logger.banner('[ Router.configure ] - Initializing Router ...');

  // Main process
  try {
    // Check app
    if (!_.has(this.app, 'use') || !_.isFunction(this.app.use)) {
      throw 'Your app is invalid. Please ad a valid express app on your Router.app property';
    }

    // Getting toutes
    var routes = glob.sync('*.json', {
      cwd      : this.routes,
      nosort   : true,
      realpath : true
    });

    // Empty routes ?
    if (_.isEmpty(routes)) {
      this.logger.warning([ '[ Router.configure ] - No routes founded on',
        this.routes ].join(' '));
    }

    // Routes
    _.each(routes, function (item) {
      // Get controller name
      var ctrlName = item.replace(this.routes, '');

      // Logging message
      this.logger.info([ '[ Router.configure ] - Retreiving routes for [',
        ctrlName, ']' ].join(' '));

      // Require module
      var mods = JSON.parse(fs.readFileSync(item));

      // Has routes ?
      if (_.isEmpty(mods)) {
        // War message
        this.logger.warning([ '[ Router.configure ] - Module [', ctrlName,
          '] doesn\'t have any routes.',
          'Remove this file or add one route configuration' ].join(' '));
      } else {
        // Parses routes
        _.each(mods, function (mod) {
          // Validation schema
          var schema = joi.object().min(3).max(5).keys({
            method : joi.string().required().empty().valid([
              'get', 'post', 'put', 'delete', 'options', 'head'
            ]),
            path       : joi.string().required().empty().min(1),
            regexp     : joi.boolean().default(false),
            priority   : joi.number().default(100).min(0).max(999),
            controller : joi.object().required().min(2).max(2).keys({
              name : joi.string().required().empty().min(1),
              fn   : joi.string().required().empty().min(1)
            }).allow('name', 'fn')
          }).allow('method', 'path', 'controller', 'regexp', 'priority');

          // Is error path ? so need to clean validation rules
          if (_.has(mod, 'error')) {
            // Defined error schema
            schema = joi.object().min(3).max(3).keys({
              priority   : joi.number().default(100).min(0).max(999),
              error      : joi.number().optional().allow([ 404, 500 ]),
              controller : joi.object().required().min(2).max(2).keys({
                name : joi.string().required().empty().min(1),
                fn   : joi.string().required().empty().min(1)
              }).allow('name', 'fn')
            }).allow('controller', 'priority', 'error');
          }

          // Validate
          var result = schema.validate(mod);

          // Has error
          if (!_.isNull(result.error)) {
            // Parse details
            _.each(result.error.details, function (error) {
              this.logger.warning([ '[ Router.configure ] - Cannot add route for',
                ctrlName,
                'config given is invalid. Error is :',
                utils.obj.inspect(error)
              ].join(' '));
            }.bind(this));
          } else {
            // Override mod with joi validate value
            mod = result.value;

            // Build ctrlPath
            var ctrlPath =  path.normalize([ [ this.ctrl, mod.controller.name ].join('/'), 'js'
            ].join('.'));

            // File exits ?
            if (!fs.existsSync(ctrlPath)) {
              // It looks like no ....
              this.logger.warning([ '[ Router.configure ] - Given endpoint controller [',
                mod.controller.name, '] for route [', ctrlName,
                '] is invalid. Path [', ctrlPath,
                '] is not found. Operation Aborted !' ].join(' '));
            } else {
              // Require controller
              var controller = require(ctrlPath);

              // Func exists and is a func ??
              if (!_.has(controller, mod.controller.fn) ||
                  !_.isFunction(controller[mod.controller.fn])) {
                // Warning
                this.logger.warning([ '[ Router.configure ] - Cannot find Function [',
                  mod.controller.fn, '] for controller [',
                  mod.controller.name, '] on [', ctrlPath,
                  ']. Operation Aborted' ].join(' '));
              } else {
                // Messsage
                this.logger.info([ '[ Router.configure ] - Adding route [',
                  mod.path || mod.error, '] on a [',
                  mod.method ? mod.method.toUpperCase() : mod.error,
                  '] HTTP Request with a callback on [',
                  [ mod.controller.name, mod.controller.fn ].join('.'),
                  ']' ].join(' '));

                // Has regexp
                if (_.has(mod, 'regexp') && mod.regexp) {
                  // Path to regexp
                  mod.path = new RegExp(mod.path);
                }

                // Save priority
                var priority = mod.priority;

                // Remove key

                delete mod.priority;

                // Push routes item
                routesList.push({
                  item       : mod,
                  controller : controller,
                  priority   : priority
                });
              }
            }
          }
        }.bind(this));
      }
    }.bind(this));
  } catch (e) {
    // Something is invalid
    this.logger.error([ '[ Router.configure ] - An Error occured during routes initialization.',
      'error is :', e, 'Operation aborted !' ].join(' '));

    // Statement
    return false;
  }

  // Return true if all is valid
  return this.addRoute(routesList);
};

/*
 * Default method to add un route on current app. This method will sort route by given priority.
 * By default this priority was defined to 100
 *
 * @param {Array} routes default route list
 * @return {Boolean} return true if all is ok false otherwise
 */
Router.prototype.addRoute = function (routes) {
  // Has routes ?
  if (routes.length > 0) {
    // Process routes
    routes = _.sortBy(routes, function (route) {
      // Default sort statement
      return this.min(route.priority);
    }.bind(Math));

    // Parse all routes
    _.each(routes, function (route) {
      // Is normal route ?
      if (!_.has(route.item, 'error')) {
        // Route
        this.app[route.item.method](route.item.path,
          route.controller[route.item.controller.fn].bind(this.app));
      } else {
        // Default handler for error
        this.app.use(route.controller[route.item.controller.fn].bind(this.app));
      }
    }.bind(this));

    // How many routes added ??
    this.logger.info([ '[ Router.addRoute ] -', routes.length,
      routes.length < 2 ? 'route' : 'routes',
      'was added on current app' ].join(' '));
  } else {
    // Log message
    this.logger.warning('[ Router.addRoute ] - No routes to add.');
  }

  // Default statement
  return true;
};

/**
 * Set path for routes files
 *
 * @param {String} path path of js files
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.setRoutes = function (path) {
  // Default statement
  return this.set('routes', path);
};

/**
 * Set path for controller files
 *
 * @param {String} path path of js files
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.setEndPoint = function (path) {
  // Default statement
  return this.set('ctrl', path);
};

/**
 * Define app reference for mapping
 *
 * @param {Object} app express app to use
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.useApp = function (app) {
  // Default statement
  return this.set('app', app);
};

/**
 * Set function, assign given data to a property
 *
 * @param {String} name name of property
 * @param {String} value value of property
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.set = function (name, value) {
  // Check requirements
  if (!_.isUndefined(name) && _.isString(name) && !_.isEmpty(name)) {
    // Is relative ?
    if ((name === 'routes' || name === 'ctrl') && !path.isAbsolute(value)) {
      // Process correct path
      value = path.normalize([ process.cwd(), value ].join('/'));

      // Try here exception can be throwed
      try {
        // Parse file
        var parse   = fs.statSync(value);

        // Change state

        if (!parse.isDirectory()) {
          // Throw exception here
          throw [ 'Path is not a directory for :', name ].join(' ');
        }
      } catch (e) {
        // Warn message
        this.logger.warning([ '[ Router.set ] - given value is not a directory : ', e ].join(' '));

        // Return invalid statement if we are here
        return false;
      }
    }

    // Assign value
    this[name] = value;
  } else {
    // Log a warning messsage.
    this.logger.warning([ '[ Router.set ] - Invalid value given.',
      'name must be a string and not empty. Operation aborted !' ].join(' '));

    // Invalid statement
    return false;
  }

  // Returning current instance
  return true;
};

// Default export
module.exports = function (l) {
  // Is a valid logger ?
  if (_.isUndefined(l) || _.isNull(l)) {
    logger.warning('[ Router.constructor ] - Invalid logger given. Use internal logger');

    // Assign
    l = logger;
  }

  // Default statement
  return new Router(l);
};
