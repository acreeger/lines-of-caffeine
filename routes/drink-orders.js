var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')
  , constants = require('../models/constants')
  , orderConstants = constants.order
  , twilioService = require('../services/twilio-service.js')
  , _s = require('underscore.string')

function logError(res,err) {
  res.json(500, {success:false,data:{error:err}});
}

exports.create = function(req, res) {
  var reqBody = req.body;
  //TODO: Seems insecure
  var order = new DrinkOrder(reqBody);
  order.save(function(err) {
    if (err) {
      console.log("Received error:", err);
      res.json(500, {
        success:false,
        data: {
          error : err
        }
      });
    } else {
      // res.redirect('/api/order/'+order._id)
      res.json({success:true, data: order});
    }
  });

  //TODO: Implement number formatting and validation on client side
}

//TODO: counts of new orders

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

exports.request = function(req, res) {
  var ordersRequired = req.query['count'] || 2;
  var newOnly = req.query['new_only'] == "true";

  var returnResults = function(err, orders) {
    if (err) {
      logError(res, err);
    } else {
      res.json(orders);
    }
  }

  if (newOnly) {
    getNewOrders(ordersRequired, returnResults);
  } else {
    var orders = [];
    getInProductionOrders(ordersRequired, function(err, inProdOrders) {
      orders = orders.concat(inProdOrders);
      ordersRequired -= orders.length;

      //TODO: Iterate through a list instead of this - its a bit clumsy
      if (ordersRequired > 0) {
        getAssignedOrders(ordersRequired, function(err, assignedOrders) {
          orders = orders.concat(assignedOrders);
          ordersRequired -= orders.length
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

function validatePhoneNumber(phone_number) {
  phone_number = phone_number.replace(/\s+/g, "");
  return phone_number.length > 9 &&
    phone_number.match(/^(\+?1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}

function addPrefixToPhoneNumber(smsToNumber) {
  var prefix;
  if (smsToNumber.substring(0,2) == "+1") prefix = ""
  else if (smsToNumber.substring(0,1) == "1") prefix = "+"
  else prefix = "+1"
  smsToNumber = prefix + smsToNumber;
  return smsToNumber
}

exports.start = function(req, res) {
  var id = req.params.id;
  // console.log("in start with id:",id)
  DrinkOrder.findOneAndUpdate({"_id":id, status: orderConstants.STATUS_ASSIGNED}, {status: orderConstants.STATUS_IN_PRODUCTION}, function(err,order){
    if (err) {
      res.json(500, {success:false,data:{error:err}});
    } else if (order) {
      console.log("Updated order",order._id,"to status:",order.status);
      var smsToNumber = order.customer.cellPhone
      if (validatePhoneNumber(smsToNumber)) {
        smsToNumber = addPrefixToPhoneNumber(smsToNumber)
        var drinkType = constants.drinkTypes[order.drinks[0].drinkType] || order.drinks[0].drinkType
        var smsMessage = _s.sprintf("Hi %s, your %s will be ready soon. Please come grab it before it gets cold! Love, the folks from Culture and Wellness. <3",
                                      order.customer.firstName
                                    , drinkType
                                    );
        twilioService.sendSMS(smsMessage, smsToNumber);
      } else {
        console.log("Not sending SMS to %s as it doesn't appear to be a valid number", smsToNumber)
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
      logError(res, err);
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
  DrinkOrder.findOneAndUpdate({"_id":id, status: orderConstants.STATUS_IN_PRODUCTION}, {status: orderConstants.STATUS_COMPLETE}, function(err,order) {
    if (err) {
      logError(res, err)
    } else if (order) {
      console.log("Updated order",order._id,"to status:",order.status);
      sendOldOrderAndNextOne(res, order);
    } else {
      //Tell the client why we couldn't find the order
      DrinkOrder.findById(id, function(err, order) {
        if (err) {
          logError(res, err);
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
      logError(res, err)
    } else if (order) {
      var smsToNumber = order.customer.cellPhone
      if (validatePhoneNumber(smsToNumber)) {
        smsToNumber = addPrefixToPhoneNumber(smsToNumber)
        var drinkType = constants.drinkTypes[order.drinks[0].drinkType] || order.drinks[0].drinkType
        var smsMessage = _s.sprintf("Hi %s. Unfortunately there was a problem with your drink order. Please come see us to sort it out. Sorry about that!",
                                      order.customer.firstName
                                    );
        twilioService.sendSMS(smsMessage, smsToNumber);
      } else {
        console.log("Not sending cancellation SMS to %s as it doesn't appear to be a valid number", smsToNumber)
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
      logError(res, err)
    } else if (order) {
      var updates = {
        "assignee": assignee
      }

      if (order.status === orderConstants.STATUS_NEW) updates["status"] = orderConstants.STATUS_ASSIGNED;

      DrinkOrder.findByIdAndUpdate(order._id, updates, function(err, order) {
        if (err) {
          logError(res, err);
        } else {
          res.json({success:true, data: order})
        }
      })
    } else {
      res.json(404, {success:false,data:{error:"Order cannot be found: " + id}});
    }
  });
}

exports.count = function(req, res) {
  var status = req.query["status"];
  var criteria = {};
  if (status) {
    criteria.status = status
  }

  DrinkOrder.count(criteria, function(err, count) {
    if (err) {
      logError(res, err)
    } else {
      res.json({success:true, data: {count:count}});
    }
  })
}