var Casper = require('casper').Casper;

exports.create = function(initCb) {
  var casper = new Casper({
    viewportSize: {
        width: 1024
      , height: 768
    }
  });

  casper.on('page.initialized', function() {
    if (initCb) initCb.call(casper);
  });

  return casper;
};
