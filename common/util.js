exports.logError = function(res, err, status) {
  var status = status || 500;
  res.json(status, {success:false,data:{error:err}});
}

exports.sendSuccess = function(data, status) {
    var status = status || 200;
    res.json(status, {success:true, data:data});
}