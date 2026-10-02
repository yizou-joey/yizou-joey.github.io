import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import services from "../contents/services.js";
import { renderListHtml, renderServicesItemHtml } from "../js/renderers.js";

const source = await readFile(new URL("../js/service-tooltip.js", import.meta.url), "utf8");
const eventTarget = () => {
  const listeners = new Map();
  return {
    addEventListener(type, callback) {
      listeners.set(type, [...(listeners.get(type) || []), callback]);
    },
    dispatch(type, event = {}) {
      for (const callback of listeners.get(type) || []) callback(event);
    },
  };
};

const createPage = () => {
  const entries = [0, 1].map(() => {
    const classes = new Set();
    const link = { ...eventTarget(), matches: () => true };
    const tooltip = {
      ...eventTarget(),
      classList: {
        add: (value) => classes.add(value),
        remove: (value) => classes.delete(value),
        contains: (value) => classes.has(value),
        toggle(value, enabled) {
          if (enabled) classes.add(value);
          else classes.delete(value);
        },
      },
    };
    return { link, tooltip, open: () => classes.has("is-open") };
  });
  const fine = { ...eventTarget(), matches: true };
  const reduced = { ...eventTarget(), matches: false };
  const document = {
    ...eventTarget(),
    querySelectorAll: () => entries.map((entry) => ({
      querySelector: (selector) => selector.startsWith("a") ? entry.link : entry.tooltip,
    })),
  };
  const window = eventTarget();
  const timers = new Map();
  const frames = new Map();
  let time = 0;
  let nextId = 0;
  const context = {
    document, window, innerWidth: 1280, innerHeight: 720,
    matchMedia: (query) => query.includes("reduced") ? reduced : fine,
    setTimeout(callback, delay) {
      timers.set(++nextId, { callback, at: time + delay });
      return nextId;
    },
    clearTimeout: (id) => timers.delete(id),
    requestAnimationFrame(callback) {
      frames.set(++nextId, callback);
      return nextId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  const frame = () => {
    for (const [id, callback] of [...frames]) {
      if (frames.delete(id)) callback();
    }
  };
  const advance = (milliseconds) => {
    time += milliseconds;
    for (const [id, timer] of [...timers]) {
      if (timer.at <= time && timers.delete(id)) timer.callback();
    }
  };
  runInNewContext(source, context);
  return { entries, document, window, context, fine, reduced, frame, advance };
};
const mouse = { pointerType: "mouse" };

const html = renderListHtml(services, renderServicesItemHtml);
assert.equal((html.match(/role="tooltip"/g) || []).length, 2);
assert.ok(html.includes('aria-describedby="service-event-description-0"'));
assert.ok(html.includes('id="service-event-description-1"'));
assert.ok(html.includes("17th ACM Multimedia Systems Conference"));
assert.ok(!renderServicesItemHtml({ event: "No link", eventFullName: "Test" }).includes('role="tooltip"'));
assert.ok(!renderServicesItemHtml({ event: "[Test](https://example.com)" }).includes('role="tooltip"'));
assert.ok(renderServicesItemHtml({ event: "[Test](https://example.com)", eventFullName: "<Full> & Name" }).includes("&lt;Full&gt; &amp; Name"));

let page = createPage();
let [first, second] = page.entries;
first.link.dispatch("pointerenter", mouse);
assert.ok(first.open(), "Pointer entry opens immediately, like resource-link underlines.");
first.link.dispatch("pointerleave");
page.advance(100);
first.tooltip.dispatch("pointerenter");
page.advance(100);
assert.ok(first.open());
first.tooltip.dispatch("pointerleave");
page.advance(150);
assert.ok(!first.open());

first.link.dispatch("focus");
page.window.dispatch("scroll"); // The browser scrolls a newly focused link into view.
page.frame();
assert.ok(first.open());
assert.ok(first.tooltip.classList.contains("is-instant"));
page.document.dispatch("keydown", { key: "Escape" });
first.link.dispatch("pointerenter", mouse);
page.advance(200);
assert.ok(!first.open());
first.link.dispatch("blur");
first.link.dispatch("pointerleave");
first.link.dispatch("focus");
page.frame();
assert.ok(first.open());
page.window.dispatch("scroll");
assert.ok(!first.open());
first.link.dispatch("blur");
first.link.dispatch("focus");
page.frame();
assert.ok(first.open());
second.link.dispatch("focus");
page.frame();
assert.ok(second.open() && !first.open());

page = createPage();
[first, second] = page.entries;
first.link.dispatch("pointerenter", mouse);
first.link.dispatch("pointerleave");
second.link.dispatch("pointerenter", mouse);
page.advance(200);
assert.ok(!first.open() && second.open());
page.window.dispatch("resize");
assert.ok(!second.open());

for (const width of [390, 768, 900, 1023, 1024, 1280]) {
  const boundaryPage = createPage();
  boundaryPage.context.innerWidth = width;
  const target = boundaryPage.entries[0];
  target.link.dispatch("pointerenter", mouse);
  assert.equal(target.open(), width >= 1024);
  target.link.dispatch("pointerleave");
  boundaryPage.advance(150);
  target.link.dispatch("focus");
  boundaryPage.frame();
  assert.equal(target.open(), width >= 1024);
}

for (const touchOnly of [false, true]) {
  page = createPage();
  [first] = page.entries;
  if (touchOnly) page.fine.matches = false;
  else page.context.innerWidth = 390;
  first.link.dispatch("focus");
  page.frame();
  first.link.dispatch("pointerenter", { pointerType: "touch" });
  page.advance(200);
  assert.ok(!first.open());
}

page = createPage();
[first] = page.entries;
page.reduced.matches = true;
first.link.dispatch("pointerenter", mouse);
page.advance(200);
assert.ok(first.open()); // CSS controls reduced-motion transitions; content stays available.
page.fine.matches = false;
page.fine.dispatch("change");
assert.ok(!first.open());
first.link.dispatch("blur");
first.link.dispatch("pointerleave");
page.fine.matches = true;
first.link.dispatch("focus");
page.document.dispatch("keydown", { key: "Escape" });
page.frame();
assert.ok(!first.open());

console.log("Service tooltip checks passed: rendering, timing, keyboard focus scrolling, dismissal, touch and reduced motion.");
