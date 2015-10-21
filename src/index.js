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
 */
function Router (logger) {
  /**
   * Default logger instance
   *
   * @property logger
   * @type Object
   */
  this.logger   = logger;

  /**
   * Default base path for routes
   *
   * @property routes
   * @type String
   */
  this.routes   = process.cwd();

  /**
   * Default base path for controller assign on routes
   *
   * @property ctrl
   * @type String
   */
  this.ctrl     = process.cwd();

  /**
   * Default app value must be an express app
   *
   * @property app
   * @type String
   * @default Null
   */
  this.app      = null;
}

/**
 * Default configure method, use for main process of module
 *
 * @method configure
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.configure = function () {
  // base message
  this.logger.banner('[ Router.configure ] - Initializing Router ...');

  // main process
  try {
    // check app
    if (!_.has(this.app, 'use') || !_.isFunction(this.app.use)) {
      throw 'Your app is invalid. Please ad a valid express app on your Router.app property';
    }

    // getting toutes
    var routes = glob.sync('*.json', { cwd : this.routes, nosort : true, realpath : true });

    // empty routes ?
    if (_.isEmpty(routes)) {
      this.logger.warning([ '[ Router.configure ] - No routes founded on',
                            this.routes ].join(' '));
    }

    // process routes item
    var nbRoutes = 0;

    // routes
    _.each(routes, function (item) {
      // get controller name
      var ctrlName = item.replace(this.routes, '');

      // logging message
      this.logger.info([ '[ Router.configure ] - Retreiving routes for [',
                         ctrlName, ']' ].join(' '));

      // require module
      var mods = JSON.parse(fs.readFileSync(item));

      // has routes ?
      if (_.isEmpty(mods)) {
        // war message
        this.logger.warning([ 'Module [', ctrlName, '] doesn\'t have any routes.',
                              'Remove this file or add one route configuration' ].join(' '));
      } else {
        // parses routes
        _.each(mods, function (mod) {
          // validation schema
          var schema = joi.object().min(3).max(3).keys({
            method      : joi.string().required().empty().valid([
              'get', 'post', 'put', 'delete', 'options', 'head'
            ]),
            path        : joi.string().required().empty().min(3),
            controller  : joi.object().required().min(2).max(2).keys({
              name  : joi.string().required().empty().min(1),
              fn    : joi.string().required().empty().min(1)
            }).allow('method', 'path', 'controller')
          });

          // validate
          var result = schema.validate(mod);

          // has error
          if (!_.isNull(result.error)) {
            // parse details
            _.each(result.error.details, function (error) {
              this.logger.warning([ '[ Router.configure ] - Cannot add route for',
                                    ctrlName,
                                    'config given is invalid. Error is :',
                                    utils.obj.inspect(error)
                                  ].join(' '));
            }, this);
          }

          // build ctrlPath
          var ctrlPath =  path.normalize([ [ this.ctrl, mod.controller.name ].join('/'), 'js'
                                         ].join('.'));

          // file exits ?
          if (!fs.existsSync(ctrlPath)) {
            // it looks like no ....
            this.logger.warning([ '[ Router.configure ] - Given endpoint controller [',
                                  mod.controller.name, '] for route [', ctrlName,
                                  '] is invalid. Path [', ctrlPath,
                                  '] is not found. Operation Aborted !' ].join(' '));
          } else {
            // require controller
            var controller = require(ctrlPath);

            // func exists and is a func ??
            if (!_.has(controller, mod.controller.fn) ||
                !_.isFunction(controller[mod.controller.fn])) {
              // warning
              this.logger.warning([ '[ Router.configure ] - Cannot find Function [',
                                    mod.controller.fn, '] for controller [',
                                    mod.controller.name, '] on [', ctrlPath,
                                    ']. Operation Aborted' ].join(' '));
            } else {
              // messsage
              this.logger.info([ '[ Router.configure ] - Adding route [',
                                 mod.path, '] on a [',  mod.method.toUpperCase(),
                                 '] HTTP Request with a callback on [',
                                 [ mod.controller.name, mod.controller.fn ].join('.'),
                                 ']' ].join(' '));
              // adding route to current app
              this.app[mod.method](mod.path, controller[mod.controller.fn]);
              // increment nb routes
              nbRoutes++;
            }
          }
        }, this);
      }
    }, this);

    // how many routes added ??
    this.logger.info([ '[ Router.configure ] -', nbRoutes,
                       (nbRoutes < 2 ? 'route' : 'routes'),
                       'was added on current app' ].join(' '));
  } catch (e) {
    // something is invalid
    this.logger.error([ '[ Router.configure ] - An Error occured during routes initialization.',
                        'error is :', e, 'Operation aborted !' ] .join(' '));

    // statement
    return false;
  }

  // return true if all is valid
  return true;
};

/**
 * Set path for routes files
 *
 * @param {String} path path of js files
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.setRoutes = function (path) {
  // default statement
  return this.set('routes', path);
};

/**
 * Set path for controller files
 *
 * @param {String} path path of js files
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.setEndPoint = function (path) {
  // default statement
  return this.set('ctrl', path);
};

/**
 * Define app reference for mapping
 *
 * @param {Object} app express app to use
 * @return {Boolean} true if all is ok false otherwise
 */
Router.prototype.useApp = function (app) {
  // default statement
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
  // check requirements
  if (!_.isUndefined(name) && _.isString(name) && !_.isEmpty(name)) {
    // is relative ?
    if ((name === 'routes' || name === 'ctrl') && !path.isAbsolute(value)) {
      // process correct path
      value = path.normalize([ process.cwd(), value ].join('/'));

      // try here exception can be throwed
      try {
        // parse file
        var parse   = fs.statSync(value);
        // change state
        if (!parse.isDirectory()) {
          // throw exception here
          throw [ 'Path is not a directory for :', name ].join(' ');
        }

      } catch (e) {
        // warn message
        this.logger.warning([ '[ Router.set ] - given value is not a directory : ', e ].join(' '));
        // return invalid statement if we are here
        return false;
      }
    }

    // assign value
    this[name] = value;
  } else {
    // log a warning messsage.
    this.logger.warning([ '[ Router.set ] - Invalid value given.',
                          'name must be a string and not empty. Operation aborted !' ].join(' '));
    // invalid statement
    return false;
  }

  // returning current instance
  return true;
};

// Default export
module.exports = function (l) {
  // is a valid logger ?
  if (_.isUndefined(l) || _.isNull(l)) {
    logger.warning('[ Router.constructor ] - Invalid logger given. Use internal logger');
    // assign
    l = logger;
  }

  // default statement
  return new (Router)(l);
};
