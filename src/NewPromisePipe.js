var PipeLink = require('./PipeLink');
var Context = require('./Context');
var gedID = require('./ID');
var chainRunner = require('./chainRunner');
var TransactionController = require('./TransactionController');
var debug = require('debug')('PP');

module.exports = function PromisePipeFactory(options = {}) {
  options.timeout = options.timeout || 2000;
  options.logger = options.logger || console;

  debug('PromisePipe create');
  let ID = gedID();
  function PromisePipe(sequence = [], opts) {
    if(!(sequence instanceof Array)) {
      opts = sequence;
      sequence = [];
    }


    function Pipe(data, context = {}) {
      //context.generatePipeCallId(); - check it should be automatically on first call
      //and it should start tracing
      Context.setEnv(
        Context.setPipeCallId(
          context, Math.ceil(Math.random() * Math.pow(10, 16))
        ), PromisePipe.env);

      debug('Pipe run ', context._pipeCallId);

      //clone existing sequence for this pipe
      let chain = [].concat.apply([], sequence)
                      .map(PipeLink.cloneLink)
                      .map((link) => link.setEnv(link._env || PromisePipe.env));

      //add debug chain
      if(PromisePipe.mode === 'DEBUG') {
        chain = chain.concat( PipeLink.getDebugLink(ID())
                                      .setEnv(PromisePipe.env));
      }
      //add cleanup context chain
      chain = chain.concat( PipeLink.getCleanupLink(ID())
                                    .setEnv(PromisePipe.env));
      //add context to all chains
      chain = chain.map((link) => link.mixContext(context));

      //run the chain
      return executeChain(chain, Pipe, data, context);
    }
    Pipe._id = ID();

    PromisePipe.pipes[Pipe._id] = {
      id: Pipe._id,
      sequence: sequence,
      name: opts && opts.name,
      description: opts && opts.description,
      Pipe: Pipe
    }

    Pipe.then = function then(fn, env) {
      let link = PipeLink.getNewLink(fn, ID())
                          .setEnv(env || fn._env);
      sequence.push(link);
      return Pipe;
    }

    Pipe.catch = function catchFn(fn, env) {
      let link = PipeLink.getNewLink(fn, ID())
                          .setEnv(env || fn._env)
                          .setCatch();
      sequence.push(link);
      return Pipe;
    }

    Pipe.cache = function cache(fn, env) {
      let link = PipeLink.getNewLink(fn, ID())
                          .setEnv(env || fn._env)
                          .setCache();
      sequence.push(link);
      return Pipe;
    }

    // join pipes
    Pipe.join = function(){
      var sequences = [].map.call(arguments, function(pipe){
        return pipe._getSequence();
      });

      var newSequence = sequence.concat.apply(sequence, sequences);
      return PromisePipe(newSequence);
    };

    // get an array of pipes
    Pipe._getSequence = function(){
      return sequence;
    };

    Object.keys(PromisePipe.transformations).forEach(function addTransformations(name){
      var customApi = PromisePipe.transformations[name];
      const wrapper = typeof customApi === 'object' ? wrapObject : wrapPromise;
      customApi._name = name;
      Pipe[name] = wrapper(customApi, sequence, Pipe);
    });

    return Pipe;
  }
  const { executeChain } = chainRunner(PromisePipe, options);
  PromisePipe.TransactionHandler = TransactionController(options);

  function wrapObject(customApi, sequence, thePipe){
    return Object.keys(customApi).reduce(function(api, apiName){
      if(apiName.charAt(0) === "_") return api;
      customApi[apiName]._env = customApi._env;
      customApi[apiName]._name = customApi._name +"."+ apiName;
      const wrapper = typeof customApi[apiName] === 'object' ? wrapObject : wrapPromise;
      api[apiName] = wrapper(customApi[apiName], sequence, thePipe);
      return api;
    }, {});
  }

  function wrapPromise(customApi, sequence, thePipe){
    return function wrapper() {
      const args = [].slice.call(arguments);
      function wrapperApiFunction(data, context) {
        return customApi.apply(thePipe, [data, context].concat(args))
      }
      let link = PipeLink.getNewLink(wrapperApiFunction, ID()).setEnv(customApi._env);
      link.name = customApi._name;
      link.isCatch = customApi.isCatch;
      link.isCache = customApi.isCache;
      sequence.push(link);
      return thePipe;
    }
  }

  function addContextToLinks(context) {
    return function mapContextMixing(link) {
      return link.mixContext(context);
    }
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


  PromisePipe.transformations = {};
  /*
  * add new API for PromisePipe
  */
  PromisePipe.use = function use(name, handler = ()=>{}, options = {}) {
    if(!options._env) {
      options._env = PromisePipe.env;
    }
    PromisePipe.transformations[name] = handler;
    Object.keys(options).forEach(function(optname){
      PromisePipe.transformations[name][optname] = options[optname];
    });
  }

  PromisePipe.envTransitions = {};

  // Inside transition you describe how to send message from one
  // env to another within a Pipe call
  PromisePipe.envTransition = function(from, to, transition){
    if(!PromisePipe.envTransitions[from]) {
      PromisePipe.envTransitions[from] = {};
    }

    PromisePipe.envTransitions[from][to] = transition;
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


  // when you pass a message within a pipe to other env
  // you should
  PromisePipe.execTransitionMessage = function execTransitionMessage(message){
    if(PromisePipe.TransactionHandler.processTransaction(message)) return {then: function(){}}
    debug(`execute message for ${message.call} of pipe: ${message.pipe}`);
    var context = message.context;
    context._env = PromisePipe.env;
    delete context._passChains;

    //get back contexts non enumerables
    Context.setPipeCallId(context, message.call);
    //TODO:augmentContext(context, '_trace', message._trace);
    var sequence = PromisePipe.pipes[message.pipe].sequence;

    let chain = [].concat.apply([], sequence)
                    .map(PipeLink.cloneLink)
                    .map((link) => link.setEnv(link._env || PromisePipe.env));

    var ids = chain.map(function(el){
      return el._id;
    });

    //Check that this is bounded chain nothing is passed through
    var firstChainIndex = ids.indexOf(message.chains[0]);


    //someone is trying to hack the Pipe
    if(firstChainIndex > 0 && sequence[firstChainIndex]._env === sequence[firstChainIndex - 1]._env) {
      debug("Non-consistent pipe call, message is trying to omit chains");
      return Promise.reject({error: "Non-consistent pipe call, message is trying to omit chains"}).catch(unhandledCatch);
    }

    var newChain = chain.slice(firstChainIndex, ids.indexOf(message.chains[1]) + 1);

    newChain = newChain.map((link) => link.mixContext(context));

    //catch inside env
    function unhandledCatch(data){
      message.unhandledFail = data;
      return data;
    }


    return  executeChain(newChain, PromisePipe.pipes[message.pipe].Pipe, message.data, context).catch(unhandledCatch);
  };



  PromisePipe.createTransitionMessage = function createTransitionMessage(data, context, pipeId, chainId, envBackChainId, callId){
    var contextToSend = JSON.parse(JSON.stringify(context));
    delete contextToSend[context._env]
    return {
      data: data,
      context: contextToSend,
      pipe: pipeId,
      chains: [chainId, envBackChainId],
      call: callId,
      _trace: context._trace
    };
  };

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
      }
    };
  };

  PromisePipe.api = require('./RemoteAPIHandlers')(PromisePipe);

  return PromisePipe;

}
