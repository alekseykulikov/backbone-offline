var mongoose   = require('mongoose')
  , Schema     = mongoose.Schema
  , ObjectId   = Schema.ObjectId
  , timestamps = require('mongoose-types').useTimestamps;

var NoteSchema = new Schema({
    body:     { type: String, required: true }
  , notebook: { type: ObjectId, ref: 'Notebook', required: true }
  , tags:     [ { type: ObjectId, ref: 'Tag' } ]
});

var NotebookSchema = new Schema({
    name: { type: String, required: true }
});

var TagSchema = new Schema({
    name: { type: String, required: true }
});

NoteSchema.plugin(timestamps);
TagSchema.plugin(timestamps);
NotebookSchema.plugin(timestamps);

exports.Note     = mongoose.model('Note', NoteSchema);
exports.Notebook = mongoose.model('Notebook', NotebookSchema);
exports.Tag      = mongoose.model('Tag', TagSchema);
