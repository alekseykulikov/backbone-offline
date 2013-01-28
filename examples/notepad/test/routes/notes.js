require('../test_helper');

var async    = require('async')
  , expect   = require('chai').expect
  , request  = require('supertest')
  , ObjectId = require('mongoose').Types.ObjectId
  , Note     = require('../../lib/models').Note
  , Notebook = require('../../lib/models').Notebook
  , app      = require('../../app');

describe('Notes api', function() {
  var notebook = null;

  beforeEach(function(done) {
    notebook = Notebook({ name: 'Test' });
    notebook.save(done);
  });

  describe('GET /api/notes', function() {
    beforeEach(function(done){
      async.parallel([
        function(cb) { Note.create({ body: 'Note 1', notebookId: notebook }, cb); },
        function(cb) { Note.create({ body: 'Note 2', notebookId: notebook }, cb); },
        function(cb) { Note.create({ body: 'Note 3', notebookId: notebook }, cb); }
      ], done);
    });

    it('returns all notes', function(done) {
      request(app)
        .get('/api/notes')
        .expect(200)
        .end(function(err, res){
          if (err) return done(err);
          expect(res.body).length(3);
          done();
        });
    });
  });

  describe('POST /api/notes', function() {
    it('creates new note with valid params', function(done) {
      request(app)
        .post('/api/notes')
        .send({ body: 'New note', notebookId: notebook.id})
        .expect(201)
        .end(function(err, res){
          if (err) return done(err);
          Note.count(function(err, count) {
            expect(count).equal(1);
            done();
          });
        });
    });

    it('returns 422 for invalid params', function(done) {
      request(app)
        .post('/api/notes')
        .send({ body: '', notebookId: notebook.id})
        .expect(422)
        .end(done);
    });
  });

  describe('PUT /api/notes/:noteId', function() {
    var note = null;

    beforeEach(function(done) {
      note = Note({ body: 'My note', notebookId: notebook });
      note.save(done);
    });

    it('description', function(done) {
      // body...
      done();
    });
  });
});
