var Abstract = require('./abstract')
  , arrg = require('arrg')
  , _ = require('underscore');

var MemoryAdapter = Abstract.extend({
  sync: true,
  
  initialize: function() {
    var self = this;
    this.storage = {};
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

  set: function(key, value, options) {
    options = options || {};

    var ttl = this._getOption(options, 'ttl');
    
    this.storage[key] = {
      value: this._filterData(value),
      expire: this._currentTime() + ttl
    };

    return this._fakePromise(value);
  },

  get: function(key, options) {
    options = options || {};

    var extendttl = this._getOption(options, 'extendttl');
    var ttl = this._getOption(options, 'ttl');

    var entry = this.storage[key];

    if (entry && entry.expire <= this._currentTime()) {
      // now we need to remove the entry
      delete this.storage[key];
    } else {
      // update ttl, maybe?
      if (extendttl) {
        this.storage[key].expire = this._currentTime() + ttl;
      }
    }

    var data = this.storage[key];
    if (data) {
      data = this._parseData(data.value);
    }

    return this._fakePromise(data);
  },

  del: function(key, options) {
    options = options || {};

    var ttl = this._getOption(options, 'ttl');

    delete this.storage[key];

    return this._fakePromise(key);
  },

  check: function(key) {
    var check = this.storage[key];
    var expire = 0;
    if (check) {
      expire = check.expire - this._currentTime();
    }

    return this._fakePromise(expire);
  },

  touch: function(key, options) {
    options = options || {};
    var ttl = this._getOption(options, 'ttl');

    var check = this.storage[key];
    var expire = 0;
    if (check) {
      this.storage[key].expire = this._currentTime() + ttl;
    }

    return this._fakePromise(ttl);
  },

  clear: function() {
    this.storage = {};
  }
});

module.exports = MemoryAdapter;