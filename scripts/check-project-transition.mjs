import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../js/project-transition.js", import.meta.url), "utf8");
const storage = new Map();
const project = "https://test/dodgeui.html";
const home = "https://test/";
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const pending = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function transition() {
  const ready = pending(), finished = pending();
  const result = { ready: ready.promise, finished: finished.promise, skipped: false,
    skipTransition() { this.skipped = true; }, readyEvent: ready, finishEvent: finished };
  return result;
}
function page(url, { reduced = false, native = true, titleVisible = true } = {}) {
  const events = {}, classes = new Set(), attributes = new Set(), animations = [];
  const rect = { width: 300, height: 30, top: titleVisible ? 100 : 900,
    bottom: titleVisible ? 130 : 930, left: 100, right: 400 };
  const title = { getBoundingClientRect: () => rect,
    setAttribute: (name) => attributes.add(name), removeAttribute: (name) => attributes.delete(name) };
  const preview = { getBoundingClientRect: () => rect };
  const root = { dataset: {},
    classList: { add: (...values) => values.forEach((v) => classes.add(v)),
      remove: (...values) => values.forEach((v) => classes.delete(v)), contains: (v) => classes.has(v) },
    animate: () => { const animation = { cancel() {} }; animations.push(animation); return animation; } };
  const isHome = url === home;
  const browser = { innerHeight: 800, innerWidth: 1200, scrollY: 250,
    navigation: { activation: { from: { url: isHome ? project : home } } },
    addEventListener: (name, handler) => { events[name] = handler; } };
  if (native) Object.assign(browser, { onpageswap: null, onpagereveal: null });
  const history = { scrollRestoration: "auto" };
  vm.runInNewContext(source, {
    window: browser, history, location: { href: url, origin: "https://test" }, URL, Date,
    sessionStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    document: { documentElement: root, addEventListener() {},
      querySelector: (selector) => selector === ".project-title" ? (isHome ? null : title)
        : selector === ".publication-preview" ? preview : selector === ".project-image-frame" ? (isHome ? null : {}) : null,
      querySelectorAll: (selector) => selector === ".publication-project-link"
        ? (isHome ? [{ href: project, closest: () => title }] : [])
        : (attributes.size ? [title] : []) },
    matchMedia: () => ({ matches: reduced }),
    getComputedStyle: () => ({ opacity: "1", fontSize: "20px", getPropertyValue: (name) => name.includes("duration") ? "250ms" : "ease" }),
  });
  return { events, classes, root, browser, history, animations, attributes };
}
function depart(page, destination, navigationType = "traverse") {
  const vt = transition();
  page.events.pageswap({ activation: { entry: { url: destination }, navigationType }, viewTransition: vt });
  return vt;
}
async function arrive(page, persisted = false) {
  const vt = transition();
  page.events.pageshow?.({ persisted });
  page.events.pagereveal({ viewTransition: vt });
  vt.readyEvent.resolve(); await settle();
  return vt;
}
async function finish(vt) { vt.finishEvent.resolve(); await settle(); }

// The same homepage instance is restored twice: no initialization-time direction flags.
const h = page(home), p = page(project);
for (let visit = 0; visit < 2; visit += 1) {
  const outgoing = depart(p, home);
  assert(p.classes.has("project-return-departing"));
  const incoming = await arrive(h, true);
  assert.equal(incoming.skipped, false);
  assert(h.classes.has("project-return-arriving"));
  assert(h.attributes.has("data-project-return-target"));
  assert.equal(h.browser.scrollY, 250, "History owns scroll restoration");
  assert.equal(h.history.scrollRestoration, "auto");
  await finish(outgoing); await finish(incoming);
  assert(!p.classes.has("project-return-departing"));
  assert.equal(h.attributes.size, 0);
  const forwardOut = depart(h, project);
  const forwardIn = await arrive(p, true);
  assert(!h.classes.has("project-departing"), "Forward must not create an image preview");
  assert(!p.classes.has("project-arriving"));
  assert.equal(forwardIn.skipped, false, "Forward retains the native page fade");
  await finish(forwardOut); await finish(forwardIn);
}

// Ordinary Home links share the same lifecycle as browser back.
const homeLink = depart(p, home, "push");
const homeArrival = await arrive(h);
assert(h.classes.has("project-return-arriving"));
await finish(homeLink); await finish(homeArrival);

// A real visible click preview still produces the existing shared-image transition.
storage.set("dodgeui-transition", JSON.stringify({ time: Date.now(), from: home, to: project, image: "preview.webp" }));
const imageOut = depart(h, project, "push");
assert(h.classes.has("project-departing"));
const imageIn = await arrive(p);
assert(p.classes.has("project-arriving"));
await finish(imageOut); await finish(imageIn);

for (const settings of [{ reduced: true }, { native: false }]) {
  const ordinary = page(project, settings);
  const vt = depart(ordinary, home);
  assert(vt.skipped);
  assert.equal(storage.size, 0);
  const reveal = await arrive(ordinary, true);
  assert(reveal.skipped);
  assert.equal(ordinary.animations.length, 0);
}
const offscreen = page(home, { titleVisible: false });
const offscreenOut = depart(p, home);
const offscreenIn = await arrive(offscreen, true);
assert(!offscreen.classes.has("project-return-arriving"));
assert.equal(offscreen.browser.scrollY, 250, "Do not scroll merely to manufacture a shared title");
await finish(offscreenOut); await finish(offscreenIn);

const unrelated = depart(p, "https://elsewhere.test/");
assert(unrelated.skipped);
assert.equal(storage.size, 0);
const failedOut = depart(p, home);
const failedIn = transition();
h.events.pagereveal({ viewTransition: failedIn });
failedIn.readyEvent.reject(new Error("capture unavailable"));
await settle();
assert.equal(h.root.dataset.projectTransition, "native-skipped");
assert.equal(h.attributes.size, 0, "Rejected transitions must clean snapshot names");
await finish(failedOut); await finish(failedIn);
// Late completion from a previous visit cannot erase a new visit's names.
const olderOut = depart(p, home);
const olderIn = await arrive(h, true);
const newerOut = depart(p, home);
const newerIn = await arrive(h, true);
await finish(olderOut); await finish(olderIn);
assert(h.classes.has("project-return-arriving"));
assert.equal(h.root.dataset.projectTransitionMode, "title");
await finish(newerOut); await finish(newerIn);
// pageshow may follow pagereveal on a network load; it must not cancel it.
for (const persisted of [false, true]) {
  const out = depart(p, home);
  const incoming = transition();
  h.events.pagereveal({ viewTransition: incoming });
  h.events.pageshow?.({ persisted });
  assert.equal(incoming.skipped, false);
  assert.equal(h.root.dataset.projectTransition, "native-pending");
  assert.equal(h.root.dataset.projectTransitionMode, "title");
  incoming.readyEvent.resolve();
  await settle();
  assert.equal(h.root.dataset.projectTransition, "native-ready");
  await finish(out); await finish(incoming);
}

// Ignore a storage record from another navigation, even when its target matches.
storage.set("dodgeui-transition", JSON.stringify({ time: Date.now(), from: "https://test/other.html", to: home, direction: "return", project }));
const staleArrival = await arrive(h, true);
assert(staleArrival.skipped);
assert.equal(h.attributes.size, 0);
console.log("Project transitions passed: repeated BFCache back/forward, native scroll, Home link, shared image, offscreen title, reduced motion, unsupported and rejected transitions.");
