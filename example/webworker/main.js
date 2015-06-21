var work = require('webworkify');

var connectors = require('../connectors/WorkerDuplexStream.js')

var logic = require('./logic.js')

ENV = 'CLIENT';
var w = work(require('./worker.js'));
logic.pipe.stream('client','worker').connector(connectors.ClientWorkerStream(w))

module.exports = logic;
