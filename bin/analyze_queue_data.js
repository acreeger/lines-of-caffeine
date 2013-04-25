var fs = require("fs")
  , mongoose = require('mongoose')
  , _ = require('underscore');

var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/caffeine_development';

mongoose.connect(mongoUri, function(err) {
  if (!err) {
    console.log('connected to MongoDB');
  } else {
    throw err;
  }
});

// Bootstrap models
var models_path = __dirname + '/../models'
fs.readdirSync(models_path).forEach(function (file) {
  // console.log("Reading model",file)
  require(models_path+'/'+file)
})

var DrinkOrder = mongoose.model('DrinkOrder')

DrinkOrder.find({status:"complete"}).sort('date').exec(function(err, orders) {
  if (err) {
    console.log("Got error:",JSON.stringify(err))
  } else {
    console.log("Got %s orders",orders.length)

    var totalDuration = 0.0
    var completedOrders = 0
    var skippedOrders = 0

    //TODO: Change this to read from the DB and run as a script directly on the DB!
    var DURATION_THRESHOLD_MIN = 50 * 1000 // 50 seconds
    var DURATION_THRESHOLD_MAX = 6 * 60 * 1000 // 6 mins

    var previousStartTimes = [null, null];
    var baristaStartToStartTimes = [0, 0];
    var baristaOrderCounts = [0, 0];

    _.each(orders, function(order, i) {
      var startDate = order.dateStarted;
      var endDate = order.dateCompleted;
      var assignee = order.assignee;

      if (previousStartTimes[assignee] !== null) {
        var startToStart = startDate.getTime() - previousStartTimes[assignee].getTime();
        if (startToStart > 12 * 60 * 60 * 1000) { //12 hours
          console.log("Skipping current record as it appears to be a long break.");
        } else {
          console.log("Current start-to-start time is %s seconds",startToStart/1000);
          baristaStartToStartTimes[assignee] = baristaStartToStartTimes[assignee] + startToStart;
          console.log("Total start-to-start time for barista %s is now %s seconds",assignee, baristaStartToStartTimes[assignee]/1000);
          baristaOrderCounts[assignee] = baristaOrderCounts[assignee] + 1;
          console.log("Total completed order count for barista %s is now %s",assignee,baristaOrderCounts[assignee]);              
        }
      } else {
        console.log("Previous start time for %s does not exist",assignee)      
      }

      previousStartTimes[assignee] = startDate;

      var difference = endDate.getTime() - startDate.getTime();
      console.log("endDate: %s, startDate: %s, difference:", endDate,startDate, difference);

      if (difference < DURATION_THRESHOLD_MAX && difference >= DURATION_THRESHOLD_MIN) {
        totalDuration += difference
        completedOrders++
      } else {
        console.log("Discarding drink making duration of %d seconds (assigned to %s) as it is an outlier", difference/1000, assignee)
        skippedOrders++
      }
    });

    var overallStartToStart = 0
    var overallStartToStartCount = 0
    for(var i = 0;i<2;i++) {
      overallStartToStart += baristaStartToStartTimes[i]
      overallStartToStartCount += baristaOrderCounts[i]
      console.log("Barista %s completed %s orders, with an average of start-to-start time of %s minutes",i,baristaOrderCounts[i], (baristaStartToStartTimes[i]/baristaOrderCounts[i])/1000/60);
    }
    console.log("Average overall startToStart time is %s minutes", overallStartToStart/overallStartToStartCount/1000/60)
    var averageDuration = (totalDuration / completedOrders) / 1000;
    console.log("Number of skipped orders:",skippedOrders);
    console.log("Number of completed orders:",completedOrders);
    console.log("Total time to make drinks:",totalDuration / 1000,"seconds");
    console.log("Average time to make drinks:",averageDuration,"seconds,", averageDuration/60,"minutes");
    var averageOverallStartToStartSeconds = (overallStartToStart/overallStartToStartCount)/1000
    console.log("Average time between drinks: %s mins",(averageOverallStartToStartSeconds - averageDuration) / 60)  
  }
  process.exit();
});


// var fs = require('fs');
// var array = fs.readFileSync('./coffee-orders-start-end-only.csv').toString().split("\n");
// for(i in array) {

//   var data = array[i];
//   var parts = data.split(",");
//   var status = parts[2]
//     , startDateString = parts[0]
//     , endDateString = parts[1]
//     , assignee = parseInt(parts[3], 10);

//   if (i == 0) {
//     console.log("Skipping first row")
//   } else if (status.trim() != "complete") {
//     skippedOrders++
//     console.log("Not processing order with status %s",status.trim())
//   } else {
//     var startDate = new Date(startDateString);
//     if (previousStartTimes[assignee] !== null) {
//       var startToStart = startDate.getTime() - previousStartTimes[assignee].getTime();
//       if (startToStart > 12 * 60 * 60 * 1000) { //12 hours
//         console.log("Skipping current record as it appears to be a long break.");
//       } else {
//         console.log("Current start-to-start time is %s seconds",startToStart/1000);
//         baristaStartToStartTimes[assignee] = baristaStartToStartTimes[assignee] + startToStart;
//         console.log("Total start-to-start time for barista %s is now %s seconds",assignee, baristaStartToStartTimes[assignee]/1000);
//         baristaOrderCounts[assignee] = baristaOrderCounts[assignee] + 1;
//         console.log("Total completed order count for barista %s is now %s",assignee,baristaOrderCounts[assignee]);              
//       }
//     } else {
//       console.log("Previous start time for %s does not exist",assignee)      
//     }
//     previousStartTimes[assignee] = startDate;
//     var endDate = new Date(endDateString);

//     var difference = endDate.getTime() - startDate.getTime();

//     if (difference < DURATION_THRESHOLD_MAX && difference >= DURATION_THRESHOLD_MIN) {
//       totalDuration += difference
//       completedOrders++
//     } else {
//       console.log("Discarding drink making duration of %ds (assigned to %s) as it is an outlier", difference/1000, assignee)
//       skippedOrders++
//     }
//   }
// }

// var overallStartToStart = 0
// var overallStartToStartCount = 0
// for(var i = 0;i<2;i++) {
//   overallStartToStart += baristaStartToStartTimes[i]
//   overallStartToStartCount += baristaOrderCounts[i]
//   console.log("Barista %s completed %s orders, with an average of start-to-start time of %s minutes",i,baristaOrderCounts[i], (baristaStartToStartTimes[i]/baristaOrderCounts[i])/1000/60);
// }
// console.log("Average overall startToStart time is %s minutes", overallStartToStart/overallStartToStartCount/1000/60)
// var averageDuration = (totalDuration / completedOrders) / 1000;
// console.log("Number of skipped orders:",skippedOrders);
// console.log("Number of completed orders:",completedOrders);
// console.log("Total time to make drinks:",totalDuration / 1000,"seconds");
// console.log("Average time to make drinks:",averageDuration,"seconds,", averageDuration/60,"minutes");
// var averageOverallStartToStartSeconds = (overallStartToStart/overallStartToStartCount)/1000
// console.log("Average time between drinks: %s mins",(averageOverallStartToStartSeconds - averageDuration) / 60)
