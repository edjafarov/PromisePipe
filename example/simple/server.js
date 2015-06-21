var pipe = require('./logic.js');
var PromisePipe = pipe.PromisePipe;

var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var server = require('http').Server(app);
// parse application/json
app.use(bodyParser.json())



var io = require('socket.io')(server);
var connectors = require('../connectors/SocketIODuplexStream')
PromisePipe.stream('server','client').connector(connectors.SIOServerClientStream(io))

//var connectors = require('../connectors/HTTPDuplexStream')
//PromisePipe.stream('server','client').connector(connectors.HTTPServerClientStream(app))


app.use(function(req,res,next){
	next();
})
app.use(express.static("./"))



server.listen(3000)

console.log("check localhost:3000");
