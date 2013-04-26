
/**
 * Module dependencies.
 */

var express = require('express')
  , api = require('./routes/api')
  , momath = require('./routes/momath')
  , http = require('http')
  , path = require('path');

var app = express();

app.set('port', process.env.PORT || 3000);
app.configure(function(){
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  // API Requests
  app.get('/api/:svc/:method/:arg1?/:arg2?/:arg3?', api.api);
  app.post('/api/:svc/:method/:arg1?/:arg2?/:arg3?', api.api);

  app.use('/', momath.staticRoutes);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
