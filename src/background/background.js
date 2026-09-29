"use strict";

const reports = new Map();

// Practical approximation of the registrable domain. This keeps common
// Brazilian and two-level suffixes from classifying sibling subdomains as
// third parties without shipping a full Public Suffix List.
const TWO_LEVEL_SUFFIXES = new Set([
  "com.br", "net.br", "org.br", "gov.br", "edu.br",
  "co.uk", "org.uk", "ac.uk", "com.au", "co.jp"
]);

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch (_error) {
    return "";
  }
}

function siteKey(hostname) {
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) {
    return parts.join(".");
  }
  const suffix = parts.slice(-2).join(".");
  return TWO_LEVEL_SUFFIXES.has(suffix)
    ? parts.slice(-3).join(".")
    : suffix;
}

function isThirdParty(requestHost, pageHost) {
  return Boolean(requestHost && pageHost && siteKey(requestHost) !== siteKey(pageHost));
}

function emptyReport(tabId, pageUrl = "") {
  return {
    tabId,
    pageUrl,
    pageHost: hostnameFromUrl(pageUrl),
    startedAt: new Date().toISOString(),
    requestCount: 0,
    thirdPartyRequestCount: 0,
    thirdPartyDomains: new Set(),
    cookiesSetDuringLoad: 0,
    cookieDomains: new Set(),
    storageFrames: new Map()
  };
}

function getReport(tabId, pageUrl = "") {
  if (!reports.has(tabId)) {
    reports.set(tabId, emptyReport(tabId, pageUrl));
  }
  return reports.get(tabId);
}

function resetReport(tabId, pageUrl) {
  const report = emptyReport(tabId, pageUrl);
  reports.set(tabId, report);
  return report;
}

function aggregateStorage(report) {
  const origins = new Map();

  for (const frame of report.storageFrames.values()) {
    const origin = frame.origin || "origem-desconhecida";
    if (!origins.has(origin)) {
      origins.set(origin, {
        localStorage: { available: false, used: false, itemCount: 0 },
        sessionStorage: { available: false, used: false, itemCount: 0 },
        indexedDB: { available: false, used: false, databaseCount: 0, names: [] },
        readableCookies: 0
      });
    }

    const originData = origins.get(origin);
    for (const storageName of ["localStorage", "sessionStorage"]) {
      const frameStorage = frame.storage?.[storageName];
      if (!frameStorage) continue;
      originData[storageName].available ||= frameStorage.available;
      originData[storageName].used ||= frameStorage.used;
      originData[storageName].itemCount = Math.max(
        originData[storageName].itemCount,
        frameStorage.itemCount || 0
      );
    }

    const frameIndexedDB = frame.storage?.indexedDB;
    if (frameIndexedDB) {
      originData.indexedDB.available ||= frameIndexedDB.available;
      originData.indexedDB.used ||= frameIndexedDB.used;
      originData.indexedDB.databaseCount = Math.max(
        originData.indexedDB.databaseCount,
        frameIndexedDB.databaseCount || 0
      );
      originData.indexedDB.names = [
        ...new Set([...originData.indexedDB.names, ...(frameIndexedDB.names || [])])
      ];
    }

    originData.readableCookies = Math.max(
      originData.readableCookies,
      frame.storage?.readableCookies || 0
    );
  }

  const summary = {
    localStorage: { available: false, used: false, itemCount: 0, originCount: 0 },
    sessionStorage: { available: false, used: false, itemCount: 0, originCount: 0 },
    indexedDB: { available: false, used: false, databaseCount: 0, originCount: 0, names: [] },
    readableCookies: 0,
    scannedFrameCount: report.storageFrames.size
  };

  for (const originData of origins.values()) {
    for (const storageName of ["localStorage", "sessionStorage"]) {
      summary[storageName].available ||= originData[storageName].available;
      summary[storageName].used ||= originData[storageName].used;
      summary[storageName].itemCount += originData[storageName].itemCount;
      if (originData[storageName].used) summary[storageName].originCount += 1;
    }

    summary.indexedDB.available ||= originData.indexedDB.available;
    summary.indexedDB.used ||= originData.indexedDB.used;
    summary.indexedDB.databaseCount += originData.indexedDB.databaseCount;
    if (originData.indexedDB.used) summary.indexedDB.originCount += 1;
    summary.indexedDB.names.push(...originData.indexedDB.names);
    summary.readableCookies += originData.readableCookies;
  }

  summary.indexedDB.names = [...new Set(summary.indexedDB.names)];
  return summary;
}

