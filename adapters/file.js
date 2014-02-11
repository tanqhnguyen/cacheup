var Abstract = require('./abstract')
  , fs = require('fs')
  , fsExtra = require('fs-extra')
  , md5 = require('../libs/md5')
  , arrg = require('arrg')
  , when = require('when')
  , path = require('path')
  , Timer = require('../libs/timer')
  , _ = require('underscore');

var FileAdapter = Abstract.extend({
  initialize: function(options) {
    if (!options.cacheDir) {
      this.options.cacheDir = __dirname + '/_cache';
    }

    this.timer = new Timer();
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

  _constructKey: function(key) {
    return md5(key+'');
  },

  _constructPath: function(key) {
    key = this._constructKey(key);
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
          data = null;
        } else {
          return deferred.reject(error);
        }
      }
      deferred.resolve(data? data.toString(): null);
    });

    return deferred.promise;
  },

  _writeFile: function(key, data, ttl) {
    var self = this;
    var deferred = this.defer();

    var path = this._constructPath(key);

    this._makeDir().done(function(){
      fs.writeFile(path, self._filterData(data), {

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

  _set: function(key, value, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = this._getOption(options, 'ttl');
    var promise = this._writeFile(key, value, ttl);

    this.timer.start(this._constructKey(key), ttl, function(){
      this._delFile(key);
    }, this);

    return promise;
  },

  _get: function(key, options) {
    var self = this;
    var deferred = this.defer();

    this._readFile(key).done(function(data){
      return deferred.resolve(self._parseData(data));
    }, deferred.reject);

    return deferred.promise;
  },

  _del: function(key, options) {
    options = options || {};
    this.timer.stop(this._constructKey(key));

    return this._delFile(key);
  },

  _ttl: function(key) {
    var self = this;
    var deferred = this.defer();

    process.nextTick(function(){
      deferred.resolve(self.timer.timeleft(self._constructKey(key)));
    });

    return deferred.promise;
  },

  _touch: function(key, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = options.ttl || this.options.ttl;

    process.nextTick(function(){
      self.timer.reset(self._constructKey(key), ttl);
      deferred.resolve(ttl);
    });

    return deferred.promise;
  },

  _clear: function() {
    fsExtra.remove(this.options.cacheDir);
    this.timer.clearAll();
  }
});

module.exports = FileAdapter;