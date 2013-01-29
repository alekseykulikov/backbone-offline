var Notebook = require('../models').Notebook
  , Note     = require('../models').Note
  , error    = require('./errors');

exports.index = function(req, res){
  Notebook.find({}, function(err, notebooks) {
    return err ? error.internalError(res) : res.json(200, notebooks);
  });
};

exports.create = function(req, res){
  Notebook.create(req.body, function(err, notebook) {
    return err ? error.unprocEntity(res, err) : res.json(201, notebook);
  });
};

exports.show = function(req, res){
  if (!req.notebook) return error.notFound(res);

  Note.find({ notebookId: req.notebook.id }, function(err, notes) {
    return err ? error.internalError(res) : res.json(200, notes);
  });
};

exports.update = function(req, res){
  if (!req.notebook) return error.notFound(res);

  req.notebook.set(req.body);
  req.notebook.save(function(err) {
    return err ? error.unprocEntity(res, err) : res.send(204);
  });
};

exports.destroy = function(req, res){
  if (!req.notebook) return error.notFound(res);

  req.notebook.remove(function(err) {
    return err ? error.internalError(res) : res.send(204);
  });
};

exports.load = function(id, next) {
  Notebook.findById(id, next);
};
