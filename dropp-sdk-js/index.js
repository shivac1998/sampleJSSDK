(() => {
  "use strict";
  var e = {
      949: function (e, t, r) {
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
          (t._AbstractDroppCreditPaymentRequest = void 0);
        const o = r(149);
        t._AbstractDroppCreditPaymentRequest = class {
          constructor(e) {
            this.droppHttpClient = e;
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
              return yield this.droppHttpClient.postToDroppService(
                "/merchant/processRequest",
                n
              );
            });
          }
        };
      },
      105: function (e, t, r) {
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
          (t._AbstractDroppPaymentRequest = void 0);
        const o = r(149);
        t._AbstractDroppPaymentRequest = class {
          constructor(e) {
            this.droppHttpClient = e;
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
              return yield this.droppHttpClient.postToDroppService(
                "/payment/processRequest",
                t
              );
            });
          }
        };
      },
      492: (e, t, r) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppClient = void 0);
        const n = r(321),
          o = r(105),
          i = r(949),
          s = r(814),
          a = r(14);
        t.DroppClient = class {
          constructor(e) {
            (this.env = e),
              (this.droppHttpClient = new n._DroppHttpClient(e)),
              (0, s.droppLog)(`Version: ${a.DROPP_SDK_VERSION}`),
              (0, s.droppLog)(`Environment: ${this.env}`);
          }
          createPaymentRequest(e) {
            switch (e) {
              case "SINGLE":
                return new (class extends o._AbstractDroppPaymentRequest {})(
                  this.droppHttpClient
                );
              case "CREDIT":
                return new (class extends i._AbstractDroppCreditPaymentRequest {})(
                  this.droppHttpClient
                );
              default:
                throw new Error(
                  "Payment type unknown or not implemented in the SDK yet"
                );
            }
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
            ["QA", "https://main.qa.dropp.cc"],
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
          c = r(37);
        t._DroppHttpClient = class {
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
              );
          }
          generateUserAgentString() {
            return "DroppSdkJs/" + s.DROPP_SDK_VERSION + " (" + c.type() + ")";
          }
          postToDroppService(e, t) {
            return n(this, void 0, void 0, function* () {
              let r;
              yield this.axiosInstance
                .post(e, t)
                .then(function (e) {
                  (0, p.droppLog)("Response received"), (r = e);
                })
                .catch(function (e) {
                  (0, p.droppLog)("Error"), (r = e);
                });
              var n = r.data;
              return new a.DroppResponse(n.responseCode, n.errors, n.data);
            });
          }
        };
      },
      814: (e, t, r) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.droppLog = void 0);
        const n = r(14);
        t.droppLog = function (e) {
          console.log(`    - [${n.DROPP_SDK_NAME}] ${e}`);
        };
      },
      878: (e, t) => {
        Object.defineProperty(t, "__esModule", { value: !0 });
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
          (t.DROPP_SDK_VERSION = "0.0.2"),
          (t.DROPP_SDK_NAME = "dropp-sdk-js");
      },
      149: (e, t, r) => {
        Object.defineProperty(t, "__esModule", { value: !0 }),
          (t.DroppSignatureGenerator = void 0);
        const n = r(300),
          o = r(707);
        t.DroppSignatureGenerator = class {
          static generateMerchantSignature(e, t) {
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
          o(r(422), t),
          o(r(492), t);
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
