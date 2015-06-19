function Stream(worker){
  return {
    send: function(message){
      worker.postMessage(message);
    },
    listen: function(handler){
      worker.addEventListener('message', function (ev) {
        handler(ev.data);
      });
    }
  }
}

module.exports = {
  ClientWorkerStream: Stream,
  WorkerClientStream: Stream
}
