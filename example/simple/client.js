var logic = require('./logic');


var PromisePipe = logic.PromisePipe;

var socket = io.connect('http://localhost:3000');
var connectors = require('../connectors/SocketIODuplexStream')
PromisePipe.stream('client','server').connector(connectors.SIOClientServerStream(socket))


//var connectors = require('../connectors/HTTPDuplexStream')
//PromisePipe.stream('client','server').connector(connectors.HTTPClientServerStream())


module.exports = logic;
