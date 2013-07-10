var fs = require("fs")
  , mongoose = require('mongoose')
  , _ = require('underscore');

var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/caffeine_development';

// Bootstrap models
var models_path = __dirname + '/../models'
fs.readdirSync(models_path).forEach(function (file) {
  // console.log("Reading model",file)
  require(models_path+'/'+file)();
})

var DrinkOrder = mongoose.model('DrinkOrder');

function lookupPhoneNumbersByName() {
	var array = fs.readFileSync('names.log').toString().split("\n");
  for(i in array) {
    var name = array[i];
    var indexOfSpace = name.indexOf(" ");
    var firstName = name.substring(0,indexOfSpace);
    var lastName = name.substring(indexOfSpace + 1)//.replace(/ /g,"");
    var firstLetterOfLastName = lastName.substring(0,1);
    // console.log("Looking up phone number for firstName: %s, lastName: %s", firstName, lastName);
    var query = {
      "customer.firstName" : firstName,
      $or : [{"customer.lastName" : lastName}, {"customer.lastName" : firstLetterOfLastName}],
      "customer.cellPhone" : {$ne : null}
    }
    
    var handler = (function (f, l) {
      return function (err, data) {
        if (err) {
          // console.err("An error occured whilst looking for a phone number for %s %s: %s", f, l, JSON.stringify(err))
        } else if (data.length > 0){
          console.log("%s", data[0].customer.cellPhone);
        } else {
          // console.log("Got no results for %s %s",f, l);
        }
      }
    })(firstName, lastName);  
    DrinkOrder.find(query, null, {limit:1}, handler);
  }
}

mongoose.connect(mongoUri, function(err) {
  if (!err) {
    // console.log('connected to MongoDB');
    lookupPhoneNumbersByName();
    // process.exit();
  } else {
    throw err;
  }
});

