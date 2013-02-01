var Note   = require('../models').Note
  , helper = require('./shared/json_helpers');

exports.index = function(req, res){
  Note.find({}, helper.ok(res));
};

exports.create = function(req, res){
  Note.create(req.body, helper.created(res));
};

exports.update = function(req, res){
  req.note.set(req.body);
  req.note.save(helper.noContent(res));
};

exports.destroy = function(req, res){
  req.note.remove(helper.noContent(res));
};

exports.load = helper.load(Note);
