var casper = require('./test/casper').create(function() {
  this.evaluate(function() {
    localStorage.clear();
  });
});

casper.start('http://localhost:3001/', function() {
  // Запускается процесс первой синхронизации
  // Все полученные данные сохраняются в localStorage
});

casper.run(function() {
  this.test.renderResults(true);
});
