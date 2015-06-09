'use strict';

var config        = require('yocto-config');
var logger        = require('yocto-logger');
var glob          = require('glob');
var _             = require('lodash');
var path          = require('path');
var joi           = require('joi');
var utils         = require('yocto-utils');
var fs            = require('fs');

/**
 * Yocto Router
 * Manage Your own routes defines on config files
 *
 * For more details on these dependencies read links below :
 * - yocto-logger : lab.yocto.digital:yocto-node-modules/yocto-logger.git
 * - yocto-config : lab.yocto.digital:yocto-node-modules/yocto-config.git
 * - yocto-utils : lab.yocto.digital:yocto-node-modules/yocto-utils.git
 * - Lodash : https://lodash.com/
 * - path : https://nodejs.org/api/path.html
 * - joi : https://github.com/hapijs/joi
 * - fs : https://nodejs.org/api/fs.html
 * - glob : https://www.npmjs.com/package/glob
 * 
 * @date : 09/06/2015
 * @author : ROBERT Mathieu <mathieu@yocto.re>
 * @copyright : Yocto SAS, All right reserved
 * @class Router
 */
function Router() {
  /**
   * Default logger instance
   * 
   * @property logger
   * @type Object
   */
  this.logger = logger;

  /**
   * Default config instance
   * 
   * @property config
   * @type Object
   */
  this.config = config;

  /**
   * Default base path for routes
   * 
   * @property base
   * @type String
   */  
  this.base   = process.cwd();

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
Router.prototype.configure = function() {
  // welcome message ...
  this.logger.banner('[ Router.configure ] - Initializing Router ...');
  
  // main process
  try {
      // config is valid ??
      if (!this.config.load()) {
        throw 'Invalid config given. Please check your config files';
      }

      // check app
      if (!_.has(this.app, 'use') || !_.isFunction(this.app.use)) {
        throw 'Your app is invalid. Please ad a valid express app on your Router.app property';        
      }

      // getting toutes
      var routes = glob.sync('*.js', { cwd : this.base, nosort : true, realpath : true });

      // empty routes ?
      if (_.isEmpty(routes)) {
        this.logger.warning([ '[ Router.configure ] - No routes founded on ', this.base ].join(' '));
      }
      
      // process routes item
      var nbRoutes = 0;
      
      // routes
      _.each(routes, function(item) { 
        // get controller name        
        var ctrlName = item.replace(this.base, '');
        
        // logging message
        this.logger.info([ '[ Router.configure ] - Retreiving routes for [', ctrlName, ']' ].join(' '));
        
        // require module
        var mods = require(item);

        // has routes ?
        if (!_.has(mods, 'routes')) {
          this.logger.warning([ 'Module [', ctrlName, "] doesn't have any routes. Remove this file or add one route configuration" ].join(' '));
        } else {
            // parses routes 
            _.each(mods.routes, function(mod) {
              // validation schema
              var schema = joi.object().min(3).max(3).keys({
                method      : joi.string().required().empty().valid([ 'get', 'post', 'put', 'delete', 'options', 'head']),
                path        : joi.string().required().empty().min(3),
                controller  : joi.object().required().min(2).max(2).keys({
                  name : joi.string().required().empty().min(1),
                  fn : joi.string().required().empty().min(1)
                }).allow('method', 'path', 'controller')
              });

              // validate
              var result = schema.validate(mod);
              
              // has error
              if (!_.isNull(result.error)) {
                // parse details
                _.each(result.error.details, function(error) {
                  this.logger.warning([ '[ Router.configure ] - Cannot add route for', ctrlName,'config given is invalid. Error is :', utils.strings.inspect(error, false) ].join(' '));
                }, this);
              }
              
              // build ctrlPath
              var ctrlPath =  path.normalize([ [ this.ctrl, mod.controller.name ].join('/'), 'js' ].join('.'));
              
              // file exits ?
              if (!fs.existsSync(ctrlPath)) {
                // it looks like no ....
                this.logger.warning([ '[ Router.configure ] - Given endpoint controller [', mod.controller.name, '] for route [', ctrlName, '] is invalid. Path [', ctrlPath, '] is not found. Operation Aborted !' ].join(' '));
              } else {
                // require controller
                var controller = require(ctrlPath);

                // func exists and is a func ??
                if (!_.has(controller, mod.controller.fn) || !_.isFunction(controller[mod.controller.fn])) {
                  this.logger.warning([ '[ Router.configure ] - Cannot find Function [', mod.controller.fn, '] for controller [', mod.controller.name, '] on [', ctrlPath, ']. Operation Aborted' ].join(' '));                
                } else {
                  this.logger.info([ '[ Router.configure ] - Adding route [', mod.path, '] on a [',  mod.method.toUpperCase(),  '] HTTP Request with a callback on [', [ mod.controller.name, mod.controller.fn ].join('.'), ']' ].join(' '));                  
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
      this.logger.info([ '[ Router.configure ] -', nbRoutes, (nbRoutes < 2 ? 'route' : 'routes'), 'was added on current app' ].join(' '));
      
  } catch (e) {
    // something is invalid
    this.logger.error([ '[ Router.configure ] - An Error occured during routes initialization. error is :', e, 'Operation aborted !' ] .join(' '));

    // statement
    return false;
  }

  // return true if all is valid 
  return true;
};

/**
 * Set function, assign given data to a property
 *
 * @method set
 * @param {String} name name of property
 * @param {Mixed} value value of property
 * @return {Object} current instance 
 */
Router.prototype.set = function(name, value) {
  // check requirements
  if (!_.isUndefined(name) && _.isString(name) && !_.isEmpty(name)) {    
    // is relative ?
    if ((name == 'base' || name == 'ctrl') && !path.isAbsolute(value)) {
      // process correct path
      value = path.normalize([ process.cwd(), value ].join('/'));
    }
    
    // assign value
    this[name] = value;  
  } else {
    // log a warning messsage.
    this.logger.warning('[ Router.set ] - Invalid value given. name must be a string and not empty. Operation aborted !');
  }
  
  // returning current instance
  return this;
};

// Instanciate express with default express engine.
// Set method is available for module usage or override
module.exports = new (Router)();