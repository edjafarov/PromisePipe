function mock(data){
  console.warn("SHOULD NOT BE HERE");
  return data;
}
mock._env = 'server';

console.log("MOOK");


export var prepareTopIds = function(){
  return mock;
};
prepareTopIds._env = 'server';
export var getItemsByIds = mock;
export var addBidIds = mock;
export var resolveBids = mock;
export var withCurrentUser = mock;
export var makeABid = mock;
export var watch = mock;
export var broadcast = mock;
export var verifyCredentials = mock;
export var getCurrentUser = mock;

export var getUsersByIds = mock;
export var putUserInSession = mock;
export var crearUserFromSession = mock;
