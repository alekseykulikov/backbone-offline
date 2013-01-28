exports.internalError = function(err, res) {
  res.json(500, { error: 'Internal Server Error' });
};

exports.unprocEntity = function(err, res) {
  res.json(422, { error: err });
};

exports.notFound = function(err, res) {
  res.json(404, { error: 'Not Found' });
};
