"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const listeners = {};
const browser = {
  webRequest: {
    onBeforeRequest: { addListener(callback) { listeners.beforeRequest = callback; } },
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
    { name: "Set-Cookie", value: "id=1" },
    { name: "set-cookie", value: "session=2" },
    { name: "Content-Type", value: "text/plain" }
  ]
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

  assert.equal(result.report.requestCount, 3);
  assert.equal(result.report.thirdPartyRequestCount, 1);
  assert.deepEqual(Array.from(result.report.thirdPartyDomains), ["tracker.invalid"]);
  assert.equal(result.report.cookiesSetDuringLoad, 2);
  assert.equal(result.report.storage.localStorage.used, true);
  assert.equal(result.report.storage.localStorage.originCount, 3);
  assert.equal(result.report.storage.localStorage.itemCount, 3);
  assert.equal(result.report.storage.sessionStorage.originCount, 3);
  assert.equal(result.report.storage.sessionStorage.itemCount, 4);
  assert.equal(result.report.storage.indexedDB.originCount, 1);
  assert.equal(result.report.storage.indexedDB.databaseCount, 1);
  assert.equal(result.report.storage.scannedFrameCount, 3);
  assert.equal(result.score.value, 71);
  assert.deepEqual(
    JSON.parse(JSON.stringify(result.score.deductions)),
    {
      thirdPartyDomains: 2,
      cookiesSetDuringLoad: 2,
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
