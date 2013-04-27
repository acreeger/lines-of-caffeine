var fs = require("fs")
  , mongoose = require('mongoose')
  , _ = require('underscore');

var mongoUri = 'mongodb://localhost/caffeine_development';

// Bootstrap models
var models_path = __dirname + '/../models'
fs.readdirSync(models_path).forEach(function (file) {
  // console.log("Reading model",file)
  require(models_path+'/'+file)
})

var DrinkOrder = mongoose.model('DrinkOrder')

var numTimesCalled = 0

function saveRecord(max, n) {
  if (n < max) {
    var i = n + 1;
    var payload = {
      "customer":{
        "firstName": i.toString(),
        "lastName": i.toString()      
      },
      "drinks":[{
        "specialInstructions":"","strength":"full","drinkType":"latte","milk":"full-fat"
      }]
    }
    var order = new DrinkOrder(payload);
    order.contactInfo = "a@a.com";
    order.save(function(err) {
      if (err) {
        console.log("An error occured while saving order %s: %s", n, JSON.stringify(err))
      } else {
        console.log("Order %s saved succesfully.", n)
      }
      saveRecord(max, n + 1);
    });
  } else {
    process.exit()
  }
}

mongoose.connect(mongoUri, function(err) {
  if (!err) {
    console.log('connected to MongoDB');

    var numOrders;
    if (process.argv.length > 2) {
      numOrders = parseInt(process.argv[2], 10);
    } else {
      numOrders = 10;
    }
    console.log("Creating %s test orders", numOrders);

    saveRecord(numOrders, 0)
  } else {
    console.log("Error occured connecting to mongo")
    throw err;
  }
});