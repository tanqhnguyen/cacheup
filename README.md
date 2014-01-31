# CacheUp
A general purpose caching library using multiple data storages

At the moment, `CacheUp` supports 4 data storages `memory`, `file`, `mongo` and `redis`. The API for all storages are the same, so storages can be switched without changing any code

## Redis
`CacheUp` supports the use of multiple redis servers through consistent hashing algorithm. The mechanism is quite simple at first and does not support re-hashing keys when adding/removing servers (could be added in the future versions)

The sample configuration for `redis` when using `CacheUp`
```javascript
var cache = new Cacheup({
  servers: [
    {
      host: '127.0.0.1',
      port: 6379
    },
    {
      host: '127.0.0.1',
      port: 6378,
      password: 'i-am-invincible'
    }
  ],
  type: 'redis'
}));
```

Or when there is only one redis server to be used
```javascript
var cache = new Cacheup({
  host: '127.0.0.1',
  port: 6378,
  password: 'i-am-invincible',
  type: 'redis'
}));
```
* `password` is optional
* `host`, `port` are required

## File
Store cache in files. Considering the cost of SSD is now pretty low, using files for caching is a cheap solution to increase the performance

Initiate the `file` storage. Cache directory will be created if it is not existed. By default, if `cacheDir` is not set, `CacheUp` will create directory named `_cache` in `node_modules/cacheup/adatapers` to store cache files
```javascript
var cache = new Cacheup({
  type: 'file',
  cacheDir: '/absolute/path/to/cache/dir'
})
```

## MongoDB
Use mongo to store cache. Data is stored in a collection named `cacheup` which can be customized. Similar to `redis` adapter, `mongo` adapter also supports multiple databases through the use of consistent hashing algorithm

```javascript
var cache = new Cacheup({
  servers: [
    {
      host: '127.0.0.1',
      port: 27017,
      database: 'cache',
      collection: 'new_name'
    },
    {
      host: '127.0.0.1',
      port: 27016,
      database: 'cache',
      username: 'something',
      password: 'i-am-invincible'
    }
  ],
  type: 'mongo'
}));
```

Or when there is only one server to be used
```javascript
var cache = new Cacheup({
  host: '127.0.0.1',
  port: 27017,
  database: 'test',
  username: 'mongo',
  password: 'i-am-invincible',
  type: 'mongo'
}));
```
* `username`, `password`, `collection` are optional
* `host`, `port`, `database` are required

## Memory
Memory caching is not encouraged for using in production environment. It is supposed to be used during development (or demonstration) only. Using it in production might cause the server to be exploded and you hold full responsible for the consequences

Initiate the `memory` storage
```javascript
var cache = new Cacheup({
  type: 'memory'
})
```

## Other configuration options
The following options are used for all adapters

* `ttl`: the default time (in seconds) that the data should be cached. Default: `7200`
* `extendttl`: auto increase the expire time of a key when accessing it. Default `false`. This should be changed to true if you want your data to be cached forever (well not really, but as long as someone accesses it, the timer is reset)

Options can be passed in when calling a specific method to override the default one

## Install
```base
npm install cacheup
```

Load the library
```javascript
var CacheUp = require('cacheup');
```

## Dependencies
```javascript
"dependencies": {
  "underscore": "~1.5.2",
  "when": "~2.7.1",
  "redis": "~0.10.0",
  "arrg": "~0.1.3",
  "backbone": "~1.1.0",
  "hashring": "~1.0.3",
  "fs-extra": "~0.8.1",
  "mongodb": "~1.3.23",
  "hiredis": "~0.1.16" // (optional but recommended)
}
```

## APIs
All APIs support passing arguments normally as well as using object. For example
```javascript
cache.set(key, value, options, callback);

// Is equivalent to
cache.set({
  key: key,
  value: value,
  options: options,
  callback: callback
});
```

All APIs support callback and promise style
```javascript
cache.set(key, value, function(error, data){
  
});
// Is equivalent to
cache.set(key, value).done(function(data){
  
}, function(error){
  
});
```

### set(key, value [, options, callback])
Cache a `value` in `key`  
**Options**
* `ttl`: set the time (in seconds) for the data to be cached  

**Examples**
```javascript
cache.set(key, value).done(function(data){
  // data is the same as value
}, handleError);

// or callback-style
cache.set(key, value, function(error, data){
  if (error) return handleError(error);

});
```

Setting custom `ttl`
```javascript
cache.set(key, value, {ttl: 3600}).done(function(data){
  // data is the same as value
}, handleError);
// when using callback-style, the callback will go after the options
cache.set(key, value, {ttl: 3600}, function(error, data){
  if (error) return handleError(error);

});
```

### get(key [, options, callback])
Get the data at `key`  
**Options**
* `extendttl`: whether to auto reset the timer of the cached data

**Examples**
```javascript
cache.get(key).done(function(data){
  
}, handleError);

// or callback-style
cache.get(key, function(error, data){
  if (error) return handleError(error);

});
```

Setting custom `extendttl`
```javascript
cache.get(key, {extendttl: true}).done(function(data){
  
}, handleError);
// when using callback-style, the callback will go after the options
cache.get(key, {extendttl: true}, function(error, data){
  if (error) return handleError(error);

});
```

