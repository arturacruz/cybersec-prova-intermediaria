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
    storage: null
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

function serialise(report) {
  return {
    ...report,
    thirdPartyDomains: [...report.thirdPartyDomains].sort(),
    cookieDomains: [...report.cookieDomains].sort()
  };
}

function calculateScore(report) {
  const thirdPartyPenalty = Math.min(40, report.thirdPartyDomains.size * 2);
  const cookiePenalty = Math.min(25, report.cookiesSetDuringLoad);
  const localStoragePenalty = report.storage?.localStorage?.used ? 10 : 0;
  const sessionStoragePenalty = report.storage?.sessionStorage?.used ? 5 : 0;
  const indexedDBPenalty = report.storage?.indexedDB?.used ? 10 : 0;

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

  if (message.type === "OCEANIA_STORAGE_REPORT" && sender.tab) {
    const report = getReport(sender.tab.id, sender.tab.url);
    report.storage = message.storage;
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
