var COFFEE = COFFEE || {};

COFFEE.shared = (function() {

  var COFFEE_TYPES = {
    "americano": "Americano"
    , "latte": "Caffè latte"
    , "mocha": "Caffè mocha"
    , "cappuccino": "Cappuccino"
    , "chai": "Chai latte"
    , "espresso": "espresso"
  };

  var MILK_TYPES = {
    "full-fat": "full fat"
    , "skim": "skim"
    , "none": "no"
  };

  var STRENGTH_TYPES = {
    "full": "full strength"
    , "decaf": "decaffeinated"
    , "half-caff": "half caff"
  };

  return {
    COFFEE_TYPES : COFFEE_TYPES
    , MILK_TYPES : MILK_TYPES
    , STRENGTH_TYPES : STRENGTH_TYPES
  };
})(jQuery);