var Abstract = require('./abstract')
  , fs = require('fs')
  , fsExtra = require('fs-extra')
  , md5 = require('../libs/md5')
  , arrg = require('arrg')
  , when = require('when')
  , path = require('path')
  , _ = require('underscore');

var FileAdapter = Abstract.extend({
  initialize: function(options) {
    if (!options.cacheDir) {
      throw "Must specify cacheDir";
    }
  },

  _makeDir: function() {
    var deferred = this.defer();
    var dir = this.options.cacheDir;

    fs.exists(dir, function(exists){
      if (!exists) {
        fs.mkdir(dir, 0755, function(error){
          if (error) return deferred.reject(error);
          deferred.resolve(exists);
        });
      } else {
        deferred.resolve(exists);
      }
    });

    return deferred.promise;
  },

  _currentTime: function() {
    var currentTime = new Date().getTime();
    return Math.round(currentTime/1000);
  },

  _constructPath: function(key) {
    key = md5(key+'');
    return path.join(this.options.cacheDir, key);
  },

  _readFile: function(key) {
    var self = this;
    var deferred = this.defer();

    var path = this._constructPath(key);

    fs.readFile(path, function(error, data){
      if (error) {
        if (error.errno == 34) {
          // file not existed, just return dump data
          data = JSON.stringify({expire: null, value: null});
        } else {
          return deferred.reject(error);
        }
      }
      deferred.resolve(self._parseData(data.toString()));
    });

    return deferred.promise;
  },

  _writeFile: function(key, data, ttl) {
    var filteredData = this._filterData(data);
    var deferred = this.defer();

    var actualContent = {
      value: filteredData,
      expire: this._currentTime() + ttl
    };

    var path = this._constructPath(key);

    this._makeDir().done(function(){
      fs.writeFile(path, JSON.stringify(actualContent), {

      }, function(error, result){
        if (error) return deferred.reject(error);
        deferred.resolve(data);
      });
    });

    return deferred.promise;
  },

  _delFile: function(key) {
    var deferred = this.defer();

    var path = this._constructPath(key);

    fs.unlink(path, function(error, result){
      if (error) return deferred.reject(error);
      deferred.resolve(key);
    });

    return deferred.promise;
  },

  set: function(key, value, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = this._getOption(options, 'ttl');

    return this._writeFile(key, value, ttl);
  },

  get: function(key, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var extendttl = options.extendttl;

    if (typeof(extendttl) == 'undefined') {
      extendttl = this.options.extendttl;
    }

    var ttl = options.ttl || this.options.ttl;

    this._readFile(key).otherwise(deferred.reject).done(function(data){
      if (data.expire && data.expire <= self._currentTime()) {
        self.del(key); // should take care of error here, maybe?
        deferred.resolve(null);
      } else {
        if (extendttl) {
          self.touch(key, {ttl: ttl}).otherwise(deferred.reject).done(function(){
            deferred.resolve(self._parseData(data.value));
          }); 
        } else {
          deferred.resolve(self._parseData(data.value));
        }
      }
    });

    return deferred.promise;
  },

  del: function(key, options) {
    options = options || {};

    var ttl = options.ttl || this.options.ttl;

    return this._delFile(key);
  },

  check: function(key) {
    var self = this;
    var deferred = this.defer();

    this._readFile(key).otherwise(deferred.reject).done(function(data){
      deferred.resolve(data.expire - self._currentTime());
    });

    return deferred.promise;
  },

  touch: function(key, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = options.ttl || this.options.ttl;

    this._readFile(key).otherwise(deferred.reject).done(function(data){
      self.set(key, data.value, {ttl: ttl}).otherwise(deferred.reject).done(function(){
        deferred.resolve(ttl);
      });
    });

    return deferred.promise;
  },

  clear: function() {
    fsExtra.remove(this.options.cacheDir);
  }
});

module.exports = FileAdapter;