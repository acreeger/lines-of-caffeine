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

function addPrefixToPhoneNumber(smsToNumber) {
  var prefix;
  if (smsToNumber.substring(0,2) == "+1") prefix = ""
  else if (smsToNumber.substring(0,1) == "1") prefix = "+"
  else prefix = "+1"
  smsToNumber = prefix + smsToNumber;
  return smsToNumber
}

var normalizePhoneNumberRegExp = /[\s\.\-\(\)]/g

exports.normalizeUSPhoneNumber = function(phoneNumber) {
  if (!phoneNumber) return null;

  if (!exports.validateUSPhoneNumber(phoneNumber)) return phoneNumber;

  var result = addPrefixToPhoneNumber(phoneNumber);
  return result.replace(normalizePhoneNumberRegExp, '');
}