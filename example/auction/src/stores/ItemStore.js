var Store = require('./BasicStore');

module.exports = Store("ItemStore", {
  item: {},
  init: function(context){
    context.on('item:update', this.updateItem.bind(this));
  },
  updateItem: function(data){
    this.item = data;
    this.emit('change', this.item);
  },
  get: function(){
    return this.item;
  }
})
