var Router = require('./router.js');
var PromisePipe = require('../../src/PromisePipe')();
var Promise = require('es6-promise').Promise;

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
    var stateId = typeof(args[0]) == 'string'?args.shift():'/';
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
          path: uniquePath,
          router: router,
          params: params,
          transition: transition,
          id: prepareParents.join(''),
          config: stateConfig[uniquePath],
          parents: options.parents
        }

        return RoutePipe(null, handlerContext).then(function(data){
          if(!transition.renderData) transition.renderData = {};
          transition.renderData[uniquePath || "/"] = {
            context: handlerContext,
            data: data,
            params: params,
            component: stateConfig[uniquePath].component
          }
        })
      },
      enter: function(PP){
        return PP
      },
      //debugging
      events: {
        error: function(err){
          console.log(arguments, "ERROR WHEN TRANSITION")
          console.log(err.message)
        }
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
      if(!!handler){
        router.map(function(match){
          match('/').to('/', function(nmatch){
            handler(PPRouter.bind(PPRouter, {
              match: nmatch,
              parents: prepareParents
            }))
            PPRouter.call(PPRouter, {
              match: nmatch,
              parents: prepareParents,
            }, "/");
          })
        })
      } else {
        router.map(function(match){
          match('/').to('/');
        })

      }
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

  PPRouter.prepareRenderData = function(state, context){
    return Object.keys(state).reduce(function(result, key){
      result[key].component = stateConfig[key].component;
      if(context) result[key].context = context;
      return result;
    }, state)
  }

  PPRouter.use = function(adapter){
    if(!adapter) throw new Error("Adapter required");
    if(adapter.renderer) renderer = adapter.renderer;
    if(adapter.updateURL) router.updateURL = adapter.updateURL;
    if(router.reset) adapter.routerReset = router.reset;
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
        handler.catch(function(err){
          reject(err)
        });
      })
    }

    if(adapter.handleTransition){
      var transitionTo = router.transitionTo;
      router.transitionTo = function(to, context){
        var handler = transitionTo.call(router, to);

        if(context) handler._context = context;

        return new Promise(function(resolve, reject){
          handler.then(function(){
            resolve({
              renderData: handler.renderData,
              handler: handler
            });
          })
          handler.catch(function(err){
            reject(err)
          });
        }).then(adapter.handleTransition).catch(function(e){console.log("Failed Handling",e);});
      }
    }
  }

  router.getHandler = function(name) {
    return stateConfig[name];
  };

  PPRouter.router = router;

  PPRouter.PromisePipe = PromisePipe;

  return PPRouter;
}
