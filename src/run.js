var PromisePipeFactory = require('./PromisePipe');
var PromisePipe = PromisePipeFactory();

PromisePipe.use('log', {a:function(data, context, variable){
  console.log("LOG: ",context[variable]);
  return data;
}})



var test = PromisePipe().then((data, c)=>{
  console.log(data++)
  c.t=1;
  return data;
}).log.a("t")
  .then((data, c)=>{
  console.log(data++)
  f.x=2;
  return data;
}).catch(function(e){
  console.log(e,"<<<")
})

var k ={};
//console.log(test)
test(2, k).then((data) => {
  console.log(data, k,  "<<")
  return data;
}).catch((e) => {
  console.log(e,"!")
})
