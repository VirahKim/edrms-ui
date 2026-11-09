/* Q-BITS — behaviour for the AI buttons, theme toggle and sidebar. Plain script, no dependencies. */
window.QBits = (function () {
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function chromium() {
    var d = navigator.userAgentData;
    if (d && d.brands) return d.brands.some(function (b) { return /Chromium|Google Chrome|Microsoft Edge/.test(b.brand); });
    return /Chrome\//.test(navigator.userAgent) && !/Edg\/|OPR\//.test(navigator.userAgent) ? true : false;
  }
  function ensureFilter() {
    if (document.getElementById('qb-liquid')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="0" height="0" style="position:absolute;width:0;height:0">' +
      '<filter id="qb-liquid" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="11" result="noise"/>' +
      '<feGaussianBlur in="noise" stdDeviation="1.5" result="soft"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="soft" scale="28" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter></svg>';
    var host = document.body || document.documentElement;
    host.insertBefore(wrap.firstChild, host.firstChild);
  }
  function liquid(el) {
    if (!el || el.dataset.qbLiquid) return el;
    el.dataset.qbLiquid = '1';
    ensureFilter();
    if (chromium()) requestAnimationFrame(function () { el.classList.add('is-refract'); });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    el.addEventListener('pointerleave', function () { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); });
    el.addEventListener('pointerdown', function (e) {
      if (reduced()) return;
      var r = el.getBoundingClientRect(), drop = document.createElement('span');
      drop.className = 'qb-ai__ripple';
      drop.style.left = (e.clientX - r.left) + 'px';
      drop.style.top = (e.clientY - r.top) + 'px';
      el.appendChild(drop);
      setTimeout(function () { drop.remove(); }, 700);
      el.classList.remove('is-press'); void el.offsetWidth; el.classList.add('is-press');
    });
    el.addEventListener('animationend', function (e) { if (e.animationName === 'qb-jelly') el.classList.remove('is-press'); });
    return el;
  }

  /* ---- From Q-Bits ERM: AI quick-action hub, theme toggle, sidebar collapse ---- */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function hub(el) {
    if (!el || el.dataset.qbHubReady) return el;
    el.dataset.qbHubReady = '1';
    var fab = el.querySelector('.qb-fab'), items = el.querySelector('.qb-hub__items');
    var list = items ? [].slice.call(items.querySelectorAll('.qb-hub__item')) : [];
    function set(open) {
      el.classList.toggle('is-open', open);
      if (fab) { fab.setAttribute('aria-expanded', open); fab.setAttribute('aria-label', open ? 'Close Q-BITS menu' : 'Open Q-BITS AI'); }
      if (items) items.setAttribute('aria-hidden', !open);
      list.forEach(function (b, i) { b.tabIndex = open ? 0 : -1; b.style.transitionDelay = open ? ((list.length - 1 - i) * 60) + 'ms' : '0ms'; });
    }
    if (fab) fab.addEventListener('click', function () { set(!el.classList.contains('is-open')); });
    list.forEach(function (b) { b.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.classList.contains('is-open')) { set(false); if (fab) fab.focus(); } });
    el.qbSet = set;
    return el;
  }
  function setTheme(theme) {
    var root = document.documentElement;
    root.classList.add('qb-theme-transition');
    root.setAttribute('data-theme', theme);
    setTimeout(function () { root.classList.remove('qb-theme-transition'); }, 500);
    store('qb-theme', theme);
    document.querySelectorAll('[data-qb-theme-toggle]').forEach(function (b) {
      if (b.hasAttribute('data-qb-demo')) return;
      b.classList.toggle('is-dark', theme === 'dark'); b.setAttribute('aria-checked', theme === 'dark');
    });
    window.dispatchEvent(new CustomEvent('qb:theme', { detail: theme }));
  }
  function themeToggle(b) {
    if (!b || b.dataset.qbTtReady) return b;
    b.dataset.qbTtReady = '1';
    var saved = store('qb-theme');
    if ((saved === 'dark' || saved === 'light') && document.documentElement.getAttribute('data-theme') !== saved) document.documentElement.setAttribute('data-theme', saved);
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (!b.hasAttribute('data-qb-demo')) { b.classList.toggle('is-dark', dark); b.setAttribute('aria-checked', dark); }
    b.addEventListener('click', function () { setTheme(b.classList.contains('is-dark') ? 'light' : 'dark'); });
    return b;
  }
  function collapse(btn) {
    if (!btn || btn.dataset.qbColReady) return btn;
    btn.dataset.qbColReady = '1';
    var side = btn.closest('.qb-sidebar');
    if (!side) return btn;
    if (store('qb-side-collapsed') === '1') side.classList.add('is-collapsed');
    function label() { var c = side.classList.contains('is-collapsed'); btn.setAttribute('aria-label', c ? 'Expand menu' : 'Collapse menu'); btn.setAttribute('aria-expanded', !c); }
    label();
    btn.addEventListener('click', function () { var c = side.classList.toggle('is-collapsed'); store('qb-side-collapsed', c ? '1' : '0'); label(); });
    return btn;
  }
  function thinking(el, on) { el.classList.toggle('is-thinking', !!on); el.setAttribute('aria-busy', on ? 'true' : 'false'); }
  function init(root) {
    var r = root || document;
    r.querySelectorAll('.qb-ai').forEach(liquid);
    r.querySelectorAll('[data-qb-hub]').forEach(hub);
    r.querySelectorAll('[data-qb-theme-toggle]').forEach(themeToggle);
    r.querySelectorAll('[data-qb-collapse]').forEach(collapse);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
  return { liquid: liquid, init: init, thinking: thinking, hub: hub, themeToggle: themeToggle, setTheme: setTheme, collapse: collapse };
})();
