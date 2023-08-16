const http = require("http");
const url = require("url");
const droppPayment = require("./dropp-payment");
const fs = require("fs").promises;

const droppSdk = require("./dropp-sdk-js");

require("dotenv").config();

const myDroppMerchantAccountId = process.env.DROPP_MERCHANT_ID;

function serveHtmlFileContents(filename, res) {
  return serveFileContents(filename, "text/html", res);
}

function serveJsFileContents(filename, res) {
  return serveFileContents(filename, "application/javascript", res);
}

function serveFileContents(filename, contentType, res) {
  getFileContents(filename, function (contents) {
    res.setHeader("Content-Type", contentType);
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
    droppPayment.processPayment(p2pObj, res, returnCallback);
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Required p2p param is missing." }));
  }
}

function processRecurring(recurringData, res) {
  if (recurringData) {
    // NOTE: it is best practice to sanitize inputs before passing them downstream.
    let recurringDataObj = JSON.parse(recurringData);
    log(`Recurring payment. Initiating.`);
    droppPayment.processRecurringPayment(recurringDataObj, res, returnCallback);
  } else {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Required param is missing." }));
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
    case "/rps-callback":
      processRecurring(queryObject.RecurringData, res);
      break;
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
        serveHtmlFileContents(pathname, res);
      } else if (pathname.endsWith(".js")) {
        serveJsFileContents(pathname, res);
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
const port = 8000;
const server = http.createServer(requestListener);

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
  const droppClient = new droppSdk.DroppClient(process.env.DROPP_ENVIRONMENT);
  new droppSdk.DroppPaymentRequest(droppClient);
});
