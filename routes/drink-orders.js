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

exports.request = function(req, res) {
  var numberOfBaristas = req.query['num_baristas'] || 2;
  var orders = [];
  var ordersRequired = numberOfBaristas;
  var q = DrinkOrder.find({status:orderConstants.STATUS_IN_PRODUCTION}).limit(numberOfBaristas).sort('date').exec(function(err, inProdOrders) {
    while(ordersRequired > 0 && inProdOrders.length > 0) {
      var order = inProdOrders.splice(0, 1)[0];
      orders.push(order);
      ordersRequired = numberOfBaristas - orders.length
    }
    //TODO: Iterate through a list instead of this - its a bit clumsy
    if (ordersRequired > 0) {
      getAssignedOrders(ordersRequired, function(err, assignedOrders) {
        orders = orders.concat(assignedOrders);
        ordersRequired = numberOfBaristas - orders.length
        if (ordersRequired > 0) {
          getNewOrders(ordersRequired, function(err, newOrders) {
            orders = orders.concat(newOrders);
            res.json(orders);
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

exports.start = function(req, res) {
  var id = req.params.id;
  // console.log("in start with id:",id)
  DrinkOrder.findOneAndUpdate({"_id":id, status: orderConstants.STATUS_ASSIGNED}, {status: orderConstants.STATUS_IN_PRODUCTION}, function(err,order){
    if (err) {
      res.json(500, {success:false,data:{error:err}});
    } else if (order) {
      console.log("Updated order",order._id,"to status:",order.status);
      var smsToNumber = order.customer.cellPhone
      if (smsToNumber && smsToNumber.length == 10) {
        smsToNumber = "+1" + smsToNumber;
        var drinkType = constants.drinkTypes[order.drinks[0].drinkType] || order.drinks[0].drinkType
        var smsMessage = _s.sprintf("Hi %s! Your %s will be ready soon, please come grab it! Lots of love, C.O.F.F.E.E.",
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

exports.complete = function(req, res) {
  var id = req.params.id;
  console.log("in complete with id:",id)
  DrinkOrder.findOneAndUpdate({"_id":id, status: orderConstants.STATUS_IN_PRODUCTION}, {status: orderConstants.STATUS_COMPLETE}, function(err,order) {
    if (err) {
      logError(res, err)
    } else if (order) {
      console.log("Updated order",order._id,"to status:",order.status);
      getNewOrders(1, function(err, newOrders) {
        if (err) {
          logError(res, err);
        } else {
          var nextOrder = null;
          if (newOrders.length > 0) {
            nextOrder = newOrders[0];
          }
          res.json({success:true, data: {oldOrder: order, nextOrder: nextOrder}})
        }
      });
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
