[![Build Status](https://travis-ci.org/edjafarov/PromisePipe.svg?branch=master)](https://travis-ci.org/edjafarov/PromisePipe)

#PromisePipe - reusable promise chains

PromisePipe allows to build a reusable Promise chain with custom API. Promise pipe returns a function which you can call multiple times and each time all chains will be called and the result of the function would be a promise.

```javascript
var pipe = PromisePipe().then(doSmth).then(doSmthElse);

var result = pipe(1); // calls doSmth, doSmthElse and returns a promise
// result is a Promise

```

PromisePipe is built with small API and ability to extend API with custom methods. You can build your specific API that describes your business logic better.

```javascript
var saveEventItem = PromisePipe()
.validateItem(validationScheme)
.saveItem()
.updateItem()
.catchError('item:add:reject')
```

PromisePipe can live on client and server simultaneously allowing to describe business logic completely instead of thinking about client/server communication.

![](http://g.recordit.co/0jVhHM2rOW.gif)

check simple [todo app](https://github.com/edjafarov/PromisePipe/tree/master/example/simple-todo)

and [todo with mongodb and session](https://github.com/edjafarov/PromisePipe/tree/master/example/mongotodo), live on heroku [https://promisepipe-todo.herokuapp.com/](https://promisepipe-todo.herokuapp.com/)

##install

npm install promise-pipe

##extend

You can extend ```PromisePipe``` API with additional methods. Thus you are able to build your own customized DSL.
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

var action = PromisePipe().log().log('foo');

action({foo:"baz", bar:"xyz"})
// {foo:"baz", bar:"xyz"} <- log()
// baz <- log('foo')
```
##API
###PromisePipe

###PromisePipe.use(name, handler)
Allows to build your own customized DSL. ```handler``` is a function with arguments

```javascript
function handler(data, context, arg1, ..., argN){
  //you can return Promise
  return data;
}
PromisePipe.use('custom', handler);

PromisePipe().custom(arg1, ..., argN)
```

###Transitions
If the PromisePipe live on several environments you should describe how to pass the message between environments. Following methods are built for that.

###PromisePipe.envTransition(from, to, handler)

###PromisePipe.execTransitionMessage(message)

###PromisePipe.localContext(context)

#### PromisePipe.localContext(context).execTransitionMessage(message)

#### PromisePipe.localContext(context).wrap(fn)

###Pipe
Is a function that returns a promise. First argument is a data, second is a context. While `data` behaves the same way as in Promises `context` is passing thorough whole chain of promises.

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
###Pipe:then
As in Promises you can pass two functions inside for success and fail.
```javascript
var pipe = PromisePipe()
.then(function(data, context){
  return //Promise.resolve/reject
})
.then(success)
.catch(fail)
```
###Pipe:all
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
###Pipe:catch
The catch is taking single argument and bahaves same as Promise catch.

###Pipe:join
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
