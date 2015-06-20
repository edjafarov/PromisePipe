var PromisePipe = require('../../src/PromisePipe')();
PromisePipe.setMode("DEBUG");
var Promise = require('es6-promise').Promise;
var ENV = 'CLIENT';
//set up server
if(typeof(window) !== 'object'){
 PromisePipe.setEnv('server');
 ENV = 'SERVER';
}


//((2+5+6+10)*2)^3-2-6 = 10640
module.exports = PromisePipe()
	.then(plus(5))
	.then(minus(6))
	.then(doOnServer(plus(10)))
	.then(doOnServer(multipy(2)))
	.then(pow(3))
	.then(doOnServer(minus(2)))
	.then(minus(6))

  module.exports.PromisePipe = PromisePipe;


	function plus(a){
		return function(data, context){
			return doAsyncStuff("add "+a+" to "+data, function(){
				return data + a;
			})
		}
	}

	function minus(a){
		return function(data, context){
			return doAsyncStuff("subtract "+a+" of "+data, function(){
				return data - a;
			});
		}
	}





	function doOnServer(fn){
		fn._env = 'server';
		return fn
	}


	function prepare(data, context){
		if(!context.stack) context.stack = [];
		return data;

	}



	function multipy(a){
		return function(data, context){
			return doAsyncStuff("multipy "+data+" by "+a, function(){
				return data * a;
			});
		}
	}
	function pow(a){
		return function(data, context){
			return doAsyncStuff("power "+data+" by "+a, function(){
				return Math.pow(data, a);
			});
		}
	}

	function doAsyncStuff(text, fn){
		console.log(text);
		return new Promise(function(res, rej){
			var result = fn.call(null);

			setTimeout(function(){
				console.log("=", result);
				res(result);
			}, 1000);
		})
	}
