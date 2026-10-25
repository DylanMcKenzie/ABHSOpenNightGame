// Keep the original particles.js backdrop decorative, quiet, and out of the way.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function loadParticles() {
  if (typeof particlesJS !== 'function') return;
  particlesJS('particles-js', {
    particles: {
      number: { value: 43, density: { enable: true, value_area: 800 } },
      color: { value: '#c1d3df' },
      shape: { type: 'circle' },
      opacity: { value: 0.4, random: false },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 100, color: '#c1d3df', opacity: 0.15, width: 1 },
      move: { enable: !reducedMotion.matches, speed: 1.2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: false }, onclick: { enable: false }, resize: true }
    },
    retina_detect: true
  });
}

loadParticles();
reducedMotion.addEventListener('change', function () {
  // Update the existing instance, avoiding duplicate canvases and animation loops.
  const instance = window.pJSDom && window.pJSDom.find(entry => entry.pJS.canvas.el.parentElement.id === 'particles-js');
  if (!instance) return;
  const particles = instance.pJS;
  particles.particles.move.enable = !reducedMotion.matches;
  if (reducedMotion.matches) cancelAnimationFrame(particles.fn.drawAnimFrame);
  particles.fn.vendors.draw();
});
