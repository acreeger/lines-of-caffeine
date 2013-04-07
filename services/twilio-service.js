

var getenv = require('getenv')
    , TWILIO_SID = getenv("TWILIO_SID", null)
    , TWILIO_AUTH_TOKEN = getenv("TWILIO_AUTH_TOKEN", null)
    , TWILIO_FROM_NUMBER = getenv("TWILIO_FROM_NUMBER", null)
    , TWILIO_ENABLED = getenv.bool("TWILIO_ENABLED", false)
    
if (TWILIO_ENABLED && (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER)) {
    throw new Error("Please make sure TWILIO_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER are specified in environment variables");
}

if (TWILIO_ENABLED) console.log("Twilio enabled from %s.", TWILIO_FROM_NUMBER)
else console.log("Twilio not enabled.");

exports.sendSMS = function(message, smsNumber, cb) {
    if (!cb || typeof cb !== "function") cb = function(){};
    if (!TWILIO_ENABLED) {
        console.log("Not sending SMS to %s because Twilio functionality has not been enabled", smsNumber);
        cb(null, {from: TWILIO_FROM_NUMBER, to: smsNumber,"direction": "outbound-api", "body": message});
    } else {
        var client = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN);

        //Send an SMS text message
        console.log("About to send SMS to %s", smsNumber)
        client.sendSms({
            to:smsNumber, // Any number Twilio can deliver to
            from: TWILIO_FROM_NUMBER, // A number you bought from Twilio and can use for outbound communication
            body: message // body of the SMS message
        }, function(err, responseData) {
            if (!err) { // "err" is an error received during the request, if any
                console.log("Received succesful response for SMS to %s", smsNumber);            
                // // "responseData" is a JavaScript object containing data received from Twilio.
                // // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
                // // http://www.twilio.com/docs/api/rest/sending-sms#example-1
            } else {
                console.log("An error occured while sending an SMS to %s. Status: %d, Message: %s, Code: %s, More info: %s", smsNumber, err.status, err.message, err.code, err.moreInfo);
            }
            cb(err, responseData);
        });
    }
};
