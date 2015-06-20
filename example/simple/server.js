var pipe = require('./logic.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var stream = require('./SocketIODuplexStream')


server.listen(3000)

console.log("check localhost:3000");

var PromisePipe = pipe.PromisePipe;



app.use(function(req,res,next){
	next();
})
app.use(express.static("./"))

PromisePipe.stream('server','client').pipe(stream.SIOServerClientStream(io))
