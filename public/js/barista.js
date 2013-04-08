var COFFEE = COFFEE || {};

COFFEE.barista = (function($, ich, shared) {

  var numberOfBaristas = 0

  var unassignedBaristasCount;
  var orderStore = {};
  var baristas;

  function updateOrderStore(order) {
    if (order) orderStore[order._id] = order;
  }

  function getOrderFromStore(id) {
    return orderStore[id];
  }

  function assignOrderToBarista(order, baristaId) {
    if (baristas[baristaId]) {
      console.log("Warning: assignOrderToBarista: Cannot barista %d order '%s' as they already have order '%s'", baristaId, order._id, baristas[baristaId]._id);
    } else {
      $.post("/api/order/" + order._id + "/assign/" + baristaId, function(response) {
        order = response.data;
        updateOrderStore(order);
        baristas[baristaId] = order;
        unassignedBaristasCount--;
        var drink = order.drinks[0];
        var orderForTemplate = {
          strength: shared.STRENGTH_TYPES[drink.strength] ? shared.STRENGTH_TYPES[drink.strength] : drink.strength,
          drinkType: shared.DRINK_TYPES[drink.drinkType] || drink.drinkType,
          milk: shared.MILK_TYPES[drink.milk] || drink.milk,
          name: order.customer.firstName + " " + order.customer.lastName.substring(0,1),
          status: order.status,
          id: order._id
        }
        var $order = ich.orderTemplate(orderForTemplate);
        $order.hide();
        var $baristaContainer = $("#barista" + baristaId + " .orders")
        $baristaContainer.append($order);
        $order.fadeIn(200)
      });
    }
  }

  function clearAssignedOrderFromBarista(baristaId, cb) {
    var order = baristas[baristaId]
    if (order) {
      baristas[baristaId] = null
      unassignedBaristasCount++;
      var $order = $("#order-" + order._id);
      $order.fadeOut(function() {
        $order.remove();
        if ($.type(cb) === "function") cb();
      });
    } else {
      console.log("Warning: clearAssignedOrderFromBarista: barista %d is not assigned an order", baristaId);
    }
  }

  var init = function(numBaristas) {
    //TODO the scoping is weird here.
    numberOfBaristas = numBaristas;
    unassignedBaristasCount = numberOfBaristas;
    baristas = new Array(numberOfBaristas);
    $(function() {
      $.get('/api/order/request', {num_baristas: numberOfBaristas}, function(orders) {
        if (orders.length === 0) {
          $(".no-orders").show();
        } else {
          var i;
          for(i = 0; i < orders.length; i++) {
            var order = orders[i];
            updateOrderStore(order);
            //TODO: Can probably get rid of this SEF now.
            (function(order, baristaId) {
              assignOrderToBarista(order, baristaId);
            })(order,i);
          }
          while(i < numberOfBaristas) {
            $("#barista" + i + " .no-orders").show();
            i++;
          } 
        }
      });

      function orderStatusButttonHandler(button, cb) {
        var $button = $(button);
        var $order = $button.closest(".order")
        var orderId = $order.attr("data-order-id");
        var action = $button.attr("data-action-type");
        var url = "/api/order/" + orderId + "/" + action
        $.post(url, function(response) {
          updateOrderStore(response.data);
          if (cb && typeof cb === "function") cb(orderId, $order, response);
        })

      }
      $(document).on("click", ".mark-as-started", function(){
        orderStatusButttonHandler(this, function(orderId, $order) {
          $order.removeClass("status-assigned").addClass("status-in-production");
        });
      });

      $(document).on("click", ".mark-as-done", function(){
        orderStatusButttonHandler(this, function(orderId, $order, response) {
          var order = getOrderFromStore(orderId);
          if (!order) {
            console.log("Error: Could not find order %s from local store", orderId);
          } else {
            var baristaId = order.assignee;
            if ($.type(baristaId) !== "number") {
              console.log("Error: Could not retrieve proper assigned barista for order %s, got value %s", orderId, baristaId);
            } else {
              var nextOrder = response.data.nextOrder;
              var cb;
              if (!nextOrder) {
                cb = function() {
                  $("#barista" + baristaId + " .no-orders").fadeIn();
                }
              } else {
                cb = function() {
                  assignOrderToBarista(nextOrder, baristaId);                       
                }
              }
              clearAssignedOrderFromBarista(baristaId, cb);              
            }
          }
        });
      });
      //TODO: Get the count of unopened orders
    });
  }

  return {
    init : init
  };
})(jQuery, ich, COFFEE.shared);