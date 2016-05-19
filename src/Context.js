module.exports = {
  setEnv(context, env) {
    context._env = env;
    return context;
  },
  setPipeCallId(context, id) {
    context._pipeCallId = id;
    return context;
  },
  passChains(context, chains) {
    context._passChains = chains;
  },
  cleanUp(context) {
    delete context._env;
    delete context._pipeCallId;
    return context;
  },
  updateAfterTransition(message){
    Object.keys(message.context).reduce(function(result, name){
      if(name !== '_env') result[name] = message.context[name];
      return result;
    }, context);
    return message;
  }
}
