let Context = require('../Context'),
    PipeLink = require('../PipeLink'),
    debug = require('debug')('PP:runner');;
const systemEnvs = ['both', 'inherit', 'cache'];


module.exports = function nextEnvProcessor(PromisePipe){

  const processor = {
    name: 'nextEnvProcessor',
    predicate: function isNextEnv(link, context) {
      return isLinkForOtherEnv(link, context) && !shouldLinkBeSkipped(link, context);
    },

    handler: function nextEnvHandler(link, context, data, executingChain, chain, Pipe) {
      const sequence = Pipe._getSequence()
                      .map(PipeLink.cloneLink)
                      .map((link) => link.setEnv(link._env || PromisePipe.env));
      let range = rangeChain(link._id, sequence);
      Context.passChains(context, passChains(range[0], range[1], sequence));

      if (!isValidTransition(link, context)) {
        throw Error('there is no transition ' + context._env + ' to ' + link._env);
      }

      return executingChain.then(function (data) {
        var msg = PromisePipe.createTransitionMessage(data, context, Pipe._id, link._id, sequence[range[1]]._id, context._pipecallId);
        debug(`links ${context._passChains.join(',')} send execution to ${link._env}`)
        var result = PromisePipe.TransactionHandler.createTransaction(msg)
          .send(PromisePipe.envTransitions[context._env][link._env])
          .then(context.updateAfterTransition)
          .then(handleRejectAfterTransition);
          //TODO: add logging?

        return result;
      });
    }
  };
  /**
   * Check env of system behavoir
   * @param   {String}  env Env for checking
   * @return  {Boolean}
   */
  function isSystemTransition (env) {
    return !!~systemEnvs.indexOf(env);
  }

  /**
   * Check valid is transition
   */
  function isValidTransition (link, context) {
    var isValid = true;

    if (!(PromisePipe.envTransitions[context._env] && PromisePipe.envTransitions[context._env][link._env])) {
      if (!isSystemTransition(link._env)) {
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

  return processor;
}

function handleRejectAfterTransition(message){
  return new Promise(function(resolve, reject){
    if(message.unhandledFail) return reject(message.data);
    resolve(message.data);
  })
}


function isLinkForOtherEnv(link, context) {
  return link._env !== context._env;
}

function shouldLinkBeSkipped(link, context) {
  if (context._passChains && !!~context._passChains.indexOf(link._id)) return true;
  return false;
}
