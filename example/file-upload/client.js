var logic = require('./logic');
var connector = require('http-connector')();

var PromisePipe = logic.PromisePipe;

PromisePipe.stream('client','server').connector(connector.HTTPClientServerStream())
module.exports = logic;
