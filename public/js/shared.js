var COFFEE = COFFEE || {};

COFFEE.initShared = function(drinkTypes, strengthTypes, milkTypes) {

  var DRINK_TYPES = drinkTypes;
  var STRENGTH_TYPES = strengthTypes;
  var MILK_TYPES = milkTypes;

  return {
    DRINK_TYPES : DRINK_TYPES
    , MILK_TYPES : MILK_TYPES
    , STRENGTH_TYPES : STRENGTH_TYPES
  };
}