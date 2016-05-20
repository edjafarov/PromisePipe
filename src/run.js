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
PromisePipe().then().then().channel((data, context)=>{
  this.emit()
}, (data, context)=>{
  this.on()
});
//get prev, get This
//serverN, client


client
  send
  listen

ser1
  send
  listen

ser2
  send
  listen

client-server
ser1-ser2

client.send => ser1.listen => ser1.send => ser2.listen  {channelOpen}
  => ser2.send => ser1.listen => ser1.send => client.listen

  ser2.send => ser1.listen => ser2.send => client.listen
