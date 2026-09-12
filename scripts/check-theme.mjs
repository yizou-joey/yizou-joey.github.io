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
  motion = false,
  reduced = false,
  failTransition = false,
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
    contains: (target) => target === control,
    getBoundingClientRect: () => ({ left: 100, right: 136, top: 6, bottom: 42 }),
  };
  const system = { ...eventTarget(), matches: dark };
  const captures = [];
  const document = {
    ...eventTarget(),
    readyState: ready ? "complete" : "loading",
    documentElement: { dataset: {} },
    querySelectorAll: () => hasControl ? [control] : [],
  };
  if (motion) {
    document.startViewTransition = (update) => {
      if (failTransition) throw new Error("Capture unavailable");
      let finish;
      let rejectReady;
      const capture = {
        update,
        skipped: false,
        ready: new Promise((resolve, reject) => { rejectReady = reject; }),
        finished: new Promise((resolve) => { finish = resolve; }),
        finish: () => finish(),
        skipTransition() {
          this.skipped = true;
          rejectReady(new Error("Capture skipped"));
        },
      };
      captures.push(capture);
      return capture;
    };
  }
  const window = {
    ...eventTarget(),
    matchMedia: (query) => query.includes("prefers-reduced-motion")
      ? { matches: reduced }
      : system,
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
    captures,
    get theme() { return document.documentElement.dataset.theme; },
    get writes() { return writes; },
    mount() { document.dispatch("DOMContentLoaded"); },
    toggle(detail = 0) { control.dispatch("click", { detail }); },
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

const animated = createPage({ ready: true, motion: true });
assert.equal(animated.captures.length, 0, "Initial paint never starts a transition");
animated.toggle(1);
assert.equal(animated.theme, "light", "Capture the old theme before updating the DOM");
assert.equal(animated.storage.getItem(STORAGE_KEY), "dark", "Persist intent without waiting for motion");
assert.equal(animated.captures.length, 1);
animated.captures[0].update();
assert.equal(animated.theme, "dark");
assertButtonLabel(animated);
animated.captures[0].finish();
await Promise.resolve();
assert.equal(animated.document.documentElement.dataset.themeTransition, undefined);

const rapid = createPage({ ready: true, motion: true });
rapid.toggle(1);
rapid.toggle(1);
assert.equal(rapid.captures.length, 1, "Rapid clicks must not queue another animation");
assert.equal(rapid.captures[0].skipped, true);
assert.equal(rapid.theme, "light");
rapid.captures[0].update();
assert.equal(rapid.theme, "light", "A delayed callback must not restore stale intent");
rapid.toggle(1);
rapid.captures[0].finish();
await Promise.resolve();
assert.equal(rapid.document.documentElement.dataset.themeTransition, "",
  "Old completion must not clear a newer transition");
rapid.captures[1].update();
assert.equal(rapid.theme, "dark");
rapid.toggle(1);
assert.equal(rapid.theme, "light", "A click during playback snaps to the latest preference");
assert.equal(rapid.captures[1].skipped, true);

const snapshotClick = createPage({ ready: true, motion: true });
snapshotClick.toggle(1);
snapshotClick.captures[0].update();
snapshotClick.document.dispatch("click", { detail: 1, clientX: 20, clientY: 20 });
assert.equal(snapshotClick.theme, "dark", "Clicks outside the snapshot button are ignored");
snapshotClick.document.dispatch("click", {
  detail: 1, clientX: 118, clientY: 24, target: snapshotClick.control,
});
assert.equal(snapshotClick.theme, "dark", "A normal button click must not be handled twice");
snapshotClick.document.dispatch("click", { detail: 1, clientX: 118, clientY: 24 });
assert.equal(snapshotClick.theme, "light", "The snapshot button remains clickable during playback");
assert.equal(snapshotClick.captures[0].skipped, true);

const synced = createPage({ ready: true, motion: true });
synced.toggle(1);
const syncWrites = synced.writes;
synced.receive(STORAGE_KEY, "light");
synced.captures[0].update();
assert.equal(synced.theme, "light");
assert.equal(synced.captures[0].skipped, true);
assert.equal(synced.writes, syncWrites);
assert.equal(synced.document.documentElement.dataset.themeTransition, undefined);
synced.receive(null, null);
assert.equal(synced.captures.length, 1, "Storage clear never animates");

for (const options of [
  {},
  { motion: true, reduced: true },
  { motion: true, failTransition: true },
  { motion: true, keyboard: true },
]) {
  const fallback = createPage({ ready: true, ...options });
  fallback.toggle(options.keyboard ? 0 : 1);
  assert.equal(fallback.theme, "dark", "Fallback and keyboard switching must remain immediate");
  assertButtonLabel(fallback);
  assert.equal(fallback.captures.length, 0);
  assert.equal(fallback.document.documentElement.dataset.themeTransition, undefined);
}

console.log("Theme state checks passed.");
