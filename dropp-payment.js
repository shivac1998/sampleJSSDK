const droppSdk = require('./dropp-sdk-js');

function processPayment(p2pObj, res, callback) {
    // NOTE: validate p2p is as per your needs to confirm everything is in order as you expect.
    const droppClient = new droppSdk.DroppClient(process.env.DROPP_ENVIRONMENT);
    const signingKey = process.env.DROPP_MERCHANT_SIGNING_KEY;
    new droppSdk.DroppPaymentRequest(droppClient).submit(p2pObj, signingKey)
        .then(function (paymentResponse) {
            callback(paymentResponse, res);
        })
        .catch(function (paymentError) {
            console.log(`paymentError: ${paymentError}`);
            callback(paymentError, res);
        });
}

function processRecurringPayment(recurringDataObj, res, callback) {
    // NOTE: validate p2p is as per your needs to confirm everything is in order as you expect.
    const droppClient = new droppSdk.DroppClient(process.env.DROPP_ENVIRONMENT);
    const signingKey = process.env.DROPP_MERCHANT_SIGNING_KEY;
    const rps = new droppSdk.DroppRecurringPaymentRequest(droppClient);
    rps.submitForAuthorization(recurringDataObj, signingKey)
        .then(function (apiResponse) {
            if (apiResponse.responseCode === 0) {
                const recurringToken = apiResponse.data.recurringToken;
                rps.submitForPayment(
                    {
                        merchantAccountId: process.env.DROPP_MERCHANT_ID,
                        amount: 0.01,
                        recurringToken: recurringToken
                    },
                    signingKey)
                    .then(function (paymentResponse) {
                        callback(paymentResponse, res);
                    })
                    .catch(function (paymentError) {
                        console.log(`Recurring Payment Error: ${JSON.stringify(paymentError)}`);
                        callback(paymentError, res);
                    });
            }
        })
        .catch(function (paymentError) {
            console.log(`Recurring Authorization Error: ${JSON.stringify(paymentError)}`);
            callback(paymentError, res);
        });
}


function processCreditPayment(data, res, callback) {
    // NOTE: validate data is as per your needs to confirm everything is in order as you expect.
    const droppClient = new droppSdk.DroppClient(process.env.DROPP_ENVIRONMENT);
    const signingKey = process.env.DROPP_MERCHANT_SIGNING_KEY;
    new droppSdk.DroppCreditPaymentRequest(droppClient).submit(data, signingKey)
        .then(function (paymentResponse) {
            callback(paymentResponse, res);
        })
        .catch(function (paymentError) {
            callback(paymentError, res);
        });
}

module.exports = {processPayment, processCreditPayment, processRecurringPayment};