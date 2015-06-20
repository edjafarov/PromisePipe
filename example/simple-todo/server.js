var main = require('./logic.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000)

var stream = require('../connectors/SocketIODuplexStream');

console.log("check localhost:3000");

var PromisePipe = main.PromisePipe;


app.use(express.static("./"))

var todolist = [
	{
		id: 0,
		name: "todo name",
		done: true
	},
	{
		id: 1,
		name: "todo name 1",
		done: false
	}
]

PromisePipe.stream('server','client', function(data, context, executor, end){
	context.todolist = todolist;
	executor(data, context).then(end);
}).pipe(stream.SIOServerClientStream(io))
