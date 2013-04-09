// serializeObject
(function(f){return f.fn.serializeObject=function(){var k,l,m,n,p,g,c,h=this;g={};c={};k=/^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/;l=/[a-zA-Z0-9_]+|(?=\[\])/g;m=/^$/;n=/^\d+$/;p=/^[a-zA-Z0-9_]+$/;this.build=function(d,e,a){d[e]=a;return d};this.push_counter=function(d){void 0===c[d]&&(c[d]=0);return c[d]++};f.each(f(this).serializeArray(),function(d,e){var a,c,b,j;if(k.test(e.name)){c=e.name.match(l);b=e.value;for(j=e.name;void 0!==(a=c.pop());)m.test(a)?(a=RegExp("\\["+a+"\\]$"),j=
j.replace(a,""),b=h.build([],h.push_counter(j),b)):n.test(a)?b=h.build([],a,b):p.test(a)&&(b=h.build({},a,b));return g=f.extend(!0,g,b)}});return g}})(jQuery);

jQuery.validator.addMethod("phoneUS", function(phone_number, element) {
    phone_number = phone_number.replace(/\s+/g, ""); 
  return this.optional(element) || phone_number.length > 9 &&
    phone_number.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}, "Please specify a valid phone number");

var COFFEE = COFFEE || {};

COFFEE.customer = (function($) {

  $(function() {
    $("#order-form").validate();
    $("#cust-first-name").focus();
    $("#order-button").click(function(evt) {
      evt.preventDefault();
      var $disabledElems = $(".order-row select").filter(":disabled").prop("disabled",false);
      var serializedForm = $('#order-form').serializeObject();
      $disabledElems.prop("disabled", true);
      var jqxhr = $.post('/api/order',serializedForm).done(function(data) {
        console.log("Success! Got data", data);
        $("#order-success").modal().one("hide",function() {
          $(".customer-data").val('');
          $(".order-row select option").filter(":selected").prop("selected", false);
          $disabledElems.prop("disabled",false).fadeTo(100,1.0);
        });
        //IDEA: Inlcude chance to edit phone number in modal?
      })
      .fail(function(jqXHR, textStatus, errorThrown) {console.log("An error happened", errorThrown)});        
    });
    var $strengthSelect = $(".caff-level");

    $(".coffee-type").change(function () {
      var $this = $(this);
      var caffeineOnly = $this.find("option").filter(":selected").hasClass("caffeine-only");
      var opacity = caffeineOnly ? 0.3 : 1.0;
      if (caffeineOnly) {
        $strengthSelect.val("full");
      }
      $strengthSelect.prop("disabled", caffeineOnly);
      $strengthSelect.fadeTo(200, opacity);
    });
  });

  return {

  };
})(jQuery);