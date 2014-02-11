var Timer = require('../libs/timer')
  , should = require('should')

module.exports = function() {
  describe('Timer', function(){
    before(function(){
      this.timer = new Timer();
    })

    it('runs callback correctly', function(done){
      var now = new Date().getTime();
      var ttl = 1; // second
      var check = function() {
        var then = new Date().getTime();
        var diff = then - now;
        should(diff >= ttl*1000).be.ok;
        done();
      }
      this.timer.start(12, ttl, check);
    });

    it('runs callback correctly with context', function(done){
      this.some = 'thing';
      var ttl = 1; // second
      var check = function() {
        should(this.some).be.equal('thing');
        done();
      }
      this.timer.start(12, ttl, check, this);
    });

    it('returns correct timeleft', function(done){
      var ttl = 1; // second
      var id = 12;
      var check = function() {
        done();
      }
      this.timer.start(id, ttl, check, this);
      var timeleft = this.timer.timeleft(id);
      should(timeleft).be.equal(ttl);
    });

    it('stops timeout correctly', function(done){
      var ttl = 1; // second
      var id = 12;
      var check = function() {
        should.fail("exploded");
      }

      this.timer.start(id, ttl, check, this);
      this.timer.stop(id);
      setTimeout(function(){
        done();
      }, ttl*1000);
    });

    afterEach(function(){
      this.timer.clearAll();
    });

  });
}