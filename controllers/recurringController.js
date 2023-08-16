const droppSdk = require("../dropp-sdk-js");

function processRecurringPayment(recurringDataObj, res, callback) {
  // NOTE: validate p2p is as per your needs to confirm everything is in order as you expect.
  const droppClient = new droppSdk.DroppClient("SANDBOX");
  const signingKey =
    "8bd83f9a9eec3a210e726089d48008a09ec39d3aa0d5094667b0d1e36f753c2a";
  const rps = new droppSdk.DroppRecurringPaymentRequest(droppClient);
  rps
    .submitForAuthorization(recurringDataObj, signingKey)
    .then(function (apiResponse) {
      if (apiResponse.responseCode === 0) {
        const recurringToken = apiResponse.data.recurringToken;
        rps
          .submitForPayment(
            {
              merchantAccountId: "0.0.4043972",
              amount: 0.01,
              recurringToken: recurringToken,
            },
            signingKey
          )
          .then(function (paymentResponse) {
            callback(paymentResponse, res);
          })
          .catch(function (paymentError) {
            console.log(
              `Recurring Payment Error: ${JSON.stringify(paymentError)}`
            );
            callback(paymentError, res);
          });
      }
    })
    .catch(function (paymentError) {
      console.log(
        `Recurring Authorization Error: ${JSON.stringify(paymentError)}`
      );
      callback(paymentError, res);
    });
}

function processRecurring(recurringData, res) {
  if (recurringData) {
    // NOTE: it is best practice to sanitize inputs before passing them downstream.
    let recurringDataObj = JSON.parse(recurringData);
    console.log(`Recurring payment. Initiating.`);
    processRecurringPayment(recurringDataObj, res, returnRecurringCallback);
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Required param is missing." }));
  }
}

function returnRecurringCallback(recurringData, res) {
  const status = recurringData.responseCode === 0 ? "success" : "failure";
  res.render("rps-callback.ejs", { paymentResponse: recurringData, status });
}

module.exports = {
  processRecurringPayment,
  processRecurring,
  returnRecurringCallback,
};
