var Promise = require('es6-promise').Promise;
var parse = require("parse-stack");
var stringify = require("json-stringify-safe");

function PromisePiper(sequence){
  sequence = sequence || []
  var rec = [];

  var result = function(data, context){
    if(!PromisePiper.prod) rec.push([stringify(data), stringify(context)])
    var chain = [].concat(sequence);
    chain = chain.map(bindTo(context).bindIt.bind(result));
    return doit(chain, data);
  }
  
  result.then = function(){
    sequence.push([].slice.call(arguments));
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
    return thePipe;
  }, result);

  return result;
}

PromisePiper.transformations = {};

PromisePiper.use = function(name, transformation, isCatch){
  PromisePiper.transformations[name] = transformation;
  PromisePiper.transformations[name].isCatch = isCatch;
}

function doit(sequence, data){
  return sequence.reduce(function(doWork, funcArr){
    if(funcArr[0] && funcArr[0].isCatch) return doWork.catch.apply(doWork, funcArr); //do catch or
    return doWork.then.apply(doWork, funcArr);
  }, Promise.resolve(data))
}

function bindTo(that){
  return {
    bindIt: function bindIt(handlers){
      var result = this;
      return handlers.map(function(argFunc){
        //TODO: maybe it should be optimized for prod
        if(!PromisePiper.prod) {
          var newArgFunc = function(data){
            try{
              var newFunc = argFunc.call(this, data, that);
            } catch(e) {
              var parsed = parse(e);
              var rec = result._getRec();
              var msgObject = {
                pipeArgs:{
                  data: rec[rec.length - 1][0],
                  context: rec[rec.length - 1][1]
                },
                name: parsed[0].name,
                filepath: parsed[0].filepath,
                lineNumber: parsed[0].lineNumber,
                columnNumber: parsed[0].columnNumber,
                data: data,
                context: that,
                message: e.message,
                parsedStack: parsed,
                originalError: e,
                originalFunction: argFunc.toString()
              }
              console.error("PromisePipe Error: ");
              console.error(msgObject);
              Promise.reject(msgObject);
            }
            return newFunc;
          }
        } else {
          var newArgFunc = function(data){
            return argFunc.call(this, data, that);
          }
        }
        Object.keys(argFunc).reduce(function(funObj, key){
          funObj[key] = argFunc[key]
        }, newArgFunc); 
        return newArgFunc; 
      })
    }
  }
}

module.exports = PromisePiper;