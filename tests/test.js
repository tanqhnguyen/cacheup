var Cacheup = require('../')
var sharedTests = require('./shared_tests');

describe('Cacheup:Memory', function(){
  sharedTests(new Cacheup({
    type: 'memory'
  }));
});

describe('Cacheup:Redis', function(){
  sharedTests(new Cacheup({
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
  }));
});