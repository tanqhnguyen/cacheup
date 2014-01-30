var Backbone = require('backbone')
  , _ = require('underscore')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , HashRing = require('hashring')
  , when = require('when');

var Abstract = function(options){
  options = options || {};
  options = _.defaults(options, {
    ttl: 7200, // seconds
    // by default, the cache expire time is not reset when it is accessed
    // set this to true might be suitable for data that is expensive to computate
    // but does not need to be refreshed too often
    extendttl: false 
  });

  // one server or multiple servers?
  if (!options.servers) {
    options.servers = {};
    var pick = ['host', 'port', 'username', 'database'];
    _.each(pick, function(attr){
      options.servers[attr] = options[attr];
      delete options[attr];
    });
  }


  _.each(options, function(value, key){
    this[key] = value;
  }, this);

  if (!_.isArray(this.servers)) {
    this.servers = [this.servers];
  }

  if (!this.type) {
    throw "Must supply type";
  }

  if (_.size(this.servers) === 0 && _.indexOf(skipRing, options.type) != -1) {
    throw "Must supply database connection";
  }

  EventEmitter.call(this);

  // setup ring using host:port as the convention for ring keys
  var skipRing = ['file', 'memory'];
  if (_.indexOf(skipRing, options.type) == -1) {
    var ringKeys = {};
    _.each(this.servers, function(server){
      var key = server.host+':'+server.port;
      var weight = server.weight || 1;
      ringKeys[key] = weight;
    });
    this._ring = new HashRing(ringKeys);    
  }

  this.initialize(options);
};

util.inherits(Abstract, EventEmitter);

Abstract.extend = Backbone.Model.extend;

Abstract.prototype.getRingValue = function(key) {
  return this._ring.get(key);
};

Abstract.prototype.initialize = function() {
  throw "Need implementation";
};

// helpers
Abstract.prototype._parseData = function(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
};

// properly transform the data to the correct type before saving
Abstract.prototype._filterData = function(data) {
  if (data.toJSON && _.isFunction(data.toJSON)) {
    data = data.toJSON();
  }

  if (_.isObject(data)) {
    data = JSON.stringify(data);
  }

  return data;
};

Abstract.prototype.defer = function() {
  // abstraction for promise
  var deferred = when.defer();

  var _reject = deferred.reject;

  deferred.reject = function(error) {
    _reject(error);
  };

  return deferred;
};

Abstract.prototype.fetch = function(key, fetch, options) {
  var deferred = this.defer();
  var self = this;
  var get = this.get(key, options);
  get.then(function(result){
    if (!result) {
      // support both callback and promise style
      if (options.callback) {
        fetch(function(error, data){
          if (error) return deferred.reject(error);
          self.set(key, data, options).done(deferred.resolve, deferred.reject);
        });  
      } else {
        var fetchPromise = fetch();
        fetchPromise.done(function(data){
          self.set(key, data, options).done(deferred.resolve, deferred.reject);
        }, deferred.reject);
      }
    } else {
      deferred.resolve(result);
    }
  });

  return deferred.promise;
};

module.exports = Abstract;