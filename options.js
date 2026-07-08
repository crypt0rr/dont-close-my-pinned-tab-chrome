const DEFAULT_OPTIONS = {
  restoreEnabled: true,
  restoreUrlMode: "base",
  discardRestoredTabs: true,
  siteRules: []
};

const statusElement = document.querySelector("#status");
const restoreEnabledElement = document.querySelector("#restoreEnabled");
const discardRestoredTabsElement = document.querySelector("#discardRestoredTabs");
const restoreUrlModeElements = Array.from(document.querySelectorAll("[name='restoreUrlMode']"));
const globalOptionsForm = document.querySelector("#globalOptionsForm");
const siteRuleForm = document.querySelector("#siteRuleForm");
const siteRuleOriginElement = document.querySelector("#siteRuleOrigin");
const siteRuleRestoreEnabledElement = document.querySelector("#siteRuleRestoreEnabled");
const siteRuleRestoreUrlModeElement = document.querySelector("#siteRuleRestoreUrlMode");
const siteRuleDiscardRestoredTabsElement = document.querySelector("#siteRuleDiscardRestoredTabs");
const siteRulesElement = document.querySelector("#siteRules");

let siteRules = [];

function getSelectedRestoreUrlMode() {
  const selectedElement = restoreUrlModeElements.find((element) => element.checked);
  return selectedElement ? selectedElement.value : DEFAULT_OPTIONS.restoreUrlMode;
}

async function loadOptions() {
  const options = await chrome.storage.sync.get(DEFAULT_OPTIONS);

  restoreEnabledElement.checked = options.restoreEnabled;
  discardRestoredTabsElement.checked = options.discardRestoredTabs;
  siteRules = Array.isArray(options.siteRules) ? options.siteRules : [];

  for (const element of restoreUrlModeElements) {
    element.checked = element.value === options.restoreUrlMode;
  }

  renderSiteRules();
}

async function saveOptions() {
  await chrome.storage.sync.set({
    restoreEnabled: restoreEnabledElement.checked,
    discardRestoredTabs: discardRestoredTabsElement.checked,
    restoreUrlMode: getSelectedRestoreUrlMode(),
    siteRules
  });

  statusElement.textContent = "Saved";
  setTimeout(() => {
    statusElement.textContent = "";
  }, 1200);
}

function getNormalizedOrigin(input) {
  try {
    return new URL(input).origin;
  } catch (error) {
    return undefined;
  }
}

function renderSiteRules() {
  siteRulesElement.replaceChildren();

  if (siteRules.length === 0) {
    const emptyElement = document.createElement("p");
    emptyElement.className = "empty-state";
    emptyElement.textContent = "No site rules.";
    siteRulesElement.append(emptyElement);
    return;
  }

  const listElement = document.createElement("ul");
  listElement.className = "site-rule-list";

  for (const rule of siteRules) {
    const itemElement = document.createElement("li");

    const detailsElement = document.createElement("div");
    detailsElement.className = "site-rule-details";

    const originElement = document.createElement("strong");
    originElement.textContent = rule.origin;

    const summaryElement = document.createElement("span");
    summaryElement.textContent = [
      rule.restoreEnabled ? "restore" : "do not restore",
      rule.restoreUrlMode === "exact" ? "exact URL" : "base URL",
      rule.discardRestoredTabs ? "unload restored tabs" : "keep loaded"
    ].join(" · ");

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      siteRules = siteRules.filter((siteRule) => siteRule.origin !== rule.origin);
      saveOptions()
        .then(renderSiteRules)
        .catch((error) => {
          statusElement.textContent = "Unable to remove rule";
          console.warn("Unable to remove site rule.", error);
        });
    });

    detailsElement.append(originElement, summaryElement);
    itemElement.append(detailsElement, removeButton);
    listElement.append(itemElement);
  }

  siteRulesElement.append(listElement);
}

function addSiteRule(event) {
  event.preventDefault();

  const origin = getNormalizedOrigin(siteRuleOriginElement.value.trim());
  if (!origin) {
    statusElement.textContent = "Enter a valid site URL";
    return;
  }

  const rule = {
    origin,
    restoreEnabled: siteRuleRestoreEnabledElement.checked,
    restoreUrlMode: siteRuleRestoreUrlModeElement.value,
    discardRestoredTabs: siteRuleDiscardRestoredTabsElement.checked
  };

  siteRules = [
    ...siteRules.filter((siteRule) => siteRule.origin !== origin),
    rule
  ].sort((leftRule, rightRule) => leftRule.origin.localeCompare(rightRule.origin));

  siteRuleForm.reset();
  siteRuleRestoreEnabledElement.checked = true;
  siteRuleDiscardRestoredTabsElement.checked = true;
  siteRuleRestoreUrlModeElement.value = DEFAULT_OPTIONS.restoreUrlMode;

  saveOptions()
    .then(renderSiteRules)
    .catch((error) => {
      statusElement.textContent = "Unable to add rule";
      console.warn("Unable to add site rule.", error);
    });
}

globalOptionsForm.addEventListener("change", () => {
  saveOptions().catch((error) => {
    statusElement.textContent = "Unable to save settings";
    console.warn("Unable to save options.", error);
  });
});

siteRuleForm.addEventListener("submit", addSiteRule);

loadOptions().catch((error) => {
  statusElement.textContent = "Unable to load settings";
  console.warn("Unable to load options.", error);
});
