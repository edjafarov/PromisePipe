
var EventEmitter = require('events').EventEmitter;

var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var expect = require('chai').expect;

describe('PromisePipe when comes to chains from other env', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	var PromisePipeWorker = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	PromisePipeWorker.setEnv('worker');

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


	fn1.withArgs(data1).returns(data1);
	fn2.withArgs(data1).returns(data1);
	fn3.withArgs(data1).returns(data1);
	fn4.withArgs(data1).returns(data1);
	fn5.withArgs(data1).returns(data1);


	var serverSocketMock = new EventEmitter();
	var clientSocketMock = new EventEmitter();
	var workerSocketMock = new EventEmitter();

	function sendToClient(message){
		clientSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToServer(message){
		serverSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToWorker(message){
		workerSocketMock.emit('message', JSON.stringify(message));
	}


	PromisePipe.envTransition('client', 'server', function(message){
		sendToServer(message);
	});

	PromisePipeServer.envTransition('server', 'worker', function(message){
		sendToWorker(message);
		//return PromisePipeServer.promiseMessage(message);
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

	workerSocketMock.on('message', function(message){
		message = JSON.parse(message);

		PromisePipeWorker.execTransitionMessage(message).then(function(data){
			message.data = data;
			sendToServer(message);
		});
	});

	fn2._env = 'server';
	fn3._env = 'worker';
	fn4._env = 'server';

	var finish = sinon.spy();

	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);


	var pipeWorker = PromisePipeWorker()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);

	before(function(done){
		pipe(data1, context).then(finish);
		done()
	})
	it('should not fail', function(){
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledOnce(fn2);
			sinon.assert.calledOnce(fn3);
			sinon.assert.calledOnce(fn4);
			sinon.assert.calledOnce(fn5);
			sinon.assert.calledWithExactly(finish, data1);
	})

	describe("server should also work fine", function(){
		before(function(done){
			pipeServer(data1, context1).then(finish);
			done()
		})
		it('should not fail', function(){
				sinon.assert.calledTwice(fn1);
				sinon.assert.calledTwice(fn2);
				sinon.assert.calledTwice(fn3);
				sinon.assert.calledTwice(fn4);
				sinon.assert.calledTwice(fn5);
				sinon.assert.calledWithExactly(finish, data1);
		})
	})
})


describe('PromisePipe when comes to chains from other env', function(){
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	var PromisePipeWorker = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	PromisePipeWorker.setEnv('worker');


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


	fn1.withArgs(data1).returns(data1);
	fn2.withArgs(data1).returns(data1);
	fn3.withArgs(data1).returns(data1);
	fn4.withArgs(data1).returns(data1);
	fn5.withArgs(data1).returns(data1);


	var serverSocketMock = new EventEmitter();
	var clientSocketMock = new EventEmitter();
	var workerSocketMock = new EventEmitter();

	function sendToClient(message){
		clientSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToServer(message){
		serverSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToWorker(message){
		workerSocketMock.emit('message', JSON.stringify(message));
	}


	PromisePipe.envTransition('client', 'server', function(message){
		sendToServer(message);
	});

	PromisePipeServer.envTransition('server', 'worker', function(message){
		sendToWorker(message);

		//return PromisePipeServer.promiseMessage(message);
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

	workerSocketMock.on('message', function(message){
		message = JSON.parse(message);

		PromisePipeWorker.execTransitionMessage(message).then(function(data){
			message.data = data;
			sendToServer(message);
		});
	});

	fn2._env = 'server';
	fn3._env = 'worker';
	fn4._env = 'worker';
	fn5._env = 'worker';

	var finish = sinon.spy();

	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);


	var pipeWorker = PromisePipeWorker()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);


	describe("should work if pseudo nested", function(){
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
				sinon.assert.calledWithExactly(finish, data1);
		})
	})

})


xdescribe('PromisePipe can find its way through complex nested transition #22', function(){
	/*
	It is more complicated than I thought
	the nested chain do not know about capabilities of outer chain
	thus some protocol is required that will predict behavior of execution
	and will build a path or something
	*/
	var PromisePipe = require('../src/PromisePipe')();
	var PromisePipeServer = require('../src/PromisePipe')();
	var PromisePipeWorker1 = require('../src/PromisePipe')();
	var PromisePipeWorker2 = require('../src/PromisePipe')();
	PromisePipeServer.setEnv('server');
	PromisePipeWorker1.setEnv('worker1');
	PromisePipeWorker2.setEnv('worker2');


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


	fn1.withArgs(data1).returns(data1);
	fn2.withArgs(data1).returns(data1);
	fn3.withArgs(data1).returns(data1);
	fn4.withArgs(data1).returns(data1);
	fn5.withArgs(data1).returns(data1);


	var serverSocketMock = new EventEmitter();
	var clientSocketMock = new EventEmitter();
	var worker1SocketMock = new EventEmitter();
	var worker2SocketMock = new EventEmitter();

	function sendToClient(message){
		clientSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToServer(message){
		serverSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToWorker1(message){
		worker1SocketMock.emit('message', JSON.stringify(message));
	}
	function sendToWorker2(message){
		worker2SocketMock.emit('message', JSON.stringify(message));
	}


	PromisePipe.envTransition('client', 'server', function(message){
		sendToServer(message);
	});

	PromisePipeServer.envTransition('server', 'worker1', function(message){
		sendToWorker1(message);
		//return PromisePipeServer.promiseMessage(message);
	});

	PromisePipeWorker1.envTransition('worker1', 'worker2', 'server');

	PromisePipeServer.envTransition('server', 'worker2', function(message){
		sendToWorker2(message);
		//return PromisePipeServer.promiseMessage(message);
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

	worker1SocketMock.on('message', function(message){
		message = JSON.parse(message);

		PromisePipeWorker1.execTransitionMessage(message).then(function(data){
			message.data = data;
			sendToServer(message);
		});
	});
	worker2SocketMock.on('message', function(message){
		message = JSON.parse(message);

		PromisePipeWorker2.execTransitionMessage(message).then(function(data){
			message.data = data;
			sendToServer(message);
		});
	});


	fn2._env = 'server';
	fn3._env = 'worker1';
	fn4._env = 'worker2';
	fn5._env = 'client';

	var finish = sinon.spy();

	var pipe = PromisePipe()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);


	var pipeWorker1 = PromisePipeWorker1()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);

	var pipeWorker2 = PromisePipeWorker2()
			.then(fn1)
			.then(fn2)
			.then(fn3)
			.then(fn4)
			.then(fn5);


	describe("should work if pseudo nested", function(){
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
				sinon.assert.calledWithExactly(finish, data1);
		})
	})

})
