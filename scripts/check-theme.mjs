import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../js/theme.js", import.meta.url), "utf8");
const STORAGE_KEY = "site-theme";

const eventTarget = () => {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      const callbacks = listeners.get(type) || [];
      callbacks.push(listener);
      listeners.set(type, callbacks);
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) || []) listener(event);
    },
  };
};

const createPage = ({
  saved = null,
  dark = false,
  ready = false,
  hasControl = true,
  failStorage = "",
  sharedStorage,
} = {}) => {
  const values = new Map(saved === null ? [] : [[STORAGE_KEY, saved]]);
  let writes = 0;
  const storage = sharedStorage || {
    getItem(key) {
      if (failStorage === "read") throw new Error("Storage read blocked");
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failStorage === "write") throw new Error("Storage quota exceeded");
      writes += 1;
      values.set(key, value);
    },
  };
  const attributes = new Map();
  const control = {
    ...eventTarget(),
    hidden: true,
    setAttribute: (name, value) => attributes.set(name, value),
    getAttribute: (name) => attributes.get(name) ?? null,
  };
  const system = { ...eventTarget(), matches: dark };
  const document = {
    ...eventTarget(),
    readyState: ready ? "complete" : "loading",
    documentElement: { dataset: {} },
    querySelectorAll: () => hasControl ? [control] : [],
  };
  const window = {
    ...eventTarget(),
    matchMedia: () => system,
    get localStorage() {
      if (failStorage === "access") throw new Error("Storage access blocked");
      return storage;
    },
  };
  runInNewContext(source, { document, window });
  return {
    document,
    control,
    storage,
    get theme() { return document.documentElement.dataset.theme; },
    get writes() { return writes; },
    mount() { document.dispatch("DOMContentLoaded"); },
    toggle() { control.dispatch("click"); },
    setSystem(value) {
      system.matches = value;
      system.dispatch("change");
    },
    receive(key, newValue, storageArea = storage) {
      window.dispatch("storage", { key, newValue, storageArea });
    },
  };
};

const assertButtonLabel = (page) => {
  const nextTheme = page.theme === "dark" ? "light" : "dark";
  assert.equal(page.control.getAttribute("aria-label"), `Switch to ${nextTheme} mode`);
  assert.equal(page.control.getAttribute("title"), `Switch to ${nextTheme} mode`);
  assert.equal(page.control.getAttribute("aria-pressed"), null);
};

for (const saved of [null, "system", "invalid", "light", "dark"]) {
  for (const dark of [false, true]) {
    const page = createPage({ saved, dark });
    const expectedTheme = ["light", "dark"].includes(saved) ? saved : (dark ? "dark" : "light");
    assert.equal(page.theme, expectedTheme);
    assert.equal(page.control.hidden, true, "The button stays hidden until bound");
    page.mount();
    assert.equal(page.control.hidden, false);
    assertButtonLabel(page);
    page.setSystem(!dark);
    assert.equal(page.theme, expectedTheme, "System changes after entry must not update the page");
    page.toggle();
    assert.equal(page.theme, expectedTheme === "dark" ? "light" : "dark");
    assert.equal(page.storage.getItem(STORAGE_KEY), page.theme);
    assertButtonLabel(page);
    page.toggle();
    assert.equal(page.theme, expectedTheme);
    assertButtonLabel(page);
  }
}

const page = createPage({ ready: true });
page.setSystem(true);
assert.equal(page.theme, "light", "Browser preference is only sampled on entry");
page.toggle();
assert.equal(page.theme, "dark");
page.setSystem(false);
assert.equal(page.theme, "dark", "Explicit preference survives subsequent system changes");
page.toggle();
assert.equal(page.storage.getItem(STORAGE_KEY), "light");
const nextPage = createPage({ sharedStorage: page.storage, dark: true });
assert.equal(nextPage.theme, "light", "A new page applies the persisted preference before DOM ready");
nextPage.mount();
assertButtonLabel(nextPage);

const writesBeforeSync = page.writes;
page.receive(STORAGE_KEY, "dark");
assert.equal(page.theme, "dark");
assertButtonLabel(page);
page.receive("unrelated", "light");
page.receive(STORAGE_KEY, "light", {});
assert.equal(page.theme, "dark", "Unrelated keys and session storage must not change preference");
assert.equal(page.writes, writesBeforeSync, "Receiving a storage event must not write it back");
page.receive(null, null);
assert.equal(page.theme, "light", "Clearing storage restores the browser preference sampled on entry");
assertButtonLabel(page);
page.setSystem(true);
assert.equal(page.theme, "light");
page.receive(STORAGE_KEY, "dark");
page.receive(STORAGE_KEY, "invalid");
assert.equal(page.theme, "light", "Invalid storage uses the initial browser preference, not the live value");
page.receive(STORAGE_KEY, "dark");
page.receive(STORAGE_KEY, "system");
assert.equal(page.theme, "light", "Legacy system values are treated as an absent manual preference");
page.receive(STORAGE_KEY, "dark");
page.receive(STORAGE_KEY, null);
assert.equal(page.theme, "light");
assertButtonLabel(page);

const pendingPage = createPage();
pendingPage.receive(STORAGE_KEY, "dark");
pendingPage.mount();
assert.equal(pendingPage.theme, "dark", "A storage event before DOM ready updates the eventual button state");
assertButtonLabel(pendingPage);

for (const failStorage of ["access", "read", "write"]) {
  const blockedPage = createPage({ failStorage, dark: true, ready: true });
  assert.equal(blockedPage.theme, "dark");
  blockedPage.toggle();
  assert.equal(blockedPage.theme, "light", `${failStorage} failure must not block local changes`);
  assertButtonLabel(blockedPage);
  blockedPage.toggle();
  assert.equal(blockedPage.theme, "dark");
  assertButtonLabel(blockedPage);
}

const noControl = createPage({ hasControl: false, dark: true });
noControl.mount();
assert.equal(noControl.theme, "dark");
noControl.setSystem(false);
assert.equal(noControl.theme, "dark", "A page without a button also preserves its initial theme");
noControl.receive(STORAGE_KEY, "light");
assert.equal(noControl.theme, "light", "Cross-tab synchronization does not depend on a button");

console.log("Theme state checks passed.");
