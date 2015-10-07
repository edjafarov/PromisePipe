var EventEmitter = require('events').EventEmitter;

var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var expect = require('chai').expect;



describe('PromisePipe when comes to chains from other env', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();

	PromisePipeServer.setEnv('server');

	var context = {};
	var context1 = {};
	var context2 = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn4 = sinon.stub();
	var fn5 = sinon.stub();


	fn1.withArgs(data1).returns(data2);
	fn2.withArgs(data2).returns(data1);
	fn3.withArgs(data1).returns(data2);
	fn4.withArgs(data2).returns(data1);
	fn5.withArgs(data1).returns(data2);

	var cache = {};
	var cacher = function(data, context, result){
		if(!cache['id:' + data]){
			cache['id:' + data] = result;
		} else {
			return cache['id:' + data];
		}
	}

	var serverSocketMock = new EventEmitter();
	var clientSocketMock = new EventEmitter();


	function sendToClient(message){
		clientSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToServer(message){
		serverSocketMock.emit('message', JSON.stringify(message));
	}


	PromisePipe.envTransition('client', 'server', function(message){
		sendToServer(message);
		return PromisePipe.promiseMessage(message);
	});

	clientSocketMock.on('message', function(message){
		message = JSON.parse(message);
		PromisePipe.execTransitionMessage(message);
	});

	serverSocketMock.on('message', function(message){
		message = JSON.parse(message);
		PromisePipeServer.execTransitionMessage(message).then(function(data){
			message.data = data;
			sendToClient(message);
		});
	});



	fn2._env = 'server';
	fn3._env = 'server';
	fn4._env = 'server';


	var finish = sinon.spy();

	var pipe = PromisePipe()
			.then(fn1)
			.cache(cacher)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.cache(cacher)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);


	describe("should work and cached, pass all chains", function(){
		before(function(done){
			pipe(data1, context2).then(finish);
			done()
		})
		it('should not fail', function(){
				sinon.assert.calledOnce(fn1);
				sinon.assert.calledOnce(fn2);
				sinon.assert.calledOnce(fn3);
				sinon.assert.calledOnce(fn4);
				sinon.assert.calledOnce(fn5);
				sinon.assert.calledOnce(finish);
				sinon.assert.calledWithExactly(finish, data2);
		})
		describe("should work and cached, return server result from cache", function(){
			before(function(done){
				pipe(data1, context2).then(finish);
				done()
			})
			it('should not fail', function(){
					sinon.assert.calledTwice(fn1);
					sinon.assert.calledOnce(fn2);
					sinon.assert.calledOnce(fn3);
					sinon.assert.calledOnce(fn4);
					sinon.assert.calledTwice(fn5);
					sinon.assert.calledTwice(finish);
					sinon.assert.calledWithExactly(finish, data2);
			})
		})
	})

})


describe('PromisePipe when are server chains cached', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();

	PromisePipeServer.setEnv('server');

	var context = {};
	var context1 = {};
	var context2 = {};
	var data1 = 1;
	var data2 = 2;
	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn3f = function(data, context){
		return new Promise(function(resolve, reject){
			setTimeout(function(){
				resolve(fn3(data, context))
			}, 50);
		})
	}
	var fn4 = sinon.stub();
	var fn5 = sinon.stub();


	fn1.withArgs(data1).returns(data2);
	fn2.withArgs(data2).returns(data1);
	fn3.withArgs(data1).returns(data2);
	fn4.withArgs(data2).returns(data1);
	fn5.withArgs(data1).returns(data2);

	var cache = {};
	var cacher = function(data, context, result){
		if(!cache['id:' + data]){
			cache['id:' + data] = result;
		} else {
			return cache['id:' + data];
		}

	}

	var serverSocketMock = new EventEmitter();
	var clientSocketMock = new EventEmitter();


	function sendToClient(message){
		clientSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToServer(message){
		serverSocketMock.emit('message', JSON.stringify(message));
	}


	PromisePipe.envTransition('client', 'server', function(message){
		sendToServer(message);
		return PromisePipe.promiseMessage(message);
	});

	clientSocketMock.on('message', function(message){
		message = JSON.parse(message);
		PromisePipe.execTransitionMessage(message);
	});

	serverSocketMock.on('message', function(message){
		message = JSON.parse(message);
		PromisePipeServer.execTransitionMessage(message).then(function(data){
			message.data = data;
			sendToClient(message);
		});
	});



	fn2._env = 'server';
	fn3f._env = 'server';
	fn4._env = 'server';


	var finish = sinon.spy();

	var pipe = PromisePipe()
			.then(fn1)
			.cache(cacher)
			.then(fn2)
			.then(fn3f)
			.then(fn4)
			.then(fn5);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.cache(cacher)
			.then(fn2)
			.then(fn3f)
			.then(fn4)
			.then(fn5);


	describe("and run pipe twice in parralel", function(){
		before(function(done){
			pipe(data1, context2).then(finish);
			pipe(data1, context2).then(finish).then(function(){done()});
		})
		it('should pass server chains only once', function(){
				sinon.assert.calledTwice(fn1);
				sinon.assert.calledOnce(fn2);
				sinon.assert.calledOnce(fn3);
				sinon.assert.calledOnce(fn4);
				sinon.assert.calledTwice(fn5);
				sinon.assert.calledTwice(finish);
				sinon.assert.calledWithExactly(finish, data2);
		})
	})
})
