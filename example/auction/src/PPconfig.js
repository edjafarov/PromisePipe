export default function(Router){
  var PromisePipe = Router.PromisePipe;

  PromisePipe.use('map', function map(data, context, mapFunction){
    if(!Array.isArray(data)) data = [data];
    return data.map(mapFunction)
  })

  PromisePipe.use('redirect', function map(data, context, url){
    return Router.router.transitionTo(url, context);
  })

  PromisePipe.use('emit', function map(data, context, evt){
    return context.client.emit(evt, data);
  })


}
