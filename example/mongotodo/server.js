var main = require('./main.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000)

console.log("check localhost:3000");

var PromisePipe = main.PromisePipe;


app.use(express.static("./"))



socketPipeHandler(io);

function socketPipeHandler(io){
	io.on('connection', function (socket) {
	  socket.on('messageToServer', function (message) {
	    PromisePipe.localContext({}).execTransitionMessage(message).then(function(data){
	    	message.data = data;
	    	socket.emit('messageToClient', message);
	    })
	  });
	});
}
