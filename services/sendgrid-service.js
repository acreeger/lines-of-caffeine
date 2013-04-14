var getenv = require("getenv")
  , SendGrid = require('sendgrid').SendGrid;

var sgKey = process.env["SENDGRID_KEY"]
  , sgUser = process.env["SENDGRID_USER"]
  , sgEnabled = getenv.bool("SENDGRID_ENABLED", false);

var sendGridClient;

if (sgEnabled && (!sgKey || !sgUser)) {
  throw new Error("Please make sure SENDGRID_KEY and SENDGRID_USER are specified in environment variables, or disable sendgrid by setting SENDGRID_ENABLED to 'false'");
}

if (sgEnabled) {
  sendGridClient = new SendGrid(sgUser, sgKey);
  console.log("SendGrid integration enabled.")
} else {
  console.log("SendGrid integration not enabled.")
}

exports.sendEmail = function(to, from, subject, body, cb) {
  if (!sgEnabled) {
    console.log("Not sending email to %s because SendGrid functionality has not been enabled", to);
  } else {
    console.log("About to send email to %s",to);
    sendGridClient.send({
      to: to,
      from: from,
      subject: subject,
      text: body
    }, function (success, message) {
      if (!success) {
        console.log("SendGrid Service: sendEmail: An error occured while sending email to %s: %s", to, message);
      }
      if (typeof cb === "function") {
        cb(success, message)
      }
    });
  }
}