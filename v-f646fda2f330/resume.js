/* Keep my place: resumes an unfinished quiz after the tab reloads.
   Phones and iPads throw away a sleeping tab and reload it on unlock, which put
   every quiz back at Q1. This works on every quiz engine (primer harness, banks,
   mocks, pre-lecture, case study, the older inline pages) without knowing their
   internals:
     1. Math.random is seeded per session, and reseeded before every tap, so a
        reload rebuilds the exact same question set and option order.
     2. Every quiz tap is logged (option, Submit, Undo, Next/Prev, filters, Drill missed).
     3. On reload the log is replayed. Storage writes are switched off during the
        replay, so scores, history and the weak list are never counted twice.
   A finished quiz (score card showing) still opens clean, like before.
   Must load as the FIRST script in <head>. Kill switch: localStorage keepPlace = '0'. */
(function () {
  'use strict';
  if (window.__rsLoaded) return;
  window.__rsLoaded = true;
  var LS = window.localStorage, KEY = 'rs:' + location.pathname, MAX_AGE = 7 * 864e5;
  var realRandom = Math.random, realNow = Date.now;
  try { if (LS.getItem('keepPlace') === '0') return; } catch (e) { return; }

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function read() { try { return JSON.parse(LS.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function write(o) { try { Storage.prototype.setItem.call(LS, KEY, JSON.stringify(o)); } catch (e) {} }
  function fresh() { return { v: 1, seed: (realRandom() * 4294967296) >>> 0, log: [], done: false, ts: realNow() }; }

  var sess = read();
  if (!sess || sess.v !== 1 || sess.done || !sess.log || realNow() - sess.ts > MAX_AGE) sess = fresh();
  var pending = sess.log.slice();   // what to replay on this load
  write(sess);

  var rng = mulberry(hash(sess.seed + ':load'));
  Math.random = function () { return rng(); };
  function reseed(n) { rng = mulberry(hash(sess.seed + ':' + n)); }

  /* ---------- which taps count ---------- */
  var ZONE = '.q-card,#quizArea,#focusBar,#scoreCard,.q-opts,.options,[data-f]';
  var SKIP = 'a[href],#fbMode,#fbModeTop,#rmPill,#rmPanel,.stats-wrap,.mk-fab,.mk-overlay,#rsToast';
  var VERB = /^\s*(applyFilter|pick|sataDone|submit\w*|select\w*|toggleOpt|drillMissed|restart\w*|retake\w*|startExam|next\w*|prev\w*|go\w*|showScore|finish\w*|undo\w*)\b/;
  var RESET = /clearAllAnswers|hardReset|clearHistory|resetAll/;
  function actionable(t) { return t && t.closest ? t.closest('[onclick],button,.opt,.q-opt,[data-f]') : null; }
  function classify(el) {
    if (!el || el.closest(SKIP)) return null;
    var oc = el.getAttribute('onclick') || '';
    if (RESET.test(oc) || el.getAttribute('data-f') === '__fresh') return 'reset';
    if (el.closest(ZONE) || VERB.test(oc)) return 'log';
    return null;
  }
  function locate(el) {
    if (el.id) return { i: el.id };
    var f = el.getAttribute('data-f');
    if (f !== null) return { f: f };
    var path = [], n = el;
    while (n && n !== document.body && !n.id) { path.unshift(Array.prototype.indexOf.call(n.parentNode.children, n)); n = n.parentNode; }
    return { a: n && n.id ? n.id : null, p: path };
  }
  function resolve(loc) {
    if (loc.i) return document.getElementById(loc.i);
    if (loc.f !== undefined) { var fs = document.querySelectorAll('[data-f]'); for (var k = 0; k < fs.length; k++) if (fs[k].getAttribute('data-f') === loc.f) return fs[k]; return null; }
    var n = loc.a ? document.getElementById(loc.a) : document.body;
    for (var j = 0; n && j < loc.p.length; j++) n = n.children[loc.p[j]];
    return n || null;
  }

  /* ---------- finished? (score card showing) ---------- */
  function finished() {
    var sc = document.getElementById('scoreCard') || document.getElementById('results');
    if (!sc) return false;
    // Any unanswered card left means it is not finished, whatever the score card says.
    // (Only for engines that mark answered cards with answered-* classes.)
    var cards = document.querySelectorAll('.q-card'), open = 0, marked = 0;
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].style.display === 'none') continue;
      if (/answered-/.test(cards[i].className)) marked++; else open++;
    }
    if (marked && open) return false;
    try { return window.getComputedStyle(sc).display !== 'none' && sc.style.display !== 'none'; } catch (e) { return false; }
  }
  var doneTimer = null;
  function checkDone() {
    clearTimeout(doneTimer);
    doneTimer = setTimeout(function () { var s = read() || sess; s.done = finished(); s.ts = realNow(); sess = s; write(s); }, 120);
  }

  /* ---------- record ---------- */
  window.__rsReplaying = false;
  window.addEventListener('click', function (e) {
    if (window.__rsReplaying) return;
    var el = actionable(e.target), kind = classify(el);
    if (!kind) return;
    if (kind === 'reset') { sess = fresh(); write(sess); return; }
    var s = read() || sess;
    if (s.done) { s.done = false; }
    reseed(s.log.length);
    s.log.push(locate(el)); s.ts = realNow(); sess = s; write(s);
    checkDone();
  }, true);

  /* ---------- replay ---------- */
  function replay() {
    if (!pending.length) return;
    var SP = Storage.prototype, oSet = SP.setItem, oRem = SP.removeItem, oClr = SP.clear;
    SP.setItem = function (k) { if (String(k).indexOf('rs:') === 0) return oSet.apply(this, arguments); };
    SP.removeItem = function () {}; SP.clear = function () {};
    var offset = 0, ok = 0;
    Date.now = function () { return realNow() + offset; };
    window.__rsReplaying = true;
    try {
      for (var i = 0; i < pending.length; i++) {
        var el = resolve(pending[i]);
        if (!el && pending[i].i && pending[i].i.indexOf('qt-') === 0) {
          // A 25-second time-out (quiz-timer.js) whose hidden button is not wired yet.
          var tc = document.getElementById(pending[i].i.slice(3));
          if (tc && window.__qtTimeOut) window.__qtTimeOut(tc);
          ok++; continue;
        }
        if (!el) break;
        reseed(i);
        offset += 1500;
        try { el.click(); } catch (e) {}
        ok++;
      }
    } finally {
      Date.now = realNow;
      setTimeout(function () {
        window.__rsReplaying = false;
        SP.setItem = oSet; SP.removeItem = oRem; SP.clear = oClr;
        if (ok < pending.length) { sess.log = pending.slice(0, ok); write(sess); }
        if (finished()) { sess = fresh(); write(sess); return; }
        place(); toast();
      }, 0);
    }
  }

  function place() {
    var cur = document.querySelector('.focus-on #quizArea .q-card.focus-cur');
    if (!cur) {
      var cards = document.querySelectorAll('.q-card');
      for (var i = 0; i < cards.length; i++) { if (!/answered-/.test(cards[i].className)) { cur = cards[i]; break; } }
    }
    if (cur && cur.getBoundingClientRect) {
      var top = cur.getBoundingClientRect().top + (window.pageYOffset || 0) - 70;
      try { window.scrollTo(0, Math.max(0, top)); } catch (e) {}
    }
  }

  function toast() {
    var answered = document.querySelectorAll('.q-card.answered-correct,.q-card.answered-wrong,.q-card.answered-partial').length;
    var d = document.createElement('div');
    d.id = 'rsToast';
    d.setAttribute('style', 'position:fixed;left:50%;transform:translateX(-50%);top:12px;z-index:9999;background:#13181f;color:#e2e8f0;border:1px solid #334155;border-radius:10px;padding:8px 12px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 6px 20px #0008;display:flex;gap:10px;align-items:center;max-width:calc(100% - 32px)');
    d.innerHTML = '<span>&#128278; Picked up where you left off' + (answered ? ' &middot; ' + answered + ' answered' : '') + '</span>'
      + '<button type="button" style="background:transparent;color:#a78bfa;border:1px solid #4c1d95;border-radius:8px;padding:4px 8px;font:inherit;cursor:pointer">Start over</button>';
    d.querySelector('button').onclick = function () { sess = fresh(); write(sess); location.reload(); };
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.style.transition = 'opacity .6s', d.style.opacity = '0'; }, 5000);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 5800);
  }

  function boot() { setTimeout(replay, 60); }
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();
