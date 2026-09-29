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

const IDENTIFIER_PARAMETER = /^(?:id|uid|uuid|guid|cid|sid|user(?:_?id)?|client(?:_?id)?|visitor(?:_?id)?|device(?:_?id)?|token|click_?id|gclid|fbclid|msclkid|dclid|yclid)$/i;

function cookieKind(headerValue) {
  const persistent = /(?:^|;)\s*(?:expires|max-age)\s*=/i.test(headerValue || "");
  return persistent ? "persistent" : "session";
}

function parseSetCookie(headerValue) {
  const firstPart = String(headerValue || "").split(";", 1)[0];
  const separator = firstPart.indexOf("=");
  if (separator < 1) return null;
  const name = firstPart.slice(0, separator).trim();
  const value = firstPart.slice(separator + 1).trim();
  return name ? { name, value, duration: cookieKind(headerValue) } : null;
}

function identifierParameters(url) {
  try {
    const results = [];
    for (const [name, value] of new URL(url).searchParams) {
      const decoded = value.trim();
      const looksNamed = IDENTIFIER_PARAMETER.test(name);
      const looksOpaque = decoded.length >= 16 && /[a-z]/i.test(decoded) && /\d/.test(decoded);
      if ((looksNamed || looksOpaque) && decoded.length >= 6) {
        results.push({ name, value: decoded });
      }
    }
    return results;
  } catch (_error) {
    return [];
  }
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
    cookieBreakdown: {
      firstParty: { session: 0, persistent: 0 },
      thirdParty: { session: 0, persistent: 0 }
    },
    cookieValues: new Map(),
    storageFrames: new Map(),
    canvas: { detected: false, eventCount: 0, apis: new Set(), frames: new Set() },
    bounceTracking: { detected: false, eventCount: 0, domains: new Set(), parameters: new Set() },
    cookieSync: { detected: false, eventCount: 0, domains: new Set(), parameters: new Set() },
    queryTracking: { detected: false, eventCount: 0, parameters: new Set() },
    activeMainRequestId: null
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
    cookieDomains: [...report.cookieDomains].sort(),
    cookieValues: undefined,
    canvas: {
      ...report.canvas,
      apis: [...report.canvas.apis].sort(),
      frames: report.canvas.frames.size
    },
    bounceTracking: {
      ...report.bounceTracking,
      domains: [...report.bounceTracking.domains].sort(),
      parameters: [...report.bounceTracking.parameters].sort()
    },
    cookieSync: {
      ...report.cookieSync,
      domains: [...report.cookieSync.domains].sort(),
      parameters: [...report.cookieSync.parameters].sort()
    },
    queryTracking: {
      ...report.queryTracking,
      parameters: [...report.queryTracking.parameters].sort()
    },
    activeMainRequestId: undefined
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
      const current = reports.get(details.tabId);
      const sameNavigation = Boolean(
        current && details.requestId && current.activeMainRequestId === details.requestId
      );
      report = sameNavigation ? current : resetReport(details.tabId, details.url);
      report.activeMainRequestId = details.requestId || report.activeMainRequestId;
      report.pageUrl = details.url;
      report.pageHost = hostnameFromUrl(details.url);
    } else {
      report = getReport(details.tabId);
    }

    report.requestCount += 1;

    if (isThirdParty(requestHost, report.pageHost)) {
      report.thirdPartyRequestCount += 1;
      report.thirdPartyDomains.add(requestHost);

      for (const parameter of identifierParameters(details.url)) {
        for (const [cookieValue, cookieSource] of report.cookieValues) {
          if (parameter.value === cookieValue && siteKey(cookieSource) !== siteKey(requestHost)) {
            report.cookieSync.detected = true;
            report.cookieSync.eventCount += 1;
            report.cookieSync.domains.add(requestHost);
            report.cookieSync.domains.add(cookieSource);
            report.cookieSync.parameters.add(parameter.name);
          }
        }
      }
    }
  },
  { urls: ["<all_urls>"] }
);

browser.webRequest.onBeforeRedirect.addListener(
  (details) => {
    if (details.tabId < 0 || details.type !== "main_frame") return;
    const report = getReport(details.tabId, details.url);
    const fromHost = hostnameFromUrl(details.url);
    const toHost = hostnameFromUrl(details.redirectUrl);
    if (!fromHost || !toHost || siteKey(fromHost) === siteKey(toHost)) return;

    const parameters = identifierParameters(details.redirectUrl);
    report.bounceTracking.eventCount += 1;
    report.bounceTracking.domains.add(fromHost);
    report.bounceTracking.domains.add(toHost);
    for (const parameter of parameters) {
      report.bounceTracking.parameters.add(parameter.name);
    }
    report.bounceTracking.detected = parameters.length > 0 || report.bounceTracking.eventCount >= 2;
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
      const responseHost = hostnameFromUrl(details.url);
      const party = isThirdParty(responseHost, report.pageHost) ? "thirdParty" : "firstParty";
      report.cookieDomains.add(responseHost);
      for (const header of setCookieHeaders) {
        const cookie = parseSetCookie(header.value || "");
        if (!cookie) continue;
        report.cookieBreakdown[party][cookie.duration] += 1;
        if (cookie.value.length >= 6) {
          report.cookieValues.set(cookie.value, responseHost);
        }
      }
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

  if (message.type === "OCEANIA_PRIVACY_SIGNAL") {
    const tabId = sender.tab?.id ?? message.tabId;
    if (!Number.isInteger(tabId)) return Promise.resolve({ ok: false });
    const report = getReport(tabId, sender.tab?.url || message.pageUrl || "");
    if (message.signal === "canvas") {
      report.canvas.detected = true;
      report.canvas.eventCount += 1;
      report.canvas.frames.add(sender.frameId ?? message.frameId ?? 0);
      for (const api of message.apis || []) report.canvas.apis.add(api);
    }
    return Promise.resolve({ ok: true });
  }

  if (message.type === "OCEANIA_QUERY_PARAMETERS") {
    const tabId = sender.tab?.id ?? message.tabId;
    if (!Number.isInteger(tabId)) return Promise.resolve({ ok: false });
    const report = getReport(tabId, sender.tab?.url || message.pageUrl || "");
    const parameters = Array.isArray(message.parameters) ? message.parameters.slice(0, 30) : [];
    if (parameters.length) {
      report.queryTracking.detected = true;
      report.queryTracking.eventCount += 1;
      for (const name of parameters) report.queryTracking.parameters.add(String(name));
    }
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
