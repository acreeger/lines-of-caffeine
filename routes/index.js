var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')
  , getenv = require('getenv')
  , moment = require('moment');
var twilioEnabled = require('../services/twilio-service').twilioEnabled()
  , emailEnabled = require('../services/email-service').emailEnabled();

exports.drinkOrder = require('./drink-orders');
exports.queue = require('./queue');

/*
 * GET home page.
 */
exports.customer = function(req, res){
  res.render('customer', {
    title: 'Grab Go Coffee - Customer View'
  , twilioEnabled: twilioEnabled
  , emailEnabled: emailEnabled
  });
};

exports.barista = function(req, res) {
  var numberOfBaristas = req.params.numberOfBaristas || 2 //DEFAULT IS 2
  res.render('barista', {title: 'Grab Go Coffee - Barista View', numberOfBaristas: numberOfBaristas })
};

var DEFAULT_PAGE_SIZE = 200;
exports.report = function(req, res) {
  var key = req.query["key"] || "";
  var additionalArgsForPagination = {}
  if (key !== "") additionalArgsForPagination.key = key;
  var page = req.query["page"] || 1;
  page = parseInt(page);
  var pageSize = req.query["pageSize"] || DEFAULT_PAGE_SIZE
  if (pageSize !== DEFAULT_PAGE_SIZE) additionalArgsForPagination.pageSize = pageSize;
  pageSize = parseInt(pageSize);
  var password = getenv("REPORT_PW", "");
  if(key !== password) {
    res.send(403);
  } else {
    var criteria = {}
    var sort = req.query["sort"] || "-date";
    var status = req.query["status"];
    if (status) {
      additionalArgsForPagination.status = status;
      criteria["status"] = status;
    }
    DrinkOrder.find(criteria).sort(sort).skip((page - 1) * pageSize).limit(pageSize).exec(function (err, orders) {
      DrinkOrder.count(criteria, function (err, count) {
        criteria.date = {$gt : moment().startOf('day')}
        DrinkOrder.count(criteria, function(err, todayCount) {
          res.render('report', {title: 'Grab Go Coffee - Order Report', orders: orders, pageSize: pageSize, page: page, totalCount: count, todayCount: todayCount, additionalArgsForPagination: additionalArgsForPagination})
        });
      });
    });
  }
}