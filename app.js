const express = require("express");
const path = require("path");
const url = require("url");

const app = express();
const PORT = 8000;
const bodyParser = require("body-parser");

const droppSdk = require("./dropp-sdk-js");

const singlePayController = require("./controllers/singlePayController");
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
    // console.log(p2p);
  } else {
    const paymentResponse = queryObject.paymentResponse;
    const paymentResponseData = JSON.parse(decodeURIComponent(paymentResponse));
    const returnValue = {
      responseCode: paymentResponseData.responseCode,
      errors: [],
      data: paymentResponseData.data,
    };
    singlePayController.returnCallback(returnValue, res);
  }
});

app.get("/redemptioncallback", (req, res) => {
  let queryObject = url.parse(req.url, true).query;
  const data = queryObject.query;

  if (data) {
    // Change from const to let for userAccountId and amount
    let userAccountId = queryObject.userAccountId;
    let amount = queryObject.amount;

    redemptionController
      .processRedemption(
        { userAccountId, amount },
        merchantAccountId,
        signingKey
      )
      .then((redirectUrl) => {
        res.redirect(redirectUrl);
      })
      .catch((error) => {
        console.error("Error in processRedemption:", error);
        // Handle the error
      });
  } else {
    const paymentResponse = queryObject.paymentResponse;

    if (!paymentResponse) {
      console.log("Invalid response object, return to home");
    } else {
      try {
        const paymentResponseData = JSON.parse(
          decodeURIComponent(paymentResponse)
        );
        const returnValue = {
          responseCode: paymentResponseData.responseCode,
          errors: [],
          data: paymentResponseData.data,
        };
        redemptionController.returnRedemptionCallback(returnValue, res);
      } catch (error) {
        // Handle the case where paymentResponse is not valid JSON
        // You might want to redirect or display an error message
      }
    }
  }
});

app.get("/rps-callback", (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const recurringData = queryObject.RecurringData;
  if (recurringData) {
    recurringController.processRecurring(queryObject.RecurringData, res);
    // console.log(RecurringData);
  } else {
    const paymentResponse = queryObject.RecurringData;
    const paymentResponseData = JSON.parse(decodeURIComponent(paymentResponse));
    const returnValue = {
      responseCode: paymentResponseData.responseCode,
      errors: [],
      // data: paymentResponseData.data,
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

function processPayment(p2pObj, res, callback) {
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

//Redemption Credit POST Request

app.post("/update-redemption-merchant-id", async (req, res) => {
  const { merchantAccount } = req.body;
  try {
    // You can perform any necessary validation or checks here before updating
    merchantAccountId = merchantAccount; // Update the merchantAccountId
    res.status(200).send({ message: "Merchant ID updated successfully" });
  } catch (error) {
    res.status(500).send({ error: "An error occurred" });
  }
});

// Change from const to let for signingKeyUpdate
app.post("/update-redemption-signing-key", async (req, res) => {
  // console.log("Received POST request to /update-redemption-signing-key");
  const { signingKeyUpdate, userAccountId, amount } = req.body;
  // console.log("Received signingKeyUpdate:", signingKeyUpdate);
  try {
    const userAccountId = req.body.userAccountId;
    const amount = req.body.amount;
    // console.log("Attempting to update signing key...");

    // Using the updated signingKey in redemption process
    const response = await redemptionController.processRedemption(
      { userAccountId, amount },
      merchantAccountId,
      signingKeyUpdate // Use the updated signingKey
    );

    console.log("Signing key updated successfully.");
    res.status(200).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "An error occurred" });
  }
});

// let merchantAccountId = "0.0.4043972";
// let merchantSigningKey =
//   "8bd83f9a9eec3a210e726089d48008a09ec39d3aa0d5094667b0d1e36f753c2a";
