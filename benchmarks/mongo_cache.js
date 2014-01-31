var CacheUp = require('../');

var cache = new CacheUp({
  host: '127.0.0.1',
  port: 27017,
  database: 'test',
  type: 'mongo'
});

module.exports = {
  name: 'Mongo Cache',
  maxTime: 2,
  defer: true,
  onComplete: function() {
    cache.clear();
  },
  fn: function(deferred) {
    var key = 'test';
    var data = {'some': 'data'};

    cache.set(key, data).done(function(){
      cache.get(key).done(function(data){
        deferred.resolve();
      }, function(error){

      });
    }, function(error){

    });
  }
};