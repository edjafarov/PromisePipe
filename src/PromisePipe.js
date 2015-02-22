var Promise = require('es6-promise').Promise;
var parse = require("parse-stack");
var stringify = require("json-stringify-safe");

function PromisePiper(sequence){
  sequence = sequence || []
  var rec = [];

  var result = function(data, context){
    var chain = [].concat(sequence);
    chain = chain.map(bindTo(context).bindIt.bind(result));
    return doit(chain, data);
  }
  
  result.then = function(){
    var args = [].slice.call(arguments);
    sequence.push(args);
    return result;
  }
  result.catch = function(fn){
    fn.isCatch = true;
    sequence.push([fn]);
    return result;
  }
  result.join = function(){
    var pipers = [].slice.call(arguments);

    var sequences = pipers.map(function(pipe){
      return pipe._getSequence();
    });

    var newSequence = sequence.concat.apply(sequence, sequences);
    return PromisePiper(newSequence);
  }

  result._getSequence = function(){
    return sequence;
  }
  result._getRec = function(){
    return rec;
  }  

  result = Object.keys(PromisePiper.transformations).reduce(function(thePipe, name){
    if(typeof(PromisePiper.transformations[name]) == 'object'){
      var customApi = PromisePiper.transformations[name];
      thePipe[name] = Object.keys(customApi).reduce(function(api, apiname){
        api[apiname] = function(){
          var args = [].slice.call(arguments);
          var resFun = function(data, context){
            var argumentsToPassInside = [data, context].concat(args);
            return customApi[apiname].apply(result, argumentsToPassInside);
          };
          resFun.isCatch = customApi[apiname].isCatch;
          sequence.push([resFun]);
          return result;
        }
        return api;
      }, {});

    } else {
      thePipe[name] = function(){
        var args = [].slice.call(arguments);
        var resFun = function(data, context){
          var argumentsToPassInside = [data, context].concat(args);
          return PromisePiper.transformations[name].apply(result, argumentsToPassInside);
        };
        resFun.isCatch = PromisePiper.transformations[name].isCatch;
        sequence.push([resFun]);
        return result;
      }
      
    }
    return thePipe;
  }, result);

  return result;  
}

PromisePiper.transformations = {};

PromisePiper.use = function(name, transformation, isCatch){
  PromisePiper.transformations[name] = transformation;
  PromisePiper.transformations[name].isCatch = isCatch;
}

// build a chain of promises
function doit(sequence, data){
  return sequence.reduce(function(doWork, funcArr){
    // if next promise is catch
    if(funcArr[0] && funcArr[0].isCatch) {
      return doWork.catch.apply(doWork, funcArr); //do catch
    }
    return doWork.then.apply(doWork, funcArr);
  }, Promise.resolve(data))
}

function bindTo(that){
  return {
    bindIt: function bindIt(handlers){
      var result = this;
      return handlers.map(function(argFunc){
        //TODO: maybe it should be optimized for prod
       
        var newArgFunc = function(data){
          return argFunc.call(this, data, that);
        }
      
        Object.keys(argFunc).reduce(function(funObj, key){
          funObj[key] = argFunc[key]
          return funObj;
        }, newArgFunc); 
        return newArgFunc; 
      })
    }
  }
}

module.exports = PromisePiper;