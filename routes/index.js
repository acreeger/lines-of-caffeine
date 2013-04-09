var mongoose = require('mongoose');
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