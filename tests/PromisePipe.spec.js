var PromisePipe = require('../src/PromisePipe')();
var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var expect = require('chai').expect;

describe('PromisePipe with 3 functions when called', function(){
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var data3 = 3;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var finish = sinon.spy();
	var finish1 = sinon.spy();
	//if runninng with data1
	fn1.withArgs(data1, context).returns(data2);
	fn2.withArgs(data2, context).returns(data3);
	fn3.withArgs(data3, context).returns(data1);
	//if runninng with data2
	fn1.withArgs(data2, context).returns(data3);
	fn2.withArgs(data3, context).returns(data1);
	fn3.withArgs(data1, context).returns(data2);	
	var pipe = PromisePipe()		
			.then(fn1)
			.then(fn2)
			.then(fn3);
	
	before(function(done){
		pipe(data1, context).then(finish);
		done()
	})
	it('should pass first function', function(){
		sinon.assert.calledOnce(fn1);
		sinon.assert.calledWithExactly(fn1, data1, context);
	});
	it('should pass second function', function(){
		sinon.assert.calledOnce(fn2);
		sinon.assert.calledWithExactly(fn2, data2, context);
	})
	it('should pass third function', function(){
		sinon.assert.calledOnce(fn3);
		sinon.assert.calledWithExactly(fn3, data3, context);
	});
	it('should end with final function', function(){
		sinon.assert.calledOnce(finish);
		sinon.assert.calledWithExactly(finish, data1);
	});

	describe('the pipe it should be reusable, when calling it again', function(){
		before(function(done){
			pipe(data2, context).then(finish1);
			done()
		})
		it('should pass a chain once again and all functions called again', function(){
			sinon.assert.calledTwice(fn1);
			sinon.assert.calledTwice(fn2);
			sinon.assert.calledTwice(fn3);
			sinon.assert.calledWithExactly(fn1, data2, context);
			sinon.assert.calledWithExactly(fn2, data3, context);
			sinon.assert.calledWithExactly(fn3, data1, context);
		})			
		it('should pass its own finish1 function', function(){
			sinon.assert.calledOnce(finish);
			sinon.assert.calledOnce(finish1);
			sinon.assert.calledWithExactly(finish1, data2);
		})
	})

});


describe('PromisePipe error handling', function(){
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var data3 = 3;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var finish = sinon.spy();
	//if runninng with data1
	fn1.withArgs(data1, context).returns(data2);
	fn2.withArgs(data2, context).returns(data3);
	fn3.withArgs(data3, context).returns(data1);

	var pipe = PromisePipe()		
			.then(function(data, context){
				return new Promise(function(resolve, reject){
					process.nextTick(function(){
						reject(fn1(data, context));
					});
				})
			})
			.then(function(data, context){
				return new Promise(function(resolve, reject){
					process.nextTick(function(){
						resolve(fn2(data, context));
					});
				})
			})
			.catch(fn3);
	
	before(function(done){
		pipe(data1, context).then(finish);
		done()
	})

	it('should not call fn2 after fn1 rejected', function(){
		sinon.assert.notCalled(fn2);
	})

	it('should go fn1, rejected and get to fn3 rightaway to handle error with catch', function(){
		sinon.assert.calledOnce(fn1);
		sinon.assert.calledWithExactly(fn1, data1, context);
		
		sinon.assert.calledOnce(fn3);
		sinon.assert.calledWithExactly(fn3, data2, context);
		
		sinon.assert.calledOnce(finish);
		sinon.assert.calledWithExactly(finish, undefined);

	});


});

describe('PromisePipe with 3 functions if running async', function(){
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var data3 = 3;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var finish = sinon.spy();
	var finish1 = sinon.spy();
	//if runninng with data1
	fn1.withArgs(data1, context).returns(data2);
	fn2.withArgs(data2, context).returns(data3);
	fn3.withArgs(data3, context).returns(data1);
	//if runninng with data2
	fn1.withArgs(data2, context).returns(data3);
	fn2.withArgs(data3, context).returns(data1);
	fn3.withArgs(data1, context).returns(data2);	
	var pipe = PromisePipe()		
			.then(function(data, context){
				return new Promise(function(resolve, reject){
					process.nextTick(function(){
						resolve(fn1(data, context));
					});
				})
			})
			.then(function(data, context){
				return new Promise(function(resolve, reject){
					process.nextTick(function(){
						resolve(fn2(data, context));
					});
				})
			})
			.then(function(data, context){
				return new Promise(function(resolve, reject){
					process.nextTick(function(){
						resolve(fn3(data, context));
					});
				})
			});
	
	before(function(done){
		pipe(data1, context).then(finish);
		done()
	})
	it('should pass a chain of items once', function(){
		sinon.assert.calledOnce(fn1);
		sinon.assert.calledWithExactly(fn1, data1, context);
		sinon.assert.calledOnce(fn2);
		sinon.assert.calledWithExactly(fn2, data2, context);
		sinon.assert.calledOnce(fn3);
		sinon.assert.calledWithExactly(fn3, data3, context);
		sinon.assert.calledOnce(finish);
		sinon.assert.calledWithExactly(finish, data1);
	});


});

