var async    = require('async')
  , expect   = require('chai').expect
  , request  = require('supertest')
  , ObjectId = require('mongoose').Types.ObjectId
  , Notebook = require('../../lib/models').Notebook
  , Note     = require('../../lib/models').Note
  , app      = require('../../app');

require('../test_helper');

describe('Notebooks api', function() {
  describe('GET /api/notebooks', function() {
    beforeEach(function(done){
      async.parallel([
        function(cb) { Notebook.create({ name: 'Notebook 1' }, cb); },
        function(cb) { Notebook.create({ name: 'Notebook 2' }, cb); }
      ], done);
    });

    it('returns all notebooks', function(done) {
      request(app)
        .get('/api/notebooks')
        .expect(200)
        .end(function(err, res){
          expect(res.body).length(2);
          done();
        });
    });
  });

  describe('GET /api/notebooks/:notebookId', function() {
    var notebook1, notebook2;

    beforeEach(function(done) {
      notebook1 = Notebook({ name: 'Notebook 1' });
      notebook2 = Notebook({ name: 'Notebook 2' });

      async.parallel([
        function(cb) { notebook1.save(cb); },
        function(cb) { notebook2.save(cb); },
        function(cb) { Note.create({ body: 'Note 1', notebookId: notebook1 }, cb); },
        function(cb) { Note.create({ body: 'Note 2', notebookId: notebook1 }, cb); },
        function(cb) { Note.create({ body: 'Note 3', notebookId: notebook1 }, cb); },
        function(cb) { Note.create({ body: 'Other',  notebookId: notebook2 }, cb); }
      ], done);
    });

    it('returns list of notes', function(done) {
      request(app)
        .get('/api/notebooks/' + notebook1.id)
        .end(function(err, res){
          expect(res.status).equal(200);
          expect(res.body).length(3);
          done();
        });
    });

    it('returns 404 when notebook is not found', function(done) {
      request(app)
        .get('/api/notebooks/' + new ObjectId())
        .expect(404)
        .end(done);
    });
  });

  describe('POST /api/notebooks', function() {
    it('creates new notebook with valid params', function(done) {
      request(app)
        .post('/api/notebooks')
        .send({ name: 'New notebook' })
        .end(function(err, res){
          expect(res.status).equal(201);
          Notebook.count(function(err, count) {
            expect(count).equal(1);
            done();
          });
        });
    });

    it('responses 422 for invalid params', function(done) {
      request(app)
        .post('/api/notebooks')
        .send({ name: '' })
        .expect(422)
        .end(done);
    });
  });

  describe('PUT /api/notebooks/:notebookId', function() {
    var notebook = null;

    beforeEach(function(done) {
      notebook = Notebook({ _id: new ObjectId(), name: 'My notebook' });
      notebook.save(done);
    });

    it('updates selected notebook', function(done) {
      request(app)
        .put('/api/notebooks/' + notebook.id)
        .send({ name: 'Updated notebook' })
        .end(function(err, res){
          expect(res.status).equal(204);
          Notebook.findById(notebook, function(err, updatedNotebook) {
            expect(updatedNotebook.name).equal('Updated notebook');
            done();
          });
        });
    });

    it('responses 404 when notebook is not found', function(done) {
      request(app)
        .put('/api/notebooks/' + new ObjectId())
        .expect(404)
        .end(done);
    });

    it('responses 422 when params are not valid', function(done) {
      request(app)
        .put('/api/notebooks/' + notebook.id)
        .send({ name: '' })
        .expect(422)
        .end(done);
    });
  });

  describe('DELETE /api/notebooks/:notebookId', function() {
    var notebook = null;

    beforeEach(function(done) {
      notebook = Notebook({ _id: new ObjectId(), name: 'My notebook' });
      notebook.save(done);
    });

    it('updates selected notebook', function(done) {
      request(app)
        .del('/api/notebooks/' + notebook.id)
        .end(function(err, res){
          expect(res.status).equal(204);
          Notebook.count(function(err, count) {
            expect(count).equal(0);
            done();
          });
        });
    });

    it('responses 404 when notebook is not found', function(done) {
      request(app)
        .del('/api/notebooks/' + new ObjectId())
        .expect(404)
        .end(done);
    });
  });
});
