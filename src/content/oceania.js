"use strict";

const OCEANIA_CHANNEL = "OCEANIA_PAGE_PRIVACY_SIGNAL_V2";

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.channel !== OCEANIA_CHANNEL) return;
  if (event.data.signal !== "canvas") return;
  browser.runtime.sendMessage({
    type: "OCEANIA_PRIVACY_SIGNAL",
    signal: "canvas",
    apis: Array.isArray(event.data.apis) ? event.data.apis.slice(0, 20) : []
  }).catch(() => {});
});

function installPageDetector() {
  const script = document.createElement("script");
  script.src = browser.runtime.getURL("content/page-detector.js");
  script.async = false;
  script.addEventListener("load", () => script.remove(), { once: true });
  (document.documentElement || document.head).appendChild(script);
}

installPageDetector();

// Storage belongs to the visited page's origin. The scan is repeated because
// many applications create storage asynchronously after DOMContentLoaded.
async function scanStorage() {
  const result = {
    localStorage: { available: false, used: false, itemCount: 0 },
    sessionStorage: { available: false, used: false, itemCount: 0 },
    indexedDB: { available: false, used: false, databaseCount: 0, names: [] },
    readableCookies: 0,
    scannedAt: new Date().toISOString()
  };

  try {
    result.localStorage.available = true;
    result.localStorage.itemCount = window.localStorage.length;
    result.localStorage.used = result.localStorage.itemCount > 0;
  } catch (error) {
    result.localStorage.error = error.message;
  }

  try {
    result.sessionStorage.available = true;
    result.sessionStorage.itemCount = window.sessionStorage.length;
    result.sessionStorage.used = result.sessionStorage.itemCount > 0;
  } catch (error) {
    result.sessionStorage.error = error.message;
  }

  try {
    result.readableCookies = document.cookie
      ? document.cookie.split(";").filter(Boolean).length
      : 0;
  } catch (error) {
    result.cookieError = error.message;
  }

  try {
    if (indexedDB && typeof indexedDB.databases === "function") {
      const databases = await indexedDB.databases();
      result.indexedDB.available = true;
      result.indexedDB.names = databases
        .map((database) => database.name || "(sem nome)")
        .filter((name, index, names) => names.indexOf(name) === index);
      result.indexedDB.databaseCount = databases.length;
      result.indexedDB.used = databases.length > 0;
    } else {
      result.indexedDB.error = "indexedDB.databases() indisponível";
    }
  } catch (error) {
    result.indexedDB.error = error.message;
  }

  return result;
}

async function sendStorageReport() {
  try {
    await browser.runtime.sendMessage({
      type: "OCEANIA_STORAGE_REPORT",
      storage: await scanStorage()
    });
  } catch (error) {
    // The extension can be reloaded while this content script is still alive.
    console.debug("Oceania: não foi possível enviar o relatório", error);
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (message && message.type === "OCEANIA_SCAN_STORAGE") {
    return scanStorage();
  }
  return undefined;
});

sendStorageReport();
window.addEventListener("DOMContentLoaded", sendStorageReport, { once: true });
window.addEventListener("load", sendStorageReport, { once: true });
setTimeout(sendStorageReport, 2000);
setTimeout(sendStorageReport, 5000);
setTimeout(sendStorageReport, 10000);
