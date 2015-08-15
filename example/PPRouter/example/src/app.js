
import {Router} from "./router"
import HistoryApiAdapter from  "../../adapters/HistoryApiAdapter"

function mount(data){
  document.getElementById('content').innerHTML = data;
}
var FrontendAdapter = HistoryApiAdapter(mount);
Router.use(FrontendAdapter);

document.getElementById('content').onclick = function(e){
  e.preventDefault()
  e.stopPropagation();
  if(e.target.nodeType == 1 && e.target.href && e.target.href.indexOf(document.location.origin) == 0 ) {//is a link
    Router.router.transitionTo(e.target.pathname)
  }
}

module.exports = function(state){
  mount(FrontendAdapter.renderer(Router.prepareRenderData(state)));
}
