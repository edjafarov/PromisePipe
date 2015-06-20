var logic = require('./logic');
var stream = require('./SocketIODuplexStream')

var PromisePipe = logic.PromisePipe;

var socket = io.connect('http://localhost:3000');

PromisePipe.stream('client','server').pipe(stream.SIOClientServerStream(socket))

function printResult(data){
  console.log("RESULT CLIENT: " + data);
}

module.exports = logic;
