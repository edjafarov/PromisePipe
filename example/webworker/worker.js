var logic = require('./logic.js')
var connectors = require('../connectors/WorkerDuplexStream.js')

module.exports = function(self){
  logic.pipe.setEnv('worker');
  ENV = 'WORKER';
  logic.pipe.stream('worker','client').connector(connectors.WorkerClientStream(self))
}
