var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')
  , getenv = require('getenv');
var twilioEnabled = require('../services/twilio-service').twilioEnabled();

exports.drinkOrder = require('./drink-orders');
exports.queue = require('./queue');

/*
 * GET home page.
 */
exports.customer = function(req, res){
  res.render('customer', {
    title: 'Grab Go Coffee - Customer View'
  , twilioEnabled: twilioEnabled
  });
};

exports.barista = function(req, res) {
  var numberOfBaristas = req.params.numberOfBaristas || 2 //DEFAULT IS 2
	res.render('barista', {title: 'Grab Go Coffee - Barista View', numberOfBaristas: numberOfBaristas })
};

exports.report = function(req, res) {
	var key = req.query["key"] || ""
	var password = getenv("REPORT_PW", "")
	if(key !== password) {
		res.send(403);
	} else {
		var criteria = {}
		var limit = req.query["limit"] || 200;
		var sort = req.query["sort"] || "-date";
		var status = req.query["status"];
		if (status) {
			criteria["status"] = status
		}
	  DrinkOrder.find(criteria).limit(limit).sort(sort).exec(function (err, orders) {
	  	res.render('report', {title: 'Grab Go Coffee - Order Report', orders: orders})
	  });
	}
}