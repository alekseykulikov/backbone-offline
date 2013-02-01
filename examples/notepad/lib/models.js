var mongoose   = require('mongoose')
  , Schema     = mongoose.Schema
  , ObjectId   = Schema.ObjectId
  , timestamps = require('mongoose-timestamp');

var NoteSchema = new Schema({
    name:       { type: String, required: true }
  , notebookId: { type: ObjectId, ref: 'Notebook', required: true }
  , tags:       [ { type: ObjectId, ref: 'Tag' } ]
}).plugin(timestamps);

var NotebookSchema = new Schema({
    name: { type: String, required: true }
}).plugin(timestamps);

var TagSchema = new Schema({
    name: { type: String, required: true }
}).plugin(timestamps);

exports.Note     = mongoose.model('Note', NoteSchema);
exports.Notebook = mongoose.model('Notebook', NotebookSchema);
exports.Tag      = mongoose.model('Tag', TagSchema);
