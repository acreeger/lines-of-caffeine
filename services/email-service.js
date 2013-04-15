var getenv = require("getenv")
var MAILCHIMP_KEY = process.env["MAILCHIMP_KEY"]
  , emailEnabled = getenv.bool("EMAIL_ENABLED", false)
  , mandrillInit = require('node-mandrill');

var mandrill;

if (emailEnabled) {
  if (!MAILCHIMP_KEY) {
    throw new Error("Please make sure MAILCHIMP_KEY is specified in environment variables, or disable email integration by setting EMAIL_ENABLED to 'false'");
  } else {
    mandrill = mandrillInit(MAILCHIMP_KEY);
    console.log("Mandrill integration enabled.")
  }
} else {
  console.log("Mandrill integration not enabled.")
}

exports.sendEmail = function(toName, toEmail, from, subject, body, cb) {
  if (!emailEnabled) {
    console.log("Not sending email to %s because Mandrill functionality has not been enabled", toName);
  } else {
    console.log("About to send email to %s <%s>",toName, toEmail);
    mandrill('/messages/send', {
      message: {
        to: [{name: toName, email: toEmail}],
        from_name: getenv("EMAIL_FROM_NAME", 'The Espresso Gods'),
        from_email: from,
        subject: subject,
        text: body
      }
    }, function(error, response) {
      //uh oh, there was an error
      if (error) {
        console.log("Email Service: sendEmail: An error occured while sending email to %s: %s", toEmail, JSON.stringify(err));
      } else {
        console.log("Email Service: Received succesful response for email to %s <%s>", toName, toEmail);
      }
      if (typeof cb === "function") {
        cb(error, response)
      }
    });
  }
}