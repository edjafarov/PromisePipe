#PromisePipe

##install

npm install promise-pipe

##extend

You can extend ```PromisePipe``` API with additional methods. Thus you are able to build your own customized DSL.
```javascript
var PromisePipe = require('promise-pipe');

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

###Stream
Is a function that returns a promise. First argument is a data, second is a context. While `data` behaves the same way as in Promises `context` is passing thorough whole chain of promises.

```javascript
var stream = PromisePipe()
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
stream(2, {});
//2 {}
//3 {foo:"bar"}
//4 {foo:"bar", xyz:"baz"}
```
###stream:then
As in Promises you can pass two functions inside for success and fail.
```javascript
var stream = PromisePipe()
.then(function(data, context){
	return //Promise.resolve/reject
}).then(success, fail)
```
###stream:catch
The catch is taking single argument and bahaves same as Promise catch.

###stream:join
You can join PromisePipes if you like.

```javascript
var stream = PromisePipe()
.then(function(data, context){
	return data + 1;
});
var stream2 = PromisePipe()
.then(function(data, context){
	return data + 2;
})
.join(stream)
.then(function(data){
	console.log(data);
});

stream2(1) //4
```
