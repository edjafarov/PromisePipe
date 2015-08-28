import React from "react"
import {Router} from "./router"
import HistoryApiAdapter from  "../../adapters/HistoryApiAdapter"

function mount(data){
  React.render(data, document.getElementById('content'));
}
var FrontendAdapter = HistoryApiAdapter(mount);
Router.use(FrontendAdapter);

document.getElementById('content').onclick = function(e){
  e.preventDefault()
  e.stopPropagation();
  if(e.target.nodeType == 1
      && e.target.href
      && e.target.href.indexOf(document.location.origin) == 0
      && document.location.pathname !== e.target.pathname) {//is a link
    Router.router.transitionTo(e.target.pathname)
  }
}

module.exports = function(state){
  mount(FrontendAdapter.renderer(Router.prepareRenderData(state)));
}
