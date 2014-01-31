var Abstract = require('./abstract')
  , when = require('when')
  , _ = require('underscore');

var DummyAdapter = Abstract.extend({
  initialize: function() {

  },

  set: function(key, value, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = this._getOption(options, 'ttl');

    // SET

    return deferred.promise;
  },

  get: function(key, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var extendttl = options.extendttl;

    if (typeof(extendttl) == 'undefined') {
      extendttl = this.options.extendttl;
    }

    var ttl = options.ttl || this.options.ttl;

    // GET

    return deferred.promise;
  },

  del: function(key, value, options) {
    options = options || {};
    var deferred = this.defer();

    // DEL

    return deferred.promise;
  },

  check: function(key) {
    var deferred = this.defer();

    // CHECK

    return deferred.promise;
  },

  touch: function(key, options) {
    var self = this;
    options = options || {};
    var deferred = this.defer();

    var ttl = options.ttl || this.options.ttl;

    // TOUCH

    return deferred.promise;
  },

  clear: function() {
    // CLEAR
  }
});

module.exports = DummyAdapter;