
/*
 * forwarding to momath API server.
 */

var http = require('http')
  , xml2json = require('xml2json');

var API_HOST = "api.momath.org";
var API_BASE_PATH = "/api/v1/";
var API_KEY = "2d6e7269-f701-4ae7-8494-afa25808f6ec";

var CONTENT_SVC_PATH = API_BASE_PATH + "content.svc/";

var _CreateMethodPath = function(svcPath, method, optArgs) {
  optArgs = optArgs || [];
  if (optArgs.length > 0) {
    // We want a slash between the method and args if they exist.
    optArgs = [""].concat(optArgs);
  }
  return svcPath + method + optArgs.join("/") + "?tok=" + API_KEY;
};

var CreateContentSvcPath = function(method, optArgs) {
  return _CreateMethodPath(CONTENT_SVC_PATH, method, optArgs);
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
  var req = http.request(options, function(res) {
    var response_data = '';
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      response_data += chunk;
    });
    res.on('end', function () {
      console.log('Got all data: ' + response_data);
      responseCallback(response_data);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // write data to request body
  if (body) {
    console.log('SEND_BODY: ' + body);
    req.write(body);
  }
  req.end();
};

exports.content = function(request, response){
  console.log("method: " + request.params.method);
  console.log(request.params);

  var args = [];
  _PushIfDefined(args, request.params.arg1);
  _PushIfDefined(args, request.params.arg2);
  _PushIfDefined(args, request.params.arg3);
  var path = CreateContentSvcPath(request.params.method, args);

  _SendRequest(path, xml2json.toXml(request.body), function (response_xml) {
    var response_json = xml2json.toJson(response_xml);
    response.write(response_json);
    response.end();
  });
};