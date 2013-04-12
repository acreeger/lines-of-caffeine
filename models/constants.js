//TODO: Move to common
exports.order = {
  STATUS_NEW : "new",
  STATUS_IN_PRODUCTION : "in-production",
  STATUS_COMPLETE : "complete",
  STATUS_ABORTED : "aborted",
  STATUS_ASSIGNED : "assigned"
}

// TODO: Use this to list the drink types
exports.drinkTypes = {
  "americano": "Cafè Americano"
  , "latte": "Cafè Latte"
  , "mocha": "Cafè Mocha"
  , "cappuccino": "Cappuccino"
  , "chai": "Chai Latte"
  , "single-espresso": "single Espresso shot"
  , "double-espresso": "double Espresso shot"
  , "dry-cappuccino": "dry Cappuccino"
  , "macchiato": "Macchiato"
};

exports.strengthTypes = {
  "full": "full strength"
  , "decaf": "decaffeinated"
  , "half-caff": "half caff"
};

exports.milkTypes = {
  "full-fat": "full fat"
  , "skim": "non-fat"
  , "soy" : "soy"
  , "none": "no"
};
