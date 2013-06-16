
var mongoose = require("mongoose");
var connection = mongoose.createConnection("mongodb://localhost/lines-of-caffeine-test");
require("../../models/drink-order")(connection);
var should = require("should")

var DrinkOrder = connection.model('DrinkOrder')
  , util = require("../../common/util")

function createTestOrders(contactInfos, done) {
  var lastErr = null;
  var callCount = 0;
  var cb = function(err) {
    callCount++;
    if (err) {
      lastErr = err
      console.error("ERROR while creating drink order in test:", err)
    }    
    if (callCount == contactInfos.length) done(lastErr);
  }
  for (var i = 0; i <contactInfos.length; i++) {
    var payload = {
      "customer":{
        "firstName": "first-name",
        "lastName": "last-name"      
      },
      "drinks":[{
        "specialInstructions":"","strength":"full","drinkType":"latte","milk":"full-fat"
      }]
    }
    var order = new DrinkOrder(payload);
    order.contactInfo = contactInfos[i];
    order.save(cb);
  }
}

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

  describe('#getOrdersForUser', function() {
    beforeEach(function(done){
      DrinkOrder.remove({}, function(err){
        if (err) return done(err);
        createTestOrders(["testemail@test.com","someothertest@email.com","415.767.8448","646-766-3444",
                          "testemail@test.com","someothertest@email.com","(415) 7678448","+1 (646) 766-3444",
                          "testemail@test.com","someothertest@email.com","(415) 767-8448","6467663444"], done)
        // db.save([tobi, loki, jane], done);
      });
    })
    it("should return empty list for non-existant email", function(done) {
      var contactInfo = "idontexist@here.com";
      DrinkOrder.getOrdersForUser(contactInfo, 1, function(err, orders) {
        orders.should.be.empty;
        done();
      })
    });
    it("should return empty list for non-existant cellPhone", function(done) {
      var contactInfo = "555 999 9999";
      DrinkOrder.getOrdersForUser(contactInfo, 1, function(err, orders) {
        orders.should.be.empty;
        done();
      })
    });
    it("should return the correct number of orders for a valid email (1) in descending chrono order", function(done) {
      //TODO: test chrono order (how? By DB query?)
      var email = "someothertest@email.com"
      DrinkOrder.getOrdersForUser(email, 1, function(err, orders) {
        if (err) done(err);
        else {
          orders.should.have.length(1);
          orders[0].contactInfo.should.equal(email)
          done();
        }
      })
    });
    it("should return the correct number of orders for a valid email (3) in descending chrono order", function(done) {
      //TODO: test chrono order (how? By DB query?)
      var email = "someothertest@email.com"
      DrinkOrder.getOrdersForUser(email, 3, function(err, orders) {
        if (err) done(err);
        else {
          orders.should.have.length(3);
          orders[0].contactInfo.should.equal(email)
          done();
        }
      })
    });
    it("should return the correct number of orders for a valid email (3, but requested 5) in descending chrono order", function(done) {
      //TODO: test chrono order (how? By DB query?)
      var email = "someothertest@email.com"
      DrinkOrder.getOrdersForUser(email, 5, function(err, orders) {
        if (err) done(err);
        else {
          orders.should.have.length(3);
          orders[0].contactInfo.should.equal(email)
          done();
        }
      })
    });
    it("should return the correct number of orders for a valid cellPhone", function(done) {
      //TODO: test chrono order (how? By DB query?)
      var cellPhone = "4157678448"
      DrinkOrder.getOrdersForUser(cellPhone, 1, function(err, orders) {
        if (err) done(err);
        else {
          orders.should.have.length(1);
          orders[0].contactInfo.should.equal(util.normalizeUSPhoneNumber(cellPhone))
          done();
        }
      })
    });
    it("should return the correct order for a cellPhone number, even when it is in a different format", function(done) {
      //TODO: test chrono order (how? By DB query?)
      var cellPhone = "(415) 767 8448"
      DrinkOrder.getOrdersForUser(cellPhone, 1, function(err, orders) {
        if (err) done(err);
        else {
          orders.should.have.length(1);
          orders[0].contactInfo.should.equal(util.normalizeUSPhoneNumber(cellPhone))
          done();
        }
      })
    });
    it("should return the correct number of orders for a valid cellPhone (3) in descending chrono order", function(done) {
      //TODO: test chrono order (how? By DB query?)
      var cellPhone = "4157678448"
      DrinkOrder.getOrdersForUser(cellPhone, 3, function(err, orders) {
        if (err) done(err);
        else {
          orders.should.have.length(3);
          orders[0].contactInfo.should.equal(util.normalizeUSPhoneNumber(cellPhone))
          done();
        }
      })
    });
    it("should return the correct number of orders for a valid cellPhone (3, but requested 5) in descending chrono order", function(done) {
      //TODO: test chrono order (how? By DB query?)
      var cellPhone = "4157678448"
      DrinkOrder.getOrdersForUser(cellPhone, 5, function(err, orders) {
        if (err) done(err);
        else {
          orders.should.have.length(3);
          orders[0].contactInfo.should.equal(util.normalizeUSPhoneNumber(cellPhone))
          done();
        }
      })
    });
  });
})