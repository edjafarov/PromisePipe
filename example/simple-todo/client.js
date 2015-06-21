var logic = require('./logic');
var connectors = require('../connectors/SocketIODuplexStream')

var PromisePipe = logic.PromisePipe;

var socket = io.connect('http://localhost:3000');

PromisePipe.stream('client','server').connector(connectors.SIOClientServerStream(socket))


module.exports = logic;
