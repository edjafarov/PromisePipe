var Emitter = require('events').EventEmitter;

module.exports = function StoreFactory(storeName, base){
	base = Object.keys(base).reduce(function(context, name){
			context[name] = {
				configurable: false,
				enumerable: false,
				writable: typeof(base[name]) !== 'function',
				value: base[name]
			}
			return context;
		},{});

	base.name = {
		configurable: false,
		enumerable: false,
		writable: false,
		value: storeName
	}

	return {
		name: storeName,
		create: function(){
			return Object.create(new Emitter(), base);
		}
	}
}
