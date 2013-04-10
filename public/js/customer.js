// serializeObject
(function(f){return f.fn.serializeObject=function(){var k,l,m,n,p,g,c,h=this;g={};c={};k=/^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/;l=/[a-zA-Z0-9_]+|(?=\[\])/g;m=/^$/;n=/^\d+$/;p=/^[a-zA-Z0-9_]+$/;this.build=function(d,e,a){d[e]=a;return d};this.push_counter=function(d){void 0===c[d]&&(c[d]=0);return c[d]++};f.each(f(this).serializeArray(),function(d,e){var a,c,b,j;if(k.test(e.name)){c=e.name.match(l);b=e.value;for(j=e.name;void 0!==(a=c.pop());)m.test(a)?(a=RegExp("\\["+a+"\\]$"),j=
j.replace(a,""),b=h.build([],h.push_counter(j),b)):n.test(a)?b=h.build([],a,b):p.test(a)&&(b=h.build({},a,b));return g=f.extend(!0,g,b)}});return g}})(jQuery);

jQuery.validator.addMethod("phoneUS", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, ""); 
  return this.optional(element) || phone_number.length > 9 &&
    phone_number.match(/^(\+?1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
},"Please enter a valid US phone number");

var COFFEE = COFFEE || {};

COFFEE.customer = (function($) {
  var formValidator;
  $(function() {
    var $orderForm = $("#order-form")
    formValidator = $orderForm.validate({
      errorClass: "errorMessage",
      messages: {
        "customer[firstName]" :{"required" : "What will we call you?"},
        "customer[lastName]": {"required" : "Type at least the first letter"},
        "customer[cellPhone]": {
          "required" : "Add your digits please",
          "phoneUS" : "Make sure you get this right"
        }
      }
    });

    $("#special-instructions").on("shown", function() {
      $("#special-instructions textarea").focus();
    });

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
        .fail(function(jqXHR, textStatus, errorThrown) {console.log("An error happened", errorThrown)});
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