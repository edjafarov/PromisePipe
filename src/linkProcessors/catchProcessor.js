module.exports = function catchProcessor(PromisePipe){
  return {
    name: 'catchProcessor',
    predicate: function isCatch(link) {
      return !!link.isCatch;
    },
    handler: function isCatchHandler(link, context, data, executingChain, chain, Pipe) {
      return executingChain.catch(link._handler);
    }
  };
}
