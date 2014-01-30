var _ = require('underscore')._;
var should = require('should');
var when = require('when');
var redis = require('redis');

var clients = {
  '127.0.0.1:6379': redis.createClient(6379, '127.0.0.1'),
  '127.0.0.1:6378': redis.createClient(6378, '127.0.0.1')
}

var getRedisClient = function(cache, key) {
  var ringValue = cache.adapter.getRingValue(key);
  return clients[ringValue];
}

module.exports = function(cache) {
  beforeEach(function(done){
    cache.clear();
    setTimeout(done, 200);
  });

  it('sets and makes sure that redis has data', function(done){
    var self = this;
    var obj = {"some": "data"};
    var key = 'test';
    
    cache.set(key, obj).ensure(done).done(function(data){
      getRedisClient(cache, key).get(key, function(error, result){
        should(_.isEqual(obj, JSON.parse(result))).be.ok;
      });
    }, should.fail);
  });

  it('sets and makes sure that redis has correct ttl', function(done){
    var self = this;
    var obj = {"some": "data"};
    var key = new Date().getTime();
    
    cache.set(key, obj).ensure(done).done(function(data){
      getRedisClient(cache, key).ttl(key, function(error, ttl){
        should(ttl).be.equal(cache.DEFAULTS.ttl);
      });
    }, should.fail);
  });

  it('dels and makes sure that the key is gone in redis', function(done){
    var self = this;
    var obj = {"some": "data"};
    var key = new Date().getTime();
    
    cache.set(key, obj).done(function(data){
      cache.del(key).ensure(done).done(function(){
        getRedisClient(cache, key).exists(key, function(error, result){
          should(result).not.be.ok;
        });
      }, should.fail);
    }, should.fail);
  });

  it('gets and keeps ttl in redis', function(done){
    var self = this;

    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj).then(function(){
      setTimeout(function(){
        cache.get(key).done(function(data){
          getRedisClient(cache, key).ttl(key, function(error, ttl){
            should(ttl).be.lessThan(cache.DEFAULTS.ttl);
            done();
          });
        }, should.fail);
      }, 1000);
    })
  });

  it('gets and extends ttl in redis', function(done){
    var self = this;

    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj).then(function(){
      setTimeout(function(){
        cache.get(key, {extendttl: true}).done(function(data){
          getRedisClient(cache, key).ttl(key, function(error, ttl){
            should(ttl).be.equal(cache.DEFAULTS.ttl);
            done();
          });
        }, should.fail);
      }, 1000);
    })
  });
}