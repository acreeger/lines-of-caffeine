var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')
  , _ = require("underscore")
  , util = require("../common/util")
  , constants = require("../common/constants")

var AVERAGE_TIME_TO_MAKE_DRINK = constants.AVERAGE_TIME_TO_MAKE_DRINK
var DEFAULT_NUMBER_OF_BARISTAS = constants.DEFAULT_NUMBER_OF_BARISTAS
var TIME_BETWEEN_DRINKS = constants.TIME_BETWEEN_DRINKS

exports.summary = function(req, res) {
  var status = req.query["status"];
  var numberOfBaristas = req.query["num_baristas"] || DEFAULT_NUMBER_OF_BARISTAS;
  if (numberOfBaristas === 0) numberOfBaristas = DEFAULT_NUMBER_OF_BARISTAS;

  //TODO: Test with 0!
  if (!_.isNumber(numberOfBaristas)) {
    try {
      numberOfBaristas = parseInt(numberOfBaristas, 10);
    } catch(err) {
      console.log("Error whilst parsing numberOfBaristas", numberOfBaristas)
      numberOfBaristas = DEFAULT_NUMBER_OF_BARISTAS;
    }
  }

  DrinkOrder.count({"status":"new"}, function(err, count) {
    if (err) {
      util.sendError(res, err)
    } else {
      var timeUntilOrderIsStarted;
      if (count === 0) {
        timeUntilOrderIsStarted = 0
      } else if (count < numberOfBaristas) {
        timeUntilOrderIsStarted = ((AVERAGE_TIME_TO_MAKE_DRINK + TIME_BETWEEN_DRINKS) / (numberOfBaristas + 1))
      } else {
        timeUntilOrderIsStarted = Math.round(count / (numberOfBaristas / (AVERAGE_TIME_TO_MAKE_DRINK + TIME_BETWEEN_DRINKS)))
      }
      var time = Math.round(timeUntilOrderIsStarted + AVERAGE_TIME_TO_MAKE_DRINK);
      res.json({success:true, data: {count:count, waitingTime: time}});
    }
  })
}