var Promise = require('es6-promise').Promise;
var parse = require("parse-stack");
var stringify = require("json-stringify-safe");


function PromisePiperFactory(){
  function PromisePiper(sequence){
    sequence = sequence || []
    var rec = [];

    var result = function(data, context){
      context = context || {};

      context._pipecallId = Math.ceil(Math.random()*Math.pow(10,16));
      context._env = PromisePiper.env;

      var chain = [].concat(sequence);
      chain = chain.map(bindTo(context).bindIt.bind(result));
      return doit(chain, data, result, context);
    }

    //promise pipe ID
    result._id = ID();
    PromisePiper.pipes[result._id] = sequence;

    result.then = function(){
      var args = [].slice.call(arguments);
      args._env = args[0]._env || PromisePiper.env;
      args._id = ID();
      sequence.push(args);
      return result;
    }
    result.catch = function(fn){
      fn.isCatch = true;
      var args = [fn];
      args._env = args[0]._env || PromisePiper.env;
      args._id = ID();
      sequence.push(args);
      return result;
    }
    result.join = function(){
      var pipers = [].slice.call(arguments);

      var sequences = pipers.map(function(pipe){
        return pipe._getSequence();
      });

      var newSequence = sequence.concat.apply(sequence, sequences);
      return PromisePiper(newSequence);
    }

    result._getSequence = function(){
      return sequence;
    }
    result._getRec = function(){
      return rec;
    }  


    result = Object.keys(PromisePiper.transformations).reduce(function(thePipe, name){
      var customApi = PromisePiper.transformations[name];
      if(typeof(customApi) == 'object'){
        thePipe[name] = wrapObjectPromise(customApi, sequence, result);
      } else {
        thePipe[name] = wrapPromise(customApi, sequence, result);
      }
      return thePipe;
    }, result);

    return result;  
  }
  function wrapObjectPromise(customApi, sequence, result){
    return Object.keys(customApi).reduce(function(api, apiname){
      if(apiname.charAt(0) == "_") return api;
      customApi[apiname]._env = customApi._env;
      if(typeof(customApi[apiname]) == 'object'){
        api[apiname] = wrapObjectPromise(customApi[apiname], sequence, result);
      } else {
        api[apiname] = wrapPromise(customApi[apiname], sequence, result);
      }
      return api;
    }, {});
  }

  function wrapPromise(transObject, sequence, result){
    return function(){
      var args = [].slice.call(arguments);
      var resFun = function(data, context){
        var argumentsToPassInside = [data, context].concat(args);
        return transObject.apply(result, argumentsToPassInside);
      };
      resFun.isCatch = transObject.isCatch;
      var arr = [resFun];
      arr._env = transObject._env;
      arr._id = ID();
      sequence.push(arr);
      return result;
    }
  }

  PromisePiper.pipes = {};


  PromisePiper.env = 'client';

  PromisePiper.setEnv = function(env){
    PromisePiper.env = env;
  };

  PromisePiper.envTransitions = {};

  PromisePiper.envTransition = function(from, to, fn){
    if(!PromisePiper.envTransitions[from]) PromisePiper.envTransitions[from] = {};
    PromisePiper.envTransitions[from][to] = fn;
  } 
  /*
  if next promise is for other env then
  I use transition

  the promise becomes
  new Promise(function(resolve, reject){
    //ithPP:ithStepc:CallID/->
    socketOn("/ithPP:ithStep/CallID", resolve/reject)
    socket.emit("");
  })
  PASS.PASS.PASS
  clientk
  take data, transform data, send 
  */

  PromisePiper.transformations = {};

  PromisePiper.use = function(name, transformation, options){
    options = options || {}
    if(!options._env) options._env = PromisePiper.env;
    PromisePiper.transformations[name] = transformation;

    Object.keys(options).forEach(function(optname){
      PromisePiper.transformations[name][optname] = options[optname];
    })
    
  }

  PromisePiper.messageResolvers = {};

  PromisePiper.promiseMessage = function(message){
    return new Promise(function(resolve, reject){
      PromisePiper.messageResolvers[message.call] = {
        resolve: resolve, 
        reject: reject
      };
    })
  }

  PromisePiper.execTransitionMessage = function execTransitionMessage(message){

    if(PromisePiper.messageResolvers[message.call]){
      PromisePiper.messageResolvers[message.call].resolve(message.data);
      delete PromisePiper.messageResolvers[message.call];
      return {then:function(){}};
    }
    var context = message.context;
    context._env = PromisePiper.env;
    delete context._passChains;

    var ithChain = PromisePiper.pipes[message.pipe].map(function(el){
      return el._id
    }).indexOf(message.chains[0]);
    var sequence = PromisePiper.pipes[message.pipe];
    var chain = [].concat(sequence);
    
    var ids = chain.map(function(el){
      return el._id;
    });
    var newChain = chain.slice(ids.indexOf(message.chains[0]), ids.indexOf(message.chains[1]));
    
    newChain = newChain.map(bindTo(context).bindIt);
    return doit(newChain, message.data, {_id: message.pipe}, context);
  }

  PromisePiper.createTransitionMessage = function createTransitionMessage(data, context, pipeId, chainId, envBackChainId, callId){
    return {
      data: data,
      context: context,
      pipe: pipeId,
      chains: [chainId, envBackChainId],
      call: callId
    }
  }


  // build a chain of promises
  function doit(sequence, data, pipe, ctx){

    return sequence.reduce(function(doWork, funcArr){
      
      //get into other env first time
      if(ctx._env !== funcArr._env && (!ctx._passChains || !~ctx._passChains.indexOf(funcArr._id))) {
    
        var firstChainN = sequence.map(function(el){
          return el._id
        }).indexOf(funcArr._id);

        var lastChain = sequence.map(function(el){
          return el._env;
        }).indexOf(PromisePiper.env, firstChainN );

        ctx._passChains = sequence.map(function(el){
          return el._id
        }).slice(firstChainN+1, lastChain);
        // If there is a transition
      
        
        if(PromisePiper.envTransitions[ctx._env] && PromisePiper.envTransitions[ctx._env][funcArr._env]){
          var newArgFunc = function(data){
            var msg = PromisePiper.createTransitionMessage(data, ctx, pipe._id, funcArr._id, sequence[lastChain]._id, ctx._pipecallId);
            return PromisePiper.envTransitions[ctx._env][funcArr._env].call(this, msg);
          }
          
          return doWork.then.apply(doWork, [newArgFunc]);
        } else{
          throw new Error("there is no transition " + ctx._env + " to " + funcArr._env);
        }
      //got next chain from other env
      } else if(ctx._env !== funcArr._env && ctx._passChains && !!~ctx._passChains.indexOf(funcArr._id)) {
        var newArgFunc = function(data){
          return data;
        }
        return doWork.then.apply(doWork, [newArgFunc]);
      }
      // if next promise is catch
      if(funcArr[0] && funcArr[0].isCatch) {
        return doWork.catch.apply(doWork, funcArr); //do catch
      }
      

      return doWork.then.apply(doWork, funcArr);
    }, Promise.resolve(data))
  }


  function bindTo(that){
    return {
      bindIt: function bindIt(handlers){
        var result = this;
        var newHandlers = handlers.map(function(argFunc){
          //TODO: maybe it should be optimized for prod
         
          var newArgFunc = function(data){
            return argFunc.call(result, data, that);
          }
        
          Object.keys(argFunc).reduce(function(funObj, key){
            funObj[key] = argFunc[key]
            return funObj;
          }, newArgFunc); 
          return newArgFunc; 
        })

        Object.keys(handlers).forEach(function(name){
          if(name.charAt(0) == "_"){
            newHandlers[name] = handlers[name];
          }

        })
        return newHandlers;
      }
    }
  }



  /* //identify ACTION
  PromisePipe().doitWith("id").read("/a/b");
  if cli for server -> then(sendToServer)
  .then(pass).then(pass)
  ser for client .then(resp)
  *1/
  message = {
    context:
    data:

  }
  PromisePipe().execTransitionMessage(message);
  */



  /*
{
  data
  context
  call
  chain [start, end]
  pipe
}

[c].[c].[s].[s].[d].[d].[c]

[c].[c].[s].[s].[d].[s].[c]

call
chain
pipe

1 do
2 do
3 
  remember call, remember context, send over chain where it should be back [7]
  replace all to next C with free pass chains
  call transition to send message c to s

  pipeExec receives data/call/where it should start and end
  slices down the part, on then - calls transition s to c
4
5 
  remember call, remember context, send over chain where it should be back [6]
6

*/


  var counter = 1234567890987;
  function ID() {
    counter++;
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return counter.toString(36).substr(-8);
  };
  return PromisePiper;
}

module.exports = PromisePiperFactory;