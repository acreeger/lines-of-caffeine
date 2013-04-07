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

exports.start = function(req, res) {
  var id = req.params.id;
  console.log("in start with id:",id)
  DrinkOrder.findOneAndUpdate({"_id":id, status: constants.STATUS_NEW}, {status: constants.STATUS_IN_PRODUCTION}, function(err,order){
    if (err) {
      res.json(500, {success:false,data:{error:err}});
    } else if (order) {
      console.log("Updated order",order._id,"to status:",order.status);
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

exports.assign = function(req, res) {
  var id = req.params.id;
  var assignee = req.params.assignee;

  DrinkOrder.findByIdAndUpdate(id, {"assignee": assignee}, function(err, order) {
    if (err) {
      res.json(500, {success:false,data:{error:err}});
    } else if (order) {
      res.json({success:true, data: order})
    } else {
      res.json(404, {success:false,data:{error:"Order cannot be found: " + id}});
    }
  });
}
