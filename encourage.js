/* Drop-in encouragement for self-contained quiz pages (Exam 3 tools etc.).
   Adds: a top activation card with a live exam-day countdown, and a score-screen
   reframe line. Defensive — degrades gracefully if a page's markup differs.
   Optional per-page override: window.ENCOURAGE_EXAM = { key:'Exam 3', date:'2026-06-04' } */
(function () {
  var EXAM = window.ENCOURAGE_EXAM || { key: 'Exam 3', date: '2026-06-04' };
  var LINES = [
    'Wrong answers in here are free. Spend them now, not on exam day.',
    'You are becoming the nurse who knows this cold. Prove it one question at a time.',
    'You opened it. The hardest part is already done — now just answer one.',
    'This is the seed. Everything you are building grows from reps exactly like this.',
    'The lie-flat seat that folds into a bed. The freedom to pour into him. This rep buys a piece of it.',
    'Smart, not broke — built the right way. Keep going.',
    'You do not need a clear day to start. You need one question. Start there.',
    'Showing up tired still counts. Especially then.',
    'Future-you, in scrubs and unbothered, is rooting for this exact moment.'
  ];
  var R_HIGH = [
    'That is pattern recognition, not luck. This material is becoming yours.',
    'You are not guessing anymore — you are recognizing. That is exam-ready.'
  ];
  var R_MID = [
    'Solid rep. The ones you missed are your free preview — review them and you have banked the points.',
    'Good work. Those misses just became the easiest points you will grab all week.'
  ];
  var R_LOW = [
    'You showed up and found exactly what to study. That is not a fail — it is a map. Brave work.',
    'Low score, high courage. You just turned unknowns into a to-do list. That IS the win.'
  ];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function daysUntil(d) { return Math.ceil((new Date(d + 'T17:00:00') - new Date()) / 86400000); }

  function injectStyles() {
    var css =
      '.enc-activate{background:linear-gradient(135deg,#1c1407,#0c0f14);border:1px solid #92722e;border-radius:12px;padding:.9rem 1.1rem;margin-bottom:1.25rem}' +
      '.enc-count{font-family:"IBM Plex Mono",monospace;font-size:.7rem;color:#fbbf24;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.3rem}' +
      '.enc-line{font-size:.92rem;color:#fde68a;line-height:1.45;font-weight:500}' +
      '.enc-reframe{font-size:.92rem;color:#fde68a;line-height:1.5;margin:.75rem auto 0;max-width:32rem;text-align:center}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function addCard() {
    var anchor = document.querySelector('.progress-wrap') || document.getElementById('quizArea');
    if (!anchor || !anchor.parentNode) return;
    var n = daysUntil(EXAM.date);
    var countTxt = n > 0 ? (EXAM.key + ' in ' + n + ' day' + (n === 1 ? '' : 's'))
      : (n === 0 ? (EXAM.key + ' is today') : (EXAM.key + ' — keep it sharp'));
    var card = document.createElement('div');
    card.className = 'enc-activate';
    card.innerHTML = '<div class="enc-count">' + countTxt + '</div><div class="enc-line">' + pick(LINES) + '</div>';
    anchor.parentNode.insertBefore(card, anchor);
  }

  function applyReframe() {
    var sc = document.getElementById('scoreCard');
    if (!sc) return;
    if (window.getComputedStyle(sc).display === 'none') return;
    if (document.getElementById('encReframe')) return;
    var scoreEl = document.getElementById('finalScore') || document.getElementById('finalPct');
    var pct = scoreEl ? parseInt(scoreEl.textContent, 10) : NaN;
    if (isNaN(pct)) return;
    var rf = pct >= 85 ? pick(R_HIGH) : pct >= 70 ? pick(R_MID) : pick(R_LOW);
    var p = document.createElement('p');
    p.id = 'encReframe';
    p.className = 'enc-reframe';
    p.textContent = rf;
    var after = document.getElementById('finalText') || scoreEl;
    if (after && after.parentNode) after.parentNode.insertBefore(p, after.nextSibling);
    else sc.appendChild(p);
  }

  function watchScore() {
    var sc = document.getElementById('scoreCard');
    if (!sc) return;
    applyReframe(); // in case the score is already showing on load
    var obs = new MutationObserver(applyReframe);
    obs.observe(sc, { attributes: true });
  }

  function init() { injectStyles(); addCard(); watchScore(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
