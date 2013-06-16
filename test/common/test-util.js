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
  });
  describe('#normalizeUSPhoneNumber', function() {
    it("should remove (, ), -, . and whitespace and append +1 on the beginning", function() {
      var data = {
        "415 321-4321" : "+14153214321",
        "+1 (650) 555 5555" : "+16505555555",
        "510.555.9876" : "+15105559876"
      }

      for (var input in data) {
        var expectedOutput = data[input];
        var result = util.normalizeUSPhoneNumber(input);
        result.should.equal(expectedOutput);
      }
    });

    it("should return the original for non US numbers", function() {
      var data = {
        "07855 123456" : "07855 123456",
        "+44 07987333222" : "+44 07987333222"
      }

      for (var input in data) {
        var expectedOutput = data[input];
        var result = util.normalizeUSPhoneNumber(input);
        result.should.equal(expectedOutput);
      }
    });

    it ("should return null for null input", function() {
      should.not.exist(util.normalizeUSPhoneNumber(null));
    })
  });
})