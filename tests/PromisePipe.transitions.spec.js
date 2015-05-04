var PromisePipe = require('../src/PromisePipe')();
var PromisePipeServer = require('../src/PromisePipe')();
PromisePipeServer.env = 'server';
var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var expect = require('chai').expect;

describe('PromisePipe when comes to chains from other env', function(){
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
		it('transition should create a message', function(){
			sinon.assert.calledOnce(fn2);
			sinon.assert.calledOnce(fn3)
			sinon.assert.calledTwice(fn1);
			sinon.assert.calledTwice(fn4);
			sinon.assert.calledWith(fn4, data2);
			sinon.assert.calledWithExactly(finish, data2);
		})
	})
})
