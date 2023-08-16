const express = require("express");
const path = require("path");
const url = require("url");

const app = express();
const PORT = 8000;
const bodyParser = require("body-parser");

const droppSdk = require("./dropp-sdk-js");

const redemptionController = require("./controllers/redemptionController");
const recurringController = require("./controllers/recurringController");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.get("/single-payment", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "single-payment.html"));
});
app.get("/redeem", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "redeem.html"));
});
app.get("/recurring", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "recurring.html"));
});

app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
    console.log(`Access at http://localhost:${PORT}`);
  } else console.log("Error occurred, server can't start", error);
});

app.get("/callback", (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const p2p = queryObject.p2p;
  if (p2p) {
    processDroppPayment(queryObject.p2p, res);
    console.log(p2p);
  } else {
    const paymentResponse = queryObject.paymentResponse;
    const paymentResponseData = JSON.parse(decodeURIComponent(paymentResponse));
    const returnValue = {
      responseCode: paymentResponseData.responseCode,
      errors: [],
      data: paymentResponseData.data,
    };
    returnCallback(returnValue, res);
  }
});

app.get("/redemptioncallback", (req, res) => {
  let urlObject = url.parse(req.url, true);
  const queryObject = urlObject.query;
  redemptionController.processRedemption(
    { userAccountId: queryObject.userAccountId, amount: queryObject.amount },
    res
  );
});

app.get("/rps-callback", (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const recurringData = queryObject.recurringData;
  if (recurringData) {
    recurringController.processRecurring(queryObject.recurringData, res);
    console.log(recurringData);
  } else {
    const paymentResponse = queryObject.recurringData;
    const paymentResponseData = JSON.parse(decodeURIComponent(paymentResponse));
    const returnValue = {
      responseCode: paymentResponseData.responseCode,
      errors: [],
      data: paymentResponseData.data,
    };
    recurringController.returnRecurringCallback(returnValue, res);
  }
});

//Single Payment POST Request
let signingKey = "";
let merchantId = "";
app.use(bodyParser.json());
app.post("/update-signing-key", (req, res) => {
  const { signingKey: updatedSigningKey } = req.body;
  const { merchantId: updatedMerchantId } = req.body;
  signingKey = updatedSigningKey;
  res.sendStatus(200);
});

// let merchantAccountId = "0.0.4043972";
// let merchantSigningKey =
//   "8bd83f9a9eec3a210e726089d48008a09ec39d3aa0d5094667b0d1e36f753c2a";

//Redemption Credit POST Request **BROKEN**
app.post("/update-merchant-details", (req, res) => {
  const {
    signingKey: updatedSigningKey,
    merchantId: merchantId,
    userAccountId,
    amount,
  } = req.body;
  signingKey = updatedSigningKey;

  redemptionController.processRedemption({ userAccountId, amount }, res);
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
