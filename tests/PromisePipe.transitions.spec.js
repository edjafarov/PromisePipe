var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var expect = require('chai').expect;

describe('PromisePipe when comes to chains from other env', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn4 = sinon.stub();

	var trans = sinon.stub();

	PromisePipe.envTransition('client', 'server', trans);

	fn2._env = 'server';
	fn3._env = 'server';
	var finish = sinon.spy();


	fn1.withArgs(data1, context).returns(data1);
	trans.returns(data1);
	fn2.withArgs(data1).returns(data2);
	fn3.withArgs(data2).returns(data2);
	fn4.withArgs(data1, context).returns(data1);
	fn4.withArgs(data2, context).returns(data2);


	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	before(function(done){
		pipe(data1, context).then(finish);
		done()
	})
	it('should not call server chains', function(){
		sinon.assert.calledOnce(fn1);
		sinon.assert.calledOnce(trans);

		sinon.assert.notCalled(fn2);
		sinon.assert.notCalled(fn3)
		sinon.assert.calledOnce(fn4);
		sinon.assert.calledWith(fn4, data1);
		sinon.assert.calledWithExactly(finish, data1);
	})

})

describe('PromisePipe when comes to chains from other env', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn4 = sinon.stub();

	fn2._env = 'server';
	fn3._env = 'server';
	var finish = sinon.spy();

	fn1.withArgs(data1, context).returns(data1);
		fn2.withArgs(data1).returns(data2);
	fn3.withArgs(data2).returns(data2);
	fn4.withArgs(data1, context).returns(data1);
	fn4.withArgs(data2, context).returns(data2);


	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	describe('create transition message should create message consumable with execTransitionMessage', function(){
		before(function(done){
			PromisePipe.envTransition('client', 'server', function(message){
				var innerMsg = JSON.parse(JSON.stringify(message));
				PromisePipeServer.execTransitionMessage(innerMsg).then(function(data){
					var ininnerMsg = JSON.parse(JSON.stringify(innerMsg));
					ininnerMsg.data = data;
					PromisePipe.execTransitionMessage(ininnerMsg);
				});
				return PromisePipe.promiseMessage(message);
			});
			pipe(data1, context).then(finish);
			done();
		});
		it('transition should create a message and pass it to server side, complete chain should pass', function(){
			sinon.assert.calledOnce(fn2);
			sinon.assert.calledOnce(fn3);
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledOnce(fn4);
			sinon.assert.calledWith(fn4, data2);
			sinon.assert.calledWithExactly(finish, data2);
		});
	});
});


describe('PromisePipe when comes to chains from other env', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn4 = sinon.stub();
	var fn5 = sinon.stub();

	fn2._env = 'server';
	fn3._env = 'server';
	var finish = sinon.spy();

	fn1.withArgs(data1, context).returns(data1);
		fn2.withArgs(data1).returns(Promise.reject("failTest"));
	fn3.withArgs(data2).returns(data2);
	fn4.withArgs(data1, context).returns(data1);
	fn4.withArgs(data2, context).returns(data2);


	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.catch(fn5);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.catch(fn5);

	describe('should fail back to client', function(){
		before(function(done){
			PromisePipe.envTransition('client', 'server', function(message){
				var innerMsg = JSON.parse(JSON.stringify(message));
				PromisePipeServer.execTransitionMessage(innerMsg).then(function(data){
					var ininnerMsg = JSON.parse(JSON.stringify(innerMsg));
					ininnerMsg.data = data;
					PromisePipe.execTransitionMessage(ininnerMsg);
				})
				return PromisePipe.promiseMessage(message);
			})
			pipe(data1, context).then(finish);
			done()
		})
		it('transition should be caught by client"s catch', function(){
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledOnce(fn2);
			sinon.assert.notCalled(fn3)
			sinon.assert.notCalled(fn4);
			sinon.assert.calledOnce(fn5);
			sinon.assert.calledWith(fn5, 'failTest');
		})
	})
})


