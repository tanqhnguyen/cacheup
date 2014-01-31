var CacheUp = require('../')
  , sharedTests = require('./shared_tests')
  , redisTests = require('./redis_tests')

describe('CacheUp:Memory', function(){
  sharedTests(new CacheUp({
    type: 'memory'
  }));
});

// Redis tests
var redisCache = new CacheUp({
  servers: [
    {
      host: '127.0.0.1',
      port: 6379
    },
    {
      host: '127.0.0.1',
      port: 6378
    }
  ],
  type: 'redis'
});
describe('CacheUp:Redis', function(){
  sharedTests(redisCache);

  redisTests(redisCache);
});

// file tests
var fileCache = new CacheUp({
  cacheDir: __dirname + '/cache_dir',
  type: 'file'
});

describe('CacheUp:File', function(){
  sharedTests(fileCache);

  after(function(done){
    fileCache.clear();
    done();
  });
});

// mongo tests
var mongoCache = new CacheUp({
  servers: [
    {
      host: '127.0.0.1',
      port: 27017,
      database: 'test'
    }
  ],
  type: 'mongo'
});
describe('CacheUp:Mongo', function(){
  sharedTests(mongoCache);
});