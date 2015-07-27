var Router = require('./router.js');
var PromisePipe = require('../../src/PromisePipe')();

module.exports = function PPRouterFactory(){
  var router = new Router();
  var renderer = null;
  var stateConfig = {};
  var initContext = function(){
    return {};
  }

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
        transition._context = transition._context || {};
        var handlerContext = Object.keys(transition._context).reduce(function(context, propName){
          context[propName] = transition._context[propName]
          return context;
        }, {});

        handlerContext.__proto__ = {
          params: params,
          transition: transition,
          id: prepareParents.join(''),
          config: stateConfig[uniquePath],
          parents: options.parents
        }
        handlerContext.transition._context = undefined;
        //console.log("doing " + uniquePath, transition._context);
        return RoutePipe(null, handlerContext).then(function(data){
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

    function augmentContext(context, property, value){
      Object.defineProperty(context, property, {
        value: value,
        writable: false,
        enumerable: false,
        configurable: true
      });
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
    if(adapter.initContext) initContext = adapter.initContext;
    adapter.handleURL = function(url, context){
      var handler = router.handleURL.call(router, url);
      if(context) handler._context = context;
      return new Promise(function(resolve, reject){
        handler.then(function(){
          resolve({
            renderData: handler.renderData,
            handler: handler
          });
        })
      })

    }
  }

  router.getHandler = function(name) {
    return stateConfig[name];
  };

  PPRouter.router = router;

  return PPRouter;
}
