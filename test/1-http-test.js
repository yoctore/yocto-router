'use strict';

var chai      = require('chai').assert;
var expect    = require('chai').expect;
var should    = require('chai').should();
var logger    = require('yocto-logger');
var r         = require('../src')(logger);
var express   = require('express');
var _         = require('lodash');
var path      = require('path');

// logger.disableConsole();

// routes list
var routes = [
  { name : 'routes', path : './example/routes/', endpoint : false },
  { name : 'ctrl', path : './example/ctrl/', endpoint : true }
];

var app = express();

describe('Render ->', function () {
  describe('Set and Get process must be valid', function () {
    it ('Set params to render must be valid', function () {
      app.set('render', { foo : 'bar' });
      // get value
      var r = app.get('render');
      // test case
      expect(r).to.not.empty;
      expect(r).to.be.an('object');
      expect(r).to.deep.equal({ foo : 'bar' });
    });

    it ('Attached router with app must be succeed', function () {
      var state = r.useApp(app);
      // unit test
      expect(state).to.be.a('boolean');
      expect(state).to.equal(true);
    });
  });

  // parse each routes
  _.each(routes, function (ro) {
    describe([ 'Loading config for ->', ro.name, ].join(' '), function () {
      it ([ 'Except be succeed when loading', ro.path ].join(' '), function () {
        // default state
        var state = false;
        // has endpoint
        if (ro.endpoint) {
          state = r.setEndPoint(ro.path);
        } else {
          state = r.setRoutes(ro.path);
        }
        // unit test
        expect(state).to.be.a('boolean');
        expect(state).to.equal(true);
      });
      it ([ 'Except setted path to be the strict equal to ', ro.path ].join(' '), function () {
        var fpath = path.normalize([ process.cwd(), ro.path ].join('/'));
        expect(fpath).to.be.a.string;
        expect(fpath).to.equal(r[ro.name]);
      });
    });
  });

  describe('Configure process must be succeed', function () {
    it ('Expect to be a boolean and equal to true', function () {
      var state = r.configure();
      // unit test
      expect(state).to.be.a('boolean');
      expect(state).to.equal(true);
    });
    it ('Expect to be a not empty string and a type of [ GET | POST | PUT | DELETE | PATCH ] route',
      function () {
      app._router.stack.forEach(function(r) {
        if (r.route && r.route.path) {
          expect(r.route.path).to.be.not.empty;
          expect(r.route.path).to.be.a.string;
          expect([ 'get', 'post', 'put', 'patch', 'delete' ]).to.be.include.members(Object.keys(r.route.methods));
        }
      });
    });
  });
});
