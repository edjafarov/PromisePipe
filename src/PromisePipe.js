var Promise = require('es6-promise').Promise;


function PromisePiperFactory(){
  function PromisePiper(sequence){
    sequence = sequence || []
    var rec = [];

    var result = function(data, context){
      context = context || {};

      // set Random PromisePipe call ID
      Object.defineProperty(context, '_pipecallId', {
        configurable: true,
        enumerable: false,
        writable: false,
        value: Math.ceil(Math.random()*Math.pow(10,16))
      })
      // set current PromisePipe env
      Object.defineProperty(context, '_env', {
        configurable: true,
        enumerable: false,
        writable: false,
        value: PromisePiper.env
      })
      // cleanup PromisePipe call ID/and env at the Pipe end
      function cleanup(data, context){
        delete context._pipecallId;
        delete context._env;
        return data;
      }
      var clean = [cleanup];
      clean._env = PromisePiper.env;

      var chain = [].concat(sequence, [clean]);
      // TODO: check if we need to bind stuff
      chain = chain.map(bindTo(context).bindIt.bind(result));
      // run the chain
      return doit(chain, data, result, context);
    }

    //promise pipe ID
    result._id = ID();
    PromisePiper.pipes[result._id] = sequence;

    // add function to the chain of a pipe
    result.then = function(){
      var args = [].slice.call(arguments);
      args._env = args[0]._env || PromisePiper.env;
      args._id = ID();
      sequence.push(args);
      return result;
    }
    // add catch to the chain of a pipe
    result.catch = function(fn){
      fn.isCatch = true;
      var args = [fn];
      args._env = args[0]._env || PromisePiper.env;
      args._id = ID();
      sequence.push(args);
      return result;
    }
    // join pipes
    result.join = function(){
      var pipers = [].slice.call(arguments);

      var sequences = pipers.map(function(pipe){
        return pipe._getSequence();
      });

      var newSequence = sequence.concat.apply(sequence, sequences);
      return PromisePiper(newSequence);
    }
    // get an array of pipes
    result._getSequence = function(){
      return sequence;
    }

    // deprecated so far:
    result._getRec = function(){
      return rec;
    }

    // add API extensions for the promisepipe
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
  // PromisePipe is a singleton
  // that knows about all pipes and you can get a pipe by ID's
  PromisePiper.pipes = {};

  // the ENV is a client by default
  PromisePiper.env = 'client';

  PromisePiper.setEnv = function(env){
    PromisePiper.env = env;
  };

  PromisePiper.envTransitions = {};

  // Inside transition you describe how to send message from one
  // env to another within a Pipe call
  PromisePiper.envTransition = function(from, to, transition){
    if(!PromisePiper.envTransitions[from]) PromisePiper.envTransitions[from] = {};
    PromisePiper.envTransitions[from][to] = transition;
  }

  //env transformations
  PromisePiper.envContextTransformations = function(from, to, transformation){
    if(!PromisePiper.contextTransformations[from]) PromisePiper.contextTransformations[from] = {};
    PromisePiper.contextTransformations[from][to] = transformation;
  }

  PromisePiper.transformations = {};

  // You can extend PromisePipe API with extensions
  PromisePiper.use = function(name, transformation, options){
    options = options || {}
    if(!options._env) options._env = PromisePiper.env;
    PromisePiper.transformations[name] = transformation;

    Object.keys(options).forEach(function(optname){
      PromisePiper.transformations[name][optname] = options[optname];
    })

  }
  // when you pass Message to another env, you have to wait
  // until it will come back
  // messageResolvers save the call and resoves it when message came back
  PromisePiper.messageResolvers = {};

  PromisePiper.promiseMessage = function(message){
    return new Promise(function(resolve, reject){
      PromisePiper.messageResolvers[message.call] = {
        resolve: resolve,
        reject: reject,
        context: message.context
      };
    })
  }
  // when you pass a message within a pipe to other env
  // you should
  PromisePiper.execTransitionMessage = function execTransitionMessage(message){

    if(PromisePiper.messageResolvers[message.call]){
      //inherit from coming message context
      Object.keys(message.context).reduce(function(ctx, name){
        ctx[name] = message.context[name];
        return ctx;
      }, PromisePiper.messageResolvers[message.call].context);


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
  /*
    experimental
  */
  PromisePiper.localContext = function(context){
    return {
      execTransitionMessage: function(message){
        var origContext = message.context;
        context.__proto__ = origContext;
        message.context = context;
        return PromisePiper.execTransitionMessage(message).then(function(data){
          message.context = origContext;
          return data;
        });
      },
      //TODO:cover with Tests
      wrap: function(fn){
        return function(data, origContext){
          context.__proto__ = origContext;
          return fn(data, context);
        }
      }
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
        lastChain = (lastChain == -1)?(sequence.length - 1):lastChain;



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
    }, Promise.resolve(data));
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

/*
[ ] TODO: create urtility to make easier env specific
    context augumenting.
    The problem is that on server we should have more information
    inside context. Like session or other stuff. Or maybe not?
[ ] TODO

PromiseSocketServer
*/
