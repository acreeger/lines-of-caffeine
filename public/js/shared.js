(function ($) {
  var regex = /\+1(\d{3})(\d{3})(\d{4})/
  $.fn.renderUSPhoneNumber = function() {
    return this.each(function() {
      var $this = $(this);
      var newVal = $this.text().replace(regex, "($1) $2-$3")
      $this.text(newVal);
    }); 
  }
}(jQuery));

var COFFEE = COFFEE || {};

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};

COFFEE.initShared = function(drinkTypes, strengthTypes, milkTypes, doTracking) {
  var DRINK_TYPES = drinkTypes;
  var STRENGTH_TYPES = strengthTypes;
  var MILK_TYPES = milkTypes;

  var doTracking = doTracking;

  function trackEvent(category,action,label) {
    if (doTracking && ga) {
      if (label) {
        ga('send', 'event', category, action, label);
      } else {
        ga('send', 'event', category, action);
      }
    }
  }

  console.log("COFFEE.shared: Tracking enabled:", doTracking);

  return {
    DRINK_TYPES : DRINK_TYPES
    , MILK_TYPES : MILK_TYPES
    , STRENGTH_TYPES : STRENGTH_TYPES
    , trackEvent : trackEvent
  };
}