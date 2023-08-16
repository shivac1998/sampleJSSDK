(() => {
  "use strict";
  var e = {
      492: function (e, t, r) {
        var n =
          (this && this.__awaiter) ||
          function (e, t, r, n) {
            return new (r || (r = Promise))(function (o, i) {
              function s(e) {
                try {
                  p(n.next(e));
                } catch (e) {
                  i(e);
                }
              }
              function a(e) {
                try {
                  p(n.throw(e));
                } catch (e) {
                  i(e);
                }
              }
              function p(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof r
                      ? t
                      : new r(function (e) {
                          e(t);
                        })).then(s, a);
              }
              p((n = n.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppClient = void 0);
        const o = r(321),
          i = r(814),
          s = r(14);
        t.DroppClient = class {
          constructor(e) {
            (this.env = e),
              (this.droppHttpClient = new o._DroppHttpClient(e)),
              (0, i.droppLog)(`Version: ${s.DROPP_SDK_VERSION}`),
              (0, i.droppLog)(`Environment: ${this.env}`);
          }
          postToDroppService(e, t) {
            return n(this, void 0, void 0, function* () {
              return this.droppHttpClient.postToDroppService(e, t);
            });
          }
        };
      },
      376: function (e, t, r) {
        var n =
          (this && this.__awaiter) ||
          function (e, t, r, n) {
            return new (r || (r = Promise))(function (o, i) {
              function s(e) {
                try {
                  p(n.next(e));
                } catch (e) {
                  i(e);
                }
              }
              function a(e) {
                try {
                  p(n.throw(e));
                } catch (e) {
                  i(e);
                }
              }
              function p(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof r
                      ? t
                      : new r(function (e) {
                          e(t);
                        })).then(s, a);
              }
              p((n = n.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppCreditPaymentRequest = void 0);
        const o = r(149);
        t.DroppCreditPaymentRequest = class {
          constructor(e) {
            this.droppClient = e;
          }
          submit(e, t) {
            return n(this, void 0, void 0, function* () {
              let r = Buffer.from(JSON.stringify(e)).toString("base64"),
                n = {
                  methodName: "creditToUser",
                  base64JsonContent: r,
                  signature:
                    o.DroppSignatureGenerator.generateMerchantSignature(
                      Buffer.from(r).toString("hex"),
                      t
                    ),
                };
              return yield this.droppClient.postToDroppService(
                "/merchant/processRequest",
                n
              );
            });
          }
        };
      },
      614: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppEnvironment = void 0);
        class r {
          constructor(e, t) {
            (this._name = e), (this._url = t);
          }
          static get(e) {
            const t = this.envBaseUrls.get(e);
            if (t) return new r(e, t);
            throw "Unknown Environment";
          }
          get name() {
            return this._name;
          }
          get url() {
            return this._url;
          }
        }
        (t.DroppEnvironment = r),
          (r.envBaseUrls = new Map([
            ["SANDBOX", "https://sandbox.api.dropp.cc"],
            ["PROD", "https://api.dropp.cc"],
          ]));
      },
      321: function (e, t, r) {
        var n =
          (this && this.__awaiter) ||
          function (e, t, r, n) {
            return new (r || (r = Promise))(function (o, i) {
              function s(e) {
                try {
                  p(n.next(e));
                } catch (e) {
                  i(e);
                }
              }
              function a(e) {
                try {
                  p(n.throw(e));
                } catch (e) {
                  i(e);
                }
              }
              function p(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof r
                      ? t
                      : new r(function (e) {
                          e(t);
                        })).then(s, a);
              }
              p((n = n.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t._DroppHttpClient = void 0);
        const o = r(614),
          i = r(167),
          s = r(14),
          a = r(422),
          p = r(814),
          u = r(37);
        class c {
          constructor(e) {
            (this.environment = o.DroppEnvironment.get(e)),
              (this.axiosInstance = i.default.create({
                baseURL: this.environment.url,
              })),
              (this.axiosInstance.defaults.headers.common["User-Agent"] =
                this.generateUserAgentString()),
              this.axiosInstance.interceptors.request.use(
                function (e) {
                  return e;
                },
                function (e) {
                  return Promise.reject(e);
                }
              ),
              this.axiosInstance.interceptors.response.use(
                function (e) {
                  return (
                    c.isRpsP2pApi(e)
                      ? (e = c.transformRpsP2pResponse(e))
                      : c.isRpsAuthApi(e) &&
                        (e = c.transformRpsAuthResponse(e)),
                    e
                  );
                },
                function (e) {
                  return Promise.reject(e);
                }
              );
          }
          static isRpsAuthApi(e) {
            return "/api/rps/v1/payments" === e.config.url;
          }
          static transformRpsAuthResponse(e) {
            if (c.isRpsAuthApi(e)) {
              const t = e.data;
              e.data = {
                responseCode: 0,
                errors: [],
                data: { recurringToken: t.value },
              };
            }
            return e;
          }
          static isRpsP2pApi(e) {
            return "/api/rps/v1/payments/p2p" === e.config.url;
          }
          static transformRpsP2pResponse(e) {
            if (c.isRpsP2pApi(e)) {
              const t = e.data;
              e.data = { responseCode: 0, errors: [], data: t.paymentData };
            }
            return e;
          }
          generateUserAgentString() {
            return "DroppSdkJs/" + s.DROPP_SDK_VERSION + " (" + u.type() + ")";
          }
          postToDroppService(e, t) {
            return n(this, void 0, void 0, function* () {
              let r;
              if (
                (yield this.axiosInstance
                  .post(e, t)
                  .then(function (e) {
                    (0, p.droppLog)("Response received"), (r = e);
                  })
                  .catch(function (e) {
                    if (((0, p.droppLog)("Error"), e.response.data))
                      throw new Error(e.response.data);
                    {
                      const t = JSON.parse(JSON.stringify(e));
                      throw t.status
                        ? new Error(
                            JSON.stringify({
                              code: t.code,
                              status: t.status,
                              message: t.message,
                            })
                          )
                        : new Error("Unknown error response");
                    }
                  }),
                r.data)
              ) {
                const e = r.data;
                return new a.DroppResponse(e.responseCode, e.errors, e.data);
              }
              throw new Error("Unknown response");
            });
          }
        }
        t._DroppHttpClient = c;
      },
      814: (e, t, r) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.droppLog = void 0);
        const n = r(14);
        t.droppLog = function (e) {
          console.log(`    - [${n.DROPP_SDK_NAME}] ${e}`);
        };
      },
      49: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.PromiseToPay = void 0),
          (t.PromiseToPay = class {
            constructor(e) {
              (this.payer = e.payer),
                (this.invoiceBytes = e.invoiceBytes),
                (this.timeStamp = e.timeStamp),
                (this.signatures = e.signatures),
                (this.distributionBytes = e.distributionBytes),
                (this.encodedHHTransfer = e.encodedHHTransfer),
                (this.purchaseURL = e.purchaseURL);
            }
            decodeDistributionBytes() {
              if (this.distributionBytes) {
                const e = Buffer.from(
                  this.distributionBytes,
                  "base64"
                ).toString("utf-8");
                return JSON.parse(e);
              }
            }
            decodeInvoiceBytes() {
              const e = Buffer.from(this.invoiceBytes, "base64").toString(
                "utf-8"
              );
              return JSON.parse(e);
            }
          });
      },
      878: function (e, t, r) {
        var n =
          (this && this.__awaiter) ||
          function (e, t, r, n) {
            return new (r || (r = Promise))(function (o, i) {
              function s(e) {
                try {
                  p(n.next(e));
                } catch (e) {
                  i(e);
                }
              }
              function a(e) {
                try {
                  p(n.throw(e));
                } catch (e) {
                  i(e);
                }
              }
              function p(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof r
                      ? t
                      : new r(function (e) {
                          e(t);
                        })).then(s, a);
              }
              p((n = n.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppPaymentRequest = void 0);
        const o = r(149);
        t.DroppPaymentRequest = class {
          constructor(e) {
            this.droppClient = e;
          }
          submit(e, t) {
            return n(this, void 0, void 0, function* () {
              return (
                (e.signatures.merchant =
                  o.DroppSignatureGenerator.generateMerchantSignature(
                    e.signatures.payer,
                    t
                  )),
                this.submitForPayment(e)
              );
            });
          }
          submitForPayment(e) {
            return n(this, void 0, void 0, function* () {
              let t = { methodName: "payMerchantV2", paymentData: e };
              return yield this.droppClient.postToDroppService(
                "/payment/processRequest",
                t
              );
            });
          }
        };
      },
      722: function (e, t, r) {
        var n =
          (this && this.__awaiter) ||
          function (e, t, r, n) {
            return new (r || (r = Promise))(function (o, i) {
              function s(e) {
                try {
                  p(n.next(e));
                } catch (e) {
                  i(e);
                }
              }
              function a(e) {
                try {
                  p(n.throw(e));
                } catch (e) {
                  i(e);
                }
              }
              function p(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof r
                      ? t
                      : new r(function (e) {
                          e(t);
                        })).then(s, a);
              }
              p((n = n.apply(e, t || [])).next());
            });
          };
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppRecurringPaymentRequest = void 0);
        const o = r(149),
          i = r(814);
        t.DroppRecurringPaymentRequest = class {
          constructor(e) {
            this.droppClient = e;
          }
          submitForAuthorization(e, t) {
            return n(this, void 0, void 0, function* () {
              e.signatures.merchant =
                o.DroppSignatureGenerator.generateMerchantSignature(
                  e.signatures.payer,
                  t
                );
              const r = "/api/rps/v1/payments";
              return (
                (0, i.droppLog)(`url: ${r}`),
                (0, i.droppLog)(JSON.stringify(e)),
                (e.dataInBase64 = e.data),
                (0, i.droppLog)(`AFter: ${JSON.stringify(e)}`),
                yield this.droppClient.postToDroppService(r, e)
              );
            });
          }
          submitForPayment(e, t) {
            return n(this, void 0, void 0, function* () {
              let r = Buffer.from(JSON.stringify(e)).toString("base64");
              const n = {
                signatures: {
                  merchant: o.DroppSignatureGenerator.generateMerchantSignature(
                    Buffer.from(JSON.stringify(e)).toString("hex"),
                    t
                  ),
                },
                dataInBase64: r,
              };
              let i = (yield this.droppClient.postToDroppService(
                "/api/rps/v1/payments/p2p",
                n
              )).data;
              return this.submit(i, t);
            });
          }
          submit(e, t) {
            return n(this, void 0, void 0, function* () {
              return (
                (e.signatures.merchant =
                  o.DroppSignatureGenerator.generateMerchantSignature(
                    e.signatures.dropp,
                    t
                  )),
                yield this.droppClient.postToDroppService(
                  "/api/rps/v1/payments/p2p/process",
                  e
                )
              );
            });
          }
        };
      },
      422: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppResponse = void 0),
          (t.DroppResponse = class {
            constructor(e, t, r) {
              (this.responseCode = e), (this.errors = t), (this.data = r);
            }
          });
      },
      14: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DROPP_SDK_NAME = t.DROPP_SDK_VERSION = void 0),
          (t.DROPP_SDK_VERSION = "0.1.0"),
          (t.DROPP_SDK_NAME = "dropp-sdk-js");
      },
      149: (e, t, r) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppSignatureGenerator = void 0);
        const n = r(300),
          o = r(707);
        t.DroppSignatureGenerator = class {
          static generateMerchantSignature(e, t) {
            if (null != e) {
              const r = [n.Buffer.from(e, "hex")],
                i = this.removeKeyPrefix(t),
                s = o.sign.keyPair.fromSeed(
                  new Uint8Array(n.Buffer.from(i, "hex"))
                ),
                a = o.sign.detached(
                  new Uint8Array(n.Buffer.concat(r)),
                  s.secretKey
                );
              return n.Buffer.from(a.buffer).toString("hex");
            }
            throw new Error("Missing data to sign");
          }
          static removeKeyPrefix(e) {
            const t = "302e020100300506032b657004220420";
            return e.startsWith(t) ? e.slice(t.length) : e;
          }
        };
      },
      341: function (e, t, r) {
        var n =
            (this && this.__createBinding) ||
            (Object.create
              ? function (e, t, r, n) {
                  void 0 === n && (n = r);
                  var o = Object.getOwnPropertyDescriptor(t, r);
                  (o &&
                    !("get" in o
                      ? !t.__esModule
                      : o.writable || o.configurable)) ||
                    (o = {
                      enumerable: !0,
                      get: function () {
                        return t[r];
                      },
                    }),
                    Object.defineProperty(e, n, o);
                }
              : function (e, t, r, n) {
                  void 0 === n && (n = r), (e[n] = t[r]);
                }),
          o =
            (this && this.__exportStar) ||
            function (e, t) {
              for (var r in e)
                "default" === r ||
                  Object.prototype.hasOwnProperty.call(t, r) ||
                  n(t, e, r);
            };
        Object.defineProperty(t, "__esModule", { value: !0 }),
          o(r(878), t),
          o(r(376), t),
          o(r(722), t),
          o(r(422), t),
          o(r(492), t),
          o(r(49), t);
      },
      167: (e) => {
        e.exports = require("axios");
      },
      707: (e) => {
        e.exports = require("tweetnacl");
      },
      300: (e) => {
        e.exports = require("buffer");
      },
      37: (e) => {
        e.exports = require("os");
      },
    },
    t = {},
    r = (function r(n) {
      var o = t[n];
      if (void 0 !== o) return o.exports;
      var i = (t[n] = { exports: {} });
      return e[n].call(i.exports, i, i.exports, r), i.exports;
    })(341);
  for (var n in r) this[n] = r[n];
  r.__esModule && Object.defineProperty(this, "__esModule", { value: !0 });
})();
