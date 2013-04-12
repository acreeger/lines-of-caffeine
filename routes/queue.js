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