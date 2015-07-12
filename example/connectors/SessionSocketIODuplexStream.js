module.exports = {
  SIOClientServerStream: function Stream(socket){
    return {
      send: function(message){
        socket.emit('messageToServer', message);
      },
      listen: function(handler){
        socket.on('messageToClient', function (message) {
          handler(message);
        });
      }
    }
  },
  SIOServerClientStream: function ServerClientStream(io){
    var StreamHandler=null;
    io.on('connection', function (err, socket, session) {
      socket.on('messageToServer', function (message) {
        message._socket = socket;
        message.context = message.context || {};
        message.context.session = session;
        if(StreamHandler) {
          StreamHandler(message);
        }
      });
    });
    return {
      send: function(message){
        var socket = message._socket;
        message._socket = undefined;
        if(message.context.session) message.context.session = undefined;
        if(!socket) throw new Error("Socket is nod defined in the message");
        socket.emit('messageToClient', message);
      },
      listen: function(handler){
        StreamHandler = handler;
      }
    }
  }
}
