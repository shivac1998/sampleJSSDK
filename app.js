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
  } else console.log("Error occurred, server can't start", error);
});

app.get("/callback", (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  const p2p = queryObject.p2p;
  if (p2p) {
    processDroppPayment(queryObject.p2p, res);
  } else {
    const paymentResponse = queryObject.paymentResponse;
    res.render("callback.ejs", { paymentResponse });
  }
});

app.get("/redeem-callback", (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  processRedemption(
    {
      userAccountId: queryObject.userAccountId,
      amount: queryObject.amount,
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
  res.writeHead(200);
  res.end(
    JSON.stringify({
      status: returnValue.responseCode === 0 ? "success" : "failure",
      responseCode: returnValue.responseCode,
      paymentResponse: returnValue,
    })
  );
}

// const requestListener = function (req, res) {
//   let urlObject = url.parse(req.url, true);
//   const queryObject = urlObject.query;
//   let pathname = urlObject.pathname;
//   switch (pathname) {
//     case "/callback":
//       processDroppPayment(queryObject.p2p, res);
//       break;
//     case "/redeem-callback":
//       processRedemption(
//         {
//           userAccountId: queryObject.userAccountId,
//           amount: queryObject.amount,
//         },
//         res
//       );
//       break;
//     case "/":
//     /* fall through */
//     case "/index.html":
//       pathname = "/pages/index.html";
//     /* fall through */
//     default:
//       if (pathname.endsWith(".html")) {
//         serveFileContents(pathname, res);
//       } else {
//         unknown(res);
//       }
//       break;
//   }
// };
