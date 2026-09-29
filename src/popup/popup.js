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

function setSignal(element, data, countKey) {
  element.className = "signal unknown";

  if (!data || !data.available) {
    element.textContent = data?.error ? "INDISPONÍVEL" : "AGUARDANDO";
    return;
  }

  const count = data[countKey] || 0;
  element.textContent = data.used ? `DETECTADO (${count})` : "NÃO DETECTADO";
  element.className = `signal ${data.used ? "yes" : "no"}`;
}

function renderRisk(score) {
  let label = "ALTO";
  let className = "risk-high";

  if (score >= 80) {
    label = "BAIXO";
    className = "risk-low";
  } else if (score >= 50) {
    label = "MÉDIO";
    className = "risk-medium";
  }

  elements.risk.textContent = `RISCO ${label}`;
  elements.risk.className = `risk-badge ${className}`;
}

function renderDomains(domains) {
  elements.domainList.replaceChildren();

  if (!domains.length) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "Nenhum domínio detectado.";
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
  elements.host.textContent = report.pageHost || "Página não compatível";
  elements.host.title = report.pageUrl || "";
  elements.thirdPartyCount.textContent = report.thirdPartyDomains.length;
  elements.thirdPartyRequests.textContent = report.thirdPartyRequestCount;
  elements.cookieCount.textContent = report.cookiesSetDuringLoad;
  elements.readableCookieCount.textContent = report.storage?.readableCookies ?? 0;
  setSignal(elements.localStorage, report.storage?.localStorage, "itemCount");
  setSignal(elements.sessionStorage, report.storage?.sessionStorage, "itemCount");
  setSignal(elements.indexedDB, report.storage?.indexedDB, "databaseCount");
  renderDomains(report.thirdPartyDomains);
  setStatus(`Última atualização: ${new Date().toLocaleTimeString("pt-BR")}`);
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
  setStatus("Atualizando sinais da página...");

  try {
    [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !/^https?:/.test(activeTab.url || "")) {
      throw new Error("Abra uma página HTTP ou HTTPS para executar a análise.");
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
  setStatus("Contadores zerados. Recarregue a página para uma medição completa.");
}

elements.refresh.addEventListener("click", loadReport);
elements.reset.addEventListener("click", resetReport);
loadReport();
