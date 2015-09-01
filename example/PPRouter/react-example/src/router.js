import RouterFactory from  "../../index"
import React from "react"
var Router = RouterFactory();


class RootComp extends React.Component {
  render() {
    return <div>
      <h1><a href="/">Router Example APP</a> ({this.props.data || 0})</h1>
      <a href="/items">Items</a>
      {this.props.children}
    </div>
  }
}

class ItemsComp extends React.Component {
  render() {
    var items = this.props.data.map(item => <li key={item.id}><a href={'/items/' + item.id}>{item.name}</a></li>);
    return <div>
      <ul>{items}</ul>
      {this.props.children}
    </div>
  }
}

class ItemComp extends React.Component {
  render() {
    return <div>
      <label>ID: {this.props.data.id}</label>
      <h5>name: {this.props.data.name}</h5>
      <p>{this.props.data.description}</p>
      {this.props.children}
    </div>
  }
}



Router(function(Router){
  Router("/items", function(Router){
    Router('/:id').component(React.createElement.bind(React, ItemComp)).then(getItem);
  }).component(React.createElement.bind(React, ItemsComp)).then(getItems);
}).component(React.createElement.bind(React, RootComp))



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
