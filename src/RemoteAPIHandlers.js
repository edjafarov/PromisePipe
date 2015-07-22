module.exports = function(PromisePipe){
  return {
    provide: function(connector, apiName){
      connector.listen(function(message){
        function end(data){
          message.data = data;
          connector.send(message);
        }

        PromisePipe.pipes[message.id].Pipe(message.data, message.context || {}).catch(unhandledCatch).then(end);

        //catch inside env
        function unhandledCatch(data){
          message.unhandledFail = data;
          return data;
        }
      })
      return generateClientAPI(apiName, PromisePipe);
    }
  }
}


var TransactionController = require('./TransactionController');


function generateClientAPI(apiName, PromisePipe){
  var result = [
    TransactionController.toString(),
    "var TransactionHandler = TransactionController();\n",
    "connector.listen(TransactionHandler.processTransaction);\n",
    handleRejectAfterTransition.toString(),
    apiCall.toString()
  ].join("\n")


  var theApiHash = Object.keys(PromisePipe.pipes).map(function(item){
    return PromisePipe.pipes[item];
  }).reduce(oneChain, []);
  result += "\nreturn {"+theApiHash.join(",\n")+"}\n";

  return "function " + (apiName||'initApi') + "(connector){\n"+result+"}"
}

function apiCall(id){
  return function(data, context){
    var message = {
      data: data,
      id: id
    }
    return TransactionHandler.createTransaction(message).send(connector.send).then(handleRejectAfterTransition);
  }
}

function handleRejectAfterTransition(message){
  return new Promise(function(resolve, reject){
    if(message.unhandledFail) return reject(message.data);
    resolve(message.data);
  })
}

function oneChain(result, item){
  result.push(item.name + ": apiCall('" + item.id + "')");
  return result;
}




/**
//EXPOSING
PP({name: 'getItems', description: 'Get Items from collection'}).then().then();
PP({name: 'saveItems', description: 'Save Items from collection'}).then().then();

PP.api.provide(connector);


//USAGE
<script src="http://api.url.com/v0.1"></script>....
or
var mySerivceApi = PP.api.get(apiPath);

PP.use('api', mySerivceApi);

PP().api.getItems().then();
PP().api.saveItems().then();
*/
