require('./connect');

var Faker       = require('Faker')
  , _           = require('underscore')
  , async       = require('async')
  , ObjectId    = require('mongoose').Types.ObjectId
  , Notebook    = require('../lib/models').Notebook
  , Tag         = require('../lib/models').Tag
  , Note        = require('../lib/models').Note
  , tagIds      = []
  , notebookIds = [];

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

var tasks = [
  function(cb) { Note.remove({}, cb); },
  function(cb) { Notebook.remove({}, cb); },
  function(cb) { Tag.remove({}, cb); }
];

/**
 * Create tasks for notebooks
 */

_.times(3, function() {
  var notebookId = new ObjectId();

  notebookIds.push(notebookId);
  tasks.push(function(cb) {
    Notebook.create({
        _id: notebookId
      , name: capitalize(Faker.Lorem.words(_.random(1, 3)).join(' '))
    }, cb);
  });
});

/**
 * Create tasks for tags
 */

_.times(10, function() {
  var tagId = new ObjectId();

  tagIds.push(tagId);
  tasks.push(function(cb) {
    Tag.create({
        _id: tagId
      , name: Faker.Lorem.words(1).toString()
    }, cb);
  });
});

/**
 * Create tasks for notes
 */

_.times(75, function() {
  var notebookId = notebookIds[_.random(0, notebookIds.length - 1)]
    , tags = [];

  _.times(_.random(0, 4), function() {
    tags.push(tagIds[_.random(0, tagIds.length - 1)]);
  });

  tasks.push(function (cb){
    Note.create({
        name: capitalize(Faker.Lorem.sentences(_.random(1, 10)))
      , notebookId: notebookId
      , tags: _.uniq(tags)
    }, cb);
  });
});

/**
 * Run tasks
 */

async.series(tasks, function(err) {
  console.log(err || 'Done!');
  process.exit();
});
