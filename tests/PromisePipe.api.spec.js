var sinon = require('sinon');
describe('PromisePipe when comes to chains from other env', function(){
	var EventEmitter = require('events').EventEmitter;
	var messageBus = new EventEmitter();

	var PromisePipeServer = require('../src/PromisePipe')();
	var PromisePipeClient = require('../src/PromisePipe')();

	var context = {};
	var data1 = 1;
	var data2 = 2;

	var fn1 = sinon.stub();
	var fn2 = sinon.stub();
	var fn3 = sinon.stub();
	var fn4 = sinon.stub();
	var fn5 = sinon.stub();

	var final1 = sinon.stub();
	var final2 = sinon.stub();

	fn1.withArgs(data1).returns(data2);
	fn2.withArgs(data2).returns(data1);
	fn3.withArgs(data1).returns(data2);
	fn4.withArgs(data2).returns(data1);
	fn5.withArgs(data1).returns(data2);

	PromisePipeServer({name: "MockName1"}).then(fn1)
	PromisePipeServer({name: "MockName2"}).then(fn4)

	var mockServerApi = {
		listen:function(handler){
			messageBus.on('send-to-api', handler);
		},send:function(message){
			messageBus.emit('send-back', message);
		}
	}

	var api = PromisePipeServer.api.provide(mockServerApi);

	var mockClientApi = {
		listen:function(handler){
			messageBus.on('send-back', handler);
		},
		send:function(message){
			messageBus.emit('send-to-api', message);
		}
	}

	var PromieSRC = require('fs').readFileSync("node_modules/es6-promise/dist/es6-promise.js").toString();

	var PromiseInject = "var PromiseObj = {};var module,define;(function(){\n" + PromieSRC + "}).bind(PromiseObj)();var Promise = PromiseObj.ES6Promise.Promise;\n"

	PromisePipeClient.use('remoteApi', new Function('connector', PromiseInject + "return " + api)()(mockClientApi));

	var test1 = PromisePipeClient().remoteApi.MockName1().then(fn2)
	var test2 = PromisePipeClient().then(fn3).remoteApi.MockName2().then(fn5)

	before(function(done){
		test1(data1).then(final1);
		test2(data1).then(final2);
		done()
	})
	it('should pass first chain and call MockName1() from PromisePipeServer',function(){
		sinon.assert.calledOnce(fn1);
		sinon.assert.calledOnce(fn2);
		sinon.assert.calledWithExactly(final1, data1);
	})

	xit('should pass second chain and call MockName2() from PromisePipeServer',function(){
		sinon.assert.calledOnce(fn3);
		sinon.assert.calledOnce(fn4);
		sinon.assert.calledOnce(fn5);
		sinon.assert.calledWithExactly(final2, data2);
	})

})
