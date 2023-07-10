const express = require("express");
const path = require("path");
const url = require("url");

const app = express();
const PORT = 8000;
const bodyParser = require("body-parser");

const droppPayment = require("./dropp-payment");
const { DroppClient } = require("./dropp-sdk-js");

let signingKey = "";
app.use(bodyParser.json());
app.post("/update-signing-key", (req, res) => {
  const { signingKey: updatedSigningKey } = req.body;
  signingKey = updatedSigningKey;
  res.sendStatus(200);
});

let merchantAccountId = "";
let merchantSigningKey = "";
app.post("/update-merchant-details", (req, res) => {
  const { signingKey, merchantId } = req.body;

  merchantAccountId = merchantId;
  merchantSigningKey = signingKey;
  res.sendStatus(200);
});

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

app.get("/redeem-callback", (req, res) => {
  const customerAccountId = req.query.userAccountId;
  const creditAmount = req.query.amount;
  const merchantId = req.query.merchantId;
  const signingKey = req.query.signingKey;

  processRedemption(
    {
      customerAccountId: customerAccountId,
      creditAmount: creditAmount,
      merchantId: merchantId,
      merchantSigningKey: signingKey,
    },
    res
  );
});

const droppPaymentType = {
  single: "SINGLE",
  credit: "CREDIT",
};

function processPayment(p2pObj, res, callback) {
  // NOTE: validate p2p is as per your needs to confirm everything is in order as you expect.
  const droppClient = new DroppClient("SANDBOX");
  droppClient
    .createPaymentRequest(droppPaymentType.single)
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
    // NOTE: it is best practice to sanitize inputs before passing them downstream.
    let p2pObj = JSON.parse(p2p);
    let invoiceData = JSON.parse(Buffer.from(p2pObj.invoiceBytes, "base64"));
    console.log(`invoiceData: ${JSON.stringify(invoiceData)}`);
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

function processRedemption(data, res) {
  const redemptionData = {
    merchantAccountId: merchantAccountId,
    userAccountId: data.customerAccountId,
    amount: data.creditAmount,
    currency: "USD",
    creditReference: "Test redeem",
    ipAddress: "127.0.0.1", //todo
  };
  console.log(
    `Credit payment. Initiating: ${redemptionData.currency} ${redemptionData.amount},  ${redemptionData.merchantAccountId} --> ${redemptionData.userAccountId}.`
  );
  processRedemptionPayment(
    redemptionData,
    res,
    merchantSigningKey,
    returnRedemptionCallback
  );
}

function processRedemptionPayment(data, res, signingKey, callbackFunc) {
  // NOTE: validate data is as per your needs to confirm everything is in order as you expect.
  const droppClient = new DroppClient("SANDBOX");
  droppClient
    .createPaymentRequest(droppPaymentType.credit)
    .submit(data, signingKey)
    .then(function (paymentResponse) {
      callbackFunc(paymentResponse, res);
    })
    .catch(function (paymentError) {
      const errorResponse = {
        responseCode: -1,
        errors: [paymentError.message], // Update the error response with the actual error message
        data: null,
      };
      callbackFunc(errorResponse, res);
    });
}

function returnRedemptionCallback(returnValue, res) {
  const status = returnValue.responseCode === 0 ? "success" : "failure";
  res.render("redemptionCallback.ejs", {
    paymentResponse: returnValue,
    status,
  });
}
