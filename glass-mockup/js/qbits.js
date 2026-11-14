/* Q-BITS design system behaviour (bundle.js), copied as supplied: liquid glass, AI hub, theme toggle, sidebar collapse and the tutorial tour (QBits.tour). */
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
  /* ---- From Q-Bits ERM: User Manual tutorial mode — a tooltip tour that moves through the real page ---- */
  var tourNow = null;
  function tourVisible(el) { return !!el && el.offsetParent !== null && el.getBoundingClientRect().width > 0; }
  function tourClean(t) { return String(t || '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim(); }
  function tourEsc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tourFind(s) {
    var all = function (sel) { return [].slice.call(document.querySelectorAll(sel)).filter(function (e) { return tourVisible(e) && !e.closest('.qb-tour'); }); };
    if (s.tab) { var want = tourClean(s.tab), t = all('[role=tab]').filter(function (e) { return tourClean(e.textContent) === want; })[0]; if (t) return t; }
    if (s.button) { var b = all('button, a, .qb-btn').filter(function (e) { return e.textContent.trim().indexOf(s.button) === 0; })[0]; if (b) return b; }
    if (s.target) { var sels = s.target.split(','); for (var i = 0; i < sels.length; i++) { var m = all(sels[i].trim())[0]; if (m) return m; } }
    return null;
  }
  // Beside the target: below, above, right, left (tall targets: right, left, below, above).
  function tourPlace(r, tw, th) {
    var GAP = 14, M = 12, vw = innerWidth, vh = innerHeight;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var fits = { bottom: r.bottom + GAP + th <= vh - M, top: r.top - GAP - th >= M, right: r.right + GAP + tw <= vw - M, left: r.left - GAP - tw >= M };
    var order = r.height > vh * 0.45 ? ['right', 'left', 'bottom', 'top'] : ['bottom', 'top', 'right', 'left'];
    var side = order.filter(function (s) { return fits[s]; })[0];
    var cX = function (x) { return Math.max(M, Math.min(x, vw - tw - M)); }, cY = function (y) { return Math.max(M, Math.min(y, vh - th - M)); };
    if (side === 'bottom' || side === 'top') { var l = cX(cx - tw / 2); return { side: side, left: l, top: side === 'bottom' ? r.bottom + GAP : r.top - GAP - th, arrow: Math.max(18, Math.min(cx - l, tw - 18)) }; }
    if (side) { var tp = cY(Math.max(r.top, Math.min(cy - th / 2, r.bottom - th))); return { side: side, top: tp, left: side === 'right' ? r.right + GAP : r.left - GAP - tw, arrow: Math.max(18, Math.min(Math.max(r.top, Math.min(cy, r.top + 60)) - tp, th - 18)) }; }
    return { side: 'inside', left: cX(cx - tw / 2), top: cY(Math.min(r.bottom, vh) - th - M), arrow: null };
  }
  // Scroll the page (or the pane holding the target) so target and tooltip are both on screen.
  function tourScroll(el, tipH, ifNeeded) {
    var vh = innerHeight, r = el.getBoundingClientRect(), TOP = 80;
    var side = innerWidth - r.right > 360 || r.left > 360, need = side ? r.height : r.height + 14 + tipH;
    if (ifNeeded && r.top >= 12 && r.top + need <= vh - 12) return;
    var off = need < vh - TOP - 12 ? Math.max(TOP, (vh - need) / 2) : TOP, prev = el.style.scrollMarginTop;
    el.style.scrollMarginTop = Math.round(off) + 'px';
    el.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    el.style.scrollMarginTop = prev;
  }
  // QBits.tour(journey, opts) — journey {id, title, steps:[{title, text, shot?, target?, tab?, button?, path?, match?}]}
  // opts {step, navigate(path), location() → current path, onEnd(), scroll: 'always' (default) | 'if-needed'}. Returns {go, next, prev, end}.
  function tour(journey, opts) {
    opts = opts || {};
    if (tourNow) tourNow.end(true);
    var steps = journey.steps || [], i = Math.max(0, Math.min(opts.step || 0, steps.length - 1));
    var ring = document.createElement('div'), tip = document.createElement('div'), zoom = null;
    ring.className = 'qb-tour-ring'; ring.setAttribute('aria-hidden', 'true'); ring.hidden = true;
    tip.className = 'qb qb-tour is-waiting'; tip.setAttribute('role', 'dialog');
    document.body.appendChild(ring); document.body.appendChild(tip);
    var target = null, tries = 0, opened = false, shot = false, missing = false, last = '';
    function save() { try { if (journey.id) sessionStorage.setItem('qb-tour', JSON.stringify({ id: journey.id, step: i })); } catch (e) { /* ignore */ } }
    function render() {
      var s = steps[i], n = steps.length, end = i === n - 1;
      tip.setAttribute('aria-label', 'Tutorial: ' + journey.title + ', step ' + (i + 1) + ' of ' + n);
      var dots = steps.map(function (_, k) { return '<span class="' + (k === i ? 'is-on' : k < i ? 'is-done' : '') + '"></span>'; }).join('');
      var pic = s.shot ? ((shot || missing)
        ? '<button type="button" class="qb-tour__shot" data-a="zoom" aria-label="Enlarge screenshot"><img src="' + tourEsc(s.shot) + '" alt="Screenshot: ' + tourEsc(s.title) + '"></button>'
        : '<button type="button" class="qb-tour__link" data-a="shot">Show screenshot</button>') : '';
      tip.innerHTML = '<span class="qb-tour__arrow" aria-hidden="true"></span>' +
        '<div class="qb-tour__head"><span class="qb-tour__count">' + tourEsc(journey.title) + ' · ' + (i + 1) + '/' + n + '</span>' +
        '<button type="button" class="qb-tour__x" data-a="end" aria-label="Exit tutorial mode"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<h3 class="qb-tour__title">' + tourEsc(s.title) + '</h3><p class="qb-tour__text">' + tourEsc(s.text) + '</p>' +
        (missing ? '<p class="qb-tour__hint">This part isn’t on the screen right now — the screenshot shows where it is.</p>' : '') + pic +
        '<div class="qb-tour__foot"><div class="qb-tour__dots" aria-hidden="true">' + dots + '</div><div class="qb-tour__btns">' +
        (i > 0 ? '<button type="button" class="qb-tour__back" data-a="prev" aria-label="Previous step"><svg class="i" viewBox="0 0 24 24"><path d="M19 12H5M11 18l-6-6 6-6"/></svg></button>' : '') +
        '<button type="button" class="qb-btn qb-btn--primary qb-btn--sm" data-a="' + (end ? 'end' : 'next') + '">' + (end ? 'Finish' : 'Next') + '</button></div></div>';
      last = '';
    }
    function position() {
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      if (target && tourVisible(target)) {
        var r = target.getBoundingClientRect(), key = [r.top, r.left, r.width, r.height, tw, th].map(Math.round).join();
        if (key === last) return; last = key;
        var covered = !!document.querySelector('.qb-overlay, [aria-modal="true"]');
        ring.hidden = covered;
        ring.style.cssText = 'top:' + (r.top - 6) + 'px;left:' + (r.left - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px';
        var p = tourPlace(r, tw, th), a = tip.querySelector('.qb-tour__arrow');
        tip.className = 'qb qb-tour is-placed qb-tour--' + p.side;
        tip.style.left = p.left + 'px'; tip.style.top = p.top + 'px';
        if (a) { a.hidden = p.arrow == null; a.style.cssText = (p.side === 'top' || p.side === 'bottom') ? 'left:' + p.arrow + 'px' : 'top:' + p.arrow + 'px'; }
      } else {
        ring.hidden = true;
        if (missing) { tip.className = 'qb qb-tour is-floating'; tip.style.left = ''; tip.style.top = ''; }
      }
    }
    function tick() {
      var s = steps[i];
      if (!target || !tourVisible(target)) {
        var el = tourFind(s);
        if (el) {
          target = el;
          if (missing) { missing = false; render(); }
          if (s.tab && !opened && el.getAttribute('aria-selected') !== 'true') { opened = true; el.click(); }
          tourScroll(el, tip.offsetHeight || 220, opts.scroll === 'if-needed');
        } else if (++tries > 12 && !missing) { missing = true; render(); }
      }
      position();
    }
    function go(k) {
      i = Math.max(0, Math.min(k, steps.length - 1));
      var s = steps[i]; target = null; tries = 0; opened = false; shot = false; missing = false; last = '';
      tip.className = 'qb qb-tour is-waiting'; ring.hidden = true;
      if (s.path && opts.navigate) {
        var here = opts.location ? opts.location() : location.pathname, match = s.match || s.path;
        if (match === '/' ? here !== '/' : here.indexOf(match) !== 0) opts.navigate(s.path);
      }
      render(); save(); tick();
    }
    function closeZoom() { if (zoom) { zoom.remove(); zoom = null; } }
    function end(silent) {
      clearInterval(timer); closeZoom(); ring.remove(); tip.remove();
      removeEventListener('keydown', onKey); removeEventListener('resize', position); removeEventListener('scroll', position, true);
      try { sessionStorage.removeItem('qb-tour'); } catch (e) { /* ignore */ }
      tourNow = null; if (!silent && opts.onEnd) opts.onEnd();
    }
    function onKey(e) {
      if (e.key === 'Escape') { if (zoom) closeZoom(); else end(); }
      if (zoom || e.target !== document.body) return;
      if (e.key === 'ArrowRight' && i < steps.length - 1) go(i + 1);
      if (e.key === 'ArrowLeft' && i > 0) go(i - 1);
    }
    tip.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'next') go(i + 1); else if (a === 'prev') go(i - 1); else if (a === 'end') end();
      else if (a === 'shot') { shot = true; render(); position(); }
      else if (a === 'zoom') {
        zoom = document.createElement('div'); zoom.className = 'qb-tour-zoom'; zoom.setAttribute('role', 'dialog'); zoom.setAttribute('aria-label', 'Screenshot');
        zoom.innerHTML = '<img src="' + tourEsc(steps[i].shot) + '" alt="Screenshot: ' + tourEsc(steps[i].title) + '">';
        zoom.addEventListener('click', closeZoom); document.body.appendChild(zoom);
      }
    });
    addEventListener('keydown', onKey); addEventListener('resize', position); addEventListener('scroll', position, true);
    var timer = setInterval(tick, 200);
    go(i);
    tourNow = { go: go, next: function () { go(i + 1); }, prev: function () { go(i - 1); }, end: end };
    return tourNow;
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
  return { liquid: liquid, init: init, thinking: thinking, hub: hub, themeToggle: themeToggle, setTheme: setTheme, collapse: collapse, tour: tour };
})();
