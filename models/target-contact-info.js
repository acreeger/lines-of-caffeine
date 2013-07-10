var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , Schema = mongoose.Schema
  , constants = require('../common/constants')
  , orderConstants = constants.order
  , util = require('../common/util')
  , CustomValidationError = require('../common/errors').CustomValidationError;


var init = function(connection) {
  var TargetContactInfoSchema = new Schema({
    contactInfo : {type: String, required: true},
    campaign : {type: String, required: true}
  });

  TargetContactInfoSchema.statics.isUserPartOfCampaign = function(contactInfo, campaign, cb) {
    this.count({$or : [{contactInfo : contactInfo.toLowerCase()}, {contactInfo:"all"}]}, function(err, count) {
      if (err) {
        cb(err, null);
      } else {
        cb(null, count > 0 ? true : false);
      }
    });
  }

  connection = connection || mongoose;
  connection.model('TargetContactInfo', TargetContactInfoSchema);
};

module.exports = init;
