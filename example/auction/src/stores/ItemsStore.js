var Store = require('./BasicStore');

module.exports = Store("ItemsStore", {
  items: [],
  init: function(context){
    context.on('item:update', this.updateItem.bind(this));
    context.on('items:update', this.updateItems.bind(this));
  },
  updateItems: function(data){
    this.items = data;
    this.emit('change', this.items);
  },
  updateItem: function(data){

    this.items = this.items.reduce((res, item)=>{
      if(+data.id == +item.id){
        res.push(data)
      } else {
        res.push(item)
      }
      return res;
    }, []);
    this.emit('change', this.items);
  },
  get: function(){
    return this.item;
  },
  fill: function(items){
    if(!this.items[0]) this.items = items;
  }
})
