
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000)

console.log("check localhost:3000");





app.use(function(req,res,next){
	next();
})
app.use(express.static("./"))
