module.exports = {
  HTTPClientServerStream: function Stream(fetchFn){
    var fetchFn = fetchFn || fetch;
    var StreamHandler=null;
    return {
      send: function(message){
        fetchFn("/promise-pipe-connector",{
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        }).then(function(response){
          return response.json();
        }).then(function(message){
          if(StreamHandler) return StreamHandler(message);
          return message;
        });

      },
      listen: function(handler){
        StreamHandler = handler;
      }
    }
  },
  //express app
  //highly experimental
  HTTPServerClientStream: function ServerClientStream(app){
    var StreamHandler;
    app.use(function(req, res, next){
      if(req.originalUrl == '/promise-pipe-connector' && req.method=='POST'){
        var message = req.body;
        message._response = res;
        StreamHandler(message)
      } else {
        return next();
      }
    });
    return {
      send: function(message){
        if(!message._response) throw Error("no response defined");
        var res = message._response;
        message._response = undefined;
        res.json(message);
      },
      listen: function(handler){
        StreamHandler = handler;
      }
    }
  }
}
