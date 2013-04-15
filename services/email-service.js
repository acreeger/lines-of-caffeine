var getenv = require("getenv")
  , MailChimpAPI = require('mailchimp').MailChimpAPI;

var MAILCHIMP_KEY = process.env["MAILCHIMP_KEY"]
  , emailEnabled = getenv.bool("EMAIL_ENABLED", false);

var sendGridClient;

if (emailEnabled && !MAILCHIMP_KEY) {
  throw new Error("Please make sure MAILCHIMP_KEY is specified in environment variables, or disable email integration by setting EMAIL_ENABLED to 'false'");
}

var mandrill;

if (emailEnabled) {
  mandrill = new MandrillAPI(MAILCHIMP_KEY, { version : '1.0', secure: true });
  console.log("Mandrill integration enabled.")
} else {
  console.log("Mandrill integration not enabled.")
}

exports.sendEmail = function(to, from, subject, body, cb) {
  if (!emailEnabled) {
    console.log("Not sending email to %s because Mandrill functionality has not been enabled", to);
  } else {
    console.log("About to send email to %s",to);
    sendGridClient.send({
      to: to,
      from: from,
      subject: subject,
      text: body
    }, function (err, response) {
      if (err) {
        console.log("Email Service: sendEmail: An error occured while sending email to %s: %s", to, err);
      }
      if (typeof cb === "function") {
        cb(success, message)
      }
    });
  }
}