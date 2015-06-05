var PromisePipe = require('../../src/PromisePipe')();
var Promise = require('es6-promise').Promise;
PromisePipe.setMode('DEBUG');
var ENV = 'CLIENT';
//set up server
if(typeof(window) !== 'object'){
 PromisePipe.setEnv('server');
 ENV = 'SERVER';
}

var returnItems = doOnServer(function returnItems(data, context){
  return context.todolist;
})

var doneItem = doOnServer(function doneItem(data, context){
  data.done = !data.done;
  return data;
})

var addItem = doOnServer(function addItem(data, context){
  var nextId = context.todolist.length>0?(context.todolist[context.todolist.length - 1].id + 1):0;
  var item = {
    id: nextId,
    name: data,
    done: false
  }
  context.todolist.push(item);
  return data;
})

var removeById = doOnServer(function removeById(data, context){
  var resId = null;
  context.todolist.forEach(function(item, i){
    if(item.id == data) resId = i;
  });
  var old = context.todolist[resId];
  context.todolist.splice(resId,1);
  return old;
})

var getById = doOnServer(function getById(data, context){
  var resId = null;
  context.todolist.forEach(function(item, i){
    if(item.id == data) resId = i;
  });
  return context.todolist[resId];
})

var clearDone = doOnServer(function clearDone(data, context){
  context.todolist.forEach(function(item, i){
    if(item.done) context.todolist.splice(i,1);
  });
  return context.todolist;
})

module.exports = {
  PromisePipe: PromisePipe,
  addItem: PromisePipe()
    .then(addItem)
    .then(returnItems)
    .then(buildHtml)
    .then(renderItems),
  removeItem: PromisePipe()
    .then(removeById)
    .then(returnItems)
    .then(buildHtml)
    .then(renderItems),
  getItems: PromisePipe()
    .then(returnItems)
    .then(buildHtml)
    .then(renderItems),
  doneItem: PromisePipe()
    .then(getById)
    .then(doneItem)
    .then(returnItems)
    .then(buildHtml)
    .then(renderItems),
  clearDoneItems: PromisePipe()
    .then(clearDone)
    .then(returnItems)
    .then(buildHtml)
    .then(renderItems)
}




  function buildHtml(data){

    var result = "";
    data = data || [];
    result+="<ul>";
    result+=data.map(function(item, i){
      var name = item.name;
      if(item.done) name = "<strike>"+name + "</strike>";
      return "<li>"+name+"<button onclick='main.doneItem("+item.id+")'>+</button><button onclick='main.removeItem("+item.id+")'>x</button></li>";
    }).join('');
    result+="</ul>";
    return result;
  }
  function renderItems(data){
    document.getElementById('todolist').innerHTML = data;
    return data;
  }



	function doOnServer(fn){
		fn._env = 'server';
		return fn
	}
