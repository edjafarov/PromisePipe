var Promise = Promise || require('es6-promise').Promise,
    debug = require('debug')('PP:transactions');
module.exports = function TransactionController(options){
  if(typeof(debug) === "undefined") debug = function(){}; //for tests sake
  options = options || {};
  var timeout = options.timeout || 2000;
  var transactions = {};
  return {
    createTransaction: function createTransaction (message){

      message._transactionId = Math.ceil(Math.random() * Math.pow(10, 16));
      debug(`create transaction with tId ${message._transactionId}`);
      return {
        send: function sendTransaction(handler){
          debug(`send message with tId ${message._transactionId}`);
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
      debug(`process ${!!transactions[transactionMessage._transactionId]?'existing':'nonexisting'} response with tId ${transactionMessage._transactionId} `);
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
