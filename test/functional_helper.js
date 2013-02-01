require('../examples/notepad/test/test_helper');
require('../examples/notepad/app');

var expect = require('chai').expect;

function prepareData(data) {
  data = data.toString();
  return data.slice(0, data.lastIndexOf('\n'));
}

exports.casper = function(file, cb) {
  var spawn    = require('child_process').spawn
    , fileName = 'test/casper_scenarios/' + file + '.js'
    , casperjs = spawn('casperjs', ['test', fileName]);

  casperjs.stdout.on('data', function (data) {
    console.log(prepareData(data));
  });

  casperjs.stderr.on('data', function (data) {
    console.error('Error: ' + prepareData(data));
  });

  casperjs.on('exit', function (code) {
    expect(code).equal(0);
    cb();
  });

  // Split scenarios with new line
  console.log('\n');
};

exports.Note     = require('../examples/notepad/lib/models').Note;
exports.Notebook = require('../examples/notepad/lib/models').Notebook;
exports.Tag      = require('../examples/notepad/lib/models').Tag;
