var main = require('./main.js');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cookieParser = require('cookie-parser');

var expressSession = require('express-session');

var MongoStore = require('connect-mongo')(expressSession);

var myCookieParser = cookieParser('secret');

var sessionStore = new MongoStore({
	url: process.env.MONGOHQ_URL || "mongodb://localhost:27017/test" 
});
server.listen(process.env.PORT || 3000)

console.log("check localhost:" + process.env.PORT||3000);

var PromisePipe = main.PromisePipe;

app.use(myCookieParser);
app.use(expressSession({
	secret: 'secret', store: sessionStore
}));
app.use(express.static("./"))


var SessionSockets = require('session.socket.io')
  , sessionSockets = new SessionSockets(io, sessionStore, myCookieParser);

socketPipeHandler(sessionSockets);

function socketPipeHandler(io){
	io.on('connection', function (err, socket, session) {
		if(session && !session.id) session.id = Math.ceil(Math.random()*Math.pow(10,16));
	  socket.on('messageToServer', function (message) {
	    PromisePipe.localContext({session: session}).execTransitionMessage(message).then(function(data){
	    	message.data = data;
	    	socket.emit('messageToClient', message);
	    })
	  });
	});
}
