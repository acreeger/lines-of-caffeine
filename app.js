
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

var app = express();

var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/caffeine_development';

mongoose.connect(mongoUri, function(err) {
  if (!err) {
    console.log('connected to MongoDB');
  } else {
    throw err;
  }
});

// Bootstrap models
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function (file) {
  console.log("Reading model",file)
  require(models_path+'/'+file)
})

var routes = require('./routes')

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.customer);

app.get('/barista',routes.barista);

app.post('/api/order', routes.drinkOrder.create);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
