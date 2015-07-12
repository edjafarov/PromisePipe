var PromisePipe = require('../../src/PromisePipe')();
PromisePipe.setMode('DEBUG');
var Promise = require('es6-promise').Promise;
var MongoPipeApi = require('mongo-pipe-api');

var mongodbUrl = 'localhost:27017/test';

//set up server

PromisePipe.setEnv('server');
ENV = 'SERVER';
mongodbUrl = process.env.MONGOHQ_URL || mongodbUrl;



PromisePipe.use('db', MongoPipeApi(mongodbUrl, ['items']), {_env:"server"});

PromisePipe.use('log', function(data, context){
  console.log(data)
  return data;
});

var forUser = function forUser(data, context){
  data = data || {};
  data.uid = context.session.id;
  return data;
}

var byId = function byId(data, context){
  return {
    _id: MongoPipeApi.ObjectId(data)
  };
};

var ensureItem = function(data){

  if(typeof(data) == 'object' && data.name) return Promise.resolve(data);
  return Promise.reject({data:data, message: "data is not promer object"});
}

var ensureId = function(data){
  if(typeof(data) == 'string' && data.length > 0) return Promise.resolve(data);
  return Promise.reject({data:data, message: "data is not proper string ID"});
}

var toggleModifyItem = function toggleModifyItem(data, context){
  return {
    query:{
      uid: context.session.id,
      _id:data[0]._id
    },
    update:{
      $set: {
        done: !data[0].done
      }
    }
  };
};

var toggleAllItems = function toggleAllItem(data, context){
  return [
    {
      uid: data.uid
    },
    {
      $set: {
        done: data.done
      }
    },
    {
      multi: true
    }
  ]
};

var byDoneTrue = function byDoneTrue(data, context){
  data.done = true;
  return data;
};




module.exports = {
  PromisePipe: PromisePipe,
  addItem: PromisePipe({name: 'addItem'})
    .then(ensureItem)
    .then(forUser)
    .db.insert.items(),
  getItems: PromisePipe({name: 'getItems'})
    .then(forUser)
    .db.find.items(),
  removeItem: PromisePipe({name: 'removeItem'})
    .then(ensureId)
    .then(byId)
    .then(forUser)
    .db.remove.items(),

  doneItem: PromisePipe({name: 'doneItem'})
    .then(ensureId)
    .then(byId)
    .then(forUser)
    .db.findOne.items()
    .then(toggleModifyItem)
    .db.findAndModify.items(),

  doneAllItems: PromisePipe({name: 'doneAllItems'})
    .then(forUser)
    .then(toggleAllItems)
    .db.update.items(),

  clearDoneItems: PromisePipe({name: 'clearDoneItems'})
    .then(forUser)
    .then(byDoneTrue)
    .log()
    .db.remove.items()
}
