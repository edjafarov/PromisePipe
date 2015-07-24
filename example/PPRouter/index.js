var Router = require('./router.js');
var PromisePipe = require('../../src/PromisePipe')();

module.exports = function PPRouterFactory(){
  var router = new Router();
  var renderer = null;
  var stateConfig = {};

  function PPRouter(){
    var args = Array.prototype.slice.call(arguments);
    var options = typeof(args[0]) == 'object'?args.shift():{};
    var stateId = typeof(args[0]) == 'string'?args.shift():'';
    var handler = typeof(args[0]) == 'function'?args.shift():undefined;

    var RoutePipe = PromisePipe();

    var prepareParents = options.parents?[].concat(options.parents, [stateId]):[stateId];

    var uniquePath = prepareParents.join("");

    stateConfig[uniquePath] = {
      model: function(params, transition){
        //console.log("doing " + uniquePath, transition);
        return RoutePipe(null, {
          params: params,
          transition: transition,
          id: prepareParents.join(''),
          config: stateConfig[uniquePath],
          parents: options.parents
        }).then(function(data){
          if(!transition.renderData) transition.renderData = {};
          transition.renderData[uniquePath] = {
            data: data,
            params: params,
            component: stateConfig[uniquePath].component
          }
        })
      },
      enter: function(PP){
        return PP
      }
    }


    if(!options.match){
      router.map(function(match){
        match('/').to('', function(match){
          handler(PPRouter.bind(PPRouter, {
            match: match,
            parents: prepareParents
          }))
        })
      })
    } else {
      if(!!handler){
        options.match(stateId).to(uniquePath, function(match){
          handler(PPRouter.bind(PPRouter, {
            match: match,
            parents: prepareParents
          }))
          if(!stateConfig[uniquePath + "/"]){
            PPRouter.call(PPRouter, {
              match: match,
              parents: prepareParents,
            }, "/");
          }
        });
      } else {
        options.match(stateId).to(uniquePath);
      }
    }
    RoutePipe.component = function(comp){
      stateConfig[uniquePath].component = comp;
      return RoutePipe;
    }

    return RoutePipe;
  }

  PPRouter.use = function(adapter){
    if(!adapter) throw new Error("Adapter required");
    if(adapter.renderer) renderer = adapter.renderer;
    if(adapter.updateURL) router.updateURL;
    adapter.handleURL = router.handleURL.bind(router)
  }

  router.getHandler = function(name) {
    return stateConfig[name];
  };

  PPRouter.router = router;

  return PPRouter;
}
