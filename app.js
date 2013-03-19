
/**
 * Module dependencies.
 */
 
var express = require('express')
  , api = require('./routes/api')
  , momath = require('./routes/momath')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  // app.set('view engine', 'jade');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  // API Requests
  app.get('/api/content/:method/:arg1?/:arg2?/:arg3?', api.content);
  app.post('/api/content/:method/:arg1?/:arg2?/:arg3?', api.content);

  app.use('/', momath.staticRoutes);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
