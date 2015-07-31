import RouterFactory from  "../../index"

var Router = RouterFactory();

Router(function(Router){
  Router('/items', function(Router){
    Router('/:id').component(itemComp).then(getItem);
  }).component(itemsComp).then(getItems);
}).component(rootComp).then(count)


function itemComp(params){
  return `<div>
    <label>ID: ${params.data.id}</label>
    <h5>name: ${params.data.name}</h5>
    <p>${params.data.description}</p>
    ${params.children || ''}
  </div>`
}

function itemsComp(params){
  var items = params.data.map(item => `<li><a href="/items/${item.id}">${item.name}</a></li>`).join("");
  return `<div>
    <ul>${items}</ul>
    ${params.children || ''}
  </div>`
}


function rootComp(params){
  return `<div>
    <h1><a href="/">Router Example APP</a> (${params.data || 0})</h1>
    <a href="/items">Items</a>
    ${params.children || ''}
  </div>`
}

function getItems(){
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve(Items);
    }, 100);
  })
}

function getItem(data, context){
  return Items.reduce(function(result, item){
    if(result) return result;
    if(item.id == context.params.id) return item;
  }, null);
}


function count(){
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve(Items.length);
    }, 100);
  })
}


var Items = [
  {
    id:1,
    name: "Item1",
    description: "The Item Description"
  },
  {
    id:2,
    name: "Item2",
    description: "The Item2 Description"
  },
  {
    id:3,
    name: "Item3",
    description: "The Item3 Description"
  }

];

export var Router = Router;
