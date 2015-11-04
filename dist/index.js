/* yocto-router - Manage route configuration & mapping for an express app - V1.0.4 */
"use strict";function Router(a){this.logger=a,this.routes=process.cwd(),this.ctrl=process.cwd(),this.app=null}var logger=require("yocto-logger"),glob=require("glob"),_=require("lodash"),path=require("path"),joi=require("joi"),utils=require("yocto-utils"),fs=require("fs");Router.prototype.configure=function(){this.logger.banner("[ Router.configure ] - Initializing Router ...");try{if(!_.has(this.app,"use")||!_.isFunction(this.app.use))throw"Your app is invalid. Please ad a valid express app on your Router.app property";var a=glob.sync("*.json",{cwd:this.routes,nosort:!0,realpath:!0});_.isEmpty(a)&&this.logger.warning(["[ Router.configure ] - No routes founded on",this.routes].join(" "));var b=0;_.each(a,function(a){var c=a.replace(this.routes,"");this.logger.info(["[ Router.configure ] - Retreiving routes for [",c,"]"].join(" "));var d=JSON.parse(fs.readFileSync(a));_.isEmpty(d)?this.logger.warning(["[ Router.configure ] - Module [",c,"] doesn't have any routes.","Remove this file or add one route configuration"].join(" ")):_.each(d,function(a){var d=joi.object().min(3).max(3).keys({method:joi.string().required().empty().valid(["get","post","put","delete","options","head"]),path:joi.string().required().empty().min(3),controller:joi.object().required().min(2).max(2).keys({name:joi.string().required().empty().min(1),fn:joi.string().required().empty().min(1)}).allow("method","path","controller")}),e=d.validate(a);_.isNull(e.error)||_.each(e.error.details,function(a){this.logger.warning(["[ Router.configure ] - Cannot add route for",c,"config given is invalid. Error is :",utils.obj.inspect(a)].join(" "))},this);var f=path.normalize([[this.ctrl,a.controller.name].join("/"),"js"].join("."));if(fs.existsSync(f)){var g=require(f);_.has(g,a.controller.fn)&&_.isFunction(g[a.controller.fn])?(this.logger.info(["[ Router.configure ] - Adding route [",a.path,"] on a [",a.method.toUpperCase(),"] HTTP Request with a callback on [",[a.controller.name,a.controller.fn].join("."),"]"].join(" ")),this.app[a.method](a.path,g[a.controller.fn].bind(this.app)),b++):this.logger.warning(["[ Router.configure ] - Cannot find Function [",a.controller.fn,"] for controller [",a.controller.name,"] on [",f,"]. Operation Aborted"].join(" "))}else this.logger.warning(["[ Router.configure ] - Given endpoint controller [",a.controller.name,"] for route [",c,"] is invalid. Path [",f,"] is not found. Operation Aborted !"].join(" "))},this)},this),this.logger.info(["[ Router.configure ] -",b,2>b?"route":"routes","was added on current app"].join(" "))}catch(c){return this.logger.error(["[ Router.configure ] - An Error occured during routes initialization.","error is :",c,"Operation aborted !"].join(" ")),!1}return!0},Router.prototype.setRoutes=function(a){return this.set("routes",a)},Router.prototype.setEndPoint=function(a){return this.set("ctrl",a)},Router.prototype.useApp=function(a){return this.set("app",a)},Router.prototype.set=function(a,b){if(_.isUndefined(a)||!_.isString(a)||_.isEmpty(a))return this.logger.warning(["[ Router.set ] - Invalid value given.","name must be a string and not empty. Operation aborted !"].join(" ")),!1;if(("routes"===a||"ctrl"===a)&&!path.isAbsolute(b)){b=path.normalize([process.cwd(),b].join("/"));try{var c=fs.statSync(b);if(!c.isDirectory())throw["Path is not a directory for :",a].join(" ")}catch(d){return this.logger.warning(["[ Router.set ] - given value is not a directory : ",d].join(" ")),!1}}return this[a]=b,!0},module.exports=function(a){return(_.isUndefined(a)||_.isNull(a))&&(logger.warning("[ Router.constructor ] - Invalid logger given. Use internal logger"),a=logger),new Router(a)};