import React from "react"
import {Router} from "./router"
var connectors = require('../connector/SessionSocketConnector')
import HistoryApiAdapter from  "../../PPRouter/adapters/HistoryApiAdapter"
var EventEmitter = require('events').EventEmitter;
var MeStore = require('./stores/MeStore');
var ItemStore = require('./stores/ItemStore');
var ItemsStore = require('./stores/ItemsStore');

var PromisePipe = Router.PromisePipe;
PromisePipe.setMode("DEBUG");
PromisePipe.setEnv('client');
var socket = io.connect(document.location.origin);

PromisePipe.stream('client','server').connector(connectors.SIOClientServerStream(socket))


function mount(data){
  React.render(data, document.getElementById('content'));
}
var FrontendAdapter = HistoryApiAdapter(mount, document.getElementById('content'));
Router.use(FrontendAdapter);

var context = {client: new EventEmitter};
context.client.MeStore = MeStore.create();
context.client.MeStore.init(context.client)
context.client.ItemStore = ItemStore.create();
context.client.ItemStore.init(context.client)
context.client.ItemsStore = ItemsStore.create();
context.client.ItemsStore.init(context.client)

socket.on('item:update', (data)=>{
  context.client.emit('item:update', data[0]);
})
context.login = Router.actions.login;
context.logout = Router.actions.logout;
context.makeABid = Router.actions.makeABid;

Router.actions.getSession(null, context);
Router.actions.watch(null, context);

document.getElementById('content').onclick = function(e){
  var a = e.target.href?e.target:upTo(e.target, "a");
  if(a && a.nodeType == 1
      && a.href
      && a.href.indexOf(document.location.origin) == 0) {//is a link
    e.preventDefault()
    e.stopPropagation();
    if(document.location.pathname !== a.pathname) Router.router.transitionTo(a.pathname, context)
  }
}

// Find first ancestor of el with tagName
// or undefined if not found
function upTo(el, tagName) {
  tagName = tagName.toLowerCase();

  while (el && el.parentNode) {
    el = el.parentNode;
    if (el.tagName && el.tagName.toLowerCase() == tagName) {
      return el;
    }
  }
  // Many DOM methods return null if they don't
  // find the element they are searching for
  // It would be OK to omit the following and just
  // return undefined
  return null;
}



module.exports = function(state){
  mount(FrontendAdapter.renderer(Router.prepareRenderData(state, context)));
}
