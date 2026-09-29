"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const listeners = {};
const browser = {
  webRequest: {
    onBeforeRequest: { addListener(callback) { listeners.beforeRequest = callback; } },
    onBeforeRedirect: { addListener(callback) { listeners.beforeRedirect = callback; } },
    onHeadersReceived: { addListener(callback) { listeners.headersReceived = callback; } }
  },
  runtime: {
    onMessage: { addListener(callback) { listeners.message = callback; } }
  },
  tabs: {
    onRemoved: { addListener(callback) { listeners.tabRemoved = callback; } }
  }
};

const source = fs.readFileSync(
  path.join(__dirname, "../src/background/background.js"),
  "utf8"
);
vm.runInNewContext(source, { browser, URL, Date, Map, Set, Promise });

listeners.beforeRequest({
  tabId: 7,
  type: "main_frame",
  requestId: "navigation-1",
  url: "https://news.example.com/article"
});
listeners.beforeRequest({
  tabId: 7,
  type: "script",
  url: "https://static.example.com/app.js"
});
listeners.beforeRequest({
  tabId: 7,
  type: "xmlhttprequest",
  url: "https://tracker.invalid/collect"
});
listeners.headersReceived({
  tabId: 7,
  url: "https://tracker.invalid/collect",
  responseHeaders: [
    { name: "Set-Cookie", value: "id=identifier-12345; Max-Age=3600" },
    { name: "set-cookie", value: "session=session-abcdef" },
    { name: "Content-Type", value: "text/plain" }
  ]
});
listeners.headersReceived({
  tabId: 7,
  url: "https://news.example.com/article",
  responseHeaders: [
    { name: "Set-Cookie", value: "theme=dark; Expires=Wed, 21 Oct 2030 07:28:00 GMT" },
    { name: "Set-Cookie", value: "visit=current-session" }
  ]
});
listeners.beforeRequest({
  tabId: 7,
  type: "xmlhttprequest",
  url: "https://sync.invalid/match?uid=identifier-12345"
});
listeners.beforeRedirect({
  tabId: 7,
  type: "main_frame",
  requestId: "navigation-1",
  url: "https://news.example.com/out",
  redirectUrl: "https://bounce.invalid/continue?uid=visitor-123456"
});

(async () => {
  await listeners.message(
    {
      type: "OCEANIA_STORAGE_REPORT",
      storage: {
        localStorage: { available: true, used: true, itemCount: 1 },
        sessionStorage: { available: true, used: true, itemCount: 2 },
        indexedDB: { available: true, used: true, databaseCount: 1, names: ["main-db"] },
        readableCookies: 1
      }
    },
    {
      tab: { id: 7, url: "https://news.example.com/article" },
      frameId: 0,
      url: "https://news.example.com/article"
    }
  );

  await listeners.message(
    {
      type: "OCEANIA_PRIVACY_SIGNAL",
      signal: "canvas",
      apis: ["canvas.toDataURL"]
    },
    {
      tab: { id: 7, url: "https://news.example.com/article" },
      frameId: 0
    }
  );

  await listeners.message(
    {
      type: "OCEANIA_STORAGE_REPORT",
      storage: {
        localStorage: { available: true, used: true, itemCount: 1 },
        sessionStorage: { available: true, used: true, itemCount: 1 },
        indexedDB: { available: true, used: false, databaseCount: 0, names: [] },
        readableCookies: 2
      }
    },
    {
      tab: { id: 7, url: "https://news.example.com/article" },
      frameId: 1,
      url: "https://good.third-party.invalid/frame"
    }
  );

  await listeners.message(
    {
      type: "OCEANIA_STORAGE_REPORT",
      storage: {
        localStorage: { available: true, used: true, itemCount: 1 },
        sessionStorage: { available: true, used: true, itemCount: 1 },
        indexedDB: { available: true, used: false, databaseCount: 0, names: [] },
        readableCookies: 2
      }
    },
    {
      tab: { id: 7, url: "https://news.example.com/article" },
      frameId: 2,
      url: "https://broken.third-party.invalid/frame"
    }
  );

  const result = await listeners.message(
    { type: "OCEANIA_GET_REPORT", tabId: 7 },
    {}
  );

  assert.equal(result.report.requestCount, 4);
  assert.equal(result.report.thirdPartyRequestCount, 2);
  assert.deepEqual(Array.from(result.report.thirdPartyDomains), ["sync.invalid", "tracker.invalid"]);
  assert.equal(result.report.cookiesSetDuringLoad, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(result.report.cookieBreakdown)), {
    firstParty: { session: 1, persistent: 1 },
    thirdParty: { session: 1, persistent: 1 }
  });
  assert.equal(result.report.canvas.detected, true);
  assert.deepEqual(Array.from(result.report.canvas.apis), ["canvas.toDataURL"]);
  assert.equal(result.report.bounceTracking.detected, true);
  assert.equal(result.report.cookieSync.detected, true);
  assert.equal(result.report.storage.localStorage.used, true);
  assert.equal(result.report.storage.localStorage.originCount, 3);
  assert.equal(result.report.storage.localStorage.itemCount, 3);
  assert.equal(result.report.storage.sessionStorage.originCount, 3);
  assert.equal(result.report.storage.sessionStorage.itemCount, 4);
  assert.equal(result.report.storage.indexedDB.originCount, 1);
  assert.equal(result.report.storage.indexedDB.databaseCount, 1);
  assert.equal(result.report.storage.scannedFrameCount, 3);
  assert.equal(result.score.value, 67);
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.score.deductions)),
    {
      thirdPartyDomains: 4,
      cookiesSetDuringLoad: 4,
      localStorage: 10,
      sessionStorage: 5,
      indexedDB: 10
    }
  );

  console.log("background.test.js: OK");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
