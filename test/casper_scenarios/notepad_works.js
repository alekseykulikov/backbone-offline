var casper = require('./test/casper').create();

function tableHas(count, message) {
  casper.test.assertEvalEquals(function() {
    return $('table tr').length;
  }, count, message);
}

casper.start('http://localhost:3001/', function() {
  this.test.assertTitle('Notepad app', 'Expects app\'s title');

  this.test.assertEvalEquals(function() {
    return location.hash;
  }, '#notes/all', 'App automatically redirects to #notes/all');

  this.test.assertEvalEquals(function() {
    return $('.nav-list:first-of-type li').length;
  }, 3, 'Notebooks menu has 3 links: "All Notes" + 2 notebooks');

  this.test.assertEvalEquals(function() {
    return $('.nav-list:last-of-type li').length;
  }, 3, 'Tags menu has 3 links by tags');

  tableHas(5, 'Table displays all notes');
});

casper.thenClick('.nav-list:first-of-type li:nth-child(2) a', function() {
  tableHas(3, 'Table displays only notes for first notebook');
});

casper.thenClick('.nav-list:last-of-type li:nth-child(3) a', function() {
  tableHas(2, 'Table is filtered by last tag');
});

casper.thenClick('[href="#notebooks"]', function() {
  tableHas(2, 'Table displays all notebooks');
  this.test.assertDoesntExist('.nav-list', 'Sidebar does not exists');
});

casper.thenClick('[href="#tags"]', function() {
  tableHas(3, 'Table displays all tags');
  this.test.assertDoesntExist('.nav-list', 'Sidebar does not exists again');
});

casper.run(function() {
  this.test.renderResults(true);
});
