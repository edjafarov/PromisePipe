var sinon = require('sinon');
var Promise = require('es6-promise').Promise;
describe('Router', function(){
  var PPRouter = require('../index')();
  var root = sinon.stub();
  var rootPosts = sinon.stub();
	var postsId = sinon.stub();
	var postsNew = sinon.stub();
  var rootItems = sinon.stub();
	var itemsId = sinon.stub();
	var itemsNew = sinon.stub();

  PPRouter(function(PPRouter){
    PPRouter('/posts', function(PPRouter){
      PPRouter('/:id').then(postsId)
      PPRouter('/new').then(postsNew)
    }).then(rootPosts)
    PPRouter('items', function(PPRouter){
      PPRouter('/:id').then(itemsId)
      PPRouter('/new').then(itemsNew)
    }).then(rootItems)
  }).then(root)

  describe('with url /posts', function(){
    before(function(done){
      PPRouter.router.handleURL("/posts");
      done();
    })
    it('should trigger rootPosts chain', function(){
      sinon.assert.calledOnce(root);
      sinon.assert.calledOnce(rootPosts);
      sinon.assert.notCalled(postsId)
      sinon.assert.notCalled(postsNew)
    })

    describe('with url /posts/123', function(){
      before(function(done){
        PPRouter.router.handleURL("/posts/123");
        done();
      })
      it('should trigger postsId chain', function(){
        sinon.assert.calledOnce(rootPosts);
        sinon.assert.calledOnce(postsId);
        sinon.assert.notCalled(postsNew)
      })
      describe('with url /posts/new', function(){
        before(function(done){
          PPRouter.router.handleURL("/posts/new");
          done();
        })
        it('should trigger postsNew chain', function(){
          sinon.assert.calledOnce(rootPosts);
          sinon.assert.calledOnce(postsId);
          sinon.assert.calledOnce(postsNew);
        })
        describe('with url /items/new', function(){
          before(function(done){
            PPRouter.router.handleURL("/items/new");
            done();
          })
          it('should trigger postsNew chain', function(){
            sinon.assert.calledOnce(rootPosts);
            sinon.assert.calledOnce(postsId);
            sinon.assert.calledOnce(postsNew);
            sinon.assert.calledOnce(rootItems);
            sinon.assert.notCalled(itemsId);
            sinon.assert.calledOnce(itemsNew);
          })
        })
      })
    })
  })
})


describe('Router', function(){
  var PPRouter = require('../index')();
  var rootPosts = sinon.stub();
	var postsId = sinon.stub();
	var postsNew = sinon.stub();
  var rootItems = sinon.stub();
	var itemsId = sinon.stub();
	var itemsNew = sinon.stub();

  function delayFor(timeout){
    return function delay(){
      return new Promise(function(resolve, reject){
        setTimeout(resolve, timeout);
      })
    }
  }
  function log(text){
    return function(data){
      console.log(text);
      return data;
    }
  }

  PPRouter(function(PPRouter){
    PPRouter('/posts', function(PPRouter){
      PPRouter('/:id').then(delayFor(40)).then(postsId)
    }).then(delayFor(50)).then(rootPosts)
  })
  before(function(done){
    PPRouter.router.handleURL("/posts/123").then(function(){
      done()
    });
  })
  it('handleURL is a promise that is resolved when all handlers fulfuled', function(){
    sinon.assert.calledOnce(rootPosts);
    sinon.assert.calledOnce(postsId);
  })
})



describe('Router', function(){
  var PPRouter = require('../index')();
  var root = sinon.stub();
  var rootPosts = sinon.stub();
	var postsId = sinon.stub();
	var postsNew = sinon.stub();
  var rootItems = sinon.stub();
	var itemsId = sinon.stub();
	var itemsNew = sinon.stub();

  PPRouter(function(PPRouter){

    PPRouter('posts', function(PPRouter){
      PPRouter(':id').then(postsId)
      PPRouter('new').then(postsNew)
    }).then(rootPosts)
    PPRouter('items', function(PPRouter){
      PPRouter(':id').then(itemsId)
      PPRouter('new').then(itemsNew)
    }).then(rootItems)
  }).then(root)

  describe('with url /', function(){
    before(function(done){
      PPRouter.router.handleURL("/");
      done();
    })
    it('should trigger rootPosts chain', function(){
      sinon.assert.calledOnce(root);
      sinon.assert.notCalled(rootPosts);
      sinon.assert.notCalled(postsId);
      sinon.assert.notCalled(postsNew);
      sinon.assert.notCalled(rootItems);
      sinon.assert.notCalled(itemsId);
      sinon.assert.notCalled(itemsNew);
    })
    describe('with url /posts', function(){
      before(function(done){
        PPRouter.router.handleURL("/posts");
        done();
      })
      it('should trigger rootPosts chain', function(){
        sinon.assert.calledOnce(root);
        sinon.assert.calledOnce(rootPosts);
        sinon.assert.notCalled(postsId);
        sinon.assert.notCalled(postsNew);
        sinon.assert.notCalled(rootItems);
        sinon.assert.notCalled(itemsId);
        sinon.assert.notCalled(itemsNew);
      })
      describe('with url /', function(){
        before(function(done){
          PPRouter.router.handleURL("/");
          done();
        })
        it('should trigger rootPosts chain', function(){
          sinon.assert.calledOnce(root);
          sinon.assert.calledOnce(rootPosts);
          sinon.assert.notCalled(postsId);
          sinon.assert.notCalled(postsNew);
          sinon.assert.notCalled(rootItems);
          sinon.assert.notCalled(itemsId);
          sinon.assert.notCalled(itemsNew);
        })
      })
    })
  })
})
