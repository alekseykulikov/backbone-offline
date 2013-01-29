var Note  = require('../models').Note
  , error = require('./errors');

exports.index = function(req, res){
  Note.find({}, function(err, notes) {
    return err ? error.internalError(res) : res.json(200, notes);
  });
};

exports.create = function(req, res){
  Note.create(req.body, function(err, note) {
    return err ? error.unprocEntity(res, err) : res.json(201, note);
  });
};

exports.update = function(req, res){
  if (!req.note) return error.notFound(res);

  req.note.set(req.body);
  req.note.save(function(err) {
    return err ? error.unprocEntity(res, err) : res.send(204);
  });
};

exports.destroy = function(req, res){
  if (!req.note) return error.notFound(res);

  req.note.remove(function(err) {
    return err ? error.internalError(res) : res.send(204);
  });
};

exports.load = function(id, next) {
  Note.findById(id, next);
};
