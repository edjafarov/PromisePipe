var expect = require('chai').expect;
var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var expect = require('chai').expect;

describe('PromisePipe with 3 functions when called', function(){

  var hook;

  var PromisePipe = require('../src/PromisePipe')();

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
  //fn1.withArgs(data1, context).throws(data2);
  fn2.withArgs(data2, context).returns(data3);
  fn3.withArgs(data3, context).returns(data1);

  var pipe = PromisePipe()
      .then(function test(){
        return ff()
      })
      .then(fn2)
      .then(fn3)


  before(function(done){
    hook = captureStream(process.stdout);
    pipe(data1, context).then(finish);
    done()
  })

  it('should end with final function', function(){
    sinon.assert.notCalled(fn2);
    sinon.assert.notCalled(fn3);

    expect(/Failed inside test/.test(hook.captured())).to.be.ok;
    expect(/ReferenceError: ff is not defined/.test(hook.captured())).to.be.ok;
    expect(/PromisePipe.error.spec.js:/.test(hook.captured())).to.be.ok;
    hook.unhook();
  });
});

describe('PromisePipe with custom logger', function () {
  var hook;
  var logger = {
    log: sinon.stub(),
  };
  var PromisePipe = require('../src/PromisePipe')({
    logger: logger
  });
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
  //fn1.withArgs(data1, context).throws(data2);
  fn2.withArgs(data2, context).returns(data3);
  fn3.withArgs(data3, context).returns(data1);

  var pipe = PromisePipe()
    .then(function test(){
      return ff()
    })
    .then(fn2)
    .then(fn3);


  before(function(done){
    hook = captureStream(process.stdout);
    pipe(data1, context).then(finish);
    done()
  })

  after(function () {
    hook.unhook();
  });

  it('should end with final function', function(){
    sinon.assert.notCalled(fn2);
    sinon.assert.notCalled(fn3);

    expect(logger.log.callCount).to.be.eql(3);
    expect(/Failed inside test/.test(logger.log.firstCall.args[0])).to.be.ok;
    expect(/ReferenceError: ff is not defined/.test(logger.log.secondCall.args[0])).to.be.ok;
    expect(/PromisePipe.error.spec.js:/.test(logger.log.thirdCall.args[0])).to.be.ok;
    expect(hook.captured()).to.be.eql('');
  });

});


function captureStream(stream){
  var oldWrite = stream.write;
  var buf = '';
  stream.write = function(chunk, encoding, callback){

    buf += chunk.toString(); // chunk is a String or Buffer
    oldWrite.apply(stream, arguments);
  }

  return {
    unhook: function unhook(){
     stream.write = oldWrite;
    },
    captured: function(){
      return buf;
    }
  };
}