describe('PromisePipe (#24 bug test)', function(){

	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	var doOnServer = PromisePipe.in('server');
	PromisePipeServer.setEnv('server');
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();

	var fn4 = sinon.stub();


	var finish = sinon.spy();

	fn1.withArgs(data1).returns(data1);
	fn2.withArgs(data1).returns(data2);
	fn2.withArgs(data2).returns(data1);
	fn4.withArgs(data1).returns(data1);



	var pipe = PromisePipe()
			.then(doOnServer(fn1))
			.then(fn2)
			.then(doOnServer(fn2))
			.then(fn4);

	var pipeServer = PromisePipeServer()
			.then(doOnServer(fn1))
			.then(fn2)
			.then(doOnServer(fn2))
			.then(fn4);

	describe('create transition message should create message consumable with execTransitionMessage', function(){
		before(function(done){
			PromisePipe.envTransition('client', 'server', function(message){
				var innerMsg = JSON.parse(JSON.stringify(message));
				PromisePipeServer.execTransitionMessage(innerMsg).then(function(data){
					var ininnerMsg = JSON.parse(JSON.stringify(innerMsg));
					ininnerMsg.data = data;
					PromisePipe.execTransitionMessage(ininnerMsg);
				})
				return PromisePipe.promiseMessage(message);
			})
			pipe(data1, context).then(finish);
			done()
		})
		it('transition should create a message and pass it to server side, complete chain should pass', function(){
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledTwice(fn2);
			sinon.assert.calledOnce(fn4);
			sinon.assert.calledWith(fn4, data1);
			sinon.assert.calledWithExactly(finish, data1);
		})
	})
})


describe('PromisePipe', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn4 = sinon.stub();

	fn2._env = 'both';
	fn3._env = 'server';
	var finish = sinon.spy();

	fn1.withArgs(data1).returns(data1);
	fn2.withArgs(data1).returns(data2);
	fn3.withArgs(data2).returns(data2);
	fn4.withArgs(data1).returns(data1);
	fn4.withArgs(data2).returns(data2);


	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	describe('create transition message should create message consumable with execTransitionMessage', function(){
		before(function(done){
			PromisePipe.envTransition('client', 'server', function(message){
				var innerMsg = JSON.parse(JSON.stringify(message));
				PromisePipeServer.execTransitionMessage(innerMsg).then(function(data){
					var ininnerMsg = JSON.parse(JSON.stringify(innerMsg));
					ininnerMsg.data = data;
					PromisePipe.execTransitionMessage(ininnerMsg);
				});

				return PromisePipe.promiseMessage(message);
			})
			pipe(data1, context).then(finish);
			done()
		})
		it('transition should create a message and pass it to server side, complete chain should pass', function(){
			sinon.assert.calledTwice(fn2);
			sinon.assert.calledOnce(fn3)
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledOnce(fn4);
			sinon.assert.calledWith(fn4, data2);
			sinon.assert.calledWithExactly(finish, data2);
		})
	})
})

describe('inherit env', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	var context = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn4 = sinon.stub();

	fn2._env = 'inherit';
	fn3._env = 'server';
	var finish = sinon.spy();

	fn1.withArgs(data1).returns(data1);
	fn2.withArgs(data1).returns(data2);
	fn3.withArgs(data2).returns(data2);
	fn4.withArgs(data1).returns(data1);
	fn4.withArgs(data2).returns(data2);


	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4);

	describe('create transition message should create message consumable with execTransitionMessage', function(){
		before(function(done){
			PromisePipe.envTransition('client', 'server', function(message){
				var innerMsg = JSON.parse(JSON.stringify(message));
				PromisePipeServer.execTransitionMessage(innerMsg).then(function(data){
					var ininnerMsg = JSON.parse(JSON.stringify(innerMsg));
					ininnerMsg.data = data;
					PromisePipe.execTransitionMessage(ininnerMsg);
				});

				return PromisePipe.promiseMessage(message);
			});
			pipe(data1, context).then(finish);
			done();
		});
		it('transition should create a message and pass it to server side, complete chain should pass', function(){
			sinon.assert.calledOnce(fn2);
			sinon.assert.calledOnce(fn3);
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledOnce(fn4);
			sinon.assert.calledWith(fn4, data2);
			sinon.assert.calledWithExactly(finish, data2);
		});
	});
});
