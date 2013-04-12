// serializeObject
(function(f){return f.fn.serializeObject=function(){var k,l,m,n,p,g,c,h=this;g={};c={};k=/^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/;l=/[a-zA-Z0-9_]+|(?=\[\])/g;m=/^$/;n=/^\d+$/;p=/^[a-zA-Z0-9_]+$/;this.build=function(d,e,a){d[e]=a;return d};this.push_counter=function(d){void 0===c[d]&&(c[d]=0);return c[d]++};f.each(f(this).serializeArray(),function(d,e){var a,c,b,j;if(k.test(e.name)){c=e.name.match(l);b=e.value;for(j=e.name;void 0!==(a=c.pop());)m.test(a)?(a=RegExp("\\["+a+"\\]$"),j=
j.replace(a,""),b=h.build([],h.push_counter(j),b)):n.test(a)?b=h.build([],a,b):p.test(a)&&(b=h.build({},a,b));return g=f.extend(!0,g,b)}});return g}})(jQuery);

//charCount
(function(e){e.fn.charCount=function(t){function r(n){var r=e(n).val().length;var i=t.allowed-r;if(i<=t.warning&&i>=0){e(n).next().addClass(t.cssWarning)}else{e(n).next().removeClass(t.cssWarning)}if(i<0){e(n).next().addClass(t.cssExceeded)}else{e(n).next().removeClass(t.cssExceeded)}e(n).next().html(t.counterText+i)}var n={allowed:140,warning:25,css:"counter",counterElement:"span",cssWarning:"warning",cssExceeded:"exceeded",counterText:""};var t=e.extend(n,t);this.each(function(){e(this).after("<"+t.counterElement+' class="'+t.css+'">'+t.counterText+"</"+t.counterElement+">");r(this);e(this).keyup(function(){r(this)});e(this).change(function(){r(this)})})}})(jQuery)

jQuery.validator.addMethod("phoneUS", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, ""); 
  return this.optional(element) || phone_number.length > 9 &&
    phone_number.match(/^(\+?1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
},"Please enter a valid US phone number");

var COFFEE = COFFEE || {};

COFFEE.customer = (function($) {
  var formValidator;
  var idleTimeMins = 0;
  var oldWaitingTime = -1;
  var LONG_WAIT_THRESHOLD = 15

  function resetForm() {
    formValidator.resetForm();
    $("#order-form").get(0).reset();
    $(".modal").modal("hide");
    $(".valid").removeClass("valid");
    $("input.errorMessage").removeClass("errorMessage");
    $(".order-row select").filter(":disabled").prop("disabled",false).fadeTo(100,1.0);
    $("#special-instructions textarea").change();
  }

  $(function() {

    var idleInterval = setInterval(function() {
      idleTimeMins++;
      console.log("Incrementing idleTimeMins to", idleTimeMins);
      if (idleTimeMins > 1) { // Actually 2 mins
          idleTimeMins = 0;
          console.log("Resetting form due to inactivity");
          resetForm();
      }
    }, 60000);

    var hideVisibleWaitInfo = function() {
      $(".wait-info").filter(":visible").hide();
    }

    var updateWaitingTime = function() {
      $.get("/api/queue/summary", function(response){
        var waitingTime = response.data.waitingTime;
        if (waitingTime === 0 && oldWaitingTime !== 0) {
          hideVisibleWaitInfo();
          $(".no-wait").show();
        } else if (waitingTime === 1 && oldWaitingTime !== 1) {
          hideVisibleWaitInfo();
          $(".one-minute-wait").show();
        } else if (waitingTime > 1) {
          if (oldWaitingTime <= 1) {
            hideVisibleWaitInfo();
            $(".wait-length").text(waitingTime);
            $(".minutes-wait").show();
          } else if(oldWaitingTime !== waitingTime) {
            //just switch out the numbers
            var $waitLengthHolder = $(".wait-length")
            $waitLengthHolder.fadeOut(function (){
              $waitLengthHolder.text(waitingTime);
              $waitLengthHolder.fadeIn();
            })
          }
          if (waitingTime > LONG_WAIT_THRESHOLD) {
            $("#long-wait-caution").fadeIn()
          } else {
            $("#long-wait-caution").fadeOut()
          }          
        }
        oldWaitingTime = waitingTime;
      })
      .fail(function(jqXHR, textStatus, errorThrown) {console.log("An error happened while getting the queue summary:", errorThrown)});
    }

    var idleInterval = setInterval(updateWaitingTime, 10000); //TODO: Change to 30s
    updateWaitingTime();

    $(document).on("mousemove click keypress" ,function() {
      idleTimeMins = 0;
    });

    $(".reset-button").on("click", resetForm)
    $(".refresh-button").on("click", function() {window.location.reload()})

    var $orderForm = $("#order-form")
    formValidator = $orderForm.validate({
      errorClass: "errorMessage",
      messages: {
        "customer[firstName]" :{"required" : "What will we call you?"},
        "customer[lastName]": {"required" : "Type at least the first letter"},
        "customer[cellPhone]": {
          "required" : "Add your digits please",
          "phoneUS" : "This doesn't look right"
        }
      }
    });

    $("#special-instructions").on("shown", function() {
      $("#special-instructions textarea").focus();
    }).find("textarea").on("change", function() {
      if ($.trim($(this).val()) !== "") {
        $("#no-special-requests").hide();
        $("#entered-special-requests").show();
      } else {
        $("#no-special-requests").show();
        $("#entered-special-requests").hide();
      }
    }).charCount({
      allowed: 380,
      warning: 20,
      counterText: 'Characters left: ',
      cssWarning: 'text-warning',
      cssExceeded: 'text-error',
      counterElement: 'div'
    });

    $(".clear-special-instructions").on("click", function() {
      $("#special-instructions textarea").val("").change();
    })

    $("#order-button").click(function(evt) {
      evt.preventDefault();
      if ($orderForm.valid()) {
        $button = $(this).prop("disabled", true);
        var $disabledElems = $(".order-row select").filter(":disabled").prop("disabled",false);
        var serializedForm = $('#order-form').serializeObject();
        $disabledElems.prop("disabled", true);
        var jqxhr = $.post('/api/order',serializedForm).done(function(data) {
          console.log("Success! Got data", data);
          var timeoutHandler
          $("#order-success").one("show", function() {
            timeoutHandler = window.setTimeout(function() {
              $("#order-success").modal('hide')
            }, 10000);
          })
          .modal()
          .one("hide",function() {
            window.clearTimeout(timeoutHandler);
            $button.prop("disabled", false);
            $(".valid").removeClass("valid");
            formValidator.resetForm();
            $("#order-form").get(0).reset();
            $disabledElems.prop("disabled",false).fadeTo(100,1.0);
          });
          //IDEA: Inlcude chance to edit phone number in modal?
        })
        .fail(function(jqXHR, textStatus, errorThrown) {console.log("An error happened while creating order:",serializedForm, errorThrown)});
      }
    });
    var $strengthSelect = $(".caff-level");
    var $milkSelect = $(".milk-type");

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