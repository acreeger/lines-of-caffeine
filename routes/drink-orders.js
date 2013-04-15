var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')
  , constants = require('../common/constants')
  , orderConstants = constants.order
  , twilioService = require('../services/twilio-service.js')
  , emailService = require('../services/email-service.js')
  , _s = require('underscore.string')
  , util = require('../common/util')
  , CustomValidationError = require('../common/errors').CustomValidationError;

exports.create = function(req, res) {
  var reqBody = req.body;
  //TODO: Seems insecure
  var order = new DrinkOrder(reqBody);
  order.contactInfo = reqBody.customer.contactInfo;
  order.save(function(err) {
    if (err) {
      var status = (err instanceof CustomValidationError || typeof err.errors !== "undefined") ? 400 : 500
      if (status === 500) {
        console.log("Received unexpected error while saving order:",order, err);
      }
      util.sendError(res, err, status);
    } else {
      res.json({success:true, data: order});
    }
  });

  //TODO: Implement phone number formatting client side
}

function getOrdersForStatus(status, count, cb) {
  DrinkOrder.find({status:status}).limit(count).sort('date').exec(cb);
}

function getNewOrders(count, cb) {
  getOrdersForStatus(orderConstants.STATUS_NEW, count, cb);
}

function getAssignedOrders(count, cb) {
  getOrdersForStatus(orderConstants.STATUS_ASSIGNED, count, cb);
}

function getInProductionOrders(count, cb) {
  getOrdersForStatus(orderConstants.STATUS_IN_PRODUCTION, count, cb);
}

//TODO: Move to queue/peek
//TODO: Change this to use same response format as other api calls
exports.request = function(req, res) {
  var ordersRequired = req.query['count'] || 2;
  var newOnly = req.query['new_only'] == "true";

  var returnResults = function(err, orders) {
    if (err) {
      util.sendError(res, err);
    } else {
      res.json(orders);
    }
  }

  if (newOnly) {
    getNewOrders(ordersRequired, returnResults);
  } else {
    var orders = [];
    //TODO: Simplify to date only sort?
    getInProductionOrders(ordersRequired, function(err, inProdOrders) {
      orders = orders.concat(inProdOrders);
      ordersRequired -= inProdOrders.length;

      //TODO: Iterate through a list instead of this - its a bit clumsy
      if (ordersRequired > 0) {
        getAssignedOrders(ordersRequired, function(err, assignedOrders) {
          orders = orders.concat(assignedOrders);
          ordersRequired -= assignedOrders.length
          if (ordersRequired > 0) {
            getNewOrders(ordersRequired, function(err, newOrders) {
              orders = orders.concat(newOrders);
              returnResults(err, orders);
            });
          } else {
            res.json(orders);
          }
        })
      } else {
        res.json(orders);
      }
    });
  }
}

function addPrefixToPhoneNumber(smsToNumber) {
  var prefix;
  if (smsToNumber.substring(0,2) == "+1") prefix = ""
  else if (smsToNumber.substring(0,1) == "1") prefix = "+"
  else prefix = "+1"
  smsToNumber = prefix + smsToNumber;
  return smsToNumber
}

function sendOrderStartedTextMessage(order) {
  var smsToNumber = order.cellPhone
  smsToNumber = addPrefixToPhoneNumber(smsToNumber)
  var drinkType = constants.drinkTypes[order.drinks[0].drinkType] || order.drinks[0].drinkType
  var smsMessage = _s.sprintf("Hi %s, your %s will be ready soon. Please come grab it before it gets cold! Love, the folks from Culture and Wellness. <3",
                                order.customer.firstName
                              , drinkType
                              );
  twilioService.sendSMS(smsMessage, smsToNumber);
}

function sendOrderAbortedTextMessage(order) {
  var smsToNumber = order.cellPhone
  smsToNumber = addPrefixToPhoneNumber(smsToNumber)
  var smsMessage = _s.sprintf("Hi %s. Unfortunately there was a problem with your drink order. Please come see us to sort it out. Sorry about that!",
                                order.customer.firstName
                              );
  twilioService.sendSMS(smsMessage, smsToNumber);
}

var EMAIL_CONF_FROM_ADDRESS = "dontwait@linesofcaffeine.com"

function sendOrderStartedEmailMessage(order) {
  var emailAddress = order.emailAddress;
  var drinkType = constants.drinkTypes[order.drinks[0].drinkType] || order.drinks[0].drinkType
  var subject = _s.sprintf("Your %s will be ready soon - come get it!", drinkType);
  var body = _s.sprintf("Hi %s!\n\nYour %s will be ready soon. Please come grab it before it gets cold!\n\nLove,\n\nThe folks from Culture and Wellness. <3",
                              order.customer.firstName
                            , drinkType
                            );
  emailService.sendEmail(order.fullName, emailAddress, EMAIL_CONF_FROM_ADDRESS, subject, body);
}

