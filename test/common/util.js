require("../../models/drink-order")
var should = require("should")

var util = require("../../common/util")

describe('util', function(){
  describe('#validateUSPhoneNumber', function(){
    it('should accept phone numbers with spaces in', function(){
      var phoneNumber = "415 333 4444"
      util.validateUSPhoneNumber(phoneNumber).should.be.ok
    })

    it('should accept phone numbers with no spaces in', function(){
      var phoneNumber = "4153334444"
      util.validateUSPhoneNumber(phoneNumber).should.be.ok
    })

    it('should accept phone numbers with dots in', function(){
      var phoneNumber = "415.333.4444"
      util.validateUSPhoneNumber(phoneNumber).should.be.ok
    })
  })
})