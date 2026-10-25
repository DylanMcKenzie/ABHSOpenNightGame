const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('particles respect reduced motion and live preference changes without new canvases', () => {
  for (const initiallyReduced of [true, false]) {
    let config;
    let loads = 0;
    let draws = 0;
    let cancels = 0;
    let changed;
    const preference = {
      matches: initiallyReduced,
      addEventListener: (_, fn) => { changed = fn; }
    };
    const instance = {
      canvas: { el: { parentElement: { id: 'particles-js' } } },
      particles: { move: { enable: !initiallyReduced } },
      fn: { drawAnimFrame: 1, vendors: { draw: () => { draws++; } } }
    };
    vm.runInNewContext(readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'), {
      window: { matchMedia: () => preference, pJSDom: [{ pJS: instance }] },
      particlesJS: (_, options) => { config = options; loads++; },
      cancelAnimationFrame: () => { cancels++; }
    });
    assert.equal(config.particles.move.enable, !initiallyReduced);
    assert.equal(config.interactivity.events.onhover.enable, false);
    assert.equal(config.interactivity.events.onclick.enable, false);
    preference.matches = true; changed();
    assert.equal(instance.particles.move.enable, false);
    preference.matches = false; changed();
    assert.equal(instance.particles.move.enable, true);
    assert.equal(loads, 1);
    assert.equal(draws, 2);
    assert.equal(cancels, 1);
  }
});

test('an unavailable decorative particle library does not prevent the page running', () => {
  assert.doesNotThrow(() => vm.runInNewContext(
    readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'),
    { window: { matchMedia: () => ({ matches: false, addEventListener() {} }) } }
  ));
});
