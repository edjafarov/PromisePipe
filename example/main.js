var PromisePipe = require('./PromisePipe');

var ENV = 'CLIENT';
//set up server
if(typeof(window) !== 'object'){
 PromisePipe.setEnv('server');
 ENV = 'SERVER';
}



module.exports = PromisePipe()
	.then(prepare)
	.then(plus(5))
	.then(minus(6))
	.then(doOnServer(multipy(2)))
	.then(doOnServer(pow(3)))
	.then(doOnServer(plus(2)))
	.then(plus(2));


	function doOnServer(fn){
		fn._env = 'server';
		return fn
	}

	
	function prepare(data, context){
		if(!context.stack) context.stack = [];
		return data;

	}

	function plus(a){
		return function(data, context){
			console.log("PLUS on " + ENV, data+a, context);
			context.stack.push("PLUS on " + ENV);
			return data + a;
		}
	}

	function minus(a){
		return function(data, context){
			console.log("MINUS on " + ENV, data - a, context);
			context.stack.push("MINUS on " + ENV);
			return data - a;
		}
	}	
	function multipy(a){
		return function(data, context){
			console.log("MULTIPLY on " + ENV,data * a, context);
			context.stack.push("MULTIPLY on " + ENV);
			return data * a;
		}
	}	
	function pow(a){
		return function(data, context){
			console.log("POW on " + ENV,Math.pow(data, a), context);
			context.stack.push("POW on " + ENV);
			return Math.pow(data, a);
		}
	}	