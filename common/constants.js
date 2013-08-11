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
  , "latte": "Caffè Latte"
  , "mocha": "Caffè Mocha"
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

exports.EMAIL_VALIDATION_REGEX = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
exports.US_PHONE_VALIDATION_REGEX = /^(\+?1[-\.\s]?)?(\([2-9]\d{2}\)|[2-9]\d{2})[-\.\s]?[2-9]\d{2}[-\.\s]?\d{4}$/;

exports.AVERAGE_TIME_TO_MAKE_DRINK = 2.2
exports.DEFAULT_NUMBER_OF_BARISTAS = 2
exports.TIME_BETWEEN_DRINKS = 0.73
