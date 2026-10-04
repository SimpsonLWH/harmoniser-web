/* Harmoniser deck: navigation, motion, live mini-apps. Vanilla JS, no libraries. */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  var PRINT = html.classList.contains('print');
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduced() { return mq.matches; }
  var canAnim = typeof Element !== 'undefined' && 'animate' in Element.prototype;
  var EO = 'cubic-bezier(0.22,1,0.36,1)', EP = 'cubic-bezier(0.34,1.56,0.64,1)';
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { if (window.console) console.warn('[deck]', e); } }
  function f2(v) { return v.toFixed(2); }
  function rise(y) { return [{ opacity: 0, transform: 'translateY(' + y + 'px)' }, { opacity: 1, transform: 'none' }]; }
  function fade() { return [{ opacity: 0 }, { opacity: 1 }]; }
  function pop(s) { return [{ opacity: 0, transform: 'scale(' + (s || 0.6) + ')' }, { opacity: 1, transform: 'none' }]; }

  var slides = $$('.slide'), N = slides.length;

  /* ---------- number tween (shared) ---------- */
  function tween(el, from, to, dur, fmt, tok) {
    tok = tok || {}; el._cnt = tok;
    var t0 = performance.now();
    function step(now) {
      if (el._cnt !== tok) return;
      var p = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(p >= 1 ? to : from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step); else el._cnt = null;
    }
    requestAnimationFrame(step);
    return tok;
  }

  /* ---------- timeline context: one per slide entrance ---------- */
  function Ctx(k) { this.k = k; this.anims = []; this.timers = []; this.finals = []; this.dead = false; }
  Ctx.prototype.a = function (el, frames, delay, dur, easing, opts) {
    if (!el || this.dead || !canAnim) return null;
    opts = opts || {};
    var an = el.animate(frames, {
      delay: opts.abs ? (delay || 0) : (delay || 0) * this.k,
      duration: dur || 320, easing: easing || EO, fill: opts.fill || 'backwards'
    });
    this.anims.push(an);
    return an;
  };
  Ctx.prototype.later = function (fn, delay) {
    var self = this;
    this.timers.push(setTimeout(function () { if (!self.dead) safe(fn); }, (delay || 0) * this.k));
  };
  Ctx.prototype.count = function (el, from, to, delay, dur, fmt) {
    if (!el) return;
    var tok = {}; el._cnt = tok; el.textContent = fmt(from);
    this.finals.push(function () { if (el._cnt === tok) { el._cnt = null; el.textContent = fmt(to); } });
    this.later(function () { if (el._cnt === tok) tween(el, from, to, dur, fmt, tok); }, delay);
  };
  Ctx.prototype.type = function (el, text, delay, ms, host) {
    var self = this, i = 0;
    el.textContent = ''; host.classList.add('typing');
    this.finals.push(function () { el.textContent = text; host.classList.remove('typing'); });
    function tick() {
      i++; el.textContent = text.slice(0, i);
      if (i < text.length) self.later(tick, ms);
      else self.later(function () { host.classList.remove('typing'); }, 260);
    }
    this.later(tick, delay);
  };
  Ctx.prototype.stop = function () {
    this.dead = true;
    this.anims.forEach(function (a) { safe(function () { a.cancel(); }); });
    this.timers.forEach(clearTimeout);
    this.finals.forEach(function (f) { safe(f); });
    this.anims = []; this.timers = []; this.finals = [];
  };

  /* ---------- flip a number (old up and out, new up and in) ---------- */
  function flip(el, text, anim) {
    el._next = text;
    if (el._flipping) return;
    if (el.textContent === text) return;
    if (!anim || reduced() || !canAnim) { el.textContent = text; return; }
    el._flipping = true;
    var out = el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-55%)', opacity: 0 }], { duration: 100, easing: 'cubic-bezier(0.4,0,1,1)', fill: 'forwards' });
    out.onfinish = function () {
      el.textContent = el._next;
      out.cancel();
      var inn = el.animate([{ transform: 'translateY(55%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 100, easing: EO, fill: 'backwards' });
      inn.onfinish = function () { el._flipping = false; if (el.textContent !== el._next) flip(el, el._next, true); };
    };
  }

  /* ---------- mini-app: Split dinner (slide 1) ---------- */
  var Split = {
    bill: 120, people: 4, tip: 10,
    init: function () {
      var r = $('#split'), self = this; if (!r) return;
      this.each = $('#splitEach', r); this.total = $('#splitTotal', r); this.pp = $('#splitPeople', r);
      this.minus = $('[data-act=minus]', r); this.plus = $('[data-act=plus]', r); this.tips = $$('.tip', r);
      this.minus.addEventListener('click', function () { self.set(self.people - 1, self.tip); });
      this.plus.addEventListener('click', function () { self.set(self.people + 1, self.tip); });
      this.tips.forEach(function (b) { b.addEventListener('click', function () { self.set(self.people, +b.getAttribute('data-tip')); }); });
    },
    calc: function () { var tot = this.bill * (1 + this.tip / 100); return { each: tot / this.people, tot: tot, tipAmt: this.bill * this.tip / 100 }; },
    set: function (p, t) { this.people = Math.max(1, Math.min(20, p)); this.tip = t; this.render(true); },
    reset: function () { this.people = 4; this.tip = 10; this.render(false); },
    render: function (anim) {
      var c = this.calc(), self = this;
      this.pp.textContent = this.people;
      this.total.textContent = 'Total ' + f2(c.tot) + ', tip ' + f2(c.tipAmt);
      this.tips.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-tip') === self.tip)); });
      this.minus.disabled = this.people <= 1; this.plus.disabled = this.people >= 20;
      if (anim && !reduced()) {
        if (canAnim && this.pp.animate) this.pp.animate(pop(0.7), { duration: 240, easing: EP });
        tween(this.each, parseFloat(this.each.textContent) || 0, c.each, 450, f2);
      } else { this.each._cnt = null; this.each.textContent = f2(c.each); }
    }
  };

  /* ---------- mini-app: Tennis (slide 3), ported from app-canvas/Tennis.dc.html ---------- */
  var Tennis = {
    init: function () {
      var r = $('#tennis'), self = this; if (!r) return;
      this.status = $('#tStatus', r);
      this.cards = [$('#pMe', r), $('#pSam', r)];
      this.pts = this.cards.map(function (c) { return $('.p-pts', c); });
      this.games = this.cards.map(function (c) { return $('.p-games', c); });
      this.serve = this.cards.map(function (c) { return $('.serve', c); });
      this.btns = this.cards.map(function (c) { return $('.btn-point', c); });
      this.btns.forEach(function (b, i) { b.addEventListener('click', function () { self.point(i); }); });
    },
    reset: function () { this.s = { sets: [[6, 4]], g: [3, 2], p: [4, 3] }; this.render(false); },
    won: function (sets) { var a = 0, b = 0; sets.forEach(function (s) { if (s[0] > s[1]) a++; else b++; }); return [a, b]; },
    point: function (i) {
      var s = this.s, w = this.won(s.sets);
      if (w[0] === 2 || w[1] === 2) return;
      var o = 1 - i, p = s.p.slice(), g = s.g.slice(), sets = s.sets.slice();
      p[i] += 1;
      if (p[i] >= 4 && p[i] - p[o] >= 2) {
        g[i] += 1; p = [0, 0];
        if ((g[i] >= 6 && g[i] - g[o] >= 2) || g[i] === 7) { sets = sets.concat([g]); g = [0, 0]; }
      }
      this.s = { sets: sets, g: g, p: p };
      this.render(true);
    },
    view: function () {
      var s = this.s, p = s.p, g = s.g, map = ['0', '15', '30', '40'];
      var pts = [map[Math.min(p[0], 3)], map[Math.min(p[1], 3)]], status = '', tone = 'plain';
      var deuce = p[0] >= 3 && p[1] >= 3;
      if (deuce) {
        if (p[0] === p[1]) { pts = ['40', '40']; status = 'Deuce'; tone = 'hot'; }
        else { var lead = p[0] > p[1] ? 0 : 1; pts = lead === 0 ? ['AD', '40'] : ['40', 'AD']; status = lead === 0 ? 'Advantage you' : 'Advantage Sam'; tone = 'hot'; }
      }
      var w = this.won(s.sets), over = w[0] === 2 || w[1] === 2;
      var played = s.sets.reduce(function (n, x) { return n + x[0] + x[1]; }, 0) + g[0] + g[1];
      var server = played % 2;
      if (over) { status = w[0] === 2 ? 'You win the match' : 'Sam wins the match'; tone = 'win'; }
      else if (!status) status = (server === 0 ? 'You serve' : 'Sam serves') + ', set ' + (s.sets.length + 1) + ', game ' + (g[0] + g[1] + 1);
      return { pts: pts, status: status, tone: tone, over: over, server: server, deuce: deuce };
    },
    render: function (anim) {
      var v = this.view(), s = this.s, self = this;
      if (this.status.textContent !== v.status) {
        this.status.textContent = v.status;
        if (anim && canAnim && !reduced()) this.status.animate(pop(0.85), { duration: 240, easing: EP });
      }
      this.status.className = 'status tone-' + v.tone;
      [0, 1].forEach(function (i) {
        var leading = v.pts[i] === 'AD' || (!v.deuce && s.p[i] > s.p[1 - i]);
        self.cards[i].classList.toggle('lead', leading);
        self.pts[i].classList.toggle('ad', v.pts[i] === 'AD');
        flip(self.pts[i], v.pts[i], anim);
        self.games[i].textContent = 'Games ' + s.g[i];
        self.serve[i].hidden = v.over || v.server !== i;
        self.btns[i].disabled = v.over;
      });
    }
  };

  /* ---------- mini-app: km to miles (slide 4) ---------- */
  var Conv = {
    init: function () {
      this.inp = $('#km'); this.out = $('#rMiles'); var self = this; if (!this.inp) return;
      this.inp.addEventListener('input', function () { self.render(); });
    },
    miles: function () { var km = parseFloat(String(this.inp.value).replace(',', '.')); return isFinite(km) ? km * 0.621371 : 0; },
    reset: function () { this.inp.value = '10'; this.render(); },
    render: function () { this.out._cnt = null; this.out.textContent = f2(this.miles()) + ' mi'; }
  };

  var APPS = [Split, Tennis, Conv];
  var appsFor = { 0: [Split], 2: [Tennis], 3: [Conv] };

  /* ---------- AI flow wires ---------- */
  var AI_EDGES = [['ash','instinct',0],['lewis','instinct',0],['keanu','instinct',0],['ash','claude',0],['claude','cc',1],['instinct','cc',1],['instinct','codex',1],['cc','gate',2],['codex','gate',2],['gate','ship',3]];
  function aiWires(s) {
    var flow = $('#aiFlow', s), svg = $('.ai-wires', flow), NS = 'http://www.w3.org/2000/svg';
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var fr = flow.getBoundingClientRect(), k = fr.width / flow.offsetWidth || 1;
    function box(n) { var el = $('[data-n="' + n + '"]', flow), b = el.getBoundingClientRect(); return { l: (b.left - fr.left) / k, r: (b.right - fr.left) / k, t: (b.top - fr.top) / k, b: (b.bottom - fr.top) / k, cy: (b.top + b.height / 2 - fr.top) / k, cx: (b.left + b.width / 2 - fr.left) / k }; }
    function path(d, cls) { var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); svg.appendChild(p); return p; }
    var wires = AI_EDGES.map(function (e) {
      var a = box(e[0]), b = box(e[1]), x1 = a.r + 12, x2 = b.l - 12, dx = (x2 - x1) * 0.55;
      var d = 'M' + x1 + ' ' + a.cy + ' C' + (x1 + dx) + ' ' + a.cy + ' ' + (x2 - dx) + ' ' + b.cy + ' ' + x2 + ' ' + b.cy;
      var el = path(d, 'w'); el.setAttribute('pathLength', '1'); el.style.strokeDasharray = '1';
      return { el: el, d: d, stage: e[2] };
    });
    var g = box('gate'), p = box('keanu'), lb = flow.offsetHeight - 16;
    var ld = 'M' + g.cx + ' ' + (g.b + 12) + ' C' + g.cx + ' ' + lb + ' ' + g.cx + ' ' + lb + ' ' + (g.cx - 120) + ' ' + lb + ' L' + (p.cx + 120) + ' ' + lb + ' C' + p.l + ' ' + lb + ' ' + (p.l + 40) + ' ' + lb + ' ' + (p.l + 40) + ' ' + (p.b + 12);
    var loop = path(ld, 'loop');
    return { svg: svg, wires: wires, loop: loop, loopD: ld, NS: NS };
  }
  function aiDots(W) {
    if (!canAnim || !W.svg.isConnected) return;
    function dot(d, cls, dur, delay) {
      var c = document.createElementNS(W.NS, 'circle'); c.setAttribute('r', '7'); c.setAttribute('class', cls);
      c.style.offsetPath = "path('" + d + "')"; c.style.offsetRotate = '0deg'; W.svg.appendChild(c);
      c.animate([{ offsetDistance: '0%', opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.9 }, { offsetDistance: '100%', opacity: 0 }], { duration: dur, delay: delay, iterations: Infinity, easing: 'ease-in-out' });
    }
    W.wires.forEach(function (w, i) { dot(w.d, 'dot', 1600, w.stage * 500 + (i % 3) * 180); });
    dot(W.loopD, 'dot o', 3200, 600);
  }

  /* ---------- entrance timelines (ms from slide becoming active) ---------- */
  var enter = [
    function cover(c, s) {
      c.a($('.glow', s), fade(), 0, 700);
      c.a($('.lg-bubble', s), [{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 1, transform: 'none' }], 100, 600, EP);
      c.a($('.lg-t1', s), [{ transform: 'scale(0)' }, { transform: 'none' }], 260, 320, EP);
      c.a($('.lg-t2', s), [{ transform: 'scale(0)' }, { transform: 'none' }], 320, 320, EP);
      c.a($('.lg-pill', s), [{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'none' }], 380, 420);
      c.a($('.display', s), rise(24), 300, 600);
      $$('.tagline .w', s).forEach(function (w, i) {
        var f = rise(18);
        if (w.classList.contains('b')) { f[0].color = '#1B2236'; f[1].color = '#2F5BFF'; }
        c.a(w, f, 500 + i * 70, 420);
      });
      c.a($('.cap-wrap', s), rise(60), 600, 600);
      c.a($('.cap-shadow', s), fade(), 650, 900);
      c.a($('.sub', s), fade(), 700, 600);
      c.count($('#splitEach'), 0, Split.calc().each, 900, 850, f2);
      $$('.tip', s).forEach(function (b, i) {
        var f = pop(0.6);
        if (b.getAttribute('aria-pressed') === 'true') {
          f[0].backgroundColor = '#FFFFFF'; f[0].color = '#1B2236'; f[0].borderColor = '#DCE2EE';
          f[1].backgroundColor = '#2F5BFF'; f[1].color = '#FFFFFF'; f[1].borderColor = '#2F5BFF';
        }
        c.a(b, f, 1100 + i * 80, 360, EP);
      });
    },
    function problem(c, s) {
      c.a($('.title', s), rise(24), 0, 600);
      c.a($('.big', s), fade(), 150, 300);
      c.count($('#n30'), 0, 30, 200, 750, function (v) { return String(Math.round(v)); });
      c.a($('.plus', s), pop(0), 950, 360, EP);
      c.a($('.p-line', s), rise(16), 400, 600);
      c.a($('.p-body', s), rise(16), 480, 600);
      var tilt = [-5, 4, -3];
      $$('.note', s).forEach(function (n, i) {
        c.a(n, [{ opacity: 0, transform: 'translateY(-40px) rotate(' + tilt[i] + 'deg)' }, { opacity: 1, transform: 'none' }], 700 + i * 300, 520, EP);
      });
      var x = function (v) { return { transform: 'translateX(' + v + 'px)' }; };
      c.a($$('.note', s)[2], [x(0), x(-4), x(4), x(-4), x(4), x(0)], 1300 + 480, 160, 'linear', { fill: 'none' });
      c.a($('.p-last', s), rise(16), 2050, 600);
    },
    function solution(c, s) {
      var txt = 'tennis score, me vs Sam', ms = 28;
      c.a($('.title', s), rise(24), 0, 600);
      $$('.step-row', s).forEach(function (r, i) {
        c.a(r, rise(28), 150 + i * 225, 520);
        c.a($('.badge', r), pop(0.5), 230 + i * 225, 360, EP);
      });
      c.a($('#prompt'), [{ opacity: 0, transform: 'translateX(56px)' }, { opacity: 1, transform: 'none' }], 500, 520);
      c.type($('#promptText'), txt, 800, ms, $('#prompt'));
      var end = 800 + txt.length * ms;
      c.a($('.send', s), [{ transform: 'none' }, { transform: 'scale(1.18)' }, { transform: 'none' }], end + 100, 360, EO, { fill: 'none' });
      c.a($('#tennis'), [{ opacity: 0, transform: 'translateY(-72px) scale(0.6)' }, { opacity: 1, transform: 'none' }], end + 320, 620, EP);
      c.a($('#tStatus'), pop(0.5), end + 820, 360, EP);
      $$('.player', s).forEach(function (p, i) { c.a(p, rise(24), end + 900 + i * 80, 420); });
      $$('.p-pts', s).forEach(function (p, i) { c.a(p, [{ opacity: 0, transform: 'translateY(60%)' }, { opacity: 1, transform: 'none' }], end + 1120 + i * 80, 260); });
    },
    function range(c, s, info) {
      c.a($('.title', s), rise(24), 0, 600);
      $$('.rcard', s).forEach(function (cd, i) { if (!(i === 0 && info.shared)) c.a(cd, rise(32), 100 + i * 80, 420); });
      var R = 620;
      $$('.t-flip', s).forEach(function (m, i) { c.a(m, [{ opacity: 0, transform: 'translateY(50%)' }, { opacity: 1, transform: 'none' }], R + i * 90, 260); });
      c.count($('#rSplit'), 0, 30, R + 80, 850, f2);
      c.a($('.ring-arc', s), [{ strokeDashoffset: '289.03px' }, { strokeDashoffset: '72.26px' }], R + 160, 900, EO);
      c.a($('#rPomo'), pop(0.7), R + 760, 360, EP);
      c.count($('#rMiles'), 0, Conv.miles(), R + 240, 850, function (v) { return f2(v) + ' mi'; });
      $$('.dot i', s).forEach(function (d, i) { c.a(d, [{ transform: 'scale(0)' }, { transform: 'none' }], R + 320 + i * 110, 320, EP); });
      c.a($('.bar i', s), [{ transform: 'scaleX(0)' }, { transform: 'none' }], R + 400, 850, EO);
      c.count($('#rPack'), 0, 5, R + 400, 850, function (v) { return Math.round(v) + ' of 12'; });
    },
    function live(c, s) {
      if ($('.glow', s)) c.a($('.glow', s), fade(), 0, 600);
      c.a($('.title', s), rise(24), 0, 600);
      $$('.hcard', s).forEach(function (cd, i) {
        var d = 150 + i * 80;
        c.a(cd, rise(32), d, 420);
        c.a($('.tile', cd), pop(0.6), d + 300, 360, EP);
      });
    },
    function share(c, s) {
      if ($('.glow', s)) c.a($('.glow', s), fade(), 0, 600);
      c.a($('.title', s), rise(24), 0, 600);
      $$('.hcard', s).forEach(function (cd, i) {
        var d = 150 + i * 80;
        c.a(cd, rise(32), d, 420);
        c.a($('.tile', cd), pop(0.6), d + 300, 360, EP);
      });
    },
    function market(c, s) {
      c.a($('.title', s), rise(24), 0, 600);
      $$('.m-lines li', s).forEach(function (l, i) { c.a(l, rise(16), 150 + i * 80, 480); });
      $$('.mtile', s).forEach(function (t, i) {
        var d = 420 + i * 80;
        c.a(t, rise(32), d, 420);
        c.a($('.m-install', t), pop(0.6), d + 300, 360, EP);
      });
      c.a($('.footer', s), fade(), 1100, 600);
    },
    function trust(c, s) {
      c.a($('.title', s), rise(24), 0, 600);
      var pcs = $$('.pc', s), arrs = $$('.arr', s), dot = $('.pdot', s);
      pcs.forEach(function (p, i) { c.a(p, [{ opacity: 0, transform: 'translateY(16px) scale(0.94)' }, { opacity: 1, transform: 'none' }], 200 + i * 100, 360, EP); });
      arrs.forEach(function (a, i) { c.a(a, [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'none' }], 260 + i * 100, 260); });
      var xs = pcs.map(function (p) { return p.offsetLeft + p.offsetWidth / 2; });
      var tot = xs[xs.length - 1] - xs[0] || 1, TRAVEL = 1200, D = 1150 * c.k;
      c.a(dot, xs.map(function (x) { return { transform: 'translateX(' + x + 'px)', offset: (x - xs[0]) / tot }; }), D, TRAVEL, 'linear', { abs: true, fill: 'none' });
      c.a(dot, [{ opacity: 0 }, { opacity: 1, offset: 0.06 }, { opacity: 1, offset: 0.94 }, { opacity: 0 }], D, TRAVEL, 'linear', { abs: true, fill: 'none' });
      pcs.forEach(function (p, i) {
        var at = D + TRAVEL * (xs[i] - xs[0]) / tot - 120;
        c.a(p, [{ transform: 'none' }, { transform: 'translateY(-10px)' }, { transform: 'none' }], Math.max(0, at), 380, EO, { abs: true, fill: 'none' });
      });
      var vAt = D + TRAVEL * (xs[4] - xs[0]) / tot - 40;
      c.a($('.vcheck', s), [{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'none', offset: 0.22 }, { opacity: 1, transform: 'none', offset: 0.78 }, { opacity: 0, transform: 'scale(0.9)' }], vAt, 1100, EO, { abs: true, fill: 'none' });
      $$('.tcard', s).forEach(function (t, i) { c.a(t, rise(32), D + TRAVEL + 100 + i * 100 * c.k, 480, EO, { abs: true }); });
    },
    function harmonyos(c, s) {
      c.a($('.glow', s), fade(), 0, 600);
      c.a($('.title', s), rise(24), 0, 600);
      $$('.hcard', s).forEach(function (cd, i) {
        var d = 150 + i * 80;
        c.a(cd, rise(32), d, 420);
        c.a($('.tile', cd), pop(0.6), d + 300, 360, EP);
      });
    },
    function ai(c, s) {
      var r = function (v) { return String(Math.round(v)); };
      var W = aiWires(s);
      c.a($('.title', s), rise(24), 0, 600);
      c.a($('.ai-head .body', s), rise(16), 120, 600);
      $$('.ai-stage', s).forEach(function (st, i) {
        var d = 250 + i * 260;
        c.a($('.ai-lbl', st), fade(), d, 400);
        $$('.ai-node', st).forEach(function (n, k) { c.a(n, [{ opacity: 0, transform: 'scale(0.85)' }, { opacity: 1, transform: 'none' }], d + k * 90, 460, EP); });
        W.wires.forEach(function (w) { if (w.stage === i) c.a(w.el, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], d + 220, 520, EO); });
      });
      c.a(W.loop, fade(), 1700, 600);
      c.a($('.ai-loop', s), rise(12), 1800, 500);
      c.later(function () { aiDots(W); }, 1500);
      $$('.ai-stat', s).forEach(function (n, i) { c.a(n, rise(20), 1600 + i * 100, 420); });
      c.count($('#nPR'), 0, 23, 1700, 700, r);
      c.count($('#nCommits'), 0, 400, 1800, 800, r);
      c.count($('#nTests'), 0, 363, 1900, 800, r);
      c.a($('.footer', s), fade(), 2100, 600);
    },
    function tryit(c, s) {
      c.a($('.glow', s), fade(), 0, 600);
      c.a($('.title', s), rise(24), 0, 600);
      var t = 300;
      $$('.try-row', s).forEach(function (r) {
        var bar = $('.try-bar', r), txt = $('.try-text', r), str = txt.textContent;
        c.a(bar, [{ opacity: 0, transform: 'translateX(56px)' }, { opacity: 1, transform: 'none' }], t, 480);
        c.type(txt, str, t + 200, 24, bar);
        var end = t + 200 + str.length * 24;
        c.a($('.send', r), [{ transform: 'none' }, { transform: 'scale(1.18)' }, { transform: 'none' }], end + 80, 320, EO, { fill: 'none' });
        c.a($('.try-res', r), rise(16), end + 160, 480);
        t = end + 280;
      });
      c.a($('.footer', s), fade(), t, 600);
    },
    function built(c, s) {
      c.a($('.title', s), rise(24), 0, 600);
      var n = $$('.ncard', s);
      c.a(n[0], rise(32), 100, 480); c.a(n[1], rise(32), 180, 480);
      c.count($('#n361'), 0, 361, 250, 850, function (v) { return String(Math.round(v)); });
      c.count($('#n12'), 0, 12, 1100, 650, function (v) { return String(Math.round(v)); });
      $$('.lcard', s).forEach(function (l, i) { c.a(l, [{ opacity: 0, transform: 'translateX(96px)' }, { opacity: 1, transform: 'none' }], 300 + i * 80, 520); });
    },
    function close(c, s) {
      c.a($('.close-logo', s), pop(0.5), 380, 520, EP);
      $$('.close-h .ln', s).forEach(function (l, i) { c.a(l, rise(40), 520 + i * 110, 620); });
      c.a($('.close-f', s), fade(), 900, 600);
    }
  ];

  /* ---------- slide engine ---------- */
  var cur = -1, ctx = null, leaving = null, inAnim = null, vt = null;
  var bar = $('#bar'), curEl = $('#cur'), counter = $('.counter'), announce = $('#announce');

  function setActive(n) {
    slides.forEach(function (s, i) {
      var on = i === n;
      s.classList.toggle('active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
    });
  }
  function cleanupLeaving() {
    if (!leaving) return;
    var l = leaving; leaving = null;
    l.el.classList.remove('leaving');
    safe(function () { l.anim.cancel(); });
  }
  function start(n, k, info) {
    var c = ctx = new Ctx(k);
    (appsFor[n] || []).forEach(function (a) { safe(function () { a.reset(); }); });
    if (reduced() || !canAnim) return;
    try { enter[n](c, slides[n], info || {}); }
    catch (e) { if (window.console) console.warn('[deck] entrance', e); c.stop(); }
  }
  function updateChrome(n, o) {
    bar.style.transform = 'scaleX(' + ((n + 1) / N) + ')';
    curEl.textContent = n + 1;
    counter.classList.toggle('on-blue', n === N - 1);
    announce.textContent = 'Slide ' + (n + 1) + ' of ' + N + ': ' + slides[n].getAttribute('data-title');
    if (!o.fromHash) {
      var h = '#' + (n + 1);
      if (location.hash !== h) {
        try { if (o.replace) history.replaceState(null, '', h); else history.pushState(null, '', h); }
        catch (e) { location.hash = h; }
      }
    }
  }
  function go(n, o) {
    o = o || {};
    n = Math.max(0, Math.min(N - 1, n));
    if (n === cur) return;
    var prev = cur; cur = n;
    if (vt) { safe(function () { vt.skipTransition(); }); vt = null; }
    if (ctx) ctx.stop();
    if (inAnim) { safe(function () { inAnim.cancel(); }); inAnim = null; }
    cleanupLeaving();
    updateChrome(n, o);
    poke();
    if (prev < 0 || !canAnim) { setActive(n); start(n, 1); return; }
    var back = n < prev, k = back ? 0.5 : 1, outEl = slides[prev], inEl = slides[n];

    if (reduced()) {
      outEl.classList.add('leaving'); setActive(n);
      leaving = { el: outEl, anim: outEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }) };
      leaving.anim.onfinish = cleanupLeaving;
      inAnim = inEl.animate(fade(), { duration: 200, fill: 'backwards' });
      start(n, k);
      return;
    }

    if (prev === 2 && n === 3 && doc.startViewTransition) {
      var ok = safe(function () {
        var cap = $('#tennis'), card = $('#rangeTennis');
        cap.style.viewTransitionName = 'capsule';
        vt = doc.startViewTransition(function () {
          cap.style.viewTransitionName = '';
          card.style.viewTransitionName = 'capsule';
          setActive(n);
          start(n, k, { shared: true });
        });
        var done = function () { card.style.viewTransitionName = ''; cap.style.viewTransitionName = ''; vt = null; };
        vt.finished.then(done, done);
        if (vt.ready && vt.ready.catch) vt.ready.catch(function () {});
        return true;
      });
      if (ok) return;
    }

    outEl.classList.add('leaving');
    setActive(n);
    var wipe = n === N - 1 && !back;
    var oa = wipe
      ? outEl.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 600, fill: 'forwards' })
      : outEl.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.985)' }], { duration: 250, easing: 'cubic-bezier(0.4,0,1,1)', fill: 'forwards' });
    leaving = { el: outEl, anim: oa };
    oa.onfinish = cleanupLeaving;
    inAnim = wipe
      ? inEl.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 600, easing: EO, fill: 'backwards' })
      : inEl.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: EO, fill: 'backwards' });
    start(n, k);
  }
  function next() {
    if (cur >= N - 1) { location.href = '/'; return; }
    go(cur + 1);
  }
  function prev() { go(cur - 1); }
  function parseHash() {
    var m = /^#(\d+)$/.exec(location.hash);
    if (!m) return null;
    var n = parseInt(m[1], 10) - 1;
    return n >= 0 && n < N ? n : null;
  }

  /* ---------- counter fade ---------- */
  var pokeT = null;
  function poke() {
    if (!counter) return;
    counter.classList.add('on');
    clearTimeout(pokeT);
    pokeT = setTimeout(function () { counter.classList.remove('on'); }, 2000);
  }

  /* ---------- scale ---------- */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    if (window.visualViewport) { w = window.visualViewport.width; h = window.visualViewport.height; }
    html.style.setProperty('--s', String(Math.min(w / 1920, h / 1080)));
  }

  function toggleFs() {
    var d = doc, fs = d.fullscreenElement || d.webkitFullscreenElement;
    if (fs) { var x = d.exitFullscreen || d.webkitExitFullscreen; if (x) x.call(d); return; }
    var r = html.requestFullscreen || html.webkitRequestFullscreen;
    if (r) { var p = r.call(html); if (p && p.catch) p.catch(function () {}); }
  }

  function fontsReady() {
    if (!doc.fonts || !doc.fonts.load) return Promise.resolve();
    var p = Promise.all(['400 30px Manrope', '600 24px Manrope', '700 40px Manrope', '800 120px Manrope'].map(function (f) { return doc.fonts.load(f); })).catch(function () {});
    return Promise.race([p, new Promise(function (r) { setTimeout(r, 2500); })]);
  }

  /* ---------- boot ---------- */
  function boot() {
    APPS.forEach(function (a) { safe(function () { a.init(); }); });
    APPS.forEach(function (a) { safe(function () { a.reset(); }); });

    $$('[data-interactive]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); });
      ['touchstart', 'touchend'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    });
    $$('[data-interactive] button').forEach(function (b) {
      b.addEventListener('pointerup', function () { setTimeout(function () { b.blur(); }, 0); });
    });

    if (PRINT) {
      slides.forEach(function (s) { s.removeAttribute('aria-hidden'); s.removeAttribute('inert'); });
      doc.addEventListener('keydown', function (e) {
        if (e.key === 'p' || e.key === 'P') { e.preventDefault(); window.print(); }
        if (e.key === 'Escape') location.href = location.pathname + '#1';
      });
      return;
    }

    fit();
    window.addEventListener('resize', fit);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);

    doc.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target && e.target.closest ? e.target : doc.body;
      if (t.closest('input, textarea, select')) { poke(); return; }
      var inUI = !!t.closest('[data-interactive], a, button');
      var k = e.key, handled = true;
      switch (k) {
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'Spacebar':
          if (inUI) { handled = false; break; } next(); break;
        case 'ArrowLeft': case 'ArrowUp':
          if (inUI) { handled = false; break; } prev(); break;
        case 'PageDown': next(); break;
        case 'PageUp': prev(); break;
        case 'Home': go(0); break;
        case 'End': go(N - 1); break;
        case 'f': case 'F': toggleFs(); break;
        case 'p': case 'P': location.href = location.pathname + '?print=1'; break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
      poke();
    });

    var vp = $('#viewport');
    vp.addEventListener('click', function (e) {
      poke();
      if (e.target.closest('[data-interactive], a, button, input, label')) return;
      var sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length) return;
      next();
    });
    var tx = 0, ty = 0, tOk = false;
    vp.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tOk = false; return; }
      tOk = !e.target.closest('[data-interactive]');
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    vp.addEventListener('touchend', function (e) {
      if (!tOk) return; tOk = false;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) { if (dx < 0) next(); else prev(); }
      poke();
    }, { passive: true });
    doc.addEventListener('mousemove', poke, { passive: true });
    window.addEventListener('popstate', function () { var n = parseHash(); if (n != null) go(n, { fromHash: true }); });
    window.addEventListener('hashchange', function () { var n = parseHash(); if (n != null) go(n, { fromHash: true }); });

    fontsReady().then(function () {
      var n = parseHash();
      aiWires($('#s10'));
      go(n == null ? 0 : n, { replace: true });
      requestAnimationFrame(function () { html.classList.remove('wait'); });
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
