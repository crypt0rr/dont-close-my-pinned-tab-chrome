const pinnedTabs = new Map();

const isRestoring = new Set();
const STORAGE_KEY = "pinnedTabs";
const RESTORED_TAB_NAVIGATION_TIMEOUT_MS = 15000;
const DEFAULT_OPTIONS = {
  restoreEnabled: true,
  restoreUrlMode: "base",
  discardRestoredTabs: true
};

function snapshotKey(tabId) {
  return String(tabId);
}

function canRestoreUrl(url) {
  return typeof url === "string" && url.length > 0;
}

function hasCommittedUrl(tab) {
  return tab && canRestoreUrl(tab.url) && tab.url !== "about:blank";
}

function hasCompletedNavigation(tab) {
  return hasCommittedUrl(tab) && tab.status === "complete";
}

function getSnapshotUrl(tab, previousUrl) {
  if (canRestoreUrl(tab.pendingUrl) && tab.pendingUrl !== "about:blank") {
    return tab.pendingUrl;
  }

  if (canRestoreUrl(tab.url) && tab.url !== "about:blank") {
    return tab.url;
  }

  return previousUrl || tab.url || tab.pendingUrl;
}

async function loadPinnedTabs() {
  const stored = await chrome.storage.session.get(STORAGE_KEY);
  pinnedTabs.clear();

  for (const snapshot of stored[STORAGE_KEY] || []) {
    if (typeof snapshot.tabId === "number") {
      pinnedTabs.set(snapshotKey(snapshot.tabId), snapshot);
    }
  }
}

async function savePinnedTabs() {
  await chrome.storage.session.set({
    [STORAGE_KEY]: Array.from(pinnedTabs.values())
  });
}

async function getOptions() {
  return chrome.storage.sync.get(DEFAULT_OPTIONS);
}

async function rememberPinnedTab(tab) {
  if (!tab || typeof tab.id !== "number") {
    return;
  }

  if (!tab.pinned) {
    await forgetTab(tab.id);
    return;
  }

  const previousSnapshot = pinnedTabs.get(snapshotKey(tab.id));

  pinnedTabs.set(snapshotKey(tab.id), {
    tabId: tab.id,
    windowId: tab.windowId,
    index: tab.index,
    url: getSnapshotUrl(tab, previousSnapshot && previousSnapshot.url)
  });

  await savePinnedTabs();
}

async function forgetTab(tabId) {
  pinnedTabs.delete(snapshotKey(tabId));
  await savePinnedTabs();
}

async function rebuildPinnedTabSnapshot() {
  try {
    const tabs = await chrome.tabs.query({ pinned: true });
    pinnedTabs.clear();
    for (const tab of tabs) {
      if (tab && typeof tab.id === "number" && tab.pinned) {
        pinnedTabs.set(snapshotKey(tab.id), {
          tabId: tab.id,
          windowId: tab.windowId,
          index: tab.index,
          url: getSnapshotUrl(tab)
        });
      }
    }
    await savePinnedTabs();
  } catch (error) {
    console.warn("Unable to rebuild pinned tab snapshot.", error);
  }
}

async function getPinnedIndex(snapshot) {
  try {
    const tabs = await chrome.tabs.query({
      windowId: snapshot.windowId,
      pinned: true
    });

    return Math.min(snapshot.index, tabs.length);
  } catch (error) {
    return snapshot.index;
  }
}

function getBaseRestoreUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return `${parsedUrl.origin}/`;
    }
  } catch (error) {
    return url;
  }

  return url;
}

