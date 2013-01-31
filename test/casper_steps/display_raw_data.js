var casper = require('./test/casper').create();

casper.start('http://localhost:3001/', function() {
  this.test.assertTitle('Notepad app', 'Expects app\'s title');
  this.test.assertEval(function() {
    return location.hash === '#notes/all';
  }, 'App automatically redirects to all page');
});

casper.then(function() {
  this.capture('temp/capture.png');
});

casper.run(function() {
  this.test.done(2);
  this.test.renderResults(true);
});
