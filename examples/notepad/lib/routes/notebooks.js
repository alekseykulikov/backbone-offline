var Notebook = require('../models').Notebook
  , Note     = require('../models').Note
  , error    = require('./errors');

exports.index = function(req, res){
  Notebook.find({}, function(err, notebooks) {
    if (err) return error.internalError(err, res);
    res.json(200, notebooks);
  });
};

exports.show = function(req, res){
  if (!req.notebook) return error.notFound(null, res);

  Note.find({ notebookId: req.notebook.id }, function(err, notes) {
    if (err) return error.internalError(err, res);
    res.json(200, notes);
  });
};

exports.create = function(req, res){
  Notebook.create(req.body, function(err, notebook) {
    if (err) return error.unprocEntity(err, res);
    res.json(201, notebook);
  });
};

exports.update = function(req, res){
  if (!req.notebook) return error.notFound(null, res);

  req.notebook.set(req.body);
  req.notebook.save(function(err) {
    if (err) return error.unprocEntity(err, res);
    res.json(204);
  });
};

exports.destroy = function(req, res){
  if (!req.notebook) return error.notFound(null, res);

  req.notebook.remove(function(err) {
    if (err) return error.internalError(err, res);
    res.json(204);
  });
};

exports.load = function(id, next) {
  Notebook.findById(id, function(err, notebook) {
    if (err) return next(err);
    next(null, notebook);
  });
};
