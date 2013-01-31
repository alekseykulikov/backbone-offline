var Casper = require('casper').Casper;

exports.create = function() {
  return new Casper({
    viewportSize: {
        width: 1200
      , height: 800
    }
  });
};
