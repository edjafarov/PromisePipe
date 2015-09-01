var PromisePipe = require('../../src/PromisePipe')();
PromisePipe.setMode('DEBUG');
var Promise = require('es6-promise').Promise;


var ENV = 'CLIENT';
//set up server
if(typeof(window) !== 'object'){
 PromisePipe.setEnv('server');
 ENV = 'SERVER';

}


//PromisePipe.use('db', MongoPipeApi(mongodbUrl, ['items']), {_env:"server"});
ItemsComp




module.exports = {
  PromisePipe: PromisePipe,
  getItems: PromisePipe(),
  getItem: PromisePipe(),
  subscribe: PromisePipe(),
  bidItem: PromisePipe(),
  login: PromisePipe(),
  logout: PromisePipe()
}

getItems: PromisePipe()
  .then(prepareTopIds(5))
  .map(getItemById)
  .map(addBids)
getItem: PromisePipe()
  .map(getItemById)
  .map(addBids)
bidItem: PromisePipe()
  .then(withCurrentUser)
  .then(makeABid)
  .then(broadcast)
login: PromisePipe()
  .then(verifyCredentials)
  .then(putUserInSession)
  .catch(showError)
logout: PromisePipe()
  .then(crearUserFromSession)
  .redirect('/')

*items
  id
  name
  description
  image
  startBid

  *bids
  id
  uid
  bid

*users
  id
  name

item:bid:id


auction:items:keys
auction:items:{id}

auction:items:{id}:bids:keys
auction:items:{id}:bids:{id}

auction:users:keys
auction:users:{id}

function doOnServer(fn){
  fn._env = 'server';
  return fn
}
