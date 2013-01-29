var mongoose  = require('mongoose')
  , config    = { development: 'notepad_development', test: 'notepad_test' }
  , dbName    = config[process.env.NODE_ENV] || 'notepad_development'
  , uri       = 'mongodb://localhost/' + dbName;

mongoose.connect(uri);
