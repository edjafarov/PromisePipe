var logic = require('./logic');
var stream = require('../connectors/SocketIODuplexStream')

var PromisePipe = logic.PromisePipe;

var socket = io.connect('http://localhost:3000');

PromisePipe.stream('client','server').pipe(stream.SIOClientServerStream(socket))


module.exports = logic;
