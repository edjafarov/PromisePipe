var PromisePipe = require('../../src/PromisePipe')();
PromisePipe.setMode('DEBUG');
var Promise = require('es6-promise').Promise;

var ENV = 'CLIENT';
//set up server

PromisePipe.use('api', exampleAPI);
PromisePipe.use('and', function(){
  return {};
});


var prepareItem = function prepareItem(data, context){
  var item = {
    name: data,
    done: false
  }
  return item;
}


module.exports = {
  PromisePipe: PromisePipe,
  getItems: PromisePipe()
    .api.getItems()
    .then(buildHtml)
    .then(renderItems),
  addItem: PromisePipe()
    .then(prepareItem)
    .api.addItem()
    .and()
    .api.getItems()
    .then(buildHtml)
    .then(renderItems),
  removeItem: PromisePipe()
    .api.removeItem()
    .and()
    .api.getItems()
    .then(buildHtml)
    .then(renderItems),
  doneItem: PromisePipe()
    .api.doneItem()
    .and()
    .api.getItems()
    .then(buildHtml)
    .then(renderItems),
  doneAllItem: PromisePipe()
    .then(function(data){
      return {
        done: data
      }
    })
    .api.doneAllItems()
    .and()
    .api.getItems()
    .then(buildHtml)
    .then(renderItems),
  clearDoneItems: PromisePipe()
    .api.clearDoneItems()
    .and()
    .api.getItems()
    .then(buildHtml)
    .then(renderItems),
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
