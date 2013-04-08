var COFFEE = COFFEE || {};

COFFEE.barista = (function($, ich, shared) {

  var numberOfBaristas = 0

  var unassignedBaristasCount;
  var orderStore = {};
  var baristas;

  var pollingHandler;

  function updateOrderStore(order) {
    if (order) orderStore[order._id] = order;
  }

  function getOrderFromStore(id) {
    return orderStore[id];
  }

  function isBaristaValid(baristaId) {
    return baristaId < baristas.length;
  }

  function isBaristaBusy(baristaId) {
    var orderForBarista = baristas[baristaId];
    return (typeof orderForBarista !== "undefined" && orderForBarista !== null)
  }

  function getAvailableBaristas() {
    var result = []
    $.each( baristas, function( i, value ) {
      if (!value) result.push(i);
    });
    return result;
  }

  //returns true if order was assigned
  function assignOrderToFirstAvailableBarista(order) {
    var availableBaristas = getAvailableBaristas();
    console.log("assignOrderToFirstAvailableBarista: availableBaristas",availableBaristas);
    var result = false
    if (availableBaristas.length > 0) {
      var firstBaristaId = availableBaristas[0];
      console.log("assignOrderToFirstAvailableBarista: assigning order %s to barista %d",order._id, firstBaristaId);
      result = true;
      assignOrderToBarista(order, firstBaristaId);
    }
    return result;
  }

  function assignOrderToBarista(order, baristaId) {
    if (baristas[baristaId]) {
      console.log("Warning: assignOrderToBarista: Cannot assign barista %d order '%s' as they already have order '%s'", baristaId, order._id, baristas[baristaId]._id);
    } else {
      var cb = function(order) {
        updateOrderStore(order);
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
        var $baristaContainer = $("#barista" + baristaId)
        $baristaContainer.find(".orders").append($order)
        $baristaContainer.find(".no-orders").fadeOut(function (){
          $order.fadeIn(200)
        });
      }
      //HACK: Calling this out of callback so it gets set immediately
      baristas[baristaId] = order;
      unassignedBaristasCount--;

      if (order.assignee !== baristaId) {
        $.post("/api/order/" + order._id + "/assign/" + baristaId, function(response) {
          order = response.data;
          baristas[baristaId] = order; //already been done, but good to refresh
          cb(order)
        });
      } else {
        console.log("assignOrderToBarista: order %s was already assigned to barista %s, not hitting the server.", order._id, baristaId)
        cb(order);
      }

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

  var ASSIGNED_STATUSES = ["in-production","assigned"];

  function getMoreOrders(numberOfBaristas, newOnly) {
    var newOnly = newOnly || false;
    $.get('/api/order/request', {count: numberOfBaristas, new_only: newOnly}, function(orders) {
      var ordersToBeAssigned = orders;
      var succesfullyAssignedOrders = []; //will populate as we assign
      var orderStatusMap = {};
      //build the status map
      $.each(ASSIGNED_STATUSES, function() {orderStatusMap[this] = []});
      //populate the status map
      $.each(ordersToBeAssigned, function(i, order) {
        if (order.assignee !== -1) {
          orderStatusMap[order.status].push(order);
        }
      });

      //get the orders in each status, and assign them to the right barrista.
      $.each(ASSIGNED_STATUSES, function(){
        var ordersInState = orderStatusMap[this];
        $.each(ordersInState, function() {
          var assignee = this.assignee;
          //If they get assigned add them to the already assigned list.
          if (isBaristaValid(assignee) && !isBaristaBusy(assignee)) {
            succesfullyAssignedOrders.push(this);
            assignOrderToBarista(this, assignee);
          }
        })
      })
      //Then subtract that from the ordersToBeAssigned list.
      var ordersToBeAssigned = ordersToBeAssigned.diff(succesfullyAssignedOrders);

      //assignOrderToFirstAvailableBarista() relies upon unassignedBaristasCount being updated in real time.
      while(ordersToBeAssigned.length > 0) {
        var order = ordersToBeAssigned.splice(0,1)[0];
        console.log("processing order that needs to be assigned:",order);
        assignOrderToFirstAvailableBarista(order);
      }

      //if there are any other barista
      //this relies upon the baristas array being updated in real time. (not in a callback)
      $.each(getAvailableBaristas(), function(i, baristaId) {
        $("#barista" + baristaId + " .no-orders").show();
      });
    });
  }

  function refreshOrders() {
    // console.log("refreshOrders...")
    if (unassignedBaristasCount > 0){
      // console.log("refreshOrders: unassignedBaristasCount is non-zero:",unassignedBaristasCount)
      //I wonder if there is a race condition here. What happens if this fires at the same time as "done" action
      getMoreOrders(unassignedBaristasCount, true);
    }
    pollingHandler = setTimeout(refreshOrders, 5000);
  }

  var init = function(numBaristas) {
    //TODO the scoping is weird here.
    numberOfBaristas = numBaristas;
    unassignedBaristasCount = numberOfBaristas;
    baristas = new Array(numberOfBaristas);
    $(function() {
      getMoreOrders(numBaristas);

      pollingHandler = setTimeout(refreshOrders, 5000);

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