function serialise(report) {
  return {
    ...report,
    storageFrames: undefined,
    storage: aggregateStorage(report),
    thirdPartyDomains: [...report.thirdPartyDomains].sort(),
    cookieDomains: [...report.cookieDomains].sort()
  };
}

function calculateScore(report) {
  const storage = aggregateStorage(report);
  const thirdPartyPenalty = Math.min(40, report.thirdPartyDomains.size * 2);
  const cookiePenalty = Math.min(25, report.cookiesSetDuringLoad);
  const localStoragePenalty = storage.localStorage.used ? 10 : 0;
  const sessionStoragePenalty = storage.sessionStorage.used ? 5 : 0;
  const indexedDBPenalty = storage.indexedDB.used ? 10 : 0;

  const deductions = {
    thirdPartyDomains: thirdPartyPenalty,
    cookiesSetDuringLoad: cookiePenalty,
    localStorage: localStoragePenalty,
    sessionStorage: sessionStoragePenalty,
    indexedDB: indexedDBPenalty
  };

  return {
    value: Math.max(0, 100 - Object.values(deductions).reduce((sum, value) => sum + value, 0)),
    deductions
  };
}

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) {
      return;
    }

    const requestHost = hostnameFromUrl(details.url);
    let report;

    if (details.type === "main_frame") {
      report = resetReport(details.tabId, details.url);
    } else {
      report = getReport(details.tabId);
    }

    report.requestCount += 1;

    if (isThirdParty(requestHost, report.pageHost)) {
      report.thirdPartyRequestCount += 1;
      report.thirdPartyDomains.add(requestHost);
    }
  },
  { urls: ["<all_urls>"] }
);

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) {
      return;
    }

    const report = getReport(details.tabId);
    const headers = details.responseHeaders || [];
    const setCookieHeaders = headers.filter(
      (header) => header.name && header.name.toLowerCase() === "set-cookie"
    );

    report.cookiesSetDuringLoad += setCookieHeaders.length;
    if (setCookieHeaders.length > 0) {
      report.cookieDomains.add(hostnameFromUrl(details.url));
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

browser.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.type) {
    return undefined;
  }

  if (message.type === "OCEANIA_STORAGE_REPORT") {
    const tabId = sender.tab?.id ?? message.tabId;
    if (!Number.isInteger(tabId)) {
      return Promise.resolve({ ok: false });
    }
    const report = getReport(tabId, sender.tab?.url || message.pageUrl || "");
    const frameId = sender.frameId ?? message.frameId ?? 0;
    const frameUrl = sender.url || message.pageUrl || report.pageUrl;
    report.storageFrames.set(frameId, {
      frameId,
      url: frameUrl,
      origin: hostnameFromUrl(frameUrl),
      storage: message.storage
    });
    return Promise.resolve({ ok: true });
  }

  if (message.type === "OCEANIA_GET_REPORT") {
    const report = getReport(message.tabId, message.pageUrl || "");
    return Promise.resolve({
      report: serialise(report),
      score: calculateScore(report)
    });
  }

  if (message.type === "OCEANIA_RESET_REPORT") {
    const report = resetReport(message.tabId, message.pageUrl || "");
    return Promise.resolve({
      report: serialise(report),
      score: calculateScore(report)
    });
  }

  return undefined;
});

browser.tabs.onRemoved.addListener((tabId) => reports.delete(tabId));
