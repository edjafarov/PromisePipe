var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
var request = require('request');
var expect = require('chai').expect;

function ExpressAppAdapter(app){
  var adapter = {
    //renderData is a hash of data, params, and component
    // per resolved part of url
    renderer: function(renderData){
      var renderArr = Object.keys(renderData).map(function(mask){
        return {
          mask: mask,
          component: renderData[mask].component,
          params: renderData[mask].params,
          data: renderData[mask].data
        }
      })
      function renderComp(renderArr){
        var partial = renderArr.shift();

        if(renderArr.length > 0) partial.params.children = [renderComp(renderArr)];
        partial.params.mask = partial.mask;
        partial.params.data = partial.data;

        if(!partial.component) {
          var result = partial.data || '';
          if(partial.params.children && partial.params.children[0]) result +=partial.params.children[0];
          return result;
        }

        return partial.component(partial.params)

      }
      return renderComp(renderArr);
    }
  };
  app.use(function(req, res, next){
    var context = {test:"TEST"};
    if(req.method=='GET'){
      var handle = adapter.handleURL(req.originalUrl);
      handle.then(function(data){
        res.send(adapter.renderer(handle.renderData) || "");
        res.end();
      });
      return;
    }
    next();
  })

  return adapter;
}
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
