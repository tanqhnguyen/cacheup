var Timer = function() {
  var timers = {};

  var start = function(id, ttl, func, context) {
    if (timers[id]) {
      stop(id);
    } 
    context = context || this;
    timers[id] = {
      timeout: setTimeout(function(){
        func.apply(context, []);
      }, ttl*1000),
      callback: func,
      context: context,
      ttl: ttl
    }
  };

  var stop = function(id) {
    var timer = timers[id];
    if (!timer) {
      return false;
    }

    clearTimeout(timer.timeout);
    delete timers[id];
  };

  var reset = function(id, ttl) {
    var timer = timers[id];
    if (!timer) {
      return false;
    }
    var callback = timer.callback;
    var context = timer.context;
    var _ttl = ttl || timer.ttl;

    stop(id);
    start(id, _ttl, callback, context);    
  };

  var clearAll = function() {
    for (var i in timers) {
      stop(i);
    }
  }

  // based on this http://stackoverflow.com/a/10786331/386378 with some modifications
  timeleft = function(id) {
    var timer = timers[id];
    if (!timer) {
      return 0;
    }

    var timeout = timer.timeout;
    return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
  }

  return {
    start: start,
    stop: stop,
    reset: reset,
    clearAll: clearAll,
    timeleft: timeleft
  }
}

module.exports = Timer;