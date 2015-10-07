var Promise = Promise || require('es6-promise').Promise;
module.exports = function TransactionController(options){
  options = options || {};
  var timeout = options.timeout || 2000;
  var transactions = {};
  return {
    createTransaction: function createTransaction (message){
      message._transactionId = Math.ceil(Math.random() * Math.pow(10, 16));

      return {
        send: function sendTransaction(handler){
          return new Promise(function(resolve, reject){
            //save transaction Resolvers
            transactions[message._transactionId] = {
              resolve: resolve,
              timeoutId: setTimeout(reject.bind(this, "message took more than " + timeout), timeout)
            }
            handler(message);
          })
        }
      }
    },
    processTransaction: function processTransaction(transactionMessage){
      if(transactions[transactionMessage._transactionId]){
        var id = transactionMessage._transactionId;
        delete transactionMessage._transactionId;
        transactions[id].resolve(transactionMessage);
        clearTimeout(transactions[id].timeoutId);
        delete transactions[transactionMessage._transactionId]
        return true;
      }
      return false;
    }
  }
}

//createTransaction(message).send(messageSender).then(responseHandler);
