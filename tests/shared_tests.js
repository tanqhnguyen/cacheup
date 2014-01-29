var _ = require('underscore')._;
var should = require('should');
var when = require('when');

module.exports = function(cache) {
  beforeEach(function(done){
    cache.clear();
    setTimeout(done, 200);
  });

  it('sets and returns data', function(done){
    var self = this;
    var obj = {"some": "data"};

    cache.set('test', obj).ensure(done).done(function(data){
      should(_.isEqual(obj, data)).be.ok;
    }, should.fail);
  });

  it('sets and gets data', function(done){
    var self = this;

    var key = new Date().getTime();
    var obj = {"some": "data"};
    cache.set(key, obj).ensure(done).then(function(){
      cache.get(key).done(function(data){
        should(_.isEqual(data, obj)).be.ok;
      }, should.fail);
    })
  });

  it('sets data with default ttl', function(done){
    var self = this;

    var key = new Date().getTime();
    var obj = {"some": "data"};

    var check = function() {
      cache.check(key).ensure(done).done(function(ttl){
        should(ttl == 7200).be.ok;
      }, should.fail);
    }

    cache.set(key, obj).ensure(check).done(function(data){
      should(_.isEqual(obj, data)).be.ok;
    }, should.fail);
  });

  it('sets data with custom ttl', function(done){
    var self = this;

    var key = new Date().getTime();
    var obj = {"some": "data"};
    var customttl = 3600;

    var check = function() {
      cache.check(key).ensure(done).done(function(ttl){
        should(ttl == customttl).be.ok;
      }, should.fail);
    }

    cache.set(key, obj, {ttl: customttl}).ensure(check).done(function(data){
      should(_.isEqual(obj, data)).be.ok;
    }, should.fail);
  });

  it('gets data and keeps ttl', function(done){
    var self = this;

    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj).then(function(){
      setTimeout(function(){
        cache.get(key).done(function(data){
          cache.check(key).ensure(done).done(function(ttl){
            should(ttl).be.equal(7199);
          }, should.fail);
        }, should.fail);
      }, 1000);
    })
  });

  it('gets data and extends ttl', function(done){
    var self = this;

    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj).then(function(){
      setTimeout(function(){
        cache.get(key, {extendttl: true}).done(function(data){
          cache.check(key).ensure(done).done(function(ttl){
            should(ttl).be.equal(7200);
          }, should.fail);
        }, should.fail);
      }, 1000);
    })
  });

  it('deletes data', function(done){
    var self = this;

    var key = new Date().getTime();
    var obj = {"some": "data"};

    cache.set(key, obj).done(function(){
      cache.del(key).done(function(){
        cache.get(key).done(function(data){
          should(data).not.be.ok;
          done();
        }, should.fail);
      }, should.fail)
    }, should.fail)
  });

  it('fetches data using callback', function(done){
    var key = new Date().getTime();
    var obj = {"some": "data"};

    var fetch = function(ok) {
      should(ok).be.ok; // makes sure fetch is called
      setTimeout(function(){
        ok(null, obj);
      }, 500);
    }

    cache.fetch(key, fetch, {callback: true}).ensure(done).done(function(data){
      should(_.isEqual(obj, data)).be.ok;
    }, should.fail);
  });

  it('fetches data using promise', function(done){
    var key = new Date().getTime();
    var obj = {"some": "data"};

    var fetch = function() {
      var deferred = when.defer();

      setTimeout(function(){
        deferred.resolve(obj);
      }, 500);

      return deferred.promise;
    }

    cache.fetch(key, fetch).ensure(done).done(function(data){
      should(_.isEqual(obj, data)).be.ok;
    }, should.fail);
  });

  it('skips fetching when data is available', function(done){
    var key = new Date().getTime();
    var obj = {"some": "data"};

    var fetch = function() {
      should.fail('should not fetch here');
      var deferred = when.defer();

      setTimeout(function(){
        deferred.resolve(obj);
      }, 500);

      return deferred.promise;
    }

    cache.set(key, obj).done(function(){
      cache.fetch(key, fetch).ensure(done).done(function(data){
        should(_.isEqual(obj, data)).be.ok;
      }, should.fail);
    }, should.fail);
  });

  it('touches data', function(done){
    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj).done(function(){
      setTimeout(function(){
        cache.touch(key).ensure(done).done(function(ttl){
          should(ttl).be.equal(7200);
        }, should.fail);
      }, 1000);
    }, should.fail);
  });

  it('touches data with specific ttl', function(done){
    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj).done(function(){
      setTimeout(function(){
        cache.touch(key, {ttl: 3200}).ensure(done).done(function(ttl){
          should(ttl).be.equal(3200);
        }, should.fail);
      }, 1000);
    }, should.fail);
  });

  it('supports callback-style', function(done){
    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj, function(error, data){
      should(_.isEqual(obj, data)).be.ok;
      done();
    });
  });

  it('supports callback-style with options', function(done){
    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set(key, obj, {ttl: 3600}, function(error, data){
      should(_.isEqual(obj, data)).be.ok;
      done();
    });
  });

  it('supports passing arguments as an object in callback-style', function(done){
    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set({
      key: key,
      value: obj,
      callback: function(error, data) {
        should(_.isEqual(obj, data)).be.ok;
        done();
      },
      options: {
        ttl: 3600
      }
    });
  });

  it('supports passing arguments as an object in promis-style', function(done){
    var obj = {"some": "data"};
    var key = new Date().getTime();

    cache.set({
      key: key,
      value: obj,
      options: {
        ttl: 3600
      }
    }).ensure(done).done(function(data){
      should(_.isEqual(obj, data)).be.ok;
    }, should.fail);
  });
}