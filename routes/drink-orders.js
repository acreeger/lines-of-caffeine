var mongoose = require('mongoose')
  , DrinkOrder = mongoose.model('DrinkOrder')

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

  console.log("Got order", order);
  //TODO: Parse order
  //TODO: Save it to a DB Parse - or Mongo?
  //TODO: Implement number formatting and validation on client side
}