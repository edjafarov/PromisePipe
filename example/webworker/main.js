var work = require('webworkify');

var stream = require('../connectors/WorkerDuplexStream.js')

var logic = require('./logic.js')

ENV = 'CLIENT';
var w = work(require('./worker.js'));
logic.pipe.stream('client','worker').pipe(stream.ClientWorkerStream(w))

module.exports = logic;
