require('../test_helper');

var async    = require('async')
  , expect   = require('chai').expect
  , request  = require('supertest')
  , ObjectId = require('mongoose').Types.ObjectId
  , Tag      = require('../../lib/models').Tag
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
        .expect(200)
        .end(function(err, res){
          expect(res.body).length(4);
          done();
        });
    });
  });

  describe('POST /api/tags', function() {
    it('creates new tag with valid params', function(done) {
      request(app)
        .post('/api/tags')
        .send({ name: 'New tag' })
        .expect(201)
        .end(function(err, res){
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
    var tag = null;

    beforeEach(function(done) {
      tag = Tag({ _id: new ObjectId(), name: 'My tag' });
      tag.save(done);
    });

    it('updates selected tag', function(done) {
      request(app)
        .put('/api/tags/' + tag.id)
        .send({ name: 'Updated tag' })
        .expect(204)
        .end(function(err, res){
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
    var tag = null;

    beforeEach(function(done) {
      tag = Tag({ _id: new ObjectId(), name: 'My tag' });
      tag.save(done);
    });

    it('updates selected tag', function(done) {
      request(app)
        .del('/api/tags/' + tag.id)
        .expect(204)
        .end(function(err, res){
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
