var logic = require('./logic.js')

module.exports = function(self){
  logic.pipe.setEnv('worker');
  ENV = 'WORKER';
  self.addEventListener('message', function(e) {
    var message = e.data;
    logic.pipe.execTransitionMessage(message).then(function(data){
      message.data = data;
      self.postMessage(message);
    })
  });
}
