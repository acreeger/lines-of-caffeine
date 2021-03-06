
/**
 * Module dependencies.
 */
require('newrelic');
var express = require('express')
  , fs = require('fs')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , constants = require(__dirname + '/common/constants')
  , getenv = require('getenv');

var app = express();

var mongoUri = getenv("MONGOLAB_URI", process.env.NODE_ENV === "test" ? 'mongodb://localhost/lines-of-caffeine-test' : 'mongodb://localhost/caffeine_development');

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
  // console.log("Reading model",file)
  require(models_path+'/'+file)()
})

var routes = require('./routes')

app.configure('development', function(){
  app.use(express.errorHandler());
  app.use(express.logger('dev'));
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
  app.use(function(req, res, next){
    res.locals.drinkTypes = constants.drinkTypes;
    res.locals.strengthTypes = constants.strengthTypes;
    res.locals.milkTypes = constants.milkTypes;
    res.locals.EMAIL_VALIDATION_REGEX = constants.EMAIL_VALIDATION_REGEX;
    res.locals.paginate = require('./common/pagination').paginate
    res.locals.isProduction = getenv("NODE_ENV", "development") === "production"
    res.locals.trackingId = process.env.TRACKING_ID
    next();
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure("test", function() {
  app.set('port', process.env.PORT || 6666);
})

app.get('/', routes.customer);
app.get('/barista/:numberOfBaristas?',routes.barista);
app.get('/report', routes.report);

app.post('/api/order', routes.drinkOrder.create);
app.get('/api/order/request', routes.drinkOrder.request);
app.post('/api/order/:id/start', routes.drinkOrder.start);
app.post('/api/order/:id/complete', routes.drinkOrder.complete);
app.post('/api/order/:id/abort', routes.drinkOrder.abort);
app.post('/api/order/:id/assign/:assignee', routes.drinkOrder.assign);
app.get('/api/order/searchByContact', routes.drinkOrder.searchByContact);

app.get('/api/queue/summary', routes.queue.summary);

app.get('/testError', function(req,res,next) {
  next(new Error("This is a test error!"));
})

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

module.exports = app
