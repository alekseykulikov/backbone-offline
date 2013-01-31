var async    = require('async')
  , casper   = require('../functional_helper').casper
  , Note     = require('../functional_helper').Note
  , Notebook = require('../functional_helper').Notebook
  , Tag      = require('../functional_helper').Tag;

describe('First sync', function() {
  beforeEach(function(done) {
    var notebook1 = Notebook({ name: 'Notebook 1' })
      , notebook2 = Notebook({ name: 'Notebook 2' })
      , tag1      = Tag({ name: 'Tag 1' })
      , tag2      = Tag({ name: 'Tag 2' })
      , tag3      = Tag({ name: 'Tag 3' });

    async.parallel([
      function(cb) { notebook1.save(cb); },
      function(cb) { notebook2.save(cb); },
      function(cb) { tag1.save(cb); },
      function(cb) { tag2.save(cb); },
      function(cb) { tag3.save(cb); },
      function(cb) { Note.create({ body: 'Note 1', notebookId: notebook1, tags: [tag1] }, cb); },
      function(cb) { Note.create({ body: 'Note 2', notebookId: notebook1, tags: [tag1, tag2] }, cb); },
      function(cb) { Note.create({ body: 'Note 3', notebookId: notebook2, tags: [tag3] }, cb); },
      function(cb) { Note.create({ body: 'Note 4', notebookId: notebook1, tags: [tag2] }, cb); },
      function(cb) { Note.create({ body: 'Note 5', notebookId: notebook2, tags: [tag1, tag2, tag3] }, cb); }
    ], done);
  });

  it('display raw data', function(done) {
    casper('display_raw_data', done);
  });
});
