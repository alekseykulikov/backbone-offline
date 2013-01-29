var Tag   = require('../models').Tag
  , error = require('./errors');

exports.index = function(req, res){
  Tag.find({}, function(err, tags) {
    return err ? error.internalError(res) : res.json(200, tags);
  });
};

exports.create = function(req, res){
  Tag.create(req.body, function(err, tag) {
    return err ? error.unprocEntity(res, err) : res.json(201, tag);
  });
};

exports.update = function(req, res){
  if (!req.tag) return error.notFound(res);

  req.tag.set(req.body);
  req.tag.save(function(err) {
    return err ? error.unprocEntity(res, err) : res.send(204);
  });
};

exports.destroy = function(req, res){
  if (!req.tag) return error.notFound(res);

  req.tag.remove(function(err) {
    return err ? error.internalError(res) : res.send(204);
  });
};

exports.load = function(id, next) {
  Tag.findById(id, next);
};
