var PromisePipe = require('../src/PromisePipe')();
PromisePipe.setMode('DEBUG');
var PromisePipeServer = require('../src/PromisePipe')();
PromisePipeServer.setMode('DEBUG');
var expect = require('chai').expect;
PromisePipeServer.env = 'server';


var EventEmitter = require('events').EventEmitter;

var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var expect = require('chai').expect;

describe('PromisePipe when comes to chains from other env', function(){
	var context = {outerContext: true};
	var context1 = {innerContext:true};
	var data1 = 1;

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


	function sendToClient(message){
		clientSocketMock.emit('message', JSON.stringify(message));
	}

	function sendToServer(message){
		serverSocketMock.emit('message', JSON.stringify(message));
	}


	PromisePipe.envTransition('client', 'server', function(message){
		sendToServer(message);
	});



	clientSocketMock.on('message', function(message){
		message = JSON.parse(message);
		PromisePipe.execTransitionMessage(message);
	});

	serverSocketMock.on('message', function(message){
		message = JSON.parse(message);
		PromisePipeServer.localContext(context1).execTransitionMessage(message).then(function(data){
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


	before(function(done){
		pipe(data1, context).then(finish);
		done()
	})
	it('the context1 should be isolated inside server', function(){
			sinon.assert.calledOnce(fn1);
			expect(fn1.getCall(0).args[1]).to.have.property('outerContext', true);
			expect(fn1.getCall(0).args[1]).to.not.have.property('innerContext');
			sinon.assert.calledOnce(fn2);
			expect(fn2.getCall(0).args[1]).to.have.property('outerContext', true);
			expect(fn2.getCall(0).args[1]).to.have.property('innerContext', true);
			sinon.assert.calledOnce(fn3);
			sinon.assert.calledOnce(fn4);
			expect(fn4.getCall(0).args[1]).to.have.property('outerContext', true);
			expect(fn4.getCall(0).args[1]).to.have.property('innerContext', true);
			sinon.assert.calledOnce(fn5);
			expect(fn5.getCall(0).args[1]).to.have.property('outerContext', true);
			expect(fn5.getCall(0).args[1]).to.not.have.property('innerContext');

			sinon.assert.calledWithExactly(finish, data1);
	})

})
