casper = require('../test_helper').casper;

describe('First sync', function() {
  beforeEach(function(done) {
    // Create test data
    done();
  });

  it('loads raw data', function(done) {
    casper('loads_raw_data', done);
  });
});
