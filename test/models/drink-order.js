require("../../models/drink-order")
var should = require("should")

var assert = require("assert")
  , mongoose = require("mongoose")
  , DrinkOrder = mongoose.model('DrinkOrder');

//need to set up mongoose


describe('DrinkOrder', function(){
  describe('#setContactInfo', function(){
    it('should accept phone numbers with spaces in', function(){
      var drink = new DrinkOrder();
      drink.contactInfo = "415 333 4444"
      drink.should.have.property("customer");
      drink.customer.should.have.property("cellPhone", "415 333 4444")
    })

    it('should accept phone numbers with no spaces in', function(){
      var drink = new DrinkOrder();
      drink.contactInfo = "4153334444"
      drink.should.have.property("customer");
      drink.customer.should.have.property("cellPhone", "4153334444")
    })

    it('should accept valid email addresses', function(){
      var drink = new DrinkOrder();
      drink.contactInfo = "test@test.com"
      drink.should.have.property("customer");
      drink.customer.should.have.property("emailAddress", "test@test.com")
    })
  })
})