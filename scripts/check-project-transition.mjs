import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../js/project-transition.js", import.meta.url), "utf8");
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const pending = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function page({ scrollY, reduced = false, matching = true, fallback = false, fontsReady = Promise.resolve() } = {}) {
  const events = {}, classes = new Set(), attributes = new Set();
  const root = {
    dataset: {},
    classList: { add: (...xs) => xs.forEach((x) => classes.add(x)), remove: (...xs) => xs.forEach((x) => classes.delete(x)), contains: (x) => classes.has(x) },
  };
  const title = { setAttribute: (x) => attributes.add(x), removeAttribute: (x) => attributes.delete(x), getBoundingClientRect: () => ({ top: 600 - browser.scrollY }) };
  const animations = [], scrolls = [];
  const browser = { scrollY: 0, onpageswap: null, onpagereveal: null,
    scrollTo: ({ top }) => { browser.scrollY = top; scrolls.push(top); }, addEventListener: (name, fn) => { events[name] = fn; } };
  const history = { scrollRestoration: "auto" };
  const context = {
    window: browser, history, location: { href: "https://test/#selected-projects" },
    sessionStorage: { getItem: () => JSON.stringify({ direction: "return", time: Date.now(), to: "https://test/#selected-projects", project: "https://test/dodgeui.html", scrollY, fallback }), removeItem() {} },
    document: { documentElement: root, readyState: "complete", fonts: { ready: fontsReady }, addEventListener() {},
      querySelectorAll: () => matching ? [{ href: "https://test/dodgeui.html", closest: () => title }] : [],
      querySelector: (selector) => selector === ".site-header" ? { getBoundingClientRect: () => ({ height: 48 }) } : {
        animate: () => { const animation = { finished: Promise.resolve(), cancel() {} }; animations.push(animation); return animation; },
      }, getAnimations: () => animations },
    getComputedStyle: () => ({ getPropertyValue: () => "cubic-bezier(0.32, 0.72, 0, 1)" }),
    matchMedia: () => ({ matches: reduced }), setTimeout, clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
  };
  vm.runInNewContext(source, context);
  return { events, root, classes, attributes, browser, history, animations, scrolls };
}
async function nativeReturn(scrollY) {
  const p = page({ scrollY });
  const track = pending(), finish = pending();
  p.animations.push({ animationName: "-ua-view-transition-group-anim-project-title", finished: track.promise });
  p.events.pageshow({ persisted: false });
  p.events.pagereveal({ viewTransition: { ready: Promise.resolve(), finished: finish.promise } });
  await settle();
  assert.equal(p.root.dataset.projectTransition, "native-ready");
  assert.equal(p.browser.scrollY, scrollY);
  assert(p.attributes.has("data-project-return-target"));
  track.resolve(); finish.resolve(); await settle();
  assert.equal(p.root.dataset.projectTransition, "native-finished");
  assert(!p.attributes.has("data-project-return-target"));
  assert(p.classes.has("project-returned"));
  assert.equal(p.history.scrollRestoration, "auto");
  assert.equal(p.scrolls.length, 1, "Restore scroll only once across lifecycle events");
}
await nativeReturn(0);
await nativeReturn(235);
for (const reduced of [false, true]) {
  const p = page({ reduced });
  p.events.pageshow({ persisted: false });
  p.events.pagereveal({});
  await settle();
  assert.equal(p.browser.scrollY, 520);
  assert.equal(p.root.dataset.projectTransition, reduced ? undefined : "fallback-settled");
  assert.equal(p.history.scrollRestoration, "auto");
}
for (const cancelledAfterReady of [false, true]) {
  const p = page({ scrollY: 177 });
  const ready = pending(), finish = pending(), track = pending();
  if (cancelledAfterReady) p.animations.push({ animationName: "-ua-view-transition-group-anim-project-title", finished: track.promise });
  p.events.pagereveal({ viewTransition: { ready: ready.promise, finished: finish.promise } });
  if (cancelledAfterReady) { ready.resolve(); await settle(); track.reject(new Error("cancelled")); }
  else ready.reject(new Error("unsupported capture"));
  finish.resolve(); await settle();
  assert.equal(p.root.dataset.projectTransition, "fallback-settled");
  assert.equal(p.animations.length, cancelledAfterReady ? 1 : 0, "Never replay a fade after native rejection");
  assert.equal(p.scrolls.length, 1);
  assert.equal(p.browser.scrollY, 177);
  assert(!p.classes.has("project-return-fallback"));
}
{
  const fonts = pending();
  const p = page({ fallback: true, scrollY: 188, fontsReady: fonts.promise });
  p.events.pageshow({ persisted: false });
  p.events.pagereveal({});
  await settle();
  assert.equal(p.root.dataset.projectTransition, "fallback-finished");
  assert.deepEqual(p.scrolls, [188], "Unrelated web fonts must not delay the return");
  fonts.resolve(); await settle();
  assert.deepEqual(p.scrolls, [188]);
}
{
  const p = page({ fallback: true, reduced: true, scrollY: 88 });
  p.events.pageshow({ persisted: false });
  p.events.pagereveal({});
  await settle();
  assert.deepEqual(p.scrolls, [88], "Reduced motion still restores the saved position");
  assert.equal(p.animations.length, 0);
}
console.log("Project return checks passed: event order, scroll restoration, direct arrival, reduced motion, failure and cancellation.");