function sendOrderAbortedEmailMessage(order) {
  //TODO:
  var emailAddress = order.emailAddress;
  var drinkType = constants.drinkTypes[order.drinks[0].drinkType] || order.drinks[0].drinkType
  var subject = _s.sprintf("Their was a problem with your drink order");
  var body = _s.sprintf("Hi %s,\n\nUnfortunately there was a problem with your drink order. Please come see us to sort it out. Sorry about that!\n\nThe folks from Culture and Wellness. <3",
                              order.customer.firstName
                            );
  emailService.sendEmail(order.fullName, emailAddress, EMAIL_CONF_FROM_ADDRESS, subject, body);
}

exports.start = function(req, res) {
  var id = req.params.id;
  DrinkOrder.findOneAndUpdate({"_id":id, status: orderConstants.STATUS_ASSIGNED}, {status: orderConstants.STATUS_IN_PRODUCTION, dateStarted: Date.now()}, function(err,order){
    if (err) {
      res.json(500, {success:false,data:{error:err}});
    } else if (order) {
      console.log("Updated order",order._id,"to status:",order.status);
      if (order.hasValidCellPhone()) {
        sendOrderStartedTextMessage(order)
      } else if (order.hasValidEmailAddress()){
        sendOrderStartedEmailMessage(order)
      } else {
        console.log("Not sending order started SMS or email to %s %s for order %s as it doesn't appear have valid contact info", order.customer.firstName, order.customer.lastName, order.id)    
      }
      res.json({success:true, data: order})
    } else {
      DrinkOrder.findById(id, function(err, order) {
        if (err) {
          res.json(500, {success:false,data:{error:err}});
        }
        if (order) {
          res.json(500, {success:false,data:{error:"Order has unexpected status: " + order.status}});    
        } else {
          res.json(404, {success:false,data:{error:"Order cannot be found: " + id}});
        }
      });      
    }
  });
}

function sendOldOrderAndNextOne(res, oldOrder) {
  getNewOrders(1, function(err, newOrders) {
    if (err) {
      util.sendError(res, err);
    } else {
      var nextOrder = null;
      if (newOrders.length > 0) {
        nextOrder = newOrders[0];
      }
      res.json({success:true, data: {oldOrder: oldOrder, nextOrder: nextOrder}})
    }
  });
}

exports.complete = function(req, res) {
  var id = req.params.id;
  DrinkOrder.findOneAndUpdate({"_id":id, status: orderConstants.STATUS_IN_PRODUCTION}, {status: orderConstants.STATUS_COMPLETE, dateCompleted: Date.now()}, function(err,order) {
    if (err) {
      util.sendError(res, err)
    } else if (order) {
      console.log("Updated order",order._id,"to status:",order.status);
      sendOldOrderAndNextOne(res, order);
    } else {
      //Tell the client why we couldn't find the order
      DrinkOrder.findById(id, function(err, order) {
        if (err) {
          util.sendError(res, err);
        } else if (order) {
          res.json(500, {success:false,data:{error:"Order has unexpected status: " + order.status}});
        } else {
          res.json(404, {success:false,data:{error:"Order cannot be found: " + id}});
        }
      });
    }
  });
}

exports.abort = function(req, res) {
  var id = req.params.id;
  DrinkOrder.findOneAndUpdate({"_id":id}, {status: orderConstants.STATUS_ABORTED}, function(err,order) {
    if (err) {
      util.sendError(res, err)
    } else if (order) {
      if (order.hasValidCellPhone()) {
        sendOrderAbortedTextMessage(order)
      } else if (order.hasValidEmailAddress()){
        sendOrderAbortedEmailMessage(order)
      } else {
        console.log("Not sending order aborted SMS or email to %s %s for order %s as it doesn't appear have valid contact info", order.customer.firstName, order.customer.lastName, order.id)    
      }
      sendOldOrderAndNextOne(res, order);
    } else {
      res.json(404, {success:false,data:{error:"Order cannot be found: " + id}});
    }
  });
}

exports.assign = function(req, res) {
  var id = req.params.id;
  var assignee = req.params.assignee;

  DrinkOrder.findById(id, function(err, order) {
    if (err) {
      util.sendError(res, err)
    } else if (order) {
      var updates = {
        "assignee": assignee
      }

      if (order.status === orderConstants.STATUS_NEW) updates["status"] = orderConstants.STATUS_ASSIGNED;

      DrinkOrder.findByIdAndUpdate(order._id, updates, function(err, order) {
        if (err) {
          util.sendError(res, err);
        } else {
          res.json({success:true, data: order})
        }
      })
    } else {
      res.json(404, {success:false,data:{error:"Order cannot be found: " + id}});
    }
  });
}