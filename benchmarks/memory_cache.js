var CacheUp = require('../');

var cache = new CacheUp({
  type: 'memory'
});

module.exports = {
  name: 'Memory Cache',
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