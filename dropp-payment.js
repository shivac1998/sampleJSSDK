const { DroppClient } = require("./dropp-sdk-js");

const droppPaymentType = {
  single: "SINGLE",
  credit: "CREDIT",
};

// function processPayment(p2pObj, res, callback) {
//   // NOTE: validate p2p is as per your needs to confirm everything is in order as you expect.
//   const droppClient = new DroppClient("SANDBOX");
//   const signingKey =
//     "8bd83f9a9eec3a210e726089d48008a09ec39d3aa0d5094667b0d1e36f753c2a";
//   droppClient
//     .createPaymentRequest(droppPaymentType.single)
//     .submit(p2pObj, signingKey)
//     .then(function (paymentResponse) {
//       callback(paymentResponse, res);
//     })
//     .catch(function (paymentError) {
//       console.log(`paymentError: ${paymentError}`);
//       callback(paymentError, res);
//     });
// }

function processCreditPayment(data, res, callback) {
  // NOTE: validate data is as per your needs to confirm everything is in order as you expect.
  const droppClient = new DroppClient(process.env.DROPP_ENVIRONMENT);
  const signingKey = process.env.DROPP_MERCHANT_SIGNING_KEY;
  droppClient
    .createPaymentRequest(droppPaymentType.credit)
    .submit(data, signingKey)
    .then(function (paymentResponse) {
      callback(paymentResponse, res);
    })
    .catch(function (paymentError) {
      callback(paymentError, res);
    });
}

module.exports = { processCreditPayment };
