var logic = require('./logic.js')
var stream = require('./WorkerDuplexStream.js')

module.exports = function(self){
  logic.pipe.setEnv('worker');
  ENV = 'WORKER';
  logic.pipe.stream('worker','client').pipe(stream.WorkerClientStream(self))
}
