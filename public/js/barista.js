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

  function removeOrderFromStore(id) {
    delete orderStore[id];
  }

  function visitOrderStore(cb) {
    for(var key in orderStore) {
      var value = orderStore[key];
      if (typeof cb === "function") cb(key, value)
    }
  }

  function isBaristaValid(baristaId) {
    return baristaId < baristas.length;
  }

  function isBaristaWorkingThisOrder(baristaId, order) {
    var orderIdForBarista = baristas[baristaId];
    return orderIdForBarista === order._id
  }

  function isBaristaBusy(baristaId, order) {
    var orderIdForBarista = baristas[baristaId];
    var baristaBusy = typeof orderIdForBarista !== "undefined" && orderIdForBarista !== null;
    var workingOnThisOrder = false;
    if (orderIdForBarista && order) {
      workingOnThisOrder = order._id === orderIdForBarista && order.assignee === baristaId;
    }
    return baristaBusy && !workingOnThisOrder;
  }

  function getAvailableBaristas() {
    var result = []
    $.each( baristas, function( i, value ) {
      if (!value) result.push(i);
    });
    return result;
  }

  //returns baristaId if order was assigned
  function assignOrderToFirstAvailableBarista(order) {
    var availableBaristas = getAvailableBaristas();
    var result = null
    if (availableBaristas.length > 0) {
      var firstBaristaId = availableBaristas[0];
      // console.log("assignOrderToFirstAvailableBarista: assigning order %s to barista %d",order._id, firstBaristaId);
      result = firstBaristaId;
      assignOrderToBarista(order, firstBaristaId);
    }
    return result;
  }

  function _assignOrderToBarista(order, baristaId) {
    baristas[baristaId] = order._id;
  }

  function _clearAssignedOrderFromBarista(baristaId) {
    baristas[baristaId] = null;
  }

  function assignOrderToBarista(order, baristaId) {
    if (isBaristaBusy(baristaId, order)) {
      console.log("Warning: assignOrderToBarista: Cannot assign barista %d order '%s' as they already have order '%s'", baristaId, order._id, baristas[baristaId]);
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
          specialInstructions: drink.specialInstructions,
          id: order._id
        }
        var $order = ich.orderTemplate(orderForTemplate);
        $order.hide();
        var $baristaContainer = $("#barista" + baristaId)
        $baristaContainer.find(".orders").empty().append($order);
        $baristaContainer.find(".no-orders").fadeOut(function (){
          $order.fadeIn(200)
        });
      }
      //only decrement the unassignedBaristasCount if the barista was preivously available
      var baristaPreviouslyAvailable = !baristas[baristaId]
      if (baristaPreviouslyAvailable) {
        //HACK: Calling this out of callback so it gets set immediately
        _assignOrderToBarista(order, baristaId);
        unassignedBaristasCount--;
      }

      if (order.assignee !== baristaId) {
        $.post("/api/order/" + order._id + "/assign/" + baristaId, function(response) {
          order = response.data;
          _assignOrderToBarista(order, baristaId); //already been done, but good to refresh
          cb(order)
        });
      } else {
        // console.log("assignOrderToBarista: order %s was already assigned to barista %s on the server, so not updating the server.", order._id, baristaId)
        var orderAsPreviouslyKnown = getOrderFromStore(order._id);
        if (baristaPreviouslyAvailable || (orderAsPreviouslyKnown && order.status !== orderAsPreviouslyKnown.status)) {
          cb(order);
        }
      }
    }
  }

  function clearAssignedOrderFromBarista(baristaId, cb) {
    var orderId = baristas[baristaId]
    if (orderId) {
      _clearAssignedOrderFromBarista(baristaId);
      removeOrderFromStore(orderId);
      unassignedBaristasCount++;
      var $order = $("#order-" + orderId);
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
      //HACK: I'm doing this because the order API is inconsistent with it's response format.
      //TODO: Refactor API so orders are returned in an order property, not directly under the data.
      //      That way the order that was acted upon is always returned in a  consistent manner.
      if (response.data && response.data._id) updateOrderStore(response.data);
      if (cb && typeof cb === "function") cb(orderId, $order, response);
    })
  }

  var ASSIGNED_STATUSES = ["in-production","assigned"];

  function getMoreOrders(numberOfBaristas, partial) {
    //TODO: Handle syncing screen when an order is removed
    $.get('/api/order/request', {count: numberOfBaristas, new_only: false}, function(orders) {
      var ordersToBeAssigned = orders;
      var succesfullyAssignedOrders = []; //will populate as we assign
      var orderStatusMap = {};
      var baristasAssigned = [];
      var orderIds = $.map(orders, function(element) {return element._id})

      if (!partial) {
        visitOrderStore(function(orderId, order) {
          if ($.inArray(orderId, orderIds) === -1) {
            console.log("Order %s is no longer in orders returned from the server. Unassigning from barista %s", orderId, order.assignee);
            clearAssignedOrderFromBarista(order.assignee);
          }
        });
      }

      //intialize the status map with empty arrays
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
          if (isBaristaValid(assignee) && !isBaristaBusy(assignee, this)) {
            succesfullyAssignedOrders.push(this);
            baristasAssigned.push(assignee);
            assignOrderToBarista(this, assignee);
          }
        })
      })
      //Then subtract that from the ordersToBeAssigned list.
      var ordersToBeAssigned = ordersToBeAssigned.diff(succesfullyAssignedOrders);

      //assignOrderToFirstAvailableBarista() relies upon unassignedBaristasCount being updated in real time.
      while(ordersToBeAssigned.length > 0) {
        var order = ordersToBeAssigned.splice(0,1)[0];
        var newAssignee = assignOrderToFirstAvailableBarista(order);
        if (newAssignee !== null) {
          baristasAssigned.push(newAssignee);
        }
      }

      //if there are any other barista
      //this relies upon the baristas array being updated in real time. (not in a callback)
      $.each(getAvailableBaristas(), function(i, baristaId) {
        $("#barista" + baristaId + " .no-orders").show();
      });
    });
  }

  function getNewOrderCount(cb) {
    $.get("/api/queue/summary",{num_baristas: numberOfBaristas}, function(response) {
      cb(response);
    }).fail(function(jqXHR,textStatus, errorThrown) {
      if ($.type(cb) === "function") {
        cb({success:false, data: {errorThrown: errorThrown}});
      }
    });
  }

  function updateOrderCountFromServerResponse(response) {
    if (response && response.success) {
      var count = response.data.count;
      if ($.type(count) == "number"){
        $("#orderCount").text(count);
        $("#waitingTime").text(response.data.waitingTime);
      } else {
        console.log("Warning: Not updating order count. %s is not a valid order count")
      }
    } else {
      console.log("Error: updateOrderCountFromServerResponse failed with response:", response);
    }
  }

  function refreshOrders() {
    //I wonder if there is a race condition here. What happens if this fires at the same time as "done" action
    try {
      getMoreOrders(numberOfBaristas, false);
      getNewOrderCount(updateOrderCountFromServerResponse);
    } catch (err) {
      console.log("Received error when updating orders and queue summary:", JSON.stringify(err))
    }
    pollingHandler = setTimeout(refreshOrders, 30 * 1000); //CHANGE BACK TO 5s
  }

  var init = function(numBaristas) {
    //TODO the scoping is weird here.
    numberOfBaristas = numBaristas;
    unassignedBaristasCount = numberOfBaristas;
    baristas = new Array(numberOfBaristas);
    $(function() {
      refreshOrders();
      var baristaDisabledButtonMap = {}

      $(".barista-container").on("click", ".order-action-buttons button", function(evt) {
        var baristaId = $(evt.delegateTarget).attr("data-barista-id");
        // console.log("Disable check: Got baristaId", baristaId);
        // console.log("baristaDisabledButtonMap[baristaId]:", baristaDisabledButtonMap[baristaId])
        if (baristaDisabledButtonMap[baristaId]) {
          // console.log("Button clicks are disabled for barista %s, stopping propagation", baristaId);
          evt.stopPropagation();
        } else {
          // baristaDisabledButtonMap[baristaId] = true;
          baristaDisabledButtonMap[baristaId] = window.setTimeout(function(){baristaDisabledButtonMap[baristaId] = null},1000)
          // console.log("Button clicks are not disabled, set baristaDisabledButtonMap[%s] to %d", baristaId, baristaDisabledButtonMap[baristaId]);
        }
      });

      $(document).on("click", ".mark-as-started", function(){
        orderStatusButttonHandler(this, function(orderId, $order) {
          $order.removeClass("status-assigned").addClass("status-in-production");
        });
      });

      var changeStatusAndGetNextOrder = function(button) {
        orderStatusButttonHandler(button, function(orderId, $order, response) {
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
      }

      $(document).on("click", ".mark-as-aborted, .mark-as-done", function() {
        changeStatusAndGetNextOrder(this)
      });

      $(".refresh-button").on("click", function(){window.location.reload()});
    });
  }

  return {
    init : init
  };
})(jQuery, ich, COFFEE.shared);