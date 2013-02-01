var Notebook = require('../models').Notebook
  , Note     = require('../models').Note
  , helper   = require('./shared/json_helpers');

exports.index = function(req, res){
  Notebook.find({}, helper.ok(res));
};

exports.create = function(req, res){
  Notebook.create(req.body, helper.created(res));
};

exports.show = function(req, res){
  Note.find({ notebookId: req.notebook.id }, helper.ok(res));
};

exports.update = function(req, res){
  req.notebook.set(req.body);
  req.notebook.save(helper.noContent(res));
};

exports.destroy = function(req, res){
  req.notebook.remove(helper.noContent(res));
};

exports.load = helper.load(Notebook);
