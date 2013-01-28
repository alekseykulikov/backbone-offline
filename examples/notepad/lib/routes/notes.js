var Note  = require('../models').Note
  , error = require('./errors');

exports.index = function(req, res){
  Note.find({}, function(err, notes) {
    if (err) return error.internalError(err, res);
    res.json(200, notes);
  });
};

exports.create = function(req, res){
  Note.create(req.body, function(err, note) {
    if (err) return error.unprocEntity(err, res);
    res.json(201, note);
  });
};

exports.update = function(req, res){
  if (!req.note) return error.notFound(null, res);

  req.note.set(req.body);
  req.note.save(function(err) {
    if (err) return error.unprocEntity(err, res);
    res.json(204);
  });
};

exports.destroy = function(req, res){
  if (!req.note) return error.notFound(null, res);

  req.note.remove(function(err) {
    if (err) return error.internalError(err, res);
    res.json(204);
  });
};

exports.load = function(id, next) {
  Note.findById(id, function(err, note) {
    if (err) return next(err);
    next(null, note);
  });
};
