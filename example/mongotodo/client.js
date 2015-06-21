var logic = require('./logic');
var connectors = require('../connectors/SessionSocketIODuplexStream')

var PromisePipe = logic.PromisePipe;



var socket = io.connect(document.location.toString());


PromisePipe.stream('client','server').connector(connectors.SIOClientServerStream(socket))


module.exports = logic;
