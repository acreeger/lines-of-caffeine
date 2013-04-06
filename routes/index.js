
/*
 * GET home page.
 */

exports.customer = function(req, res){
  res.render('customer', { title: 'Lines of Caffeine - Customer View' });
};

exports.barista = function(req, res) {
	res.render('barista', {title: 'Lines of Caffeine - Barista View'})
}

exports.recordOrder = function(req, res) {
  var reqBody = req.body;
  var custName = reqBody.customer.name;
  var cellNumber = reqBody.customer.number;

  console.log("Got custName", custName, "cellNumber", cellNumber);
  res.json({success:true});
  //TODO: Parse order
  //TODO: Save it to a DB Parse - or Mongo?
  //TODO: Implement number formatting and validation on client side
}