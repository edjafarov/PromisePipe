import RouterFactory from  "../../PPRouter/index"
import React from "react"

import RootComp from "./components/RootComp"
import ItemComp from "./components/ItemComp"
import UserComp from "./components/UserComp"
import LoginComp from "./components/LoginComp"
var chain = require('./serverChains/chains');


var Router = RouterFactory();
//Router.PromisePipe.setMode('DEBUG');
if(typeof(window) !== 'object'){
  Router.PromisePipe.setEnv('server');
} else {
  Router.PromisePipe.setEnv('client');
}

require('./PPconfig')(Router);
Router.actions = require('./actions')(Router.PromisePipe);

Router(function(Router){
  Router('/item/:id').component(Comp(ItemComp))
    .then((data, context)=>[context.params.id])
    .then(chain.getItemsByIds)
    .then(chain.addBidIds)

  Router('/login').component(Comp(LoginComp))

  Router('/users/:id').component(Comp(UserComp))
    .then((data, context)=>[context.params.id])
    .then(chain.getUsersByIds)

}).component(Comp(RootComp))
  .then(chain.prepareTopIds())
  .then(chain.getItemsByIds)
  .then(chain.addBidIds)


//React createElement helper
function Comp(classComponent){
  return React.createElement.bind(React, classComponent)
}

export var Router = Router;
