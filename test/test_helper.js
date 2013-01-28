process.env.NODE_ENV = 'test';
process.env.PORT     = '3001';

exports.casper = function(file, cb) {
  console.log('run casper_steps/' + file);
  cb();
};