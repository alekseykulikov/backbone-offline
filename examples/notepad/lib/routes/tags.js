var Tag   = require('../models').Tag
  , error = require('./errors');

exports.index = function(req, res){
  Tag.find({}, function(err, tags) {
    if (err) return error.internalError(err, res);
    res.json(200, tags);
  });
};

exports.create = function(req, res){
  Tag.create(req.body, function(err, tag) {
    if (err) return error.unprocEntity(err, res);
    res.json(201, tag);
  });
};

exports.update = function(req, res){
  if (!req.tag) return error.notFound(null, res);

  req.tag.set(req.body);
  req.tag.save(function(err) {
    if (err) return error.unprocEntity(err, res);
    res.json(204);
  });
};

exports.destroy = function(req, res){
  if (!req.tag) return error.notFound(null, res);

  req.tag.remove(function(err) {
    if (err) return error.internalError(err, res);
    res.json(204);
  });
};

exports.load = function(id, next) {
  Tag.findById(id, function(err, tag) {
    if (err) return next(err);
    next(null, tag);
  });
};
