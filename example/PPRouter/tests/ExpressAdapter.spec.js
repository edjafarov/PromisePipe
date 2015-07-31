var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var request = require('request');
var expect = require('chai').expect;

var ExpressAppAdapter = require('../adapters/ExpressAdapter');


function logit(name){
  return function log(data, context){
    console.log(name, data);
    return data;
  }
}
describe('Router should use adapter', function(){
  var PPRouter = require('../index')();
  var rootPosts = sinon.stub();
	var postsId = sinon.stub();
	var postsNew = sinon.stub();
  var rootItems = sinon.stub();
	var itemsId = sinon.stub();
	var itemsNew = sinon.stub();
  var root = sinon.stub();

  PPRouter(function(PPRouter){
    PPRouter('/posts', function(PPRouter){
      PPRouter('/:id').then(postsId).then(renderMock("MockID"))
    }).then(rootPosts).then(renderMock("MockPosts"))
  }).then(root).then(renderMock("MockRoot"))

  function renderMock(mock){
    return function render(){
      return mock;
    }
  }

  var express = require('express');
  var app = express();
  PPRouter.use(ExpressAppAdapter(app));

  var server;

  before(function(done){
    server = app.listen(1234, function(){
      done();
    });
  })
  describe('get /posts/123', function(){
    var responseBody;
    before(function(done){
      request.get("http://localhost:1234/posts/123", function(err, res, body){
        responseBody = body;
        done();
      })
    })
    it('handleURL is a promise that is resolved when all handlers fulfuled', function(){
      expect(responseBody).to.equal('MockRootMockPostsMockID');
      sinon.assert.calledOnce(rootPosts);
      sinon.assert.calledOnce(postsId);
      sinon.assert.calledOnce(root);
    })
  })

  after(function(){
    server.close();
  });
})


describe('Router should use adapter and work with components', function(){
  var PPRouter = require('../index')();
  var rootPosts = sinon.stub();
	var postsId = sinon.stub();
	var postsNew = sinon.stub();
  var rootItems = sinon.stub();
	var itemsId = sinon.stub();
	var itemsNew = sinon.stub();
  var root = sinon.stub();

  var componentID = sinon.stub();
  var componentPosts = sinon.stub();
  var componentRoot = sinon.stub();
  componentRoot.returns("RenderedMockRoot");
  componentPosts.returns("RenderedMockPosts");
  componentID.returns("RenderedMockID");
  
  PPRouter(function(PPRouter){
    PPRouter('/posts', function(PPRouter){
      PPRouter('/:id').component(componentID).then(postsId).then(renderMock("MockID"))
    }).component(componentPosts).then(rootPosts).then(renderMock("MockPosts"))
  }).component(componentRoot).then(root).then(renderMock("MockRoot"))

  function renderMock(mock){
    return function render(){
      return mock;
    }
  }

  var express = require('express');
  var app = express();
  PPRouter.use(ExpressAppAdapter(app));

  var server;

  before(function(done){
    server = app.listen(1234, function(){
      done();
    });
  })
  describe('get /posts/123', function(){
    var responseBody;
    before(function(done){
      request.get("http://localhost:1234/posts/123", function(err, res, body){
        responseBody = body;
        done();
      })
    })
    it('handleURL is a promise that is resolved when all handlers fulfuled', function(){
      expect(componentID.getCall(0).args[0]).to.have.property('data', 'MockID')
      expect(componentPosts.getCall(0).args[0].children[0]).to.equal('RenderedMockID')
      expect(componentPosts.getCall(0).args[0]).to.have.property('data', 'MockPosts')
      expect(componentRoot.getCall(0).args[0].children[0]).to.equal('RenderedMockPosts')
      expect(componentRoot.getCall(0).args[0]).to.have.property('data', 'MockRoot')
      expect(responseBody).to.equal('RenderedMockRoot');
      sinon.assert.calledOnce(rootPosts);
      sinon.assert.calledOnce(postsId);
      sinon.assert.calledOnce(root);
    })
    describe('get /posts/123 again', function(){
      var responseBody;
      before(function(done){
        request.get("http://localhost:1234/posts/123", function(err, res, body){
          responseBody = body;
          done();
        })
      })
      it('handleURL is a promise that is resolved when all handlers fulfuled', function(){
        sinon.assert.calledTwice(rootPosts);
        sinon.assert.calledTwice(postsId);
        sinon.assert.calledTwice(root);
        expect(componentID.getCall(1).args[0]).to.have.property('data', 'MockID')
        expect(componentPosts.getCall(1).args[0].children[0]).to.equal('RenderedMockID')
        expect(componentPosts.getCall(1).args[0]).to.have.property('data', 'MockPosts')
        expect(componentRoot.getCall(1).args[0].children[0]).to.equal('RenderedMockPosts')
        expect(componentRoot.getCall(1).args[0]).to.have.property('data', 'MockRoot')
        expect(responseBody).to.equal('RenderedMockRoot');
      })
    })
  })

  after(function(){
    server.close();
  });
})
