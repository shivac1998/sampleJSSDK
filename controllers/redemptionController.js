const droppSdk = require("../dropp-sdk-js");

function processRedemption(data, merchantAccountId, signingKeyUpdate) {
  return new Promise((resolve, reject) => {
    let redemptionData = {
      merchantAccountId: merchantAccountId,
      userAccountId: data.userAccountId,
      amount: data.amount,
      currency: "USD",
      creditReference: "Test redeem",
      ipAddress: "127.0.0.1", //todo
    };
    console.log(
      `Credit payment. Initiating: ${redemptionData.currency} ${redemptionData.amount},  ${redemptionData.merchantAccountId} --> ${redemptionData.userAccountId}.`
    );

    processCreditPayment(redemptionData, signingKeyUpdate)
      .then((paymentResponse) => {
        // Construct the redirect URL
        const encodedPaymentResponse = encodeURIComponent(
          JSON.stringify(paymentResponse)
        );
        const redirectUrl = `/redemptioncallback?paymentResponse=${encodedPaymentResponse}`;
        resolve(redirectUrl); // Return the URL to the caller
      })
      .catch((error) => {
        console.error("Error in processCreditPayment:", error);
        reject(error);
      });
  });
}

function processCreditPayment(data, signingKeyUpdate) {
  return new Promise((resolve, reject) => {
    const droppClient = new droppSdk.DroppClient("SANDBOX");
    const signingKey = signingKeyUpdate;
    new droppSdk.DroppCreditPaymentRequest(droppClient)
      .submit(data, signingKey)
      .then((paymentResponse) => {
        if (paymentResponse.responseCode === 0) {
          // Success case: Resolve with response
          resolve({ responseCode: 0 });
        } else {
          // Error case: Reject with error
          console.error("Error in processCreditPayment:", paymentError);
          reject({ error: "An error occurred" });
        }
      })
      .catch((paymentError) => {
        // Error case: Reject with error
        console.error("Error in processCreditPayment:", paymentError);
        reject({ error: "An error occurred" });
      });
  });
}

function returnRedemptionCallback(returnValue, res) {
  const status = returnValue.responseCode === 0 ? "success" : "failure";
  // console.log("Rendering redemptionCallback.ejs with:", returnValue, status);
  res.render("redemptionCallback.ejs", {
    paymentResponse: returnValue,
    status,
  });
}

module.exports = {
  processRedemption,
  processCreditPayment,
  returnRedemptionCallback,
};
