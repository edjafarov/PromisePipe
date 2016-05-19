var stackTrace = require('stacktrace-js');

module.exports = function({ logger }) {

  //it shows error in options.logger and passes it down
  return {
    enhance: function enhance(link) {
      return function errorEnhancer(data){
      //is plain Error and was not yet caught
        if(data instanceof Error && !data.caughtOnChainId){
          data.caughtOnChainId = link._id;

          var trace = stackTrace({e: data});
          if(link.name) {
            logger.log('Failed inside ' + link.name);
          }
          logger.log(data.toString());
          logger.log(trace.join('\n'));
        }
        return Promise.reject(data);
      }
    }
  }
}
