var mongoose = require('mongoose');

/*
 * GET home page.
 */

exports.customer = function(req, res){
  res.render('customer', { title: 'Lines of Caffeine - Customer View' });
};

exports.barista = function(req, res) {
  var numberOfBaristas = req.params.numberOfBaristas || 2 //DEFAULT IS 2
	res.render('barista', {title: 'Lines of Caffeine - Barista View', numberOfBaristas: numberOfBaristas })
};

exports.drinkOrder = require('./drink-orders');