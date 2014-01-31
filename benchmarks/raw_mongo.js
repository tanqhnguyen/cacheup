var MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server
  , host = '127.0.0.1'
  , port = 27017
  , collection = null
  , when = require('when');

var setupCollection = function() {
  var deferred = when.defer();
  if (collection) {
    process.nextTick(function(){
      deferred.resolve(collection);
    });
  } else {
    var mongoclient = new MongoClient(new Server(host, port), {});
    mongoclient.open(function(error, client){
      var db = client.db('test');
      collection = db.collection('cacheup');
      deferred.resolve(collection);
    });    
  }

  return deferred.promise;
}


module.exports = {
  name: 'Raw mongo insert/findOne',
  maxTime: 2,
  defer: true,
  onComplete: function() {
    setupCollection().done(function(collection){
      collection.remove(function(){

      });
    }, function(){

    });
  },
  fn: function(deferred) {
    var key = 'test';
    var data = {'some': 'data'};

    setupCollection().done(function(collection){
      collection.insert({
        key: key,
        value: JSON.stringify(data),
        expire: new Date().getTime()
      }, function(error){
        collection.findOne({key: key}, function(error, item){
          JSON.parse(item.value);
          deferred.resolve();
        });
      })
    }, function(){

    });
  }
};