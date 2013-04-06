var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , Schema = mongoose.Schema

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
  date: { type: Date, default: Date.now },
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

