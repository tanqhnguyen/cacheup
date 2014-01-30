var redis = require('redis');
var client = redis.createClient(6379, '127.0.0.1');

module.exports = {
  name: 'Raw redis set/get',
  maxTime: 2,
  defer: true,
  onComplete: function() {
    client.flushdb();
  },
  fn: function(deferred) {
    var key = 'test';
    var data = {'some': 'data'};

    client.set(key, JSON.stringify(data), function(error){
      client.get(key, function(error, data){
        data = JSON.parse(data);
        deferred.resolve();
      });
    });
  }
};