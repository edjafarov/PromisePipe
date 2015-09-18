var redis = require('redis');

var redisUrl = require('parse-redis-url')(redis);

var options = redisUrl.parse(process.env.REDIS_URL);
var client;
var clientSub;

function strongConnect(){
  client = redis.createClient(options.port, options.host);
  clientSub = redis.createClient(options.port, options.host);
  client.on('error', function(err){
    console.log("global redis error: " + err);
    strongConnect();
  });


  if(options.password){
    client.auth(options.password, function(err){
      console.log(err);
    })
    clientSub.auth(options.password, function(err){
      console.log(err);
    })
  }

  if(!process.env.REDIS_URL){
    client.select(options.database || 0, function(){});
    clientSub.select(options.database || 0, function(){});
  }
}
strongConnect()

export var prepareTopIds = doOnServer((size = 5)=>doOnServer((data, context)=>{
  return new Promise((resolve, reject)=>{
    client.get('auction:items:index', (err, index)=>{
      if(err) return reject(err);
      var result = Array.apply(null, {length: size}).map(Number.call, Number);
      //decremented array starting from last index by size
      return resolve(result.reduce((res)=>{
        res.push(index--);
        return res;
      }, []).reverse());
    })
  });
}));

export var getItemsByIds = doOnServer((data, context)=>{
  if(!Array.isArray(data)) data = [data];
  return data.reduce((sequence, id) =>{
    return sequence.then((data)=>{
      return new Promise((resolve, reject)=>{
        client.hgetall('auction:items:' + id, (err, item)=>{
          if(!item) item = {};
          item.id = id;
          data.push(item)
          resolve(data);
        });
      })
    });
  }, Promise.resolve([]));
});


export var getUsersByIds = doOnServer((data, context)=>{
  if(!Array.isArray(data)) data = [data];
  return data.map((uid)=>{
    return users.reduce((res, user)=>{
      if(user.id == uid) return user;
      return res;
    }, null)
  })
});


export var addBidIds = doOnServer((data, context)=>{
  return data.reduce((sequence, item) =>{
    return sequence.then((arr)=>{
      return new Promise((resolve, reject)=>{
        client.get('auction:items:' + item.id + ':bids:index', (err, index)=>{
          if(index){
            var ids = Array.apply(null, {length: +index + 1}).map(Number.call, Number).slice(1).reverse();
            //decremented array starting from last index by size
            return ids.reduce((bidSequence, bidId) => {
              return bidSequence.then((data)=>{
                return new Promise((resolve, reject)=>{
                  client.hgetall('auction:items:' + item.id + ':bids:' + bidId, (err, bid)=>{
                    if(!bid) return resolve(data);
                    bid.id = bidId;
                    bid.user = users.reduce((res, user)=>{
                      if(user.id == bid.uid) return user;
                      return res;
                    }, null)
                    data.push(bid)
                    resolve(data);
                  })
                })
              })
            }, Promise.resolve([]))
            .then((bids)=>{
              item.bids = bids;
              arr.push(item);
              resolve(arr);
            })
          }
          item.bids = [];
          arr.push(item);
          resolve(arr);
        });
      })
    });
  }, Promise.resolve([]));
});

export var withCurrentUser = doOnServer(mock);

export var makeABid = doOnServer((data, context)=>{
  return new Promise((resolve, reject)=>{
    client.incr('auction:items:' + data.id + ':bids:index', newBidId);
    function newBidId(err, id){
      client.hmset('auction:items:' + data.id + ':bids:' + id, {
        bid: data.bid,
        uid: context.session.user.id
      }, bidSaved);
    }
    function bidSaved(){
      resolve([data.id])
    }
  });
});

export var broadcast = doOnServer((data, context)=>{
  client.publish('item:update', JSON.stringify(data));
});

export var watch = doOnServer((data, context)=>{
  var socket = context.socket;

  clientSub.subscribe('item:update');
  clientSub.on("message", function(channel, data) {
    socket.emit(channel, JSON.parse(data));
  });

});

export var verifyCredentials = doOnServer((data, context)=>{
  return new Promise((resolve, reject)=>{
    var result = users.reduce((res, user)=>{
      if(data.login == user.login && data.pwd == user.password){
        return user;
      }
      return res;
    }, null);
    if(!result) return reject("User or password is wrong");
    resolve(result);
  })
});
export var putUserInSession = doOnServer((data, context)=>{
  context.session.user = data;
  context.session.save();
  return data;
});

export var getCurrentUser = doOnServer((data, context)=>{
  return context.session.user || {};
});

export var crearUserFromSession = doOnServer((data, context)=>{
  delete context.session.user;
  context.session.save();
  return {};
});


var users = [
  {
    id:0,
    login: "user1",
    name: "Username1",
    password: "123123"
  },
  {
    id:1,
    login: "user2",
    name: "Username2",
    password: "123123"
  }
]

  function doOnServer(fn){
    fn._env = 'server';
    return fn
  }

  function mock(data){
    console.warn("SHOULD NOT BE HERE");
    return data;
  }
