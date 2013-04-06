
/*
 * GET home page.
 */

exports.customer = function(req, res){
  res.render('customer', { title: 'Lines of Caffeine - Customer View' });
};

exports.barista = function(req, res) {
	res.render('barista', {title: 'Lines of Caffeine - Barista View'})
}