var Store = require('./BasicStore');

module.exports = Store("MeStore", {
  item: {},
  init: function(context){
    context.on('me:success', this.updateMe.bind(this));
    context.on('me:logout', this.clean.bind(this));
  },
  updateMe: function(data){
    console.log("UPDATE")
    this.item = data;
    this.emit('change', data);
  },
  clean: function(data){
    this.item = {};
    this.emit('change', data);
  },
  get: function(){
    return this.item;
  }
})
