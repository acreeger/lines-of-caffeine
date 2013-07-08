// serializeObject
(function(f){return f.fn.serializeObject=function(){var k,l,m,n,p,g,c,h=this;g={};c={};k=/^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/;l=/[a-zA-Z0-9_]+|(?=\[\])/g;m=/^$/;n=/^\d+$/;p=/^[a-zA-Z0-9_]+$/;this.build=function(d,e,a){d[e]=a;return d};this.push_counter=function(d){void 0===c[d]&&(c[d]=0);return c[d]++};f.each(f(this).serializeArray(),function(d,e){var a,c,b,j;if(k.test(e.name)){c=e.name.match(l);b=e.value;for(j=e.name;void 0!==(a=c.pop());)m.test(a)?(a=RegExp("\\["+a+"\\]$"),j=
j.replace(a,""),b=h.build([],h.push_counter(j),b)):n.test(a)?b=h.build([],a,b):p.test(a)&&(b=h.build({},a,b));return g=f.extend(!0,g,b)}});return g}})(jQuery);

//charCount
(function(e){e.fn.charCount=function(t){function r(n){var r=e(n).val().length;var i=t.allowed-r;if(i<=t.warning&&i>=0){e(n).next().addClass(t.cssWarning)}else{e(n).next().removeClass(t.cssWarning)}if(i<0){e(n).next().addClass(t.cssExceeded)}else{e(n).next().removeClass(t.cssExceeded)}e(n).next().html(t.counterText+i)}var n={allowed:140,warning:25,css:"counter",counterElement:"span",cssWarning:"warning",cssExceeded:"exceeded",counterText:""};var t=e.extend(n,t);this.each(function(){e(this).after("<"+t.counterElement+' class="'+t.css+'">'+t.counterText+"</"+t.counterElement+">");r(this);e(this).keyup(function(){r(this)});e(this).change(function(){r(this)})})}})(jQuery);

(function($) {
    $.fn.goTo = function() {
        $('html, body').animate({
            scrollTop: $(this).offset().top + 'px'
        }, 'fast');
        return this; // for chaining...
    }
})(jQuery);

function validateUSPhone(phone_number) {
  return phone_number.length > 9 &&
    phone_number.match(/^(\+?1[-\.\s]?)?(\([2-9]\d{2}\)|[2-9]\d{2})[-\.\s]?[2-9]\d{2}[-\.\s]?\d{4}$/);
}

jQuery.validator.addMethod("phoneUS", function(phone_number, element) {
  return this.optional(element) || validateUSPhone(phone_number);
},"Please enter a valid US phone number");

var COFFEE = COFFEE || {};

