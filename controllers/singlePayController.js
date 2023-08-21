const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const droppSdk = require("../dropp-sdk-js");

let signingKey = "";
let merchantId = "";
app.use(bodyParser.json());
app.post("/update-signing-key", (req, res) => {
  const { signingKey: updatedSigningKey } = req.body;
  const { merchantId: updatedMerchantId } = req.body;
  signingKey = updatedSigningKey;
  res.sendStatus(200);
});

function processPayment(p2pObj, res, callback) {
  // NOTE: validate p2p is as per your needs to confirm everything is in order as you expect.
  const droppClient = new droppSdk.DroppClient("SANDBOX");
  new droppSdk.DroppPaymentRequest(droppClient)
    .submit(p2pObj, signingKey)
    .then(function (paymentResponse) {
      callback(paymentResponse, res);
    })
    .catch(function (paymentError) {
      console.log(`paymentError: ${paymentError}`);
      callback(paymentError, res);
    });
}

function processDroppPayment(p2p, res) {
  if (p2p) {
    let p2pObj = JSON.parse(p2p);
    let invoiceData = JSON.parse(Buffer.from(p2pObj.invoiceBytes, "base64"));

    console.log(
      `Single payment. Initiating: ${invoiceData.currency} ${invoiceData.amount}, ${invoiceData.walletAddress} --> ${invoiceData.merchantAccount}`
    );
    processPayment(p2pObj, res, function (paymentResponse) {
      const encodedPaymentResponse = encodeURIComponent(
        JSON.stringify(paymentResponse)
      );
      const redirectUrl = `/callback?paymentResponse=${encodedPaymentResponse}`;
      res.redirect(redirectUrl);
    });
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Required p2p param is missing." }));
  }
}

function returnCallback(returnValue, res) {
  const status = returnValue.responseCode === 0 ? "success" : "failure";
  res.render("callback.ejs", { paymentResponse: returnValue, status });
}

module.exports = {
  processPayment,
  processDroppPayment,
  returnCallback,
};
