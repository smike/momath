
/*
 * forwarding to momath API server.
 */

var http = require('http')
  , querystring = require('querystring')
  , xml2json = require('xml2json');

var API_HOST = 'api.momath.org';
var API_BASE_PATH = '/api/v1/';
var API_KEY = '2d6e7269-f701-4ae7-8494-afa25808f6ec';

var CONTENT_SVC_PATH = API_BASE_PATH + 'content.svc/';

var _DEBUG_JSON_POST_KEY = '__DEBUG_JSON__';

var _CreateMethodPath = function(svcPath, method, args, queryArgs) {
  if (args.length > 0) {
    // We want a slash between the method and args if they exist.
    args = [""].concat(args);
  }

  queryArgs.tok = API_KEY;

  return svcPath + method + args.join('/') + '?' +
      querystring.stringify(queryArgs);
};

var CreateContentSvcPath = function(method, args, queryArgs) {
  return _CreateMethodPath(CONTENT_SVC_PATH, method, args, queryArgs);
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
  console.log('Sending request: ' + options.method + " http://" +
              options.hostname + options.path);
  var req = http.request(options, function(res) {
    var chunk_buffers = [];
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));

    res.on('data', function (chunk) {
      console.log('Got Chunk: length=' + chunk.length);
      chunk_buffers.push(chunk);
    });
    res.on('end', function () {
      var buffer = Buffer.concat(chunk_buffers);
      console.log('Got all data: length=' + buffer.length);
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

exports.content = function(request, response) {
  console.log(request);
  var args = [];
  _PushIfDefined(args, request.params.arg1);
  _PushIfDefined(args, request.params.arg2);
  _PushIfDefined(args, request.params.arg3);
  var path = CreateContentSvcPath(request.params.method, args, request.query);

  var json = request.body;
  if (json.hasOwnProperty(_DEBUG_JSON_POST_KEY)) {
    // We got a POST from a debug web form. Parse out the juicy bits as json.
    var json_string = json[_DEBUG_JSON_POST_KEY];
    console.log('__DEBUG_JSON__: ' + json_string);
    // In case json_string is empty (which can't be parsed), make it into an
    // empty object.
    json = JSON.parse(json_string || '{}');
  }

  var xml = xml2json.toXml(json);
  _SendRequest(path, xml, function (content_type, response_buffer) {
    if (content_type.indexOf("application/xml") != -1) {
      var response_json = xml2json.toJson(response_buffer.toString());
      response.setHeader("content-type", "application/json");
      response.write(response_json);
      response.end();
    } else {
      response.setHeader("content-type", content_type);
      response.write(response_buffer);
      response.end();
    }
  });
};