### fetch(key, fetch [, options, callback])
This is the convinient method to get the data from somewhere when it is not available and return the cached data when it is already cached

`fetch` can be written in callback or promise style. If it is written in callback style, the option `callback` must be set to true

**Options**
* `ttl`: set the time (in seconds) for the data to be cached  
* `extendttl`: whether to auto reset the timer of the cached data  
* `callback`: set to `true` to indicate that `fetch` is written in callback style

**Examples**
```javascript
// fetch in callback style
var getRecordFromDb = function(done) {
  queryDb(function(error, data){
    // do something with the data, maybe?
    done(error, data);
  });
}

// fetch in promise style
var getRecordFromDbPromise = function() {
  var deferred = getDefered(); // use some promise libraries to obtain the deferred object

  queryDb(function(error, data){
    // maybe use some utilities come with the promise library to "promisify" queryDb
    if (error) return deferred.reject(error);
    deferred.resolve(data);
  });

  return deferred.promise;
}

// then use it in cache
cache.fetch(key, getRecordFromDbPromise, {ttl: 10000}, function(error, data){
  // here, data can be either from queryDb or from the cache depends on the availability of it
});

// or
cache.fetch(key, getRecordFromDb, {ttl: 10000, callback: true}, function(error, data){
  
});
```
### del(key, fetch [, options, callback])
Delete the data at key and return the key

**Options**
There is no option for this, the signature is just for consistency

### ttl(key [, options, callback])
Get the remaining time of the key (in seconds)

**Options**
There is no option for this, the signature is just for consistency

### touch(key [, options, callback])
Reset the cache time for key

**Options**
* `ttl`: reset the cache time to a specific value

## Use cases
### Cache data between the application and the database
Imaging that an application needs to talk to the database (MySQL, Postgresql etc...), and each time the latency is about 500-1000ms depends on the complexity of the query. So cache layer can be put between them to reduce the latency

Here is a simple example using `node-postgres`
```javascript
var pg = require('pg');
var conString = "postgres://postgres:1234@localhost/postgres";
var cache = require('./cache');

var query = 'SELECT $1::int AS numbor';

var fetch = function(ok) {
  pg.connect(conString, function(err, client, done) {
    if(err) {
      return ok(err);
    }
    client.query(query, ['1'], function(err, result) {
      //call `done()` to release the client back to the pool
      done();

      if(err) {
        return ok(err);
      }
      return ok(null, result.rows[0].numbor);
    });
  });
}

// we can just use the query as the cache key
// maybe hash it using md5 so we have smaller namespace
cache.fetch(query, fetch, {callback: true}).done(function(numbor){
  //output: 1
  console.log(numbor);
}, handleError)
```

### Cache the whole web page
Another use case is to implement a simple cache middleware for express (or similar frameworks) to cache the page where possible

Here is another simple example
```javascript
var cacheLayer = function(req, res, next) {
  var key = req.url;

  var fetch = function() {
    var deferred = magicHappens();

    res.render('index', function(err, html){
      if (error) return deferred.reject(err);
      deferred.resolve(html);
    });
    // instead of simple page render, this could be a complex page with 
    // multiple queries to the database to get the related data

    return deferred.promise;
  }

  cache.fetch(key, fetch, function(error, html){
    if (error) {
      next(new Error(error));
    } else {
      // remember to set the correct headers
      res.end(html);
    }
  })
}
```

## Benchmarks
```bash
Running benchmark File Cache [benchmarks/file_cache.js]...
>> File Cache x 471 ops/sec ±2.05% (36 runs sampled)

Running benchmark Memory Cache [benchmarks/memory_cache.js]...
>> Memory Cache x 729 ops/sec ±1.38% (39 runs sampled)

Running benchmark Mongo Cache [benchmarks/mongo_cache.js]...
>> Mongo Cache x 356 ops/sec ±4.47% (33 runs sampled)

Running benchmark Raw mongo insert/findOne [benchmarks/raw_mongo.js]...
>> Raw mongo insert/findOne x 424 ops/sec ±2.01% (36 runs sampled)

Running benchmark Raw redis set/get [benchmarks/raw_redis.js]...
>> Raw redis set/get x 623 ops/sec ±1.07% (39 runs sampled)

Running benchmark Redis Cache [benchmarks/redis_cache.js]...
>> Redis Cache x 570 ops/sec ±1.46% (37 runs sampled)
```
The performance is somewhat similar to when using redis, mongodb directly. In this particular case, file cache is slowest because of my 3-year-old 5400RPM HDD

## Development
At the moment there are only several tests, more will be added later. Check `Gruntfile.js` and `package.json` for more information

## TODOs
* Support more cache storages such as ~~`file`~~, `memcached`, ~~`mongodb`~~, `couchbase` etc...
* Improve the performance where possible
* More tests
* More docs
* Somehow think of more ways to cache data instead of just `key-value` at the moment
* (Maybe) Move the adapters into separated repositories
* Support custom adapter
* Support add/remove servers on the fly
* Support failover servers
* Support cache size control for each adapters
* Implement some mechanism to automatically remove expired data. Currently only `redis` with built-in `ttl` feature supports that. Other adapters purge expired data as soon as it is accessed but not automatically like redis does

## License
MIT