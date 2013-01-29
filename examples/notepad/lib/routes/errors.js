exports.internalError = function(res) {
  res.json(500, { error: 'Internal Server Error' });
};

exports.unprocEntity = function(res, err) {
  res.json(422, { error: err });
};

exports.notFound = function(res) {
  res.json(404, { error: 'Not Found' });
};
