var fs = require("fs")
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , util = require('../common/util');

var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/caffeine_development';

var isDryRun = true;
if (process.argv.length > 2 && process.argv[2] == "--real") {
  isDryRun = false;
}

console.log("normalizing phone numbers.");
if (isDryRun) {
  console.log("This is only a test. No changes are being saved.")
} else {
  console.log("This is for real, changes are being saved.");
}
// Bootstrap models
var models_path = __dirname + '/../models'
fs.readdirSync(models_path).forEach(function (file) {
  // console.log("Reading model",file)
  require(models_path+'/'+file)();
})

var DrinkOrder = mongoose.model('DrinkOrder')


mongoose.connect(mongoUri, function(err) {
  if (!err) {
    console.log('connected to MongoDB');
    var processedOrders = 0
    DrinkOrder.find({"customer.cellPhone" : {'$ne': null }}).exec(function(err, orders) {
      if (orders.length == 0) {
        console.log("Found no orders to process.");
        process.exit();
      }

      var incrementAndQuit = function() {
        processedOrders++
        console.log("processed %s out of %s orders.", processedOrders, orders.length)
        if (processedOrders == orders.length) process.exit();
      } 
      console.log("Found %s potential orders to process.", orders.length)
      if (err) {
        console.error("An error occured whilst normalizing phone numbers:", err);
        incrementAndQuit();
      } else {
        orders.forEach(function(order) {
          var oldPhoneNumber = order.customer.cellPhone;
          var newPhoneNumber = util.normalizeUSPhoneNumber(oldPhoneNumber);
          if (newPhoneNumber !== oldPhoneNumber) {
            if (isDryRun) {
              console.log("Would have updated order %s's phone number from %s to %s", order.id, oldPhoneNumber, newPhoneNumber);
              incrementAndQuit();
            } else {
              order.contactInfo = newPhoneNumber;
              order.save(function(err) {
                if (err) {
                  console.error("An error occured whilst updating order %s's phone number from %s to %s", order.id, oldPhoneNumber, newPhoneNumber, err);
                } else {
                  console.log("Updated order %s's phone number from %s to %s", order.id, oldPhoneNumber, newPhoneNumber);
                }
                incrementAndQuit();
              })        
            }
          } else {
            incrementAndQuit();
          }
        })
      }
    });     
  } else {
    throw err;
  }
});