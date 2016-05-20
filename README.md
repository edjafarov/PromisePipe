[![Build Status](https://travis-ci.org/edjafarov/PromisePipe.svg?branch=master)](https://travis-ci.org/edjafarov/PromisePipe)

#PromisePipe - reusable promise chains

[![Join the chat at https://gitter.im/edjafarov/PromisePipe](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/edjafarov/PromisePipe?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

PromisePipe allows to build a reusable Promise chains. It returns a function which you can call multiple times and each time all chains will be called. The Function returns a promise each time you call it.

```javascript
var pipe = PromisePipe()
			.then(doSmth)
            .then(doSmthElse);

var result = pipe(1); // calls doSmth, doSmthElse and returns a promise
// result is a Promise

```

PromisePipe is built with small core API. It can be [extended](#promisepipeusename-handler) with custom methods. You can build your domain specific API that describes your business logic.

```javascript
var saveEventItem = PromisePipe()
  .validateItem(validationScheme)
  .saveItem()
  .updateItem()
  .catchError('item:add:reject')
```

PromisePipe is a singleton. You build chains of business logic and run the code both on server and client. Chains marked to be executed on the server will be executed on the server only and chains marked to be executed in the client will be executed in the client. You need to [set methods](#transitions) in PromisePipe to pass messages from the client to the server. And it is up to you what transport to use.

![promisepipeExample](http://g.recordit.co/Ck1tyZ5qA8.gif)

check simple [todo app](https://github.com/edjafarov/PromisePipe/tree/master/example/simple-todo)

and [todo with mongodb and session](https://github.com/edjafarov/PromisePipe/tree/master/example/mongotodo), live on heroku [https://promisepipe-todo.herokuapp.com/](https://promisepipe-todo.herokuapp.com/)

##install

npm install promise-pipe


# Getting Started

The core API mimics api of Promise. So it should be pretty obvious how to use it. Additionally with `data` that is returned from previous chain as first argument each function have access to `context` object.

```javascript
var PromisePipe = require('promise-pipe')(); //create a PromisePipe singleton

var someChain = function someChain(data, context){
  // do data transformations
  // change context
  return data; //pass data to next chain
}

var someAsyncChain = function someAsyncChain(data, context){
  return new Promise(function(resolve, reject){ //use Promise for async transformations
    // do data transformations
	// change context
    resolve(data) || reject(err)
  });
}

var handleError = function handleError(err, context){
  //handle error
  //change context
  return err;
}

var newPipe = PromisePipe()
  .then(someChain)
  .then(someAsyncChain)
  .catch(handleError);

var context = {};
var data = 1;

newPipe(data, context).then(function(result){
  //result is a result of the chain
});
```

#Core API

##PromisePipe() : pipe

###pipe : Promise
Is a constructed pipe that returns a promise. First argument is a data, second is a context. While `data` behaves the same way as in Promises `context` is passing thorough whole chain of promises.

```javascript
var pipe = PromisePipe()
.then(function(data, context){
  console.log(data, context);
    context.foo = "bar";
  return data + 1;
}).then(function(data, context){
  console.log(data, context);
    context.xyz = "baz";
  return data + 1;
}).then(function(data, context){
  console.log(data, context);
})
pipe(2, {});
//2 {}
//3 {foo:"bar"}
//4 {foo:"bar", xyz:"baz"}
```
###pipe.then
`.then` adds a simple chain to the pipe
```javascript
var pipe = PromisePipe()
.then(function(data, context){
  return //Promise.resolve/reject
})
.then(success)
.catch(fail)
```
###pipe.all
As in Promises you can compose promise pipes
```javascript
var pipe = PromisePipe()
.then(fn1)
.then(fn2)
.all(
  PromisePipe()
  .then(fnasync11)
  .then(fnasync21)
  .then(fnasync31)

  ,PromisePipe()
  .then(fnasync12)
  .then(fnasync22)
  .then(fnasync32)
)
.then(fnEnd)
```
###pipe.catch
The catch is catching error or reject of previous chains. Behaves as Promise catch.

###pipe.join
You can join PromisePipes if you like.

```javascript
var pipe = PromisePipe()
.then(function(data, context){
  return data + 1;
});

var pipe2 = PromisePipe()
.then(function(data, context){
  return data + 2;
})
.join(pipe)
.then(function(data){
  console.log(data);
});

pipe2(1) //4
```

##PromisePipe.use(name, handler)
Allows to build your own customized DSL. `handler` is a function with at least 2 arguments data and context as in simple chain.

```javascript
function handler(data, context, arg1, ..., argN){
  //you can return Promise
  return data;
}
PromisePipe.use('custom', handler);

PromisePipe().custom(arg1, ..., argN)
```

Other arguments `arg1, ..., argN` are used to additionally modify the chain behavior. For example we can build smarter `log()` method:

```javascript
var PromisePipe = require('promise-pipe')();

PromisePipe.use('log', function(data, context, name){
  if(name) {
    console.log(data[name]);
  } else {
    console.log(data)
  }
  return data;
})

var action = PromisePipe()
			  .log()
              .log('foo');

action({foo:"baz", bar:"xyz"})
// {foo:"baz", bar:"xyz"} <- log()
// baz <- log('foo')
```

##Transitions
When the PromisePipe is running on several environments and the execution comes to a chain marked to be executed on other environment PromisePipe tries to pass a message to that environment. To make it work you should describe how to pass the message between environments. Following methods are built for that.

###PromisePipe.setEnv
With `.setEnv` method you are setting environment for the PromisePipe. All methods marked same as the pipe will be executed only in this environment.
```
if(typeof(window) !== 'object'){
  PromisePipe.setEnv('server');
} else {
  PromisePipe.setEnv('client');
}
```

###PromisePipe.in
Creates wrapper that marks chains as executable in specific environment.

```javascript
var doOnServer = PromisePipe.in('server')
var addItemAction = PromisePipe()
  .then(validateItem)
  .then(doOnServer(validateItemServer)) // will be executed on server
  .then(doOnServer(saveItemInDB)) // will be executed on server
  .then(addItem)
  .catch(handleError);
addItemAction(item) // will pass complete chain
```

###PromisePipe.envTransition(from, to, handler)
Setting transition of a message between environments. `from` and `to` are environments names. For example 'client' and 'server'. `handler` is a function that passes the message to other env.

```javascript
PromisePipe.envTransition('client', 'server', function(message){
  // here you need to put a logic that sends message to server env
})
```
###PromisePipe.execTransitionMessage(message)
The message created in `PromisePipe.envTransition` comes to another env and must be executed here. When the message is prepared you need to execute it on a PromisePipe. It will resolve what chains it need to execute and will return a Promise that you need to handle and return updated message back to client.

```javascript
function serverHandler(message){
  PromisePipe.execTransitionMessage(message).then(function(data){
	message.data = data;
    //sendToClient(message);
  });
}
```
On client you would also need to execute the message that comes back:

```javascript
function clientHandler(message){
  PromisePipe.execTransitionMessage(message);
}
```

###PromisePipe.localContext(context) : PromisePipeWithContext
With serverside you would probably need to have some isolated context like session that should not be accessible on client. You can extend the context for environment. [(Usage Eaxmple)](https://github.com/edjafarov/PromisePipe/blob/20661a4cc5ee14062bd9d4e4b106ff1b69ee8ebc/example/mongotodo/server.js#L39)

#### PromisePipeWithContext.execTransitionMessage(message)
The message will be executed with access to additional context.

#### PromisePipeWithContext.wrap(fn)
The function will be executed with access to additional context.

##Connectors
To make connecting different environments easier there is connectors API.

###PromisePipe.stream(from, to, Handler).connector(Connector)
This is setting up transitions to use Connector.

Connector is an object that should implement two methods: `send` and `listen`

```javascript
{
  send: function(message){
    //send message
  },
  listen: function(handler){
    //if message comes call handler function with the message object
  }
}
```

There are implemented connectors for [SocketIO](https://github.com/edjafarov/PromisePipe/blob/master/example/connectors/SocketIODuplexStream.js), [HTTP](https://github.com/edjafarov/PromisePipe/blob/master/example/connectors/HTTPDuplexStream.js), [SocketIO + sessions](https://github.com/edjafarov/PromisePipe/blob/master/example/connectors/SessionSocketIODuplexStream.js), [Webworkers](https://github.com/edjafarov/PromisePipe/blob/master/example/connectors/WorkerDuplexStream.js)

##Debugging
###PromisePipe.setMode
To set up PromisePipe in debug mode you need to call PromisePipe.setMode('DEBUG'). Then in chrome you will be able to see in console values of arguments passed inside each chain within pipe:

![debuggability promisepipes](http://g.recordit.co/EywOLPXn7v.gif)
