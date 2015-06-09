/**
 * Default routes for ad request
 */
var routes = [
  {
    method  : 'post',
    path    : '/ad/contact/details/:property?',
    controller : {
      name  : 'ad',
      fn  : 'fnB'
    }
  },
  {
    method  : 'post',
    path    : '/ad/toto',
    controller : {
      name  : 'ad',
      fn  : 'fnA'
    }
  }  
];

/**
 * expose routes
 */
exports.routes = routes;


