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
  var catchFn = sinon.stub();

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
			.then(fn4)
      .catch(catchFn);

	var pipeServer = PromisePipeServer()
			.then(fn1)
			.then(fn2)
			.then(fn3)
      .then(fn4)
      .catch(catchFn);

	describe('create transition message should create message consumable with execTransitionMessage', function(){
		before(function(done){
			PromisePipe.envTransition('client', 'server', function(message){
				var innerMsg = JSON.parse(JSON.stringify(message));
        innerMsg.chains = [innerMsg.chains[1],innerMsg.chains[1]];
				PromisePipeServer.execTransitionMessage(innerMsg).then(function(data){
					var ininnerMsg = JSON.parse(JSON.stringify(innerMsg));
					ininnerMsg.data = data;
					PromisePipe.execTransitionMessage(ininnerMsg);
				})
			})
			pipe(data1, context).then(finish);
			done()
		})
		it('should not allow omit execution of some chains', function(){
			sinon.assert.calledOnce(fn1);
			sinon.assert.calledOnce(catchFn);
      expect(catchFn.getCall(0).args[0]).to.have.property('error','Non-consistent pipe call, message is trying to omit chains')

		})
	})
})
