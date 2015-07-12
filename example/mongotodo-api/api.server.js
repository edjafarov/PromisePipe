var main = require('./api.logic.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);

var connectors = require('../connectors/SessionSocketIODuplexStream')

var myCookieParser = cookieParser('secret');
var sessionStore = new MongoStore({
	url: process.env.MONGOHQ_URL || "mongodb://localhost:27017/test"
});
server.listen(process.env.PORT || 3333)

console.log("check localhost:" + process.env.PORT || 3333);

var PromisePipe = main.PromisePipe;

app.use(myCookieParser);
app.use(expressSession({
	secret: 'secret', store: sessionStore
}));

var SessionSockets = require('session.socket.io')
  , sessionSockets = new SessionSockets(io, sessionStore, myCookieParser);


var SocketIOSRC = require('fs').readFileSync("node_modules/socket.io/node_modules/socket.io-client/socket.io.js").toString();

var addSockets = 'var socket = io.connect("http://localhost:3333");\n'
var addConnector = "var connector = (" + connectors.SIOClientServerStream.toString() + ")(socket)\n";

var PromiseSRC = require('fs').readFileSync("node_modules/es6-promise/dist/es6-promise.js").toString();
var PromiseInject = "var PromiseObj = {};var module,define;(function(self){\n" + PromiseSRC + "})(PromiseObj);var Promise = PromiseObj.Promise;\n";
var SocketIOInject = "var SocketIOObj = {exports:{}};(function(exports, module){\n" + SocketIOSRC + "})(SocketIOObj.exports, SocketIOObj);var io = SocketIOObj.exports;\n";

var returnAPI = 'return (' + PromisePipe.api.provide(connectors.SIOServerClientStream(sessionSockets)) + ")(connector)";


var ApiSRC = "window.exampleAPI = (function(){\n" + SocketIOInject + addSockets + addConnector + PromiseInject + returnAPI+ "\n})(); console.log(exampleAPI);";


app.use(function(req, res, next){
  //console.log(req.originalUrl);
  if(req.originalUrl === "/ppApi"){
    res.setHeader('content-type', 'text/javascript');
    res.end(ApiSRC);
  }
})
