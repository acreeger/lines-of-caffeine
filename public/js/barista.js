var COFFEE = COFFEE || {};

COFFEE.barista = (function($, ich, shared) {

  var numberOfBaristas = 0

  var baristas;

  var init = function(numBaristas) {
    //TODO the scoping is weird here.
    numberOfBaristas = numBaristas;
    baristas = new Array(numberOfBaristas);
    $(function() {
      $.get('/api/order/request', {num_baristas: numberOfBaristas}, function(orders) {
        if (orders.length === 0) {
          $(".no-orders").show();
        } else {
          var i;
          for(i = 0; i < orders.length; i++) {
            var order = orders[i];
            (function($, order, baristaId) {
              $.post("/api/order/" + order._id + "/assign/" + baristaId, function(response) {
                baristas[baristaId] = response.data;
                var drink = order.drinks[0];
                var orderForTemplate = {
                  strength: shared.STRENGTH_TYPES[drink.strength] ? shared.STRENGTH_TYPES[drink.strength] : drink.strength,
                  drinkType: shared.DRINK_TYPES[drink.drinkType] || drink.drinkType,
                  milk: shared.MILK_TYPES[drink.milk] || drink.milk,
                  name: order.customer.firstName + " " + order.customer.lastName.substring(0,1),
                  status: order.status,
                  id: order._id
                }
                console.log("orderForTemplate", orderForTemplate);
                var $order = ich.orderTemplate(orderForTemplate);
                $("#barista" + baristaId + " .orders").append($order);
              });
            })($,order,i);
          }
          console.log("i at the end",i,"numberOfBaristas",numberOfBaristas);
          while(i < numberOfBaristas) {
            $("#barista" + i + " .no-orders").show();
            i++;
          } 
        }
      });

      $(document).on("click", ".mark-as-started", function(){
        var $this = $(this);
        var $order = $this.closest(".order")
        var orderId = $order.attr("data-order-id");
        console.log("mark-as-started: Got order id", orderId);
        var url = "/api/order/" + orderId + "/start"
        $.post(url, function() {
          $order.removeClass("status-new").addClass("status-in-production");
        })
      });
      //TODO: Get the count of unopened orders
    });
  }

  return {
    init : init
  };
})(jQuery, ich, COFFEE.shared);