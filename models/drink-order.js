var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , Schema = mongoose.Schema
  , constants = require('./constants').order;

var DrinkOrderSchema = new Schema({
  customer : {
    firstName: String,
    lastName: String,
    cellPhone: String
  },
  drinks : [{
    strength : String,
    drinkType : String,
    milk : String,
    specialInstructions : String
  }],
  status : {type: String, default: constants.STATUS_NEW},
  station : {type: String, default: "1"},
  assignee : {type: Number, default: -1},
  date: { type: Date, default: Date.now },
  dateStarted: Date,
  dateCompleted: Date
});

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

