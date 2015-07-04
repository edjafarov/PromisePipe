var Promise = Promise || require('es6-promise').Promise;
var stackTrace = require('stacktrace-js');
var serialize = require('json-stringify-safe');

function augumentContext(context, property, value){
  Object.defineProperty(context, property, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: value
  });
}

function PromisePipeFactory(){

  /**
   * cleanup PromisePipe call ID/and env at the Pipe end
   */
  function cleanup(data, context){
    delete context._pipecallId;
    delete context._env;
    return data;
  }

  /**
   * PromisePipe chain constructor
   * @param {Array} sequence  Sequence of chain functions
   */
  function PromisePipe(sequence){
    sequence = sequence || [];

    function result(data, context){
      context = context || {};
      // set Random PromisePipe call ID
      augumentContext(context, '_pipecallId', Math.ceil(Math.random() * Math.pow(10, 16)));
      // set current PromisePipe env
      augumentContext(context, '_env', PromisePipe.env);
      var _trace = {};
      _trace[context._pipecallId] = [];
      augumentContext(context, '_trace', _trace);

      var toConcat = [sequence];

      if(PromisePipe._mode === 'DEBUG') {
        var debugChain = {
          func: printDebug,
          _id: ID(),
          _env: PromisePipe.env
        };
        toConcat.push(debugChain);
      }
      var cleanupChain = {
        func: cleanup,
        _id: ID(),
        _env: PromisePipe.env
      };
      toConcat.push(cleanupChain);

      var chain = [].concat.apply([], toConcat);

      chain = chain.map(bindTo(context).bindIt.bind(result)).map(function(fn){
        if(!fn._env) {
          fn._env = PromisePipe.env;
        }

        return fn;
      });
      // run the chain
      return doit(chain, data, result, context);
    }

    function printDebug(data, context){
      var ln = context._trace[context._pipecallId].length;
      printDebugChain(context._trace[context._pipecallId].slice(0, ln - 1));
      return data;
    }

    function printDebugChain(traceLog){
      var seqIds = sequence.map(function(fn){
        return fn._id;
      });

      function showLevel(i, traceLog){
        var item = traceLog[i];
        var fnId = seqIds.indexOf(item.chainId);
        var name = '';
        if (!!~fnId) {
          name = sequence[fnId].name || sequence[fnId]._name;
        }
        console.group('.then(' + name + ')[' + item.env + ']');
        console.log('data', item.data && JSON.parse(item.data));
        console.log('context', JSON.parse(item.context));
        if(traceLog[i + 1]) {
          showLevel(i + 1, traceLog);
        }
        console.groupEnd('.then(' + name + ')');
      }

      if(console.group){
        showLevel(0, traceLog);
      } else {
        traceLog.forEach(function(item, i){
          var shift = new Array(i * 4 + 1).join('');
          var fnId = seqIds.indexOf(item.chainId);
          var name = '';
          if(!!~fnId) {
            name = sequence[fnId].name;
          }

          console.log(shift + ".then(" + name + ")[" + item.env + "]");
          console.log(shift + "    data    : " + JSON.stringify(item.data));
          console.log(shift + "    context : " + item.context);
          return result;
        });
      }
    }

    //promise pipe ID
    result._id = ID();
    PromisePipe.pipes[result._id] = sequence;

    // add function to the chain of a pipe
    result.then = function(fn){
      var chain = {
        func: fn,
        _id: ID(),
        name: fn.name,
        _env: fn._env
      };
      sequence.push(chain);
      return result;
    };
    // add catch to the chain of a pipe
    result.catch = function(fn){
      var chain = {
        func: fn,
        _id: ID(),
        isCatch: true,
        name: fn.name,
        _env: fn._env
      };
      sequence.push(chain);
      return result;
    };

    result.all = function(){
      //TODO: check how is this thing floating between envs
      var pipes = [].slice.call(arguments);
      var fn = function (data, context){
        return Promise.all(pipes.map(function(pipe){
          return pipe(data, context);
        }));
      };
      var chain = {
        func: fn,
        _id: ID(),
        name: "all."
      };
      sequence.push(chain);

      return result;
    };
    // join pipes
    result.join = function(){
      var pipers = [].slice.call(arguments);

      var sequences = pipers.map(function(pipe){
        return pipe._getSequence();
      });

      var newSequence = sequence.concat.apply(sequence, sequences);
      return PromisePipe(newSequence);
    };
    // get an array of pipes
    result._getSequence = function(){
      return sequence;
    };

    // add API extensions for the promisepipe
    result = Object.keys(PromisePipe.transformations).reduce(function(thePipe, name){
      var customApi = PromisePipe.transformations[name];
      customApi._name = name;
      if(typeof(customApi) === 'object'){
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
      if(apiname.charAt(0) === "_") return api;
      customApi[apiname]._env = customApi._env;
      customApi[apiname]._name = customApi._name +"."+ apiname;
      if(typeof(customApi[apiname]) === 'object') {
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
      var chain = {
        func: wrappedFunction,
        _id: ID(),
        name: transObject._name,
        _env: transObject._env,
        isCatch: transObject.isCatch
      };
      sequence.push(chain);
      return result;
    };
  }

  // PromisePipe is a singleton
  // that knows about all pipes and you can get a pipe by ID's
  PromisePipe.pipes = {};

  PromisePipe._mode = 'PROD';
  /**
  * DEBUG/TEST/PROD
  *
  */
  PromisePipe.setMode = function(mode){
    PromisePipe._mode = mode;
  };

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
      var ret = fn.bind(null);
      ret._env = env;
      return ret;
    };
    result.do = function doIn(fn){
      var ret = fn.bind(null);
      ret._env = env;
      return ret;
    };

    return result;
  };

  PromisePipe.envTransitions = {};

  // Inside transition you describe how to send message from one
  // env to another within a Pipe call
  PromisePipe.envTransition = function(from, to, transition){
    if(!PromisePipe.envTransitions[from]) {
      PromisePipe.envTransitions[from] = {};
    }

    PromisePipe.envTransitions[from][to] = transition;
  };

  //env transformations
  PromisePipe.envContextTransformations = function(from, to, transformation){
    if(!PromisePipe.contextTransformations[from]) {
      PromisePipe.contextTransformations[from] = {};
    }
    PromisePipe.contextTransformations[from][to] = transformation;
  };

  PromisePipe.transformations = {};

  // You can extend PromisePipe API with extensions
  PromisePipe.use = function(name, transformation, options){
    options = options || {};
    if(!options._env) {
      options._env = PromisePipe.env;
    }

    PromisePipe.transformations[name] = transformation;

    Object.keys(options).forEach(function(optname){
      PromisePipe.transformations[name][optname] = options[optname];
    });

  };
  // when you pass Message to another env, you have to wait
  // until it will come back
  // messageResolvers save the call and resoves it when message came back
  PromisePipe.messageResolvers = {};

  //TODO: cover by tests
  PromisePipe.stream = function(from, to, processor){
    return {
      connector: function(strm){
        //set transition
        PromisePipe.envTransition(from, to, function(message){
          strm.send(message);
          console.log("SENT:", message);
          return PromisePipe.promiseMessage(message);
        });

        strm.listen(function(message){
          console.log("GOT:", message);
          var context = message.context;
          var data = message.data;
          function end(data){
            message.context = context;
            message.data = data;
            console.log("PROCESSED:", message);
            strm.send(message);
          }
          if(processor){
            function executor(data, context){
              message.data = data;
              message.context = context;
              return PromisePipe.execTransitionMessage(message);
            }
            var localContext = {};
            localContext.__proto__= context;
            return processor(data, localContext, executor, end);
          }
          return PromisePipe.execTransitionMessage(message).then(end);
        });
      }
    };
  };

  PromisePipe.promiseMessage = function(message){
    return new Promise(function(resolve, reject){
      PromisePipe.messageResolvers[message.call] = {
        resolve: resolve,
        reject: reject,
        context: message.context
      };
    });
  };

  // when you pass a message within a pipe to other env
  // you should
  PromisePipe.execTransitionMessage = function execTransitionMessage(message){

    if(PromisePipe.messageResolvers[message.call]){

      //inherit from coming message context
      Object.keys(message.context).reduce(function(ctx, name){
        ctx[name] = message.context[name];
        return ctx;
      }, PromisePipe.messageResolvers[message.call].context);

      PromisePipe.messageResolvers[message.call].context._trace[message.call] = message._trace[message.call];

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

    //get back contexts non enumerables
    augumentContext(context, '_pipecallId', message.call);
    augumentContext(context, '_trace', message._trace);

    var sequence = PromisePipe.pipes[message.pipe];
    var chain = [].concat(sequence);

    var ids = chain.map(function(el){
      return el._id;
    });

    //Check that this is bounded chain nothing is passed through
    var firstChainIndex = ids.indexOf(message.chains[0]);

    //someone is trying to hack the Pipe
    if(firstChainIndex > 0 && sequence[firstChainIndex]._env === sequence[firstChainIndex - 1]._env) {
      console.error("Non-consistent pipe call, message is trying to omit chains");
      return Promise.reject({error: "Non-consistent pipe call, message is trying to omit chains"}).catch(unhandledCatch);
    }

    var newChain = chain.slice(firstChainIndex, ids.indexOf(message.chains[1]) + 1);

    newChain = newChain.map(bindTo(context).bindIt);

    //catch inside env
    function unhandledCatch(data){
      message.unhandledFail = data;
      return data;
    }

    return doit(newChain, message.data, {_id: message.pipe}, context).catch(unhandledCatch);
  };

  PromisePipe.createTransitionMessage = function createTransitionMessage(data, context, pipeId, chainId, envBackChainId, callId){
    return {
      data: data,
      context: context,
      pipe: pipeId,
      chains: [chainId, envBackChainId],
      call: callId,
      _trace: context._trace
    };
  };
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
        };
      }
    };
  };

  // build a chain of promises
  function doit(sequence, data, pipe, ctx) {
    return sequence.reduce(function(doWork, funcArr, funcIndex) {

      var systemEnvs = {
        both: {
          predicate: function () {
            return funcArr._env === 'both';
          },
          handler: function () {
            var toNextEnv = getNameNextEnv(PromisePipe.env);

            if (!toNextEnv) {
              return function (data) {
                return funcArr(data);
              };
            }

            return function () {
              return doWork.then(funcArr).then(function () {
                var msg = PromisePipe.createTransitionMessage(data, ctx, pipe._id, funcArr._id, funcArr._id, ctx._pipecallId);

                var range = rangeChain(funcArr._id, sequence);

                ctx._passChains = passChains(range[0]-1, range[0]-1);

                return PromisePipe.envTransitions[ctx._env][toNextEnv].call(this, msg);
              });
            };
          }
        },
        inherit: {
          predicate: function () {
            return funcArr._env === 'inherit';
          },
          handler: function () {
            var handler = function () {
              return funcArr(data);
            };

            handler._env = getNamePrevEnv(PromisePipe.env);

            return handler;
          }
        }
      };

      /**
       * Return new of next env
       * @param   {String}  env Current env name
       * @return  {String}
       */
      function getNameNextEnv(env) {
        if (!PromisePipe.envTransitions[ctx._env]) {
          return null;
        }

        return Object.keys(PromisePipe.envTransitions[ctx._env]).reduce(function (nextEnv, name) {
          if (nextEnv) { return nextEnv; }

          if (name === env) {
            return nextEnv;
          }

          if (name !== env) {
            return name;
          }
        }, null);
      }

      /**
       * Return name of prev env
       * @param   {String}  env Current env name
       * @return  {String}
       */
      function getNamePrevEnv(env) {
        if (!PromisePipe.envTransitions[ctx._env]) {
          return null;
        }

        return Object.keys(PromisePipe.envTransitions[ctx._env]).reverse().reduce(function (prevName, name) {
          if (prevName) { return prevName; }

          if (name === env) {
            return prevName;
          }

          if (name !== env) {
            return name;
          }
        }, null);
      }

      /**
       * Get index of next env appearance
       * @param   {Number}  fromIndex
       * @param   {String}  env
       * @return  {Number}
       */
      function getIndexOfNextEnvAppearance(fromIndex, env){
        return sequence.map(function(el){
          return el._env;
        }).indexOf(env, fromIndex);
      }

      /**
       * Check env of system behavoir
       * @param   {String}  env Env for checking
       * @return  {Boolean}
       */
      function isSystemTransition (env) {
        return !!systemEnvs[env];
      }

      /**
       * Check valid is transition
       * @return  {Boolean}
       */
      function isValidTransition () {
        var isValid = true;

        if (!(PromisePipe.envTransitions[ctx._env] && PromisePipe.envTransitions[ctx._env][funcArr._env])) {
          if (!isSystemTransition(funcArr._env)) {
            isValid = false;
          }
        }

        return isValid;
      }

      /**
       * Return filtered list for passing functions
       * @param   {Number}    first
       * @param   {Number}    last
       * @return  {Array}
       */
      function passChains (first, last) {
        return sequence.map(function (el) {
          return el._id;
        }).slice(first, last + 1);
      }

      /**
       * Return lastChain index
       * @param   {Number}  first
       * @return  {Number}
       */
      function lastChain (first) {
        var index = getIndexOfNextEnvAppearance(first, PromisePipe.env, sequence);

        return index === -1 ? (sequence.length - 1) : (index - 1);
      }

      /**
       * Return tuple of chained indexes
       * @param   {Number}  id
       * @return  {Tuple}
       */
      function rangeChain (id) {
        var first = getChainIndexById(id, sequence);

        return [first, lastChain(first, sequence)];
      }

      /**
       * Get chain by index
       * @param {String}  id
       * @param {Array}   sequence
       */
      function getChainIndexById(id){
        return sequence.map(function(el){
          return el._id;
        }).indexOf(id);
      }

      /**
       * Default behavoir of jump to next env
       * @param   {Array}   range Tuple of range for jump
       * @return  {Promise}
       */
      function jump (range) {
        return function (data) {
          var msg = PromisePipe.createTransitionMessage(data, ctx, pipe._id, funcArr._id, sequence[range[1]]._id, ctx._pipecallId);

          return PromisePipe.envTransitions[ctx._env][funcArr._env].call(this, msg);
        };
      }

      /**
       * Jump to next env
       * @return  {Function}
       */
      function toNextEnv () {
        var range = rangeChain(funcArr._id, sequence);

        ctx._passChains = passChains(range[0], range[1]);

        if (!isValidTransition(funcArr, ctx)) {
          throw Error('there is no transition ' + ctx._env + ' to ' + funcArr._env);
        }

        return jump(range);
      }

      /**
       * Will we go to the next env
       * @return {Boolean}
       */
      function goToNextEnv () {
        return ctx._env !== funcArr._env && !isSystemTransition(funcArr._env);
      }

      //it shows error in console and passes it down
      function errorEnhancer(data){
        //is plain Error and was not yet caught
        if(data instanceof Error && !data.caughtOnChainId){
          data.caughtOnChainId = funcArr._id;

          var trace = stackTrace({e: data});
          if(funcArr._name) {
            console.log('Failed inside ' + funcArr._name);
          }
          console.log(data.toString());
          console.log(trace.join('\n'));
        }
        return Promise.reject(data);
      }

      /**
       * Skip this chain
       * @return  {Function}
       */
      function toNextChain () {
        return function (data) {
          return data;
        };
      }

      /**
       * Check is skip chain
       * @return  {Boolean}
       */
      function skipChain() {
        if (!ctx._passChains) {
          return false;
        }

        if (!!~ctx._passChains.indexOf(funcArr._id)) {
          return true;
        }

        return false;
      }

      /**
       * Execute handler on correct env
       * @return  {Function}
       */
      function doOnPropEnv () {
        return Object.keys(systemEnvs).reduce(function (chain, name, i) {
          if (chain !== funcArr) {
            // fixed handler for current chain
            return chain;
          }

          if (systemEnvs[name].predicate(sequence, funcArr)) {
            return systemEnvs[name].handler(sequence, funcArr, funcIndex, ctx);
          }

          if (goToNextEnv() && !skipChain()) {
            return toNextEnv();
          }

          if (goToNextEnv() && skipChain()) {
            return toNextChain();
          }

          return funcArr;
        }, funcArr);
      }

      if (funcArr && funcArr.isCatch) {
        return doWork.catch(funcArr);
      }

      return doWork.then(doOnPropEnv()).catch(errorEnhancer);
    }, Promise.resolve(data));
  }


  function bindTo(that){
    return {
      bindIt: function bindIt(chain){
        var handler = chain.func;
        var newArgFunc = function(data){
          // advanced debugging

          if(PromisePipe._mode === 'DEBUG'){
            if(that._pipecallId && that._trace){
              var joinedContext = getProtoChain(that)
                .reverse()
                .reduce(join, {});
              var cleanContext = JSON.parse(serialize(joinedContext));
              //should be hidden
              delete cleanContext._passChains;
              that._trace[that._pipecallId].push({
                chainId: chain._id,
                data: serialize(data),
                context: JSON.stringify(cleanContext),
                timestamp: Date.now(),
                env: that._env
              });
            }
          }


          return handler.call(that, data, that);
        };

        newArgFunc._name = chain.name;
        Object.keys(chain).reduce(function(funObj, key){
          funObj[key] = chain[key];
          return funObj;
        }, newArgFunc);
        return newArgFunc;
      }
    };
  }

  function join(result,  obj){
    Object.keys(obj).forEach(function(key){
      result[key] = obj[key];
    });
    return result;
  }

  function getProtoChain(obj, result){
    if(!result) result = [];
    result.push(obj);
    if(obj.__proto__) return getProtoChain(obj.__proto__, result);
    return result;
  }

  var counter = 1234567890987;
  function ID() {
    counter++;
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return counter.toString(36).substr(-8);
  }
  return PromisePipe;
}

module.exports = PromisePipeFactory;
