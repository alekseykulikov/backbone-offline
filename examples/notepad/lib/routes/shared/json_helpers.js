var error = require('./errors');

exports.ok = function(res) {
  return function(err, objects) {
    return err ? error.internalError(res) : res.json(200, objects);
  };
};

exports.created = function(res) {
  return function(err, createdObj) {
    return err ? error.unprocEntity(res, err) : res.json(201, createdObj);
  };
};

exports.noContent = function(res) {
  return function(err) {
    return err ? error.unprocEntity(res, err) : res.send(204);
  };
};

exports.load = function(Klass) {
  return function(req, id, next) {
    Klass.findById(id, function(err, obj) {
      if (err) return error.internalError(req.res);
      if (!obj) return error.notFound(req.res);
      next(null, obj);
    });
  };
};
