var CacheUp = require('../')
  , timerTests = require('./timer_tests')
  , should = require('should')
  , sharedTests = require('./shared_tests')

timerTests();

describe('CacheUp:Memory', function(){
  sharedTests(new CacheUp({
    type: 'memory'
  }));
});

// Redis tests
// var redisTests = require('./redis_tests')
// var redisCache = new CacheUp({
//   servers: [
//     {
//       host: '127.0.0.1',
//       port: 6379
//     },
//     {
//       host: '127.0.0.1',
//       port: 6378
//     }
//   ],
//   type: 'redis'
// });
// describe('CacheUp:Redis', function(){
//   sharedTests(redisCache);

//   redisTests(redisCache);
// });

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