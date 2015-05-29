var PromisePipe = require('promise-pipe')();
var Promise = require('es6-promise').Promise;
var MongoPipeApi = require('mongo-pipe-api');

var mongodbUrl = 'localhost:27017/test';

var ENV = 'CLIENT';
//set up server
if(typeof(window) !== 'object'){
 PromisePipe.setEnv('server');
 ENV = 'SERVER';
 mongodbUrl = process.env.MONGOHQ_URL || mongodbUrl;
}


PromisePipe.use('db', MongoPipeApi(mongodbUrl, ['items']), {_env:"server"});


var prepareItem = doOnServer(function addItem(data, context){
  var item = {
    uid: context.session.id,
    name: data,
    done: false
  }
  return item;
})

var forMe = doOnServer(function forMe(data, context){
  return {
    uid: context.session.id
  };
});

var toggleModifyItem = doOnServer(function toggleModifyItem(data, context){
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
});

var toggleAllItem = doOnServer(function toggleAllItem(data, context){
  return [
    {
      uid: context.session.id
    },
    {
      $set: {
        done: data
      }
    },
    {
      multi: true
    }
  ]
});

var byId = doOnServer(function byId(data, context){
  return {
    uid: context.session.id,
    _id: MongoPipeApi.ObjectId(data)
  };
});

var byDoneTrue = doOnServer(function byDoneTrue(data, context){
  return {
    uid: context.session.id,
    done: true
  };
});



module.exports = {
  PromisePipe: PromisePipe,

  addItem: PromisePipe()
    .then(prepareItem)
    .db.insert.items()
    .then(forMe)
    .db.find.items()
    .then(buildHtml)
    .then(renderItems),

  removeItem: PromisePipe()
    .then(byId)
    .db.remove.items()
    .then(forMe)
    .db.find.items()
    .then(buildHtml)
    .then(renderItems),

  getItems: PromisePipe()
    .then(forMe)
    .db.find.items()
    .then(buildHtml)
    .then(renderItems),

  doneItem: PromisePipe()
    .then(byId)
    .db.findOne.items()
    .then(toggleModifyItem)
    .db.findAndModify.items()
    .then(forMe)
    .db.find.items()
    .then(buildHtml)
    .then(renderItems),

  doneAllItem: PromisePipe()
    .then(toggleAllItem)
    .db.update.items()
    .then(forMe)
    .db.find.items()
    .then(buildHtml)
    .then(renderItems),

  clearDoneItems: PromisePipe()
    .then(byDoneTrue)
    .db.remove.items()
    .then(forMe)
    .db.find.items()
    .then(buildHtml)
    .then(renderItems)
}




  function buildHtml(data){

    data = data || [];

    result = renderTodoApp(renderAppHeader()
      + renderAppMain("<ul id='todo-list'>" +
        data.map(function(item, i){
          var result = '<input class="toggle" type="checkbox" ' +(item.done?'checked':'')+ ' onclick="main.doneItem(\''+item._id+'\')"></input>';
          result+= "<label>" + item.name + "</label>";
          result+='<button class="destroy" onclick="main.removeItem(\''+item._id+'\')"></button>';
          result = '<div class="view">'+result+'</div>'
          result = '<li class="'+(item.done?'completed':'')+'">'+result+'</li>'
          return result;
        }).join('') + "</ul>"
      , data)
      + renderAppFooter(data)) + renderAppInfo();
    return result;
  }



  function renderItems(data){
    document.getElementById('todo-app').innerHTML = data;
    return data;
  }

  function renderAppHeader(){
    return '<header id="header"><h1>todos</h1><input id="new-todo" placeholder="What needs to be done?" autofocus onkeyup="event.which == 13 && main.addItem(this.value);"></header>';
  }

  function renderAppMain(wrap, items){
    var allChecked = items.reduce(function(result, item){
      if(!item.done) return false;
      return result;
    }, true);
    return '<section id="main"><input id="toggle-all" '+(allChecked?'checked':'')+' type="checkbox" onclick="main.doneAllItem(this.checked)"><label for="toggle-all">Mark all as complete</label>' + wrap + '</section>';
  }

  function renderAppFooter(data){
    return '<footer id="footer"><span id="todo-count">' +(data?data.length:0)+ ' items</span><button id="clear-completed" onclick="main.clearDoneItems()">Clear completed</button></footer>';
  }

  function renderTodoApp(wrap){
    return '<section id="todoapp">' + wrap + '</section>';
  }
  function renderAppInfo(){
    return '<div id="info"><p>Written by <a href="https://github.com/edjafarov">Eldar Djafarov</a></p><p><a href="https://github.com/edjafarov/PromisePipe/tree/master/example/mongotodo">PromisePipe based MongoDb persistent TodoApp</a> is a part of <a href="http://todomvc.com">TodoMVC</a></p></div>'
  }
  function doOnServer(fn){
    fn._env = 'server';
    return fn
  }
