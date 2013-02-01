require('../test_helper');

var async    = require('async')
  , expect   = require('chai').expect
  , request  = require('supertest')
  , ObjectId = require('mongoose').Types.ObjectId
  , Note     = require('../../lib/models').Note
  , Notebook = require('../../lib/models').Notebook
  , app      = require('../../app');

describe('Notes api', function() {
  var notebook;

  beforeEach(function(done) {
    notebook = Notebook({ name: 'Test' });
    notebook.save(done);
  });

  describe('GET /api/notes', function() {
    beforeEach(function(done){
      async.parallel([
        function(cb) { Note.create({ name: 'Note 1', notebookId: notebook }, cb); },
        function(cb) { Note.create({ name: 'Note 2', notebookId: notebook }, cb); },
        function(cb) { Note.create({ name: 'Note 3', notebookId: notebook }, cb); }
      ], done);
    });

    it('returns all notes', function(done) {
      request(app)
        .get('/api/notes')
        .end(function(err, res){
          expect(res.status).equal(200);
          expect(res.body).length(3);
          done();
        });
    });
  });

  describe('POST /api/notes', function() {
    it('creates new note with valid params', function(done) {
      request(app)
        .post('/api/notes')
        .send({ name: 'New note', notebookId: notebook.id })
        .end(function(err, res){
          expect(res.status).equal(201);
          Note.count(function(err, count) {
            expect(count).equal(1);
            done();
          });
        });
    });

    it('returns 422 for invalid params', function(done) {
      request(app)
        .post('/api/notes')
        .send({ name: '', notebookId: notebook.id })
        .expect(422)
        .end(done);
    });
  });

  describe('PUT /api/notes/:noteId', function() {
    var note;

    beforeEach(function(done) {
      note = Note({ name: 'My note', notebookId: notebook });
      note.save(done);
    });

    it('updates selected note', function(done) {
      request(app)
        .put('/api/notes/' + note.id)
        .send({ name: 'Updated note' })
        .end(function(err, res){
          expect(res.status).equal(204);
          Note.findById(note, function(err, updatedNote) {
            expect(updatedNote.name).equal('Updated note');
            done();
          });
        });
    });

    it('returns 404 when note is not found', function(done) {
      request(app)
        .put('/api/notes/' + new ObjectId())
        .expect(404)
        .end(done);
    });

    it('returns 422 when params are not valid', function(done) {
      request(app)
        .put('/api/notes/' + note.id)
        .send({ name: 'Updated note', notebookId: '' })
        .expect(422)
        .end(done);
    });
  });

  describe('DELETE /api/notes/:noteId', function() {
    var note;

    beforeEach(function(done) {
      note = Note({ name: 'My note', notebookId: notebook });
      note.save(done);
    });

    it('updates selected note', function(done) {
      request(app)
        .del('/api/notes/' + note.id)
        .end(function(err, res){
          expect(res.status).equal(204);
          Note.count(function(err, count) {
            expect(count).equal(0);
            done();
          });
        });
    });

    it('returns 404 when note is not found', function(done) {
      request(app)
        .del('/api/notes/' + new ObjectId())
        .expect(404)
        .end(done);
    });
  });
});
