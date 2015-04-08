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
	.then(multipy(2))
	.then(pow(3))
	.then(plus(2));


	function plus(a){
		return function(data){
			console.log("PLUS on " + ENV);
			return data + a;
		}
	}

	function minus(a){
		return function(data){
			console.log("MINUS on " + ENV);
			return data - a;
		}
	}	
	function multipy(a){
		var result = function(data){
			console.log("MULTIPLY on " + ENV);
			return data * a;
		}
		result._env = "server";
		return result;
	}	
	function pow(a){
		var result = function(data){
			console.log("POW on " + ENV);
			return Math.pow(data, a);
		}
		result._env = "server";
		return result;
	}	