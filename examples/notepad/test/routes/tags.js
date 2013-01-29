require('../test_helper');

var async    = require('async')
  , expect   = require('chai').expect
  , request  = require('supertest')
  , ObjectId = require('mongoose').Types.ObjectId
  , Tag      = require('../../lib/models').Tag
  , Notebook = require('../../lib/models').Notebook
  , Note     = require('../../lib/models').Note
  , app      = require('../../app');

describe('Tags api', function() {
  describe('GET /api/tags', function() {
    beforeEach(function(done){
      async.parallel([
        function(cb) { Tag.create({ name: 'Tag 1' }, cb); },
        function(cb) { Tag.create({ name: 'Tag 2' }, cb); },
        function(cb) { Tag.create({ name: 'Tag 3' }, cb); },
        function(cb) { Tag.create({ name: 'Tag 4' }, cb); }
      ], done);
    });

    it('returns all tags', function(done) {
      request(app)
        .get('/api/tags')
        .end(function(err, res){
          expect(res.status).equal(200);
          expect(res.body).length(4);
          done();
        });
    });
  });

  describe('GET /api/tags/:tagId', function() {
    var tag1, tag2, notebook;

    beforeEach(function(done) {
      notebook = Notebook({ name: 'Notebook 1' });
      tag1     = Tag({ name: 'Tag 1' });
      tag2     = Tag({ name: 'Tag 2' });

      async.parallel([
        function(cb) { tag1.save(cb); },
        function(cb) { tag2.save(cb); },
        function(cb) { notebook.save(cb); },
        function(cb) { Note.create({ body: 'Note 1', notebookId: notebook, tags: [tag1.id, tag2.id] }, cb); },
        function(cb) { Note.create({ body: 'Note 2', notebookId: notebook, tags: [tag1.id] }, cb); },
        function(cb) { Note.create({ body: 'Note 3', notebookId: notebook, tags: [tag2.id] }, cb); },
        function(cb) { Note.create({ body: 'Note 4', notebookId: notebook, tags: [tag1.id] }, cb); }
      ], done);
    });

    it('returns list of notes', function(done) {
      request(app)
        .get('/api/tags/' + tag1.id)
        .end(function(err, res){
          expect(res.status).equal(200);
          expect(res.body).length(3);
          done();
        });
    });

    it('returns 404 when tag is not found', function(done) {
      request(app)
        .get('/api/tags/' + new ObjectId())
        .expect(404)
        .end(done);
    });
  });

  describe('POST /api/tags', function() {
    it('creates new tag with valid params', function(done) {
      request(app)
        .post('/api/tags')
        .send({ name: 'New tag' })
        .end(function(err, res){
          expect(res.status).equal(201);
          Tag.count(function(err, count) {
            expect(count).equal(1);
            done();
          });
        });
    });

    it('returns 422 for invalid params', function(done) {
      request(app)
        .post('/api/tags')
        .send({ name: '' })
        .expect(422)
        .end(done);
    });
  });

  describe('PUT /api/tags/:tagId', function() {
    var tag;

    beforeEach(function(done) {
      tag = Tag({ name: 'My tag' });
      tag.save(done);
    });

    it('updates selected tag', function(done) {
      request(app)
        .put('/api/tags/' + tag.id)
        .send({ name: 'Updated tag' })
        .end(function(err, res){
          expect(res.status).equal(204);
          Tag.findById(tag, function(err, updatedTag) {
            expect(updatedTag.name).equal('Updated tag');
            done();
          });
        });
    });

    it('returns 404 when tag is not found', function(done) {
      request(app)
        .put('/api/tags/' + new ObjectId())
        .expect(404)
        .end(done);
    });

    it('returns 422 when params are not valid', function(done) {
      request(app)
        .put('/api/tags/' + tag.id)
        .send({ name: '' })
        .expect(422)
        .end(done);
    });
  });

  describe('DELETE /api/tags/:tagId', function() {
    var tag;

    beforeEach(function(done) {
      tag = Tag({ name: 'My tag' });
      tag.save(done);
    });

    it('updates selected tag', function(done) {
      request(app)
        .del('/api/tags/' + tag.id)
        .end(function(err, res){
          expect(res.status).equal(204);
          Tag.count(function(err, count) {
            expect(count).equal(0);
            done();
          });
        });
    });

    it('returns 404 when tag is not found', function(done) {
      request(app)
        .del('/api/tags/' + new ObjectId())
        .expect(404)
        .end(done);
    });
  });
});
