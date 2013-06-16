var mongoose = require("mongoose");
var connection = mongoose.createConnection("mongodb://localhost/lines-of-caffeine-test");
require("../models/drink-order")(connection);

var DrinkOrder = connection.model('DrinkOrder')

exports.createTestOrders = function(contactInfos, done) {
  var lastErr = null;
  var callCount = 0;
  var cb = function(err) {
    callCount++;
    if (err) {
      lastErr = err
      console.error("ERROR while creating drink order in test:", err)
    }    
    if (callCount == contactInfos.length) done(lastErr);
  }
  for (var i = 0; i <contactInfos.length; i++) {
    var payload = {
      "customer":{
        "firstName": "first-name",
        "lastName": "last-name"      
      },
      "drinks":[{
        "specialInstructions":"","strength":"full","drinkType":"latte","milk":"full-fat"
      }]
    }
    var order = new DrinkOrder(payload);
    order.contactInfo = contactInfos[i];
    order.save(cb);
  }
}

exports.removeAllOrders = function(cb) {
  DrinkOrder.remove({}, function() {cb()});
}
