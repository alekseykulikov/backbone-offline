var express  = require('express')
  , mongoose = require('mongoose')
  , config   = { development: 'notepad_development', test: 'notepad_test' };

var app = module.exports = express();
var uri = 'mongodb://localhost/' + config[app.get('env')];
mongoose.connect(uri);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.listen(app.get('port'), function(){
  console.log('Server listening on port %d in %s mode', app.get('port'), app.get('env'));
});
