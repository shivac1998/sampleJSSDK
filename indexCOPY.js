const http = require("http");
const url = require("url");
const droppPayment = require("./dropp-payment");
const fs = require("fs").promises;
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 8000;

let signingKey = "8bd83f9a9eec3a210e726089d48008a09ec39d3aa0d5094667b0d1e36f753c2a";

app.use(bodyParser.json());

app.post("/update-signing-key", (req, res) => {
  signingKey = req.body.signingKey;

  processPayment.setSigningKey(signingKey);

  res.sendStatus(200);
});

const { DroppClient } = require("./dropp-sdk-js");

require("dotenv").config();

const myDroppMerchantAccountId = process.env.DROPP_MERCHANT_ID;

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

function serveFileContents(filename, res) {
  getFileContents(filename, function (contents) {
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(contents);
  });
}

function processRedemption(data, res) {
  let redemptionData = {
    merchantAccountId: myDroppMerchantAccountId,
    userAccountId: data.userAccountId,
    amount: data.amount,
    currency: "USD",
    creditReference: "Test redeem",
    ipAddress: "127.0.0.1", //todo
  };
  log(
    `Credit payment. Initiating: ${redemptionData.currency} ${redemptionData.amount},  ${redemptionData.merchantAccountId} --> ${redemptionData.userAccountId}.`
  );
  droppPayment.processCreditPayment(redemptionData, res, returnCallback);
}

function processDroppPayment(p2p, res) {
  if (p2p) {
    // NOTE: it is best practice to sanitize inputs before passing them downstream.
    let p2pObj = JSON.parse(p2p);
    let invoiceData = JSON.parse(Buffer.from(p2pObj.invoiceBytes, "base64"));
    log(`invoiceData: ${JSON.stringify(invoiceData)}`);
    log(
      `Single payment. Initiating: ${invoiceData.currency} ${invoiceData.amount}, ${invoiceData.walletAddress} --> ${invoiceData.merchantAccount}`
    );
    processPayment(p2pObj, res, returnCallback);
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Required p2p param is missing." }));
  }
}

function unknown(res) {
  res.writeHead(404);
  res.end(
    JSON.stringify({ error: "Resource not found. Perhaps try /callback." })
  );
}

function returnCallback(returnValue, res) {
  res.writeHead(200);
  res.end(
    JSON.stringify({
      status: returnValue.responseCode === 0 ? "success" : "failure",
      responseCode: returnValue.responseCode,
      paymentResponse: returnValue,
    })
  );
}

const requestListener = function (req, res) {
  let urlObject = url.parse(req.url, true);
  const queryObject = urlObject.query;
  let pathname = urlObject.pathname;
  switch (pathname) {
    case "/callback":
      processDroppPayment(queryObject.p2p, res);
      break;
    case "/redeem-callback":
      processRedemption(
        {
          userAccountId: queryObject.userAccountId,
          amount: queryObject.amount,
        },
        res
      );
      break;
    case "/":
    /* fall through */
    case "/index.html":
      pathname = "/pages/index.html";
    /* fall through */
    default:
      if (pathname.endsWith(".html")) {
        serveFileContents(pathname, res);
      } else {
        unknown(res);
      }
      break;
  }
};

function getFileContents(filename, callback) {
  const fullPath = __dirname + filename;
  fs.readFile(fullPath)
    .then((contents) => {
      callback(contents);
    })
    .catch((err) => {
      console.error(`Could not read ${fullPath} file: ${err}`);
      process.exit(1);
    });
}

function log(message) {
  console.log(`    - ${message}`);
}

const host = "localhost";
const server = http.createServer(requestListener);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.listen(port, host, () => {
  console.log();
  console.log(`:: Dropp Payment Samples ::`);
  log(`Running    : http://${host}:${port}`);
  log("Environment: " + process.env.DROPP_ENVIRONMENT);
  log("Merchant ID: " + process.env.DROPP_MERCHANT_ID);
  log(
    "NOTE: Ensure you have correct signing key and merchant ID added. Key and ID differ per environment."
  );

  // The DroppClient instantiation is not needed here.
  // It is included as a means to confirm if Dropp SDK is installed and accessible.
  new DroppClient("SANDBOX");
});
