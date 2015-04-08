var PromisePipe = require('./PromisePipe');

var ENV = 'CLIENT';
//set up server
if(typeof(window) !== 'object'){
 PromisePipe.setEnv('server');
 ENV = 'SERVER';
}



module.exports = PromisePipe()
	.then(plus(5))
	.then(minus(6))
	.then(doOnServer(multipy(2)))
	.then(doOnServer(pow(3)))
	.then(doOnServer(plus(2)))
	.then(doOnServer(plus(2)));


	function doOnServer(fn){
		fn._env = 'server';
		return fn
	}

	function plus(a){
		return function(data){
			console.log("PLUS on " + ENV, data+a);
			return data + a;
		}
	}

	function minus(a){
		return function(data){
			console.log("MINUS on " + ENV, data - a);
			return data - a;
		}
	}	
	function multipy(a){
		return function(data){
			console.log("MULTIPLY on " + ENV,data * a);
			return data * a;
		}
	}	
	function pow(a){
		return function(data){
			console.log("POW on " + ENV,Math.pow(data, a));
			return Math.pow(data, a);
		}
	}	