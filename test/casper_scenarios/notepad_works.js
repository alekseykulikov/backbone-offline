var casper = require('./test/casper').create();

casper.start('http://localhost:3001/', function() {
  this.test.assertTitle('Notepad app', 'Expects app\'s title');
  this.test.assertEvalEquals(function() {
    return location.hash;
  }, '#notes/all', 'App automatically redirects to #notes/all');
  // Проверка на существование меню и отображения всех заметок
});

casper.then(function() {
  // переключение по блокнотам и тегам и проверка отображения элементов
});

casper.then(function() {
  // переключение в раздел notebooks
});

casper.then(function() {
  // переключение в раздел tags
});

casper.run(function() {
  this.test.renderResults(true);
});
