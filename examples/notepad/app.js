require('express-resource');
require('./db/connect');

var express   = require('express')
  , notes     = require('./lib/routes/notes')
  , notebooks = require('./lib/routes/notebooks')
  , tags      = require('./lib/routes/tags');

var app = module.exports = express();

app.configure('development', function(){
  app.use(express.logger('dev'));
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
  app.use(express.errorHandler());
});

app.resource('api/notes',     notes,     { load: notes.load });
app.resource('api/notebooks', notebooks, { load: notebooks.load });
app.resource('api/tags',      tags,      { load: tags.load });

app.listen(app.get('port'), function(){
  console.log('Notepad server listening on port %d in %s mode', app.get('port'), app.get('env'));
});
