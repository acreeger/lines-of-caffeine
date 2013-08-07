var app = require('../../app');
var request = require('supertest');

var helper = require("../drink-order-helper")

var TEST_KEY = "TEST_KIOSK_KEY"

describe("drink-order routes" ,function() {
  describe("POST /api/order", function() {
    it("should fail when no key is passed and the station is not accepting public orders");
    it("should succeed when no key is passed and the station is allowing public orders");
    it("should succeed when no key is passed and the station is allowing public orders");
    it("should always fail when the incorrect key is passed");
    it("should always succeed when the correct key is passed and order is valid", function(done) {
      var key = TEST_KEY;
      var url = "/api/order?key=" + TEST_KEY
      var order = {
        "customer[firstName]" : "Testy"
      , "customer[lastName]" : "McTestFace"
      , "customer[contactInfo]" : "an@emailaddress.com"
      , "drinks[0][strength]" : "full"
      , "drinks[0][drinkType]" : "americano"
      , "drinks[0][milk]" : "skim"
      }
      request(app)
        .post(url)
        .type('form')
        .send(order)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")            
          }
        })
    });
  });
  describe('GET /api/order/searchByContact', function(){
    beforeEach(function(done){
      helper.removeAllOrders(function(err) {
        if (err) return done(err);
        helper.createTestOrders(["testemail@test.com","someothertest@email.com","415.767.8448","646-766-3444",
                          "testemail@test.com","someothertest@email.com","(415) 7678448","+1 (646) 766-3444",
                          "testemail@test.com","someothertest@email.com","(415) 767-8448","6467663444", "testemail@test.com"], done);
      });
    })
    it("should return empty list for non-existant email", function(done) {
      var contactInfo = "idontexist@here.com";
      var url = "/api/order/searchByContact?contact=" + encodeURIComponent(contactInfo);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(0);
            done();
          }
        });
    });
    it("should return empty list for non-existant cellPhone", function(done) {
      var contactInfo = "555 999 9999";
      var url = "/api/order/searchByContact?contact=" + encodeURIComponent(contactInfo);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(0);
            done();
          }
        });
    });
    it("should return the correct 1 order for a valid email when no limit is specified in descending chrono order", function(done) {
      var email = "someothertest@email.com";
      var url = "/api/order/searchByContact?contact=" + encodeURIComponent(email);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(1);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("emailAddress", email)
            done();
          }
        });
    });
    it("should return the correct number of orders for a valid email (3) in descending chrono order", function(done) {
      var email = "someothertest@email.com";
      var url = "/api/order/searchByContact?limit=3&contact=" + encodeURIComponent(email);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(3);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("emailAddress", email)
            done();
          }
        });
    });
    it("should return the correct number of orders for a valid email (3, but requested 5) in descending chrono order", function(done) {
      var email = "someothertest@email.com";
      var url = "/api/order/searchByContact?limit=5&contact=" + encodeURIComponent(email);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(3);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("emailAddress", email)
            done();
          }
        });
    });
    it("should return the all orders for a valid email (4) when limit is 0", function(done) {
      var email = "testemail@test.com";
      var url = "/api/order/searchByContact?limit=0&contact=" + encodeURIComponent(email);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(4);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("emailAddress", email)
            done();
          }
        });
    });
    it("should return the all orders for a valid email (4) when limit is < 0", function(done) {
      var email = "testemail@test.com";
      var url = "/api/order/searchByContact?limit=-1&contact=" + encodeURIComponent(email);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(4);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("emailAddress", email)
            done();
          }
        });
    });
    it("should return the only 1 order when limit is not a valid number", function(done) {
      var email = "testemail@test.com";
      var url = "/api/order/searchByContact?limit=fgsdfgdf&contact=" + encodeURIComponent(email);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(1);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("emailAddress", email)
            done();
          }
        });
    });
    it("should return the correct number of orders for a valid cellPhone", function(done) {
      var cellPhone = "4157678448"
      var url = "/api/order/searchByContact?contact=" + encodeURIComponent(cellPhone);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(1);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("cellPhone", "+14157678448")
            done();
          }
        });
    });
    it("should return the correct order for a cellPhone number, even when it is in a different format", function(done) {
      var cellPhone = "(415) 767 8448"
      var url = "/api/order/searchByContact?contact=" + encodeURIComponent(cellPhone);
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(1);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("cellPhone", "+14157678448")
            done();
          }
        });
    });
    it("should return the correct number of orders for a valid cellPhone (3) in descending chrono order", function(done) {
      var cellPhone = "4157678448"
      var url = "/api/order/searchByContact?contact=" + encodeURIComponent(cellPhone) + "&limit=3";
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(3);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("cellPhone", "+14157678448")
            done();
          }
        });
    });
    it("should return the correct number of orders for a valid cellPhone (3, but requested 5) in descending chrono order", function(done) {
      var cellPhone = "4157678448"
      var url = "/api/order/searchByContact?contact=" + encodeURIComponent(cellPhone) + "&limit=5";
      request(app)
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            done(err)
          } else {
            var obj = res.body;
            obj.should.be.a("object");
            obj.should.have.property("success", true)
            obj.should.have.property("data")
            obj.data.should.have.length(3);
            obj.data[0].should.have.property("customer");
            obj.data[0].customer.should.have.property("cellPhone", "+14157678448")
            done();
          }
        });
    });
    it("should return 400 when no contact is provided", function(done) {
      var url = "/api/order/searchByContact";
      request(app)
        .get(url)
        .expect(400, done);
    });
  });
});
  