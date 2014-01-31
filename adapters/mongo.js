var Abstract = require('./abstract')
  , when = require('when')
  , _ = require('underscore')

  , md5 = require('../libs/md5')
  , MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server;

var MongoAdapter = Abstract.extend({
  initialize: function() {
    this._dbCache = {};
  },

  _key: function(key) {
    return md5(key+'');
  },

  _currentTime: function() {
    var currentTime = new Date().getTime();
    return Math.round(currentTime/1000);
  },

  _authenticate: function(serverOptions, db) {
    var deferred = this.defer();

    if (serverOptions.username && serverOptions.password) {
      db.authenticate(serverOptions.username, serverOptions.password, function(error, result){
        if (error) return deferred.reject(error);
        if (result) {
          deferred.resolve(db);
        } else {
          deferred.reject("Invalid credentials");
        }
      });
    } else {
      process.nextTick(function(){
        deferred.resolve(db);
      });
    }

    return deferred.promise;
  },

  _pickCollection: function(key) {
    var self = this;

    var deferred = this.defer();
    var hostPort = this.getRingValue(key);
    var hostPortArray = hostPort.split(":");

    var host = hostPortArray[0];
    var port = parseInt(hostPortArray[1]);
    var server = _.findWhere(this.options.servers, {
      host: host,
      port: port
    });
    var db = this._dbCache[hostPort];

    if (db) {
      process.nextTick(function(){
        deferred.resolve(db.collection(MongoAdapter.COLLECTION_NAME));
      });
    } else {
      server.options = server.options || {};
      var connectOptions = _.defaults(server.options, MongoAdapter.DEFAULT_CONNECT_OPTIONS);

      var mongoclient = new MongoClient(new Server(host, port), connectOptions);
      mongoclient.open(function(error, client){
        if (error) return deferred.reject(error);
        var _db = client.db(server.database);
        self._authenticate(server, _db).done(function(finalDb){
          self._dbCache[hostPort] = finalDb;
          deferred.resolve(finalDb.collection(MongoAdapter.COLLECTION_NAME));
        }, deferred.reject);
      });
    }
    
    return deferred.promise;
  },

  set: function(key, value, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = this._getOption(options, 'ttl');
    this._pickCollection(key).done(function(collection){
      collection.insert({
        key: self._key(key),
        value: self._filterData(value),
        expire: self._currentTime() + ttl
      }, function(error, doc){
        if (error) return deferred.reject(error);
        deferred.resolve(value);
      });
    }, deferred.reject);

    return deferred.promise;
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

    var resolve = function(value) {
      deferred.resolve(self._parseData(value));
    };

    this._pickCollection(key).done(function(collection){
      collection.findOne({
        key: self._key(key)
      }, function(error, item){
        if (error) return deferred.reject(error);

        if (item) {
          if (extendttl) {
            self.touch(key, {ttl: ttl}).done(function(){
              resolve(item.value);
            }, deferred.reject);
          } else {
            if (item.expire <= self._currentTime) {
              self.del(key).done(function(){
                resolve(null);
              });
            } else {
              resolve(item.value);
            }
          }
        } else {
          deferred.resolve(null);
        }
      });
    }, deferred.reject);

    return deferred.promise;
  },

  del: function(key, value, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    this._pickCollection(key).done(function(collection){
      collection.remove({
        key: self._key(key)
      }, function(error, item){
        if (error) return deferred.reject(error);
        deferred.resolve(key);
      });
    }, deferred.reject);

    return deferred.promise;
  },

  check: function(key) {
    var deferred = this.defer();
    var self = this;

    this._pickCollection(key).done(function(collection){
      collection.findOne({
        key: self._key(key)
      }, function(error, item){
        if (error) return deferred.reject(error);
        var expire = 0;
        if (item) {
          expire = item.expire - self._currentTime();
        }
        deferred.resolve(expire);
      });
    }, deferred.reject);

    return deferred.promise;
  },

  touch: function(key, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = options.ttl || this.options.ttl;

    this._pickCollection(key).done(function(collection){
      collection.findOne({
        key: self._key(key)
      }, function(error, item){
        if (error) return deferred.reject(error);
        if (item) {
          var expire = self._currentTime() + ttl;
          collection.update(
            {key: self._key(key)},
            {$set: {expire: expire}},
            {multi: true}, function(error, item){
              if (error) return deferred.reject(error);
              deferred.resolve(ttl);
          });
        }
      });
    }, deferred.reject);

    return deferred.promise;
  },

  clear: function() {
    _.each(this._dbCache, function(db){
      db.collection(MongoAdapter.COLLECTION_NAME).remove(function(){

      });
    });
  }
}, {
  DEFAULT_CONNECT_OPTIONS: {
    
  },
  COLLECTION_NAME: 'cacheup'
});

module.exports = MongoAdapter;