const droppSdk = require("../dropp-sdk-js");

function processRedemption(data, res, callback) {
  let redemptionData = {
    merchantAccountId: "0.0.4043972",
    userAccountId: data.userAccountId,
    amount: data.amount,
    currency: "USD",
    creditReference: "Test redeem",
    ipAddress: "127.0.0.1", //todo
  };
  console.log(
    `Credit payment. Initiating: ${redemptionData.currency} ${redemptionData.amount},  ${redemptionData.merchantAccountId} --> ${redemptionData.userAccountId}.`
  );
  processCreditPayment(redemptionData, res, returnRedemptionCallback);
}

function processCreditPayment(data, res, callback) {
  const droppClient = new droppSdk.DroppClient("SANDBOX");
  const signingKey =
    "8bd83f9a9eec3a210e726089d48008a09ec39d3aa0d5094667b0d1e36f753c2a";
  new droppSdk.DroppCreditPaymentRequest(droppClient)
    .submit(data, signingKey)
    .then(function (paymentResponse) {
      callback(paymentResponse, res);
    })
    .catch(function (paymentError) {
      callback(paymentError, res);
    });
}

function returnRedemptionCallback(returnValue, res) {
  const status = returnValue.responseCode === 0 ? "success" : "failure";
  res.render("callback.ejs", { paymentResponse: returnValue, status });
}

module.exports = {
  processRedemption,
  processCreditPayment,
  returnRedemptionCallback,
};
