
/*
 * MoMath static webpage routes.
 */

var http = require('http')
  , path = require('path');

exports.staticRoutes = function(request, response) {
  var reqPath = request.path;

  var templateName = 'body.404.ejs';
  if (reqPath == '' || reqPath == '/') {
    templateName = 'body.main.ejs';
  } else if (reqPath == '/contact') {
    templateName = 'body.contact.ejs';
  } else if (reqPath == '/about') {
    templateName = 'body.about.ejs';
  } else if (reqPath == '/login') {
    templateName = 'body.login.ejs';
  } else if (reqPath == '/render-3ds') {
    templateName = 'body.render-3ds.ejs';
  }

  response.render(path.join(__dirname, '../', 'public/templates/', templateName));
};