COFFEE.customer = (function($) {
  var formValidator, contactInfoFormValidator;
  var idleTimeMins = 0;
  var oldWaitingTime = -1;
  var LONG_WAIT_THRESHOLD = 15;

  $(function() {

    function resetForm() {
      formValidator.resetForm();
      contactInfoFormValidator.resetForm();
      $contactInfoForm.get(0).reset();
      clearStateBag();
      $("#order-form").get(0).reset();
      $(".modal").modal("hide");
      $(".valid").removeClass("valid");
      $("input.errorMessage").removeClass("errorMessage");
      $(".order-row select").filter(":disabled").prop("disabled",false).fadeTo(100,1.0);
      $("#special-instructions textarea").change();
      $orderForm.hide();
      $contactInfoForm.show();
    }

    var handleSpecialInstructions = function(specialInstructions) {
      var hasSpecialInstructions = specialInstructions.length > 0;
      if (hasSpecialInstructions) {
        $("#special-instructions-input").val(specialInstructions);
        $("#special-instructions-text").text(specialInstructions);
      }
      $("#no-special-requests").toggle(!hasSpecialInstructions);
      $("#entered-special-requests").toggle(hasSpecialInstructions);
    }

    var idleInterval = setInterval(function() {
      idleTimeMins++;
      console.log("Incrementing idleTimeMins to", idleTimeMins);
      if (idleTimeMins > 1) { // Actually 2 mins
          idleTimeMins = 0;
          console.log("Resetting form due to inactivity");
          COFFEE.shared.trackEvent("Miscellaneous", "Reset", "Inactivity");
          resetForm();
      }
    }, 60000);

    var hideVisibleWaitInfos = function() {
      $(".wait-info").filter(":visible").hide();
    }

    var showOrHideWaitingTimeCaution = function(waitingTime) {
      if (waitingTime > LONG_WAIT_THRESHOLD) {
        $("#long-wait-caution").fadeIn()
      } else {
        $("#long-wait-caution").fadeOut()
      }
    }

    var updateWaitingTime = function() {
      $.get("/api/queue/summary", function(response){
        var waitingTime = response.data.waitingTime;
        if (waitingTime === 0 && oldWaitingTime !== 0) {
          hideVisibleWaitInfos();
          $(".no-wait").show();
        } else if (waitingTime === 1 && oldWaitingTime !== 1) {
          hideVisibleWaitInfos();
          $(".one-minute-wait").show();
        } else if (waitingTime > 1) {
          if (oldWaitingTime <= 1) {
            hideVisibleWaitInfos();
            $(".wait-length").text(waitingTime);
            $(".minutes-wait").show();
            showOrHideWaitingTimeCaution(waitingTime);
          } else if(oldWaitingTime !== waitingTime) {
            //just switch out the numbers
            var $waitLengthHolder = $(".wait-length")
            $waitLengthHolder.fadeOut(function (){
              $waitLengthHolder.text(waitingTime);
              $waitLengthHolder.fadeIn(function() {
              });
            });
            showOrHideWaitingTimeCaution(waitingTime);
          }
        }
        oldWaitingTime = waitingTime;
      })
      .fail(function(jqXHR, textStatus, errorThrown) {console.log("An error happened while getting the queue summary:", errorThrown)});
    }

    var updateWaitingTimeInterval = setInterval(updateWaitingTime, 30 * 1000);
    updateWaitingTime();

    $(document).on("mousemove click keypress" ,function() {
      idleTimeMins = 0;
    });

    $(".reset-button").on("click", function() {
      COFFEE.shared.trackEvent("Miscellaneous", "Reset", "Button clicked");
      resetForm();
    });
    $(".refresh-button").on("click", function() {
      COFFEE.shared.trackEvent("Miscellaneous", "Refresh", "Button clicked");
      window.location.reload()
    });

    var $contactInfoForm = $("#contact-info-form")
    var $orderForm = $("#order-form");

    var $strengthSelect = $(".caff-level");
    var $milkSelect = $(".milk-type");
    var $coffeeTypeSelect =$(".coffee-type");

    var emailOrUSPhoneNumber = function(value, element) {
      return this.optional(element)
        || $.validator.methods.email.call(this, value, element)
        || $.validator.methods.phoneUS.call(this, value, element)
    }

    $.validator.addMethod("emailOrUSPhoneNumber", emailOrUSPhoneNumber, "Please enter a valid email address or US phone number");

    contactInfoFormValidator = $contactInfoForm.validate({
      errorClass: "errorMessage",
      messages: {
        "contact-info-prescreen" : {
          "required" : "We'll need this to look up your last order...",
          "emailOrUSPhoneNumber" : "Sure this is a valid email or US cell number?"
        }
      },
      rules :{
        "contact-info-prescreen" : {
          required: true,
          emailOrUSPhoneNumber: true}
      },
      ignoreTitle: true
    });

    formValidator = $orderForm.validate({
      errorClass: "errorMessage",
      messages: {
        "customer[firstName]" :{"required" : "What will we call you?"},
        "customer[lastName]": {"required" : "Type at least the first letter"},
        "customer[contactInfo]": {
          "required" : "Add your digits or email please",
          "emailOrUSPhoneNumber" : "Sure this is a valid email or US cell number?"
        }
      },
      rules: {
        "customer[contactInfo]" : {
          required: true,
          emailOrUSPhoneNumber: true
        }
      },
      ignoreTitle: true
    });

    var stateBag = {};

    function clearStateBag() {
      stateBag = {};
    }

    $("#contact-info").on("keyup", function() {
      var val = $(this).val();
      var wasValid = stateBag.wasValid;
      var isValidPhoneNumber = validateUSPhone(val);
      stateBag.wasValid = isValidPhoneNumber;
      if (!wasValid && isValidPhoneNumber) this.blur();
    });

    $("#special-instructions").on("shown", function() {
      $("#special-instructions textarea").focus();
    }).find("textarea").on("change", function() {
      handleSpecialInstructions($.trim($(this).val()))
    }).charCount({
      allowed: 110,
      warning: 20,
      counterText: 'Characters left: ',
      cssWarning: 'text-warning',
      cssExceeded: 'text-error',
      counterElement: 'div'
    });

    $(".clear-special-instructions").on("click", function(evt) {
      evt.preventDefault();
      $("#special-instructions textarea").val("").change();
    })

    var hideContactInfoFormAndShowOrderForm = function(cb) {
      cb = cb || function() {};
      $contactInfoForm.fadeOut(function(){
        //TODO: Detect phone layout, hide final container
        //http://stackoverflow.com/questions/10547876/listen-for-browser-width-for-responsive-web-design
        //TODO: Handle resize, but not a priority.
        $orderForm.fadeIn(function() {
          cb();
        });
      });
    }

    $("#never-used-it-button").click(function(evt) {
      evt.preventDefault();
      COFFEE.shared.trackEvent('Pre-screen', 'Never used app before');
      hideContactInfoFormAndShowOrderForm();
    });

    $("#next-button").click(function(evt) {
      evt.preventDefault();
      if ($contactInfoForm.valid()) {
        var $button = $(this).prop("disabled", true);
        var contactInfo = $("#contact-info-prescreen").val();
        var reenableButton = function() {$button.prop("disabled", false);}
        $.get("/api/order/searchByContact?contact=" + encodeURIComponent(contactInfo)).done(function(result) {
          console.log("Got data from searchByContact(%s):",contactInfo, result);
          if (result.data.length == 0) {
            COFFEE.shared.trackEvent('Pre-screen', 'Contact Info Entered', 'No order found');
            alert("Hmm, we couldn't find your previous order.\n\nYou'll have to enter your order in from scratch. Sorry!");
          } else {
            var lastOrder = result.data[0];
            COFFEE.shared.trackEvent('Pre-screen', 'Contact Info Entered', 'Order found');
            $("#cust-first-name").val(lastOrder.customer.firstName);
            $("#cust-last-name").val(lastOrder.customer.lastName);

            var drink = lastOrder.drinks[0];
            $strengthSelect.val(drink.strength);
            $milkSelect.val(drink.milk);
            $coffeeTypeSelect.val(drink.drinkType);
            handleSpecialInstructions(drink.specialInstructions);
          }
          $("#contact-info").val(contactInfo);
          hideContactInfoFormAndShowOrderForm(reenableButton);
        }).fail(function(jqXHR, textStatus, errorThrown) {
          COFFEE.shared.trackEvent('Pre-screen', 'Contact Info Entered', 'Error occured');
          console.log("An error happened while looking up order by contactInfo:", contactInfo, errorThrown)
          alert("Ruh-roh, Raggy! Something went wrong when looking up your order.\n\nYou'll have to enter your order in from scratch. Sorry!");
          $("#contact-info").val(contactInfo);
          hideContactInfoFormAndShowOrderForm(reenableButton);
        });

      }
    });

    $("#show-order-container-button").click(function(evt) {
      evt.preventDefault();
      // if ($orderForm.valid()) {
        //TODO: Hide contact info container, show order container
        $("#order-container").goTo();
      // }
    });

    $("#order-button").click(function(evt) {
      evt.preventDefault();
      if ($orderForm.valid()) {
        var $button = $(this).prop("disabled", true);
        var $disabledElems = $(".order-row select").filter(":disabled").prop("disabled",false);
        var drinkType = $(".coffee-type option:selected").text();
        var milkType = $(".milk-type option:selected").text();
        var strength = $(".caff-level option:selected").text();
        var serializedForm = $('#order-form').serializeObject();
        serializedForm.estimatedCompletionWait = oldWaitingTime;
        $disabledElems.prop("disabled", true);
        $.post('/api/order',serializedForm).done(function(data) {
          COFFEE.shared.trackEvent("Order placed", "Success");
          COFFEE.shared.trackEvent("Drink", "Drink Type", drinkType);
          COFFEE.shared.trackEvent("Drink", "Milk Type", milkType);
          COFFEE.shared.trackEvent("Drink", "Strength", strength);
          COFFEE.shared.trackEvent("Drink", "Full drink description", strength + " " + drinkType + " " + milkType);
          console.log("Success! Got data", data);
          var timeoutHandler
          $("#order-success").one("show", function() {
            timeoutHandler = window.setTimeout(function() {
              $("#order-success").modal('hide')
            }, 2500);
          })
          .modal()
          .one("hide",function() {
            window.clearTimeout(timeoutHandler);
            $button.prop("disabled", false);
            resetForm();
          });
          updateWaitingTime();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          COFFEE.shared.trackEvent("Order placed", "Failure", textStatus);
          console.log("An error happened while creating order:",serializedForm, errorThrown)
          alert("Ruh-roh, Raggy! Something went wrong when placing your order. Please try again!");
          $button.prop("disabled", false);
        });
      } else {
        // $(".logo-row").goTo();
        $("html").goTo();
      }
    });

    $(".coffee-type").change(function () {
      var $this = $(this);
      var caffeineOnly = $this.find("option").filter(":selected").hasClass("caffeine-only");
      var opacity = caffeineOnly ? 0.3 : 1.0;
      if (caffeineOnly) {
        $strengthSelect.val("full");
      }
      $strengthSelect.prop("disabled", caffeineOnly);
      $strengthSelect.fadeTo(200, opacity);

      var noMilk = $this.find("option").filter(":selected").hasClass("no-milk");
      if (noMilk) {
        $milkSelect.val("none")
      }
    });
  });

  return {

  };
})(jQuery);