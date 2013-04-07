var COFFEE = COFFEE || {};

COFFEE.barista = (function($, ich, shared) {

  var numberOfBaristas = 0

  var init = function(numBaristas) {
    //TODO the scoping is weird here.
    numberOfBaristas = numBaristas;
    $(function() {
      $.get('/api/order/request', {num_baristas: numberOfBaristas}, function(orders) {
        if (orders.length === 0) {
          $(".no-orders").show();
        } else {
          var i;
          for(i = 0; i < orders.length; i++) {
            var order = orders[i];
            var drink = order.drinks[0];
            console.log("order", order);
            var orderForTemplate = {
              strength: shared.STRENGTH_TYPES[drink.strength] ? shared.STRENGTH_TYPES[drink.strength] : drink.strength,
              drinkType: shared.COFFEE_TYPES[drink.drinkType] || drink.drinkType,
              milk: shared.MILK_TYPES[drink.milk] || drink.milk,
              name: order.customer.firstName + " " + order.customer.lastName.substring(0,1)
            }
            console.log("orderForTemplate", orderForTemplate);
            var $order = ich.orderTemplate(orderForTemplate);
            $("#barista" + i + " .orders").append($order);
            //TODO GENERATE HTML
          }
          console.log("i at the end",i,"numberOfBaristas",numberOfBaristas);
          while(i < numberOfBaristas) {
            $("#barista" + i + " .no-orders").show();
            i++;
          } 
        }
      });
      //TODO: Get the count of unopened orders
    });
  }

  return {
    init : init
  };
})(jQuery, ich, COFFEE.shared);