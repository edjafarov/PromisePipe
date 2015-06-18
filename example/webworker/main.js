var work = require('webworkify');
var logic = require('./logic.js')
ENV = 'CLIENT';
var w = work(require('./worker.js'));

logic.pipe.envTransition('client','worker', function(message){
  w.postMessage(message);
  return logic.pipe.promiseMessage(message);
})

w.addEventListener('message', function (ev) {
  logic.pipe.execTransitionMessage(ev.data);
});

module.exports = logic;
