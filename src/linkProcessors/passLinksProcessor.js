let Context = require('../Context');
const systemEnvs = ['both', 'inherit', 'cache'];


module.exports = function passLinksProcessor(PromisePipe){
  const processor = {
    name: 'passLinksProcessor',
    predicate: function isNextEnv(link, context) {
      return isLinkForOtherEnv(link, context) && shouldLinkBeSkipped(link, context);
    },

    handler: function passLinksHandler(link, context, data, executingChain, chain, Pipe) {
      return executingChain.then(function (data) {
        return data;
      })
    }
  };
  return processor;
}



function isLinkForOtherEnv(link, context) {
  return link._env !== context._env;
}

function shouldLinkBeSkipped(link, context) {
  if (context._passChains && !!~context._passChains.indexOf(link._id)) return true;
  return false;
}
