var Promise = Promise || require('es6-promise').Promise;
var stackTrace = require('stacktrace-js');

function augumentContext(context, property, value){
  Object.defineProperty(context, property, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: value
  })
}


// cleanup PromisePipe call ID/and env at the Pipe end
function cleanup(data, context){
  delete context._pipecallId;
  delete context._env;
  return data;
}

function PromisePipeFactory(){

  function doOnPipeEnv(item){
    item._id = ID();
    item._env = PromisePipe.env;
    return item
  }

  function PromisePipe(sequence){
    sequence = sequence || []
    var rec = [];

    function result(data, context){
      context = context || {};
      // set Random PromisePipe call ID
      augumentContext(context, '_pipecallId', Math.ceil(Math.random()*Math.pow(10,16)));
      // set current PromisePipe env
      augumentContext(context, '_env', PromisePipe.env);


      var chain = [].concat(sequence, [doOnPipeEnv(cleanup)]);

      chain = chain.map(bindTo(context).bindIt.bind(result)).map(function(fn){
        if(!fn._env) fn._env = PromisePipe.env;
        return fn;
      });
      // run the chain
      return doit(chain, data, result, context);
    }

    //promise pipe ID
    result._id = ID();
    PromisePipe.pipes[result._id] = sequence;

    // add function to the chain of a pipe
    result.then = function(fn){
      if(!fn._id) fn._id = ID();
      sequence.push(fn);
      return result;
    }
    // add catch to the chain of a pipe
    result.catch = function(fn){
      fn.isCatch = true;
      if(!fn._id) fn._id = ID();
      sequence.push(fn);
      return result;
    }

    result.all = function(){
      //TODO: check how is this thing floating between envs
      var pipes = [].slice.call(arguments);
      var fn = function (data, context){
        return Promise.all(pipes.map(function(pipe){
          return pipe(data, context);
        }))
      }
      if(!fn._id) fn._id = ID();
      sequence.push(fn);
      return result;
    }
    // join pipes
    result.join = function(){
      var pipers = [].slice.call(arguments);

      var sequences = pipers.map(function(pipe){
        return pipe._getSequence();
      });

      var newSequence = sequence.concat.apply(sequence, sequences);
      return PromisePipe(newSequence);
    }
    // get an array of pipes
    result._getSequence = function(){
      return sequence;
    }

    // add API extensions for the promisepipe
    result = Object.keys(PromisePipe.transformations).reduce(function(thePipe, name){
      var customApi = PromisePipe.transformations[name];
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
      //TODO: try to use .bind here
      var wrappedFunction = function(data, context){
        var argumentsToPassInside = [data, context].concat(args);
        return transObject.apply(result, argumentsToPassInside);
      };
      wrappedFunction.isCatch = transObject.isCatch;
      wrappedFunction._id = ID();
      sequence.push(wrappedFunction);
      return result;
    }
  }

  // PromisePipe is a singleton
  // that knows about all pipes and you can get a pipe by ID's
  PromisePipe.pipes = {};


  /*
  * setting up env for pipe
  */
  PromisePipe.setEnv = function(env){
    PromisePipe.env = env;
  };

  // the ENV is a client by default
  PromisePipe.setEnv('client');


  /*
  * Is setting up function to be executed inside specific ENV
  * usage:
  * var doOnServer = PromisePipe.in('server');
  * PromisePipe().then(doOnServer(fn));
  * or
  * PromisePipe().then(PromisePipe.in('worker').do(fn));
  */
  PromisePipe.in = function(env){
    if(!env) throw new Error('You should explicitly specify env');
    var result = function makeEnv(fn){
      return fn._env = env;
    }
    result.do = function doIn(fn){
      return fn._env = env;
    }
    return result;
  };

  PromisePipe.envTransitions = {};

  // Inside transition you describe how to send message from one
  // env to another within a Pipe call
  PromisePipe.envTransition = function(from, to, transition){
    if(!PromisePipe.envTransitions[from]) PromisePipe.envTransitions[from] = {};
    PromisePipe.envTransitions[from][to] = transition;
  }

  //env transformations
  PromisePipe.envContextTransformations = function(from, to, transformation){
    if(!PromisePipe.contextTransformations[from]) PromisePipe.contextTransformations[from] = {};
    PromisePipe.contextTransformations[from][to] = transformation;
  }

  PromisePipe.transformations = {};

  // You can extend PromisePipe API with extensions
  PromisePipe.use = function(name, transformation, options){
    options = options || {}
    if(!options._env) options._env = PromisePipe.env;
    PromisePipe.transformations[name] = transformation;

    Object.keys(options).forEach(function(optname){
      PromisePipe.transformations[name][optname] = options[optname];
    })

  }
  // when you pass Message to another env, you have to wait
  // until it will come back
  // messageResolvers save the call and resoves it when message came back
  PromisePipe.messageResolvers = {};

  PromisePipe.promiseMessage = function(message){
    return new Promise(function(resolve, reject){
      PromisePipe.messageResolvers[message.call] = {
        resolve: resolve,
        reject: reject,
        context: message.context
      };
    })
  }
  // when you pass a message within a pipe to other env
  // you should
  PromisePipe.execTransitionMessage = function execTransitionMessage(message){

    if(PromisePipe.messageResolvers[message.call]){

      //inherit from coming message context
      Object.keys(message.context).reduce(function(ctx, name){
        ctx[name] = message.context[name];
        return ctx;
      }, PromisePipe.messageResolvers[message.call].context);

      if(message.unhandledFail){
        PromisePipe.messageResolvers[message.call].reject(message.data);
        delete PromisePipe.messageResolvers[message.call];
        return {then:function(){}};
      }

      PromisePipe.messageResolvers[message.call].resolve(message.data);
      delete PromisePipe.messageResolvers[message.call];
      return {then:function(){}};
    }
    var context = message.context;
    context._env = PromisePipe.env;
    delete context._passChains;


    var sequence = PromisePipe.pipes[message.pipe];
    var chain = [].concat(sequence);

    var ids = chain.map(function(el){
      return el._id;
    });

    var newChain = chain.slice(ids.indexOf(message.chains[0]), ids.indexOf(message.chains[1]) + 1);

    newChain = newChain.map(bindTo(context).bindIt);

    //catch inside env
    function unhandledCatch(data){
      message.unhandledFail = data;
      return data;
    }

    return doit(newChain, message.data, {_id: message.pipe}, context).catch(unhandledCatch);
  }

  PromisePipe.createTransitionMessage = function createTransitionMessage(data, context, pipeId, chainId, envBackChainId, callId){
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
  PromisePipe.localContext = function(context){
    return {
      execTransitionMessage: function(message){
        var origContext = message.context;
        context.__proto__ = origContext;
        message.context = context;
        return PromisePipe.execTransitionMessage(message).then(function(data){
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
    function getChainIndexById(id){
      return sequence.map(function(el){
        return el._id
      }).indexOf(id)
    }

    function getIndexOfNextEnvAppearance(fromIndex, env){
      return sequence.map(function(el){
        return el._env;
      }).indexOf(env, fromIndex);
    }
    return sequence.reduce(function(doWork, funcArr){
      //get into other env first time
      if(ctx._env !== funcArr._env && (!ctx._passChains || !~ctx._passChains.indexOf(funcArr._id))) {

        var firstChainN = getChainIndexById(funcArr._id);

        var lastChain = getIndexOfNextEnvAppearance(firstChainN, PromisePipe.env);
        lastChain = (lastChain==-1)?(sequence.length - 1):(lastChain - 1);

        ctx._passChains = sequence.map(function(el){
          return el._id
        }).slice(firstChainN, lastChain + 1);
        // If there is a transition
        if(PromisePipe.envTransitions[ctx._env] && PromisePipe.envTransitions[ctx._env][funcArr._env]){
          var newArgFunc = function(data){
            var msg = PromisePipe.createTransitionMessage(data, ctx, pipe._id, funcArr._id, sequence[lastChain]._id, ctx._pipecallId);
            return PromisePipe.envTransitions[ctx._env][funcArr._env].call(this, msg);
          }

          return doWork.then(newArgFunc);
        } else{
          throw new Error("there is no transition " + ctx._env + " to " + funcArr._env);
        }
      //got next chain from other env
      } else if(ctx._env !== funcArr._env && ctx._passChains && !!~ctx._passChains.indexOf(funcArr._id)) {
        var newArgFunc = function(data){
          return data;
        }
        return doWork.then(newArgFunc);
      }
      // if next promise is catch
      if(funcArr && funcArr.isCatch) {
        return doWork.catch(funcArr); //do catch
      }


      //it shows error in console and passes it down
      function errorEnhancer(data){
        //is plain Error and was not yet caught
        if(data instanceof Error && !data.caughtOnChainId){
          data.caughtOnChainId = funcArr._id;

          var trace = stackTrace({e: data});
          if(funcArr._name) {console.log("Failed inside " + funcArr._name)}
          console.log(data.toString())
          console.log(trace.join("\n"));
        }
        return Promise.reject(data);
      }

      return doWork.then(funcArr).catch(errorEnhancer);

    }, Promise.resolve(data));
  }


  function bindTo(that){
    return {
      bindIt: function bindIt(handler){
        var newArgFunc = function(data){
          return handler.call(that, data, that);
        }
        newArgFunc._name = handler.name;
        Object.keys(handler).reduce(function(funObj, key){
          funObj[key] = handler[key]
          return funObj;
        }, newArgFunc);
        return newArgFunc;
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
  return PromisePipe;
}



module.exports = PromisePipeFactory;

/*
[ ] TODO: create urtility to make easier env specific
    context augumenting.
    The problem is that on server we should have more information
    inside context. Like session or other stuff. Or maybe not?
[ ] TODO

PromiseSocketServer

PromisePipe.setMode('PROD');
PromisePipe.setMode('DEBUG');
PromisePipe.setMode('TEST');
*/
