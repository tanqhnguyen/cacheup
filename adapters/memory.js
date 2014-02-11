var Abstract = require('./abstract')
  , arrg = require('arrg')
  , Timer = require('../libs/timer')
  , _ = require('underscore');

var MemoryAdapter = Abstract.extend({
  initialize: function() {
    var self = this;
    this.storage = {};
    this.timer = new Timer();
  },

  _currentTime: function() {
    var currentTime = new Date().getTime();
    return Math.round(currentTime/1000);
  },

  _fakePromise: function(returnData) {
    var deferred = this.defer();

    process.nextTick(function(){
      deferred.resolve(returnData);
    });

    return deferred.promise;
  },

  _set: function(key, value, options) {
    options = options || {};

    var ttl = this._getOption(options, 'ttl');
    
    this.storage[key] = this._filterData(value);
    this.timer.start(key, ttl, function(){
      delete this.storage[key];
    }, this);

    return this._fakePromise(value);
  },

  _get: function(key, options) {
    var entry = this.storage[key];
    
    if (entry) {
      entry = this._parseData(entry);
    }
    
    return this._fakePromise(entry);
  },

  _del: function(key, options) {
    options = options || {};

    delete this.storage[key];
    this.timer.stop(key);

    return this._fakePromise(key);
  },

  _ttl: function(key) {
    expire = this.timer.timeleft(key);

    return this._fakePromise(expire);
  },

  _touch: function(key, options) {
    options = options || {};
    var ttl = this._getOption(options, 'ttl');
    this.timer.reset(key, ttl);

    return this._fakePromise(ttl);
  },

  _clear: function() {
    this.storage = {};
    this.timer.clearAll();
  }
});

module.exports = MemoryAdapter;