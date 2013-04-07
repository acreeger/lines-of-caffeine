var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')
  , constants = require('../models/constants').order

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

exports.request = function(req, res) {
  var numberOfBaristas = req.query['num_baristas'] || 2;
  var orders = [];
  var ordersRequired = numberOfBaristas;
  var q = DrinkOrder.find({status:constants.STATUS_IN_PRODUCTION}).limit(numberOfBaristas).sort('date').exec(function(err, inProdOrders) {
    while(ordersRequired > 0 && inProdOrders.length > 0) {
      var order = inProdOrders.splice(0, 1)[0];
      orders.push(order);
      ordersRequired = numberOfBaristas - orders.length
    }
    if (ordersRequired > 0) {
      DrinkOrder.find({status:constants.STATUS_NEW}).limit(ordersRequired).sort('date').exec(function(err, newOrders) {
        orders = orders.concat(newOrders);
        res.json(orders);
      });
    } else {
      res.json(orders);
    }
  });
}