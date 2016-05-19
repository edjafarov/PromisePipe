let Context = require('../Context'),
    debug = require('debug')('PP:runner');
module.exports = function catchProcessor(PromisePipe){
  return {
    name: 'cacheProcessor',
    predicate: function isCache(link) {
      return link.isCache;
    },
    handler: function isCacheHandler(link, context, data, executingChain, chain, Pipe) {
      var toNextEnv = getNameNextEnv(PromisePipe.env, context);

      if (!toNextEnv) {
        return executingChain.then(link._handler);
      }

      let range = rangeChain(chain[getChainIndexById(link._id, chain) + 1]._id, chain);
      Context.passChains(context, passChains(range[0], range[1], chain));


      function cacherFunc(data, context){
        var handler = {};
        var cacheResult = new Promise(function(resolve, reject){
          handler.reject=reject;
          handler.resolve=resolve;
        });
        var result = link._handler.call(this, data, context, cacheResult);
        if(!result) {
          return {
            res: function(cacheResult){
              return handler.resolve(cacheResult);
            },
            data:data
          }
        } else {
          return {
            res:result,
            data: data
          };
        }
      }
      return executingChain.then(cacherFunc).then(function (cacheResult) {
        function fillCache(response){
          debug(`link ${link._id} on ${PromisePipe.env} PUT in cache result from ${toNextEnv}`)
          cacheResult.res(response.data);
          return response;
        }
        if(typeof(cacheResult.res) == "function"){
          debug(`- cache: link ${link._id} executed on ${PromisePipe.env} now send execution to ${toNextEnv}`)
          var msg = PromisePipe.createTransitionMessage(cacheResult.data, context, Pipe._id, chain[range[0]]._id, chain[range[1]]._id, context._pipecallId);

          return PromisePipe.TransactionHandler.createTransaction(msg)
            .send(PromisePipe.envTransitions[context._env][toNextEnv])
            .then(context.updateContextAfterTransition)
            .then(fillCache)
            .then(handleRejectAfterTransition)

        } else {
          return cacheResult.res;
        }
      });

    }
  };

  /**
   * Return filtered list for passing functions
   * @param   {Number}    first
   * @param   {Number}    last
   * @return  {Array}
   */
  function passChains (first, last, sequence) {
    return sequence.map(function (el) {
      return el._id;
    }).slice(first, last + 1);
  }
  /**
   * Return lastChain index
   * @param   {Number}  first
   * @return  {Number}
   */
  function lastChain (first, sequence) {
    var index = getIndexOfNextEnvAppearance(first, PromisePipe.env, sequence);
    return index === -1 ? (sequence.length - 1) : (index - 1);
  }

  /**
   * Get chain by index
   * @param {String}  id
   * @param {Array}   sequence
   */
  function getChainIndexById(id, sequence){
    return sequence.map(function(el){
      return el._id;
    }).indexOf(id);
  }

  /**
   * Get index of next env appearance
   * @param   {Number}  fromIndex
   * @param   {String}  env
   * @return  {Number}
   */
  function getIndexOfNextEnvAppearance(fromIndex, env, sequence){
    return sequence.map(function(el){
      return el._env;
    }).indexOf(env, fromIndex);
  }

  /**
   * Return tuple of chained indexes
   * @param   {Number}  id
   * @return  {Tuple}
   */
  function rangeChain (id, sequence) {
    var first = getChainIndexById(id, sequence);
    return [first, lastChain(first, sequence)];
  }

  function getNameNextEnv(env, context) {
    if (!PromisePipe.envTransitions[context._env]) {
      return null;
    }

    return Object.keys(PromisePipe.envTransitions[context._env]).reduce(function (nextEnv, name) {
      if (nextEnv) { return nextEnv; }

      if (name === env) {
        return nextEnv;
      }

      if (name !== env) {
        return name;
      }
    }, null);
  }
}
function handleRejectAfterTransition(message){
  return new Promise(function(resolve, reject){
    if(message.unhandledFail) return reject(message.data);
    resolve(message.data);
  })
}