describe('PromisePipe', function(){
	var pipe = PromisePipe();
	var pipe1 = PromisePipe();
	var pipe2;
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var data3 = 3;
	var data4 = 4;
	var data5 = 5;

	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var finish = sinon.spy();
	
	fn1.withArgs(data1, context).returns(data2);
	fn2.withArgs(data2, context).returns(data3);		

	it('should return a promise', function(){
		expect(pipe()).to.be.an.instanceof(Promise);
	})

	describe('can be joined with other pipe', function(){

		before(function(){
			pipe.then(fn1)
			pipe1.then(fn2)
			pipe2 = pipe.join(pipe1);
			pipe2(data1, context).then(finish);
		})

		it('should pass all functions', function(){
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledWithExactly(fn1, data1, context);
			sinon.assert.calledOnce(fn2);
			sinon.assert.calledWithExactly(fn2, data2, context);
		})
	})

	describe('can be extended with methods', function(){
		var fn1 = sinon.stub();
		var fn2 = sinon.stub();
		var finish = sinon.spy();
		var fn3 = sinon.stub();		
		fn1.withArgs(data1, context).returns(data2);
		fn2.withArgs(data2, context).returns(data3);
		fn3.withArgs(data2, context, data4).returns(data3);		

		PromisePipe.use('mockMethod', fn3);
		var customPipe = PromisePipe()
			.then(fn1)
			.mockMethod(data4)
			.then(fn2)

		before(function(){
			customPipe(data1, context).then(finish);
		})
		it('should pass functions', function(){
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledWithExactly(fn1, data1, context);
			sinon.assert.calledOnce(fn3);
			sinon.assert.calledWithExactly(fn3, data2, context, data4);
			sinon.assert.calledOnce(fn2);
			sinon.assert.calledWithExactly(fn2, data3, context);
		})
	})
	describe('can be extended with hash of methods', function(){
		var fn1 = sinon.stub();
		var fn2 = sinon.stub();
		var finish = sinon.spy();
		var fn3 = sinon.stub();		
		var inner1 = sinon.stub();
		var inner2 = sinon.stub();
		var inner3 = sinon.stub();

		fn1.withArgs(data1, context).returns(data2);
		fn2.withArgs(data2, context).returns(data3);
		inner1.withArgs(data2, context, data4).returns(data2);
		inner2.withArgs(data2, context, data5).returns(data2);
		inner3.withArgs(data2, context, data1).returns(data2);

		PromisePipe.use('withMethod', {
			method1: inner1,
			method2: inner2,
			method3: {
				innerMethod1: inner3
			}
		});

		var customPipe1 = PromisePipe()
			.then(fn1)
			.withMethod.method1(data4)
			.then(fn2)
		
		var customPipe2 = PromisePipe()
			.then(fn1)
			.withMethod.method2(data5)
			.then(fn2)	

		var customPipe3 = PromisePipe()
			.then(fn1)
			.withMethod.method3.innerMethod1(data1)
			.then(fn2)					

		before(function(){
			customPipe1(data1, context).then(finish);
			customPipe2(data1, context).then(finish);
			customPipe3(data1, context).then(finish);
		})

		it('should pass functions', function(){
			sinon.assert.calledThrice(fn1);
			sinon.assert.calledWithExactly(fn1, data1, context);
			sinon.assert.calledOnce(inner1);
			sinon.assert.calledWithExactly(inner1, data2, context, data4);
			sinon.assert.calledOnce(inner2);
			sinon.assert.calledWithExactly(inner2, data2, context, data5);
			sinon.assert.calledOnce(inner3);
			sinon.assert.calledWithExactly(inner3, data2, context, data1);			
			sinon.assert.calledThrice(fn2);
			sinon.assert.calledWithExactly(fn2, data2, context);
		})
	})	
})


describe('PromisePipe composition 2 functions, and 2nd will be separate PromisPipe', function(){
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var data3 = 3;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var finish = sinon.spy();
	var finish1 = sinon.spy();
	//if runninng with data1
	fn1.withArgs(data1, context).returns(data2);
	fn2.withArgs(data2, context).returns(data3);
	fn3.withArgs(data3, context).returns(data1);
	//if runninng with data2
	fn1.withArgs(data2, context).returns(data3);
	fn2.withArgs(data3, context).returns(data1);
	fn3.withArgs(data1, context).returns(data2);	
	var innerPipe = PromisePipe()		
			.then(fn2)
	var pipe = PromisePipe()		
			.then(fn1)
			.then(innerPipe)
			.then(fn3);
	
	before(function(done){
		pipe(data1, context).then(finish);
		done()
	})
	it('should pass a chain of items once', function(){
		sinon.assert.calledOnce(fn1);
		sinon.assert.calledWithExactly(fn1, data1, context);
		sinon.assert.calledOnce(fn2);
		sinon.assert.calledWithExactly(fn2, data2, context);
		sinon.assert.calledOnce(fn3);
		sinon.assert.calledWithExactly(fn3, data3, context);
		sinon.assert.calledOnce(finish);
		sinon.assert.calledWithExactly(finish, data1);
	});

	describe('the pipe it should be reusable, when calling it again', function(){
		before(function(done){
			pipe(data2, context).then(finish1);
			done()
		})
		it('should pass a chain once again and all functions called again', function(){
			sinon.assert.calledTwice(fn1);
			sinon.assert.calledTwice(fn2);
			sinon.assert.calledTwice(fn3);
			sinon.assert.calledOnce(finish);
			sinon.assert.calledOnce(finish1);
			sinon.assert.calledWithExactly(fn1, data2, context);
			sinon.assert.calledWithExactly(fn2, data3, context);
			sinon.assert.calledWithExactly(fn3, data1, context);
			sinon.assert.calledWithExactly(finish1, data2);
		})
	})
});
/*
TODO: test errohandling
*/
