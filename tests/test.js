var CacheUp = require('../')
  , sharedTests = require('./shared_tests')
  , redisTests = require('./redis_tests')

describe('CacheUp:Memory', function(){
  sharedTests(new CacheUp({
    type: 'memory'
  }));
});


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