import {Router} from "./src/router"
import ExpressAppAdapter from "../PPRouter/adapters/ExpressAdapter.js"
import React from "react"

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var myCookieParser = cookieParser('secret');

var RedisStore = require('connect-redis')(expressSession);

var sessionStore = new RedisStore({
	host: "localhost",
  port: 6379
});
app.use(myCookieParser);
app.use(expressSession({
	secret: 'secret', store: sessionStore
}));

var SessionSockets = require('session.socket.io')
  , sessionSockets = new SessionSockets(io, sessionStore, myCookieParser);


var connectors = require('./connector/SessionSocketConnector')



//serve static
app.use(express.static("./"))
//serve routes
Router.use(ExpressAppAdapter(app, layout));


server.listen(process.env.PORT || 3000)

console.log("check localhost:" + process.env.PORT || 3000);

var PromisePipe = Router.PromisePipe;

//setup server-client stream with session
PromisePipe.stream('server','client').connector(connectors.SIOServerClientStream(sessionSockets))


function layout(html, renderData){
  var stateString = JSON.stringify(renderData);
  var html = React.renderToString(html);
 return `<html>
<head>
	<link rel="stylesheet" href="/css/bootstrap.min.css">
	<link rel="stylesheet" href="/css/index.css">
	<script src="/socket.io/socket.io.js"></script>
</head>
<body>
	<div class="container">
		<div id="content">${html}</div>
	</div>
	<script type="text/javascript" src="/bundle.js"></script>
	<script type="text/javascript">
		require('client')(${stateString});
	</script>
</body>
</html>`;
}