async function restorePinnedTab(snapshot) {
  await loadPinnedTabs();

  if (!canRestoreUrl(snapshot.url)) {
    return;
  }

  const options = await getOptions();
  if (!options.restoreEnabled) {
    return;
  }

  const restoreUrl = options.restoreUrlMode === "exact"
    ? snapshot.url
    : getBaseRestoreUrl(snapshot.url);
  const restoreKey = `${snapshot.windowId}:${restoreUrl}`;
  if (isRestoring.has(restoreKey)) {
    return;
  }

  isRestoring.add(restoreKey);

  try {
    const restoredTab = await chrome.tabs.create({
      windowId: snapshot.windowId,
      index: await getPinnedIndex(snapshot),
      url: restoreUrl,
      pinned: true,
      active: false
    });

    await rememberPinnedTab(restoredTab);

    if (!options.discardRestoredTabs) {
      return;
    }

    const navigatedTab = await waitForCompletedNavigation(restoredTab.id);

    if (!navigatedTab || navigatedTab.active) {
      return;
    }

    await rememberPinnedTab(navigatedTab);

    if (!hasCompletedNavigation(navigatedTab)) {
      return;
    }

    try {
      await chrome.tabs.discard(navigatedTab.id);
    } catch (error) {
      console.debug("Restored pinned tab could not be discarded.", error);
    }
  } catch (error) {
    console.warn("Unable to restore pinned tab.", snapshot, error);
  } finally {
    isRestoring.delete(restoreKey);
  }
}

async function updateSnapshotPosition(tabId, windowId, index) {
  await loadPinnedTabs();

  const snapshot = pinnedTabs.get(snapshotKey(tabId));
  if (!snapshot) {
    return;
  }

  snapshot.index = index;
  snapshot.windowId = windowId;
  await savePinnedTabs();
}

async function waitForCompletedNavigation(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (hasCompletedNavigation(tab)) {
      return tab;
    }
  } catch (error) {
    return undefined;
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      chrome.tabs.get(tabId)
        .then(resolve)
        .catch(() => resolve(undefined));
    }, RESTORED_TAB_NAVIGATION_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
      chrome.tabs.onRemoved.removeListener(handleRemoved);
    }

    function handleUpdated(updatedTabId, changeInfo, tab) {
      if (updatedTabId !== tabId || !hasCompletedNavigation(tab)) {
        return;
      }

      cleanup();
      resolve(tab);
    }

    function handleRemoved(removedTabId) {
      if (removedTabId !== tabId) {
        return;
      }

      cleanup();
      resolve(undefined);
    }

    chrome.tabs.onUpdated.addListener(handleUpdated);
    chrome.tabs.onRemoved.addListener(handleRemoved);
  });
}

async function rememberNavigationUrl(details) {
  if (details.frameId !== 0 || !canRestoreUrl(details.url) || details.url === "about:blank") {
    return;
  }

  await loadPinnedTabs();

  const snapshot = pinnedTabs.get(snapshotKey(details.tabId));
  if (!snapshot) {
    return;
  }

  snapshot.url = details.url;
  await savePinnedTabs();
}

chrome.runtime.onStartup.addListener(rebuildPinnedTabSnapshot);
chrome.runtime.onInstalled.addListener(rebuildPinnedTabSnapshot);

chrome.tabs.onCreated.addListener((tab) => {
  loadPinnedTabs()
    .then(() => rememberPinnedTab(tab))
    .catch((error) => console.warn("Unable to track created tab.", error));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  loadPinnedTabs()
    .then(() => rememberPinnedTab(tab))
    .catch((error) => console.warn("Unable to track updated tab.", error));
});

chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
  updateSnapshotPosition(tabId, moveInfo.windowId, moveInfo.toIndex)
    .catch((error) => console.warn("Unable to track moved tab.", error));
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  updateSnapshotPosition(tabId, attachInfo.newWindowId, attachInfo.newPosition)
    .catch((error) => console.warn("Unable to track attached tab.", error));
});

chrome.webNavigation.onCommitted.addListener((details) => {
  rememberNavigationUrl(details)
    .catch((error) => console.warn("Unable to track committed navigation.", error));
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  rememberNavigationUrl(details)
    .catch((error) => console.warn("Unable to track history navigation.", error));
});

chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
  rememberNavigationUrl(details)
    .catch((error) => console.warn("Unable to track fragment navigation.", error));
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  handleRemovedTab(tabId, removeInfo)
    .catch((error) => console.warn("Unable to handle removed tab.", error));
});

async function handleRemovedTab(tabId, removeInfo) {
  await loadPinnedTabs();

  const snapshot = pinnedTabs.get(snapshotKey(tabId));
  await forgetTab(tabId);

  if (!snapshot || removeInfo.isWindowClosing) {
    return;
  }

  await restorePinnedTab(snapshot);
}

rebuildPinnedTabSnapshot();
