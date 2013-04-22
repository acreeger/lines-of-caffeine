var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , Schema = mongoose.Schema
  , constants = require('../common/constants')
  , orderConstants = constants.order
  , util = require('../common/util')
  , CustomValidationError = require('../common/errors').CustomValidationError;

var DrinkOrderSchema = new Schema({
  customer : {
    firstName: {type:String, required:true},
    lastName: {type:String, required:true},
    cellPhone: {type: String, match: constants.US_PHONE_VALIDATION_REGEX},
    emailAddress: {type: String, match: constants.EMAIL_VALIDATION_REGEX}
  },
  drinks : [{
    strength : {type:String, required:true},
    drinkType : {type:String, required:true},
    milk : {type:String, required:true},
    specialInstructions : String
  }],
  status : {type: String, default: orderConstants.STATUS_NEW},
  station : {type: String, default: "1"},
  assignee : {type: Number, default: -1},
  date: { type: Date, default: Date.now },
  dateStarted: Date,
  dateCompleted: Date,
  estimatedCompletionWait: Number
});

var getContactInfo = function() {
  if (this.hasValidEmailAddress()) {
    return this.emailAddress;
  } else {
    return this.cellPhone;
  }
}

var setContactInfo = function(value) {
  if (util.validateEmailAddress(value)) {
    this.customer.emailAddress = value;
  } else if (util.validateUSPhoneNumber(value)) {
    this.customer.cellPhone = value;
  }
}

DrinkOrderSchema.virtual('cellPhone').get(function () {
  return this.customer.cellPhone;
});

DrinkOrderSchema.virtual('emailAddress').get(function () {
  return this.customer.emailAddress;
});

DrinkOrderSchema.virtual('fullName').get(function() {
  return this.customer.firstName + ' ' + this.customer.lastName;
})

DrinkOrderSchema.virtual('contactInfo').get(getContactInfo).set(setContactInfo);

DrinkOrderSchema.pre("validate", function(next) {
  var err;
  if (!this.customer.emailAddress && !this.customer.cellPhone) {
    err = new CustomValidationError("Every order must have an email address OR a cell phone number");
  }
  next(err);
})

DrinkOrderSchema.methods.hasValidEmailAddress = function () {
  return this.emailAddress && util.validateEmailAddress(this.emailAddress);
}

DrinkOrderSchema.methods.hasValidCellPhone = function (){
  return this.cellPhone && util.validateUSPhoneNumber(this.cellPhone);
}

mongoose.model('DrinkOrder', DrinkOrderSchema);

// var ArticleSchema = new Schema({
//   title: {type : String, default : '', trim : true},
//   body: {type : String, default : '', trim : true},
//   user: {type : Schema.ObjectId, ref : 'User'},
//   comments: [{
//     body: { type : String, default : '' },
//     user: { type : Schema.ObjectId, ref : 'User' },
//     createdAt: { type : Date, default : Date.now }
//   }],
//   tags: {type: [], get: getTags, set: setTags},
//   image: {
//     cdnUri: String,
//     files: []
//   },
//   createdAt  : {type : Date, default : Date.now}
// })

