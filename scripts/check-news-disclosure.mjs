import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../js/news-scroll.js", import.meta.url), "utf8");

function page(count, { reduced = false, animate = true } = {}) {
  const events = {};
  const animations = [];
  const scrolls = [];
  const document = { activeElement: null };
  let mutate;
  let resize;
  let motionChange;
  const media = { matches: reduced, addEventListener: (_, callback) => { motionChange = callback; } };
  function element() {
    const attributes = new Map();
    const item = {
      hidden: false,
      attributes,
      getAttribute: (name) => attributes.get(name) ?? null,
      setAttribute: (name, value) => attributes.set(name, value),
      removeAttribute: (name) => attributes.delete(name),
      focus: () => { document.activeElement = item; },
      matches: (selector) => selector === "li.news-entry",
      contains: (target) => target === item || target === item.link,
      getBoundingClientRect: () => ({ top: item.top ?? 100, width: item.width ?? 500 }),
      scrollIntoView: (options) => scrolls.push(options),
    };
    if (animate) item.animate = (frames, options) => {
      const animation = { frames, options, target: item, cancelled: false,
        cancel() { this.cancelled = true; delete item.currentHeight; },
        finish() { this.onfinish?.(); },
      };
      animations.push(animation);
      return animation;
    };
    item.link = { parent: item };
    return item;
  }
  const list = element();
  list.children = Array.from({ length: count }, element);
  const toggle = element();
  toggle.hidden = true;
  toggle.addEventListener = (name, callback) => { events[name] = callback; };
  const section = { querySelector: (selector) => selector === "#news-list" ? list : toggle };
  document.querySelector = () => section;
  class MutationObserver {
    constructor(callback) { mutate = callback; }
    observe(target, options) {
      assert.equal(target, list);
      assert.equal(options.childList, true);
    }
  }
  class ResizeObserver {
    constructor(callback) { resize = callback; }
    observe() {}
  }
  vm.runInNewContext(source, {
    document, MutationObserver, ResizeObserver,
    window: { matchMedia: () => media, ResizeObserver,
      addEventListener: (name, callback) => { events[name] = callback; } },
    getComputedStyle: (target) => ({
      height: `${target.currentHeight ?? list.children.filter((item) => !item.hidden).length * 100}px`,
      getPropertyValue: () => "",
    }),
  });
  return { list, toggle, document, animations, scrolls,
    click: (detail = 1) => events.click({ detail }),
    mutate, resize, windowResize: () => events.resize(),
    motion: (value) => { media.matches = value; motionChange(); },
    add: () => { list.children.push(element()); mutate(); },
  };
}

for (const count of [0, 1, 3, 4, 8]) {
  const p = page(count);
  assert.equal(p.toggle.hidden, count <= 3);
  assert.equal(p.list.children.filter((item) => !item.hidden).length, Math.min(count, 3));
  assert.equal(p.toggle.getAttribute("aria-expanded"), "false");
  assert.equal(p.toggle.textContent, "SHOW OLDER NEWS");
  if (count > 3) {
    p.click(0);
    assert(p.list.children.every((item) => !item.hidden));
    assert.equal(p.toggle.getAttribute("aria-expanded"), "true");
    assert.equal(p.toggle.textContent, "SHOW LESS");
    p.document.activeElement = p.list.children[3].link;
    p.click(0);
    assert.equal(p.document.activeElement, p.toggle, "Collapse rescues focus before hiding its ancestor");
    assert(p.list.children.slice(3).every((item) => item.hidden));
    assert.equal(p.animations.length, 0, "Keyboard activation must be immediate");
  }
}

for (const settings of [{ reduced: true }, { animate: false }]) {
  const p = page(5, settings);
  p.click();
  p.click();
  assert.equal(p.animations.length, 0);
  assert(p.list.children[3].hidden);
}

const rapid = page(5);
rapid.click();
assert.equal(rapid.animations.length, 3, "Height plus only the two older entries fade");
assert.equal(rapid.animations[0].options.duration, 200);
assert(rapid.animations.slice(1).every((animation) => rapid.list.children.indexOf(animation.target) >= 3));
rapid.list.currentHeight = 370;
rapid.click();
assert(rapid.animations.slice(0, 3).every((animation) => animation.cancelled && animation.onfinish === null));
assert.equal(rapid.animations[3].frames[0].height, "370px", "Reversal starts at interpolated height");
assert(rapid.list.children[3].hidden, "Collapsing entries immediately leave navigation and accessibility tree");
delete rapid.list.currentHeight;
rapid.click();
assert(rapid.animations[3].cancelled);
rapid.animations[4].finish();
assert(rapid.animations.every((animation) => animation.cancelled), "Completion releases every WAAPI effect");
assert(rapid.list.children.every((item) => !item.hidden));

for (const interrupt of [
  (p) => p.motion(true),
  (p) => p.windowResize(),
  (p) => { p.list.width = 320; p.resize(); },
  (p) => p.add(),
]) {
  const p = page(4);
  p.click();
  interrupt(p);
  assert(p.animations.every((animation) => animation.cancelled));
  assert(p.list.children.every((item) => !item.hidden));
}

const dynamic = page(3);
dynamic.add();
assert(!dynamic.toggle.hidden && dynamic.list.children[3].hidden);
dynamic.click(0);
dynamic.toggle.focus();
dynamic.list.children.pop();
dynamic.mutate();
assert(dynamic.toggle.hidden);
assert.equal(dynamic.document.activeElement, dynamic.list, "Removing the disclosure must not strand button focus");
assert.equal(dynamic.list.getAttribute("tabindex"), null);
dynamic.add();
assert(dynamic.list.children[3].hidden, "Dropping to three resets disclosure state");

for (const detail of [0, 1]) {
  const p = page(5);
  p.click(detail);
  p.toggle.top = -120;
  p.click(detail);
  if (detail) p.animations.at(-1).finish();
  assert.equal(p.scrolls.length, 1);
  assert.equal(p.scrolls[0].block, "nearest");
  assert.equal(p.scrolls[0].behavior, "instant");
  p.windowResize();
  p.motion(true);
  p.add();
  assert.equal(p.scrolls.length, 1, "Unrelated layout changes must not pull readers back to News");
}

console.log("News disclosure checks passed.");
