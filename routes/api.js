/*
 * forwarding to momath API server.
 */

var http = require('http')
  , querystring = require('querystring')
  , secrets = require('../private/secrets').secrets
  , xml2json = require('xml2json');


var API_HOST = secrets.MOMATH_API_HOST;
var API_BASE_PATH = '/api/v1/';
var API_KEY = secrets.MOMATH_API_KEY;

var _DEBUG_JSON_POST_KEY = '__DEBUG_JSON__';

var _CreatePath = function(svcPath, method, args, queryArgs) {
  queryArgs.tok = API_KEY;

  return API_BASE_PATH + ([svcPath, method].concat(args)).join('/') + '?' +
      querystring.stringify(queryArgs);
};

var _PushIfDefined = function(a, value) {
  value && a.push(value);
};

var _SendRequest = function(path, body, responseCallback) {
  var options = {
    hostname: API_HOST,
    path: path,
    method: body ? 'POST' : 'GET'
  };
  console.log('Sending request: ' + options.method + ' http://' +
              options.hostname + options.path);
  var req = http.request(options, function(res) {
    var chunk_buffers = [];
    //console.log('STATUS: ' + res.statusCode);
    //console.log('HEADERS: ' + JSON.stringify(res.headers));

    res.on('data', function (chunk) {
      //console.log('Got Chunk: length=' + chunk.length);
      chunk_buffers.push(chunk);
    });
    res.on('end', function () {
      var buffer = Buffer.concat(chunk_buffers);
      //console.log('Got all data: length=' + buffer.length);
      responseCallback(res.headers['content-type'], buffer);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // write data to request body
  if (body) {
    console.log('SEND_BODY: ' + body);
    req.setHeader('Content-Length', body.length);
    req.setHeader('Content-Type', 'application/xml');
    req.write(body);
  }
  req.end();
};

exports.proxy = function(request, response) {
  var args = [];
  _PushIfDefined(args, request.params.arg1);
  _PushIfDefined(args, request.params.arg2);
  _PushIfDefined(args, request.params.arg3);
  var path = _CreatePath(request.params.svc, request.params.method,
                         args, request.query);

  var json = request.body;
  if (json.hasOwnProperty(_DEBUG_JSON_POST_KEY)) {
    // We got a POST from a debug web form. Parse out the juicy bits as json.
    var json_string = json[_DEBUG_JSON_POST_KEY];
    console.log('__DEBUG_JSON__: ' + json_string);
    // In case json_string is empty (which can't be parsed), make it into an
    // empty object.
    json = JSON.parse(json_string.trim() || '{}');
  }

  var xml = xml2json.toXml(json);
  _SendRequest(path, xml, function (content_type, response_buffer) {
    var response_body = response_buffer;
    if (content_type) {
      if (content_type.indexOf('application/xml') != -1) {
        console.log('Response XML: ' + response_buffer);
        response_body = xml2json.toJson(response_buffer.toString());
        response.setHeader('Content-Type', 'application/json');
      } else {
        response.setHeader('Content-Type', content_type);
      }
    }

    response.setHeader('Content-Length', response_body.length);
    response.write(response_body);
    response.end();
  });
};

exports.request = function(svc, method, args, query_args, body_json, callback) {
  var path = _CreatePath(svc, method, args, query_args);
  var xml = xml2json.toXml(body_json || {});
  _SendRequest(path, xml, function (content_type, response_buffer) {
    if (content_type) {
      if (content_type.indexOf('application/xml') != -1) {
        //console.log('Response XML: ' + response_buffer);
        response_json = xml2json.toJson(response_buffer.toString(), {'object': true});
        callback(response_json);
      } else {
        callback(null);
      }
    }
  });
};
