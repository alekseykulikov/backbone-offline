var Tag    = require('../models').Tag
  , Note   = require('../models').Note
  , helper = require('./shared/json_helpers');

exports.index = function(req, res){
  Tag.find({}, helper.ok(res));
};

exports.create = function(req, res){
  Tag.create(req.body, helper.created(res));
};

exports.show = function(req, res){
  Note.find({ tags: req.tag.id }, helper.ok(res));
};

exports.update = function(req, res){
  req.tag.set(req.body);
  req.tag.save(helper.noContent(res));
};

exports.destroy = function(req, res){
  req.tag.remove(helper.noContent(res));
};

exports.load = helper.load(Tag);
