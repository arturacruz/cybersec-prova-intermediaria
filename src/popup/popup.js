"use strict";

const elements = {
  score: document.querySelector("#score"),
  risk: document.querySelector("#risk-badge"),
  host: document.querySelector("#page-host"),
  status: document.querySelector("#status-message"),
  thirdPartyCount: document.querySelector("#third-party-count"),
  thirdPartyRequests: document.querySelector("#third-party-requests"),
  cookieCount: document.querySelector("#cookie-count"),
  readableCookieCount: document.querySelector("#readable-cookie-count"),
  localStorage: document.querySelector("#local-storage"),
  sessionStorage: document.querySelector("#session-storage"),
  indexedDB: document.querySelector("#indexed-db"),
  domainList: document.querySelector("#domain-list"),
  refresh: document.querySelector("#refresh-button"),
  reset: document.querySelector("#reset-button")
};

let activeTab = null;

function setStatus(text, error = false) {
  elements.status.textContent = text;
  elements.status.style.color = error ? "#ff5c5c" : "#999";
}

function setSignal(element, data, countKey, unit) {
  element.className = "signal unknown";

  if (!data || !data.available) {
    element.textContent = data?.error ? "UNAVAILABLE" : "AWAITING";
    return;
  }

  const count = data[countKey] || 0;
  const origins = data.originCount || 0;
  element.textContent = data.used
    ? `${origins} ORIGIN${origins === 1 ? "" : "S"} · ${count} ${unit}${count === 1 ? "" : "S"}`
    : "NOT DETECTED";
  element.className = `signal ${data.used ? "yes" : "no"}`;
}

function renderRisk(score) {
  let label = "HIGH";
  let className = "risk-high";

  if (score >= 80) {
    label = "LOW";
    className = "risk-low";
  } else if (score >= 50) {
    label = "MEDIUM";
    className = "risk-medium";
  }

  elements.risk.textContent = `${label} RISK`;
  elements.risk.className = `risk-badge ${className}`;
}

function renderDomains(domains) {
  elements.domainList.replaceChildren();

  if (!domains.length) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "No domains detected.";
    elements.domainList.append(item);
    return;
  }

  for (const domain of domains) {
    const item = document.createElement("li");
    item.textContent = domain;
    elements.domainList.append(item);
  }
}

function render(data) {
  const { report, score } = data;
  elements.score.textContent = score.value;
  renderRisk(score.value);
  elements.host.textContent = report.pageHost || "Incompatible page";
  elements.host.title = report.pageUrl || "";
  elements.thirdPartyCount.textContent = report.thirdPartyDomains.length;
  elements.thirdPartyRequests.textContent = report.thirdPartyRequestCount;
  elements.cookieCount.textContent = report.cookiesSetDuringLoad;
  elements.readableCookieCount.textContent = report.storage?.readableCookies ?? 0;
  setSignal(elements.localStorage, report.storage?.localStorage, "itemCount", "ITEM");
  setSignal(elements.sessionStorage, report.storage?.sessionStorage, "itemCount", "ITEM");
  setSignal(elements.indexedDB, report.storage?.indexedDB, "databaseCount", "DB");
  renderDomains(report.thirdPartyDomains);
  setStatus(`Last update: ${new Date().toLocaleTimeString("en-US")}`);
}

async function scanStorageInTab() {
  try {
    return await browser.tabs.sendMessage(activeTab.id, { type: "OCEANIA_SCAN_STORAGE" });
  } catch (_error) {
    return null;
  }
}

async function loadReport() {
  elements.refresh.disabled = true;
  setStatus("Updating page data...");

  try {
    [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !/^https?:/.test(activeTab.url || "")) {
      throw new Error("Open an HTTP or HTTPS page to start the analysis.");
    }

    const storage = await scanStorageInTab();
    if (storage) {
      await browser.runtime.sendMessage({
        type: "OCEANIA_STORAGE_REPORT",
        tabId: activeTab.id,
        pageUrl: activeTab.url,
        storage
      });
    }

    const data = await browser.runtime.sendMessage({
      type: "OCEANIA_GET_REPORT",
      tabId: activeTab.id,
      pageUrl: activeTab.url
    });
    render(data);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    elements.refresh.disabled = false;
  }
}

async function resetReport() {
  if (!activeTab) {
    return;
  }

  const data = await browser.runtime.sendMessage({
    type: "OCEANIA_RESET_REPORT",
    tabId: activeTab.id,
    pageUrl: activeTab.url
  });
  render(data);
  setStatus("Counters reset. Reload the page for a full analysis.");
}

elements.refresh.addEventListener("click", loadReport);
elements.reset.addEventListener("click", resetReport);
loadReport();
