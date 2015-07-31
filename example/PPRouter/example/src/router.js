import RouterFactory from  "../../index"

var Router = RouterFactory();


function rootComp(params){
  return `<div>
    <h1>The APP: <a href="/" onclick="router.transitionTo('/');return false;">${params.data}</a></h1>
    <a href="/posts" onclick="router.transitionTo('/posts');return false;">Posts</a>

    <a href="/items" onclick="router.transitionTo('/items');return false;">Items</a>
    ${params.children || ''}
  </div>`;
}

function postsComp(params){
  return `<div>
    <h3>Params</h3>
    ${params.data || ''}
  </div>`;
}

function itemsComp(params){
  return `<div>
    <h3>Items</h3><a href="/items/new" onclick="router.transitionTo('/items/new');return false;">New</a>
    ${params.data || ''}
    <br/>
    ${params.children || ''}
  </div>`;
}

function newComp(params){
  return `<div>
    <h5>New</h5>
    ${params.data || ''}
  </div>`;
}
Router(function(Router){
  Router('/posts').component(postsComp).then(function(data, context){
    return "Posts RESULT"
  })
  Router('/items', function(Router){
    Router('/new').component(newComp).then(function(data, context){
      return "NewItems"
    })
  }).component(itemsComp).then(function(data, context){
    return "Items RESULT"
  })
}).component(rootComp).then(function(){
  return "TEST"
})

export var Router = Router;
