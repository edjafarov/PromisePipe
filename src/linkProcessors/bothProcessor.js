let Context = require('../Context'),
    debug = require('debug')('PP:runner');
module.exports = function catchProcessor(PromisePipe){
  return {
    name: 'bothProcessor',
    predicate: function isBoth(link) {
      return link._env === 'both';
    },
    handler: function isBothHandler(link, context, data, executingChain, chain, Pipe) {
      var toNextEnv = getNameNextEnv(PromisePipe.env, context);

      if (!toNextEnv) {
        return executingChain.then(link._handler);
      }

      let range = rangeChain(link._id, chain);
      Context.passChains(context, passChains(range[0], range[1], chain));
      return executingChain.then((data)=> {
        return Promise.resolve(data).then(link._handler).then(()=>{
          debug(`link ${link._id} executed on ${PromisePipe.env} now send execution to ${toNextEnv}`)
          var msg = PromisePipe.createTransitionMessage(data, context, Pipe._id, link._id, chain[range[1]]._id, context._pipecallId);

          return PromisePipe.TransactionHandler.createTransaction(msg)
            .send(PromisePipe.envTransitions[context._env][toNextEnv])
            .then(context.updateAfterTransition)
            .then(handleRejectAfterTransition);
        })
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
