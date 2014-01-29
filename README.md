# CacheUp
A general purpose caching library using multiple data storages

At the moment, `CacheUp` supports 2 data storages `memory` and `redis`. The API for all storages are the same, so storages can be switched without changing any code

## Redis
At the moment, `redis` does not have clustering support in the stable branch. `CacheUp` supports the use of multiple redis servers through consistent hashing algorithm. The mechanism is quite simple at first and does not support re-hashing keys when adding/removing servers (could be added in the future versions)

The simpliest configuration for `redis` when using `CacheUp`
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

## Memory
Memory caching is not encouraged for using in production environment. It is supposed to be used during development (or demonstration) only. Using it in production might cause the server to be exploded and you hold full responsible for the consequences

Initiate the `memory` storage
```javascript
var cache = new Cacheup({
  type: 'memory'
})
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

### CacheUp.set(key, value [, options, callback])
Cache a `value` in `key`









