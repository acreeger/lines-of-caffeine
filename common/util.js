var constants = require('./constants');

exports.sendError = function(res, err, status) {
  status = status || 500;
  res.json(status, {success:false,data:{error:err}});
}

exports.sendSuccess = function(data, status) {
    status = status || 200;
    res.json(status, {success:true, data:data});
}

exports.validateEmailAddress = function(emailAddress) {
  return constants.EMAIL_VALIDATION_REGEX.test(emailAddress);
}

exports.validateUSPhoneNumber = function(phoneNumber) {
  return phoneNumber && phoneNumber.length > 9 && constants.US_PHONE_VALIDATION_REGEX.test(phoneNumber);  
}