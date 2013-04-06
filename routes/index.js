
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Lines of Caffeine - Customer View' });
};

exports.barista = function(req, res) {
	res.render('barista', {title: 'Lines of Caffeine - Barista View'})
}