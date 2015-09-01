var chain = require('./serverChains/chains');


export default function(PromisePipe){
  return {
    login: PromisePipe()
      .then(chain.verifyCredentials)
      .then(chain.putUserInSession)
      .emit("me:success")
      .redirect('/')
      .catch((err, context)=>{
        console.log(err)
        context.client.emit('login:fail', err);
      }),

    logout: PromisePipe()
      .then(chain.crearUserFromSession)
      .emit("me:logout"),

    getSession: PromisePipe()
      .then(chain.getCurrentUser)
      .emit("me:success"),

    makeABid: PromisePipe()
      .then(chain.makeABid)
      .then(chain.getItemsByIds)
      .then(chain.addBidIds)
      .then(chain.broadcast),

    watch: PromisePipe()
      .then(chain.watch)

  }
}
