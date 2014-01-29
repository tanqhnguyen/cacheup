var RedisAdapter = require('./adapters/redis')
  , MemoryAdapter = require('./adapters/memory')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , arrg = require('arrg')
  , when = require('when')
  , _ = require('underscore')

var adapters = {
  'redis': RedisAdapter,
  'memory': MemoryAdapter
}

var Cacheup = function(options){
  var self = this;
  var Adapter = adapters[options.type];
  this.adapter = new Adapter(options);

  this.adapter.on('error', function(error){
    self.emit('error', error);
  });

  EventEmitter.call(this);
};
util.inherits(Cacheup, EventEmitter);

Cacheup.prototype._callAdapter = function() {
  var args = Array.prototype.slice.apply(arguments);
  var methodName = args.shift();
  var method = this.adapter[methodName];

  var callback = _.last(args);
  if (_.isFunction(callback)) {
    callback = args.pop();
  } else {
    callback = null;
  }
  promise = method.apply(this.adapter, args); 
  promise.then(function(data){
    if (callback) callback(null, data);
  }).otherwise(function(error){
    if (callback) callback(error, null);
  });
  return promise;
};

Cacheup.prototype._processArguments = function(args, positions) {
  args = arrg(args, positions, {
    options: {}
  });
  if (_.isFunction(args.options)) {
    args.callback = args.options;
    args.options = {};
  }

  return args;
};

// Public methods
Cacheup.prototype.set = function() {
  var args = this._processArguments(arguments, ['key', 'value', 'options', 'callback']);

  return this._callAdapter('set', args.key, args.value, args.options, args.callback);
};

Cacheup.prototype.get = function() {
  var args = this._processArguments(arguments, ['key', 'options', 'callback']);

  return this._callAdapter('get', args.key, args.options, args.callback);
};

Cacheup.prototype.del = function() {
  var args = this._processArguments(arguments, ['key', 'options', 'callback']);

  return this._callAdapter('del', args.key, args.options, args.callback);
};

Cacheup.prototype.fetch = function() {
  var args = this._processArguments(arguments, ['key', 'fetch', 'options', 'callback']);

  return this._callAdapter('fetch', args.key, args.fetch, args.options, args.callback);
};

Cacheup.prototype.check = function(key) {
  return this._callAdapter('check', key);
};

Cacheup.prototype.touch = function(key) {
  var args = this._processArguments(arguments, ['key', 'options', 'callback']);

  return this._callAdapter('touch', args.key, args.options, args.callback);
};

Cacheup.prototype.clear = function() {
  this.adapter.clear();
};

module.exports = Cacheup;