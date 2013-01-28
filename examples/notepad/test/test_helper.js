process.env.NODE_ENV = 'test';
process.env.PORT     = '3001';

var async    = require('async')
  , Note     = require('../lib/models').Note
  , Notebook = require('../lib/models').Notebook
  , Tag      = require('../lib/models').Tag;

beforeEach(function(done){
  async.parallel([
    function(cb) { Note.remove({}, cb); },
    function(cb) { Notebook.remove({}, cb); },
    function(cb) { Tag.remove({}, cb); }
  ], done);
});
