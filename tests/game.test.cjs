const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Exercise the actual browser script with a controllable clock and field size.
// This catches deadline/input races without changing the real 30-second round.
async function game() {
  let now = 0;
  let nextTimeout = 0;
  const timeouts = new Map();
  const documentEvents = {};
  let onResize;
  function element() {
    return {
      events: {}, style: {}, dataset: {}, hidden: false, disabled: false,
      textContent: '', offsetWidth: 96, offsetHeight: 148,
      addEventListener(name, fn) { this.events[name] = fn; },
      focus() { this.focused = true; },
      querySelector() { return { decode: () => Promise.resolve() }; },
      showModal() { this.open = true; },
      close() { this.open = false; }
    };
  }
  const ids = Object.fromEntries([
    'targetSpawnArea', 'target', 'scorePopup', 'timer', 'finalScore',
    'avrgRT', 'reactionUnit', 'resultsMessage', 'restartPopupButton'
  ].map(id => [id, element()]));
  Object.assign(ids.targetSpawnArea, { clientWidth: 1000, clientHeight: 700 });
  ids.timer.parentElement = element();
  ids.scorePopup.open = false;
  vm.runInNewContext(readFileSync(path.join(__dirname, '../js/script.js'), 'utf8'), {
    document: {
      getElementById: id => ids[id],
      addEventListener: (name, fn) => { documentEvents[name] = fn; }
    },
    performance: { now: () => now },
    setTimeout: fn => { const id = ++nextTimeout; timeouts.set(id, fn); return id; },
    clearTimeout: id => timeouts.delete(id),
    ResizeObserver: class {
      constructor(fn) { onResize = fn; }
      observe() {}
    }
  });
  documentEvents.DOMContentLoaded();
  await Promise.resolve();
  return {
    ids,
    at(time) { now = time; },
    pointer(overrides = {}) {
      ids.target.events.pointerdown({ isPrimary: true, button: 0, preventDefault() {}, ...overrides });
    },
    click(detail = 1) { ids.target.events.click({ detail }); },
    tick() { const pending = [...timeouts.values()]; timeouts.clear(); pending.forEach(fn => fn()); },
    resize(width, height) {
      Object.assign(ids.targetSpawnArea, { clientWidth: width, clientHeight: height });
      onResize();
    },
    restart() { ids.restartPopupButton.events.click(); },
    visible() { documentEvents.visibilitychange(); },
    pending() { return timeouts.size; }
  };
}

test('round starts at 30 and pointer compatibility clicks never count twice', async () => {
  const g = await game();
  assert.equal(Number(g.ids.timer.textContent), 30);
  g.at(100); g.pointer(); g.click();
  g.at(600); g.pointer({ pointerType: 'touch' }); g.click();
  g.at(1000); g.tick();
  assert.equal(Number(g.ids.timer.textContent), 29);
  g.at(30000); g.tick();
  assert.equal(g.ids.finalScore.textContent, 2);
  assert.equal(g.ids.avrgRT.textContent, 300);
  assert.equal(g.ids.scorePopup.open, true);
  assert.equal(g.ids.target.hidden, true);
  assert.equal(g.ids.target.disabled, true);
  assert.equal(g.pending(), 0);
  g.pointer(); g.click(0);
  assert.equal(g.ids.finalScore.textContent, 2);
});

test('deadline rejects late input even before a delayed countdown runs', async () => {
  const g = await game();
  g.at(30001); g.pointer();
  assert.equal(g.ids.finalScore.textContent, 0);
  assert.equal(g.ids.avrgRT.textContent, '—');
  assert.equal(g.ids.reactionUnit.hidden, true);
  assert.equal(g.ids.scorePopup.open, true);
});

test('restart resets statistics, clock, focus, and leaves only one countdown', async () => {
  const g = await game();
  g.at(100); g.pointer();
  g.at(30000); g.tick();
  g.at(50000); g.restart();
  assert.equal(g.ids.scorePopup.open, false);
  assert.equal(Number(g.ids.timer.textContent), 30);
  assert.equal(g.ids.target.hidden, false);
  assert.equal(g.ids.target.disabled, false);
  assert.equal(g.ids.target.focused, true);
  assert.equal(g.pending(), 1);
  g.at(51000); g.click(0);
  g.at(80000); g.tick();
  assert.equal(g.ids.finalScore.textContent, 1);
  assert.equal(g.ids.avrgRT.textContent, 1000);
});

test('resize clamps the whole target into the field without resetting reaction time', async () => {
  const g = await game();
  g.ids.target.style.left = '800px';
  g.ids.target.style.top = '500px';
  g.at(200); g.resize(230, 180);
  assert.equal(parseFloat(g.ids.target.style.left), 122);
  assert.equal(parseFloat(g.ids.target.style.top), 20);
  g.at(500); g.pointer();
  assert.ok(parseFloat(g.ids.target.style.left) + 96 <= 230 - 12);
  assert.ok(parseFloat(g.ids.target.style.top) + 148 <= 180 - 12);
  g.at(30000); g.tick();
  assert.equal(g.ids.avrgRT.textContent, 500);
});

test('secondary pointers and right clicks are ignored; keyboard activation works', async () => {
  const g = await game();
  g.at(200); g.pointer({ isPrimary: false }); g.pointer({ button: 2 });
  let prevented = false;
  g.ids.target.events.keydown({ repeat: true, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  g.at(400); g.click(0);
  g.at(30000); g.tick();
  assert.equal(g.ids.finalScore.textContent, 1);
  assert.equal(g.ids.avrgRT.textContent, 400);
});

test('returning to a backgrounded page catches up to the real deadline', async () => {
  const g = await game();
  g.at(40000); g.visible();
  assert.equal(g.ids.scorePopup.open, true);
  assert.equal(g.ids.timer.textContent, '0');
  assert.equal(g.pending(), 0);
});
