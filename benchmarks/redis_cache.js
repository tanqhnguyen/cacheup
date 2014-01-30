var CacheUp = require('../');

var cache = new CacheUp({
  host: '127.0.0.1',
  port: 6379,
  type: 'redis'
});

module.exports = {
  name: 'Redis Cache',
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