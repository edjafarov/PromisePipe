let debug = require('debug')('PP:runner'),
    loggingCreator = require('./logging.js');

module.exports = function chainRunner(PromisePipe, options) {
  const systemLinksProcessors = [
    require('./linkProcessors/cacheProcessor')(PromisePipe),
    require('./linkProcessors/catchProcessor')(PromisePipe),
    require('./linkProcessors/bothProcessor')(PromisePipe),
    require('./linkProcessors/passLinksProcessor')(PromisePipe),
    require('./linkProcessors/nextEnvProcessor')(PromisePipe)
  ];
  const logging = loggingCreator(options);
  return {
    executeChain(chain, Pipe, data, context) {
      return chain.reduce((executingChain, link, idx) => {
        const processedLink = systemLinksProcessors.reduce(function processLink(result, linkProcessor, idx) {
          if (result) return result;
          if (linkProcessor.predicate(link, context)) {
            debug(`link ${link._id} will be handled by ${linkProcessor.name}`)
            return linkProcessor.handler(link, context, data, executingChain, chain, Pipe).catch(logging.enhance(link));
          }
          return result;
        }, false);

        !processedLink && debug(`link ${link._id} is chained in ${PromisePipe.env}`)
        return processedLink || executingChain.then(link._handler).then(logInBetween).catch(logging.enhance(link));
      }, Promise.resolve(data));
    }
  }
}

function logInBetween(data){
  debug(`data - `, data);
  return data;
}
