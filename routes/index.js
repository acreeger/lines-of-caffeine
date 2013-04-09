var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')
  , getenv = require('getenv');
var twilioEnabled = require('../services/twilio-service').twilioEnabled();
/*
 * GET home page.
 */

exports.customer = function(req, res){
  res.render('customer', {
    title: 'Lines of Caffeine - Customer View'
  , twilioEnabled: twilioEnabled
  });
};

exports.barista = function(req, res) {
  var numberOfBaristas = req.params.numberOfBaristas || 2 //DEFAULT IS 2
	res.render('barista', {title: 'Lines of Caffeine - Barista View', numberOfBaristas: numberOfBaristas })
};

exports.drinkOrder = require('./drink-orders');

exports.report = function(req, res) {
	var key = req.query["key"] || ""
	var password = getenv("REPORT_PW", "")
	if(key !== password) {
		res.send(403);
	} else {
		var limit = req.query["limit"] || 200;
		var sort = req.query["sort"] || "-date";
	  DrinkOrder.find({}).limit(limit).sort(sort).exec(function (err, orders) {
	  	res.render('report', {title: 'Lines of Caffeine - Order Report', orders: orders})
	  });
	}
}