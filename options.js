const DEFAULT_OPTIONS = {
  restoreEnabled: true,
  restoreUrlMode: "base",
  discardRestoredTabs: true
};

const statusElement = document.querySelector("#status");
const restoreEnabledElement = document.querySelector("#restoreEnabled");
const discardRestoredTabsElement = document.querySelector("#discardRestoredTabs");
const restoreUrlModeElements = Array.from(document.querySelectorAll("[name='restoreUrlMode']"));

function getSelectedRestoreUrlMode() {
  const selectedElement = restoreUrlModeElements.find((element) => element.checked);
  return selectedElement ? selectedElement.value : DEFAULT_OPTIONS.restoreUrlMode;
}

async function loadOptions() {
  const options = await chrome.storage.sync.get(DEFAULT_OPTIONS);

  restoreEnabledElement.checked = options.restoreEnabled;
  discardRestoredTabsElement.checked = options.discardRestoredTabs;

  for (const element of restoreUrlModeElements) {
    element.checked = element.value === options.restoreUrlMode;
  }
}

async function saveOptions() {
  await chrome.storage.sync.set({
    restoreEnabled: restoreEnabledElement.checked,
    discardRestoredTabs: discardRestoredTabsElement.checked,
    restoreUrlMode: getSelectedRestoreUrlMode()
  });

  statusElement.textContent = "Saved";
  setTimeout(() => {
    statusElement.textContent = "";
  }, 1200);
}

document.querySelector("form").addEventListener("change", () => {
  saveOptions().catch((error) => {
    statusElement.textContent = "Unable to save settings";
    console.warn("Unable to save options.", error);
  });
});

loadOptions().catch((error) => {
  statusElement.textContent = "Unable to load settings";
  console.warn("Unable to load options.", error);
});
