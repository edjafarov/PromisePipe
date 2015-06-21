var logic = require('./logic');
var stream = require('../connectors/SessionSocketIODuplexStream')

var PromisePipe = logic.PromisePipe;



var socket = io.connect(document.location.toString());


PromisePipe.stream('client','server').pipe(stream.SIOClientServerStream(socket))


module.exports = logic;
