/* Shared case-study quiz engine. Page sets:
   window.CS_ID, window.CS_LABEL, window.CS_QUESTIONS  */
var EXAM_ID = window.CS_ID;
var EXAM_LABEL = window.CS_LABEL;
var questions = window.CS_QUESTIONS || [];
var answered = {};
var selections = {};

document.getElementById('quizRoot').innerHTML =
  '<div class="last-attempt" id="lastAttempt" style="display:none;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:1rem;margin-bottom:1.5rem;text-align:center;font-size:.9rem;color:#94a3b8">Last attempt: <span id="lastScore" style="color:#ec4899;font-weight:700"></span> &middot; <span id="lastDate"></span></div>' +
  '<div class="progress-wrap"><div class="progress-bar" id="progressBar" style="width:0%"></div></div>' +
  '<div id="quizArea"></div>' +
  '<div class="score-card" id="scoreCard">' +
    '<h2>Case Study Complete</h2>' +
    '<div class="big-score" id="finalScore">0%</div>' +
    '<p id="finalText" style="color:#94a3b8;margin-bottom:.5rem"></p>' +
    '<p style="color:#f9a8d4;font-size:.85rem;margin-top:.5rem">This is the level he\'s moving toward. You just trained for it.</p>' +
    '<button class="btn-restart" onclick="restartQuiz()">Restart Case Study</button>' +
  '</div>';

function _seedHash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function _shuffleAllOptions(){if(window.__optsShuffled)return;window.__optsShuffled=true;questions.forEach(function(q){if(!q.options||q.options.length<2)return;var a=q.options.slice();var rnd=mulberry32(_seedHash((typeof EXAM_ID!=='undefined'&&EXAM_ID?EXAM_ID:'q')+'#'+q.id));for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}var L=['A','B','C','D','E','F','G','H'];for(var k=0;k<a.length;k++){a[k].letter=L[k];}q.options=a;});}
function buildQuiz() {
  _shuffleAllOptions();
  var area = document.getElementById('quizArea');
  area.innerHTML = '';
  questions.forEach(function (q, idx) {
    var card = document.createElement('div');
    card.className = 'q-card';
    card.id = 'qcard-' + q.id;
    var isSata = q.sata === true;
    var pBadge = q.priority ? '<span class="badge badge-priority">Priority</span>' : '<span class="badge badge-analyze">Analyze</span>';
    var sBadge = isSata ? '<span class="badge badge-sata">SATA</span>' : '';
    card.innerHTML =
      '<div class="q-top"><span class="q-num">Q' + (idx + 1) + '</span>' + pBadge + sBadge + '</div>' +
      '<div class="q-stem">' + q.stem + (isSata ? '<em>(Select all that apply)</em>' : '') + '</div>' +
      '<div class="opts" id="opts-' + q.id + '">' +
      q.options.map(function (o) {
        return '<div class="opt" id="opt-' + q.id + '-' + o.letter + '" onclick="toggleOpt(' + q.id + ',\'' + o.letter + '\',' + isSata + ')">' +
          '<span class="opt-letter">' + o.letter + '.</span>' +
          '<div><span class="opt-text">' + o.text + '</span><div class="opt-rationale" id="rat-' + q.id + '-' + o.letter + '">' + o.rationale + '</div></div></div>';
      }).join('') +
      '</div>' +
      '<button class="btn-submit" id="btn-' + q.id + '" onclick="submitQ(' + q.id + ')">Submit Answer</button>' +
      '<div class="tip" id="tip-' + q.id + '"><strong>Clinical reasoning:</strong> ' + q.tip + '</div>';
    area.appendChild(card);
  });
  loadState();
}

function toggleOpt(qId, letter, isSata) {
  if (answered[qId]) return;
  if (!selections[qId]) selections[qId] = [];
  if (isSata) {
    var idx = selections[qId].indexOf(letter);
    if (idx > -1) selections[qId].splice(idx, 1); else selections[qId].push(letter);
  } else { selections[qId] = [letter]; }
  var q = questions.find(function (x) { return x.id === qId; });
  q.options.forEach(function (o) {
    document.getElementById('opt-' + qId + '-' + o.letter).classList.toggle('selected', selections[qId].indexOf(o.letter) > -1);
  });
}

function submitQ(qId) {
  if (answered[qId]) return;
  if (!selections[qId] || selections[qId].length === 0) return;
  answered[qId] = true;
  var q = questions.find(function (x) { return x.id === qId; });
  var correct = q.options.filter(function (o) { return o.correct; }).map(function (o) { return o.letter; });
  var ok = correct.length === selections[qId].length && correct.every(function (l) { return selections[qId].indexOf(l) > -1; });
  q.options.forEach(function (o) {
    var el = document.getElementById('opt-' + qId + '-' + o.letter);
    el.style.cursor = 'default';
    if (o.correct) el.classList.add('correct-show');
    else if (selections[qId].indexOf(o.letter) > -1 && !o.correct) el.classList.add('wrong-show');
    document.getElementById('rat-' + qId + '-' + o.letter).style.display = 'block';
  });
  document.getElementById('tip-' + qId).style.display = 'block';
  document.getElementById('qcard-' + qId).classList.add(ok ? 'answered-correct' : 'answered-wrong');
  var btn = document.getElementById('btn-' + qId);
  btn.disabled = true; btn.textContent = ok ? 'Correct!' : 'Review the reasoning';
  updateProgress();
  saveState();
  if (Object.keys(answered).length === questions.length) showScore();
}

function updateProgress() {
  document.getElementById('progressBar').style.width = (Object.keys(answered).length / questions.length * 100) + '%';
}

function showScore() {
  var correct = 0;
  questions.forEach(function (q) {
    if (answered[q.id]) {
      var c = q.options.filter(function (o) { return o.correct; }).map(function (o) { return o.letter; });
      var s = selections[q.id] || [];
      if (c.length === s.length && c.every(function (l) { return s.indexOf(l) > -1; })) correct++;
    }
  });
  var pct = Math.round(correct / questions.length * 100);
  document.getElementById('finalScore').textContent = pct + '%';
  document.getElementById('finalText').textContent = correct + ' of ' + questions.length + ' correct';
  document.getElementById('scoreCard').style.display = 'block';
  document.getElementById('scoreCard').scrollIntoView({ behavior: 'smooth' });
  var rec = { score: pct, correct: correct, total: questions.length, date: new Date().toLocaleDateString() };
  localStorage.setItem(EXAM_ID + '-last', JSON.stringify(rec));
  localStorage.setItem(EXAM_ID + '-label', EXAM_LABEL);
  var hist = JSON.parse(localStorage.getItem('examHistory') || '[]');
  hist.push({ examId: EXAM_ID, examLabel: EXAM_LABEL, date: new Date().toISOString(), score: pct, correct: correct, total: questions.length });
  localStorage.setItem('examHistory', JSON.stringify(hist.slice(-20)));
}

function restartQuiz() {
  answered = {}; selections = {};
  localStorage.removeItem(EXAM_ID + '-state');
  document.getElementById('scoreCard').style.display = 'none';
  buildQuiz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveState() { localStorage.setItem(EXAM_ID + '-state', JSON.stringify({ answered: answered, selections: selections })); }

function loadState() {
  var saved = localStorage.getItem(EXAM_ID + '-state');
  if (saved) {
    var st = JSON.parse(saved);
    answered = st.answered || {}; selections = st.selections || {};
    Object.keys(answered).forEach(function (qId) {
      var q = questions.find(function (x) { return x.id == qId; });
      if (!q) return;
      var c = q.options.filter(function (o) { return o.correct; }).map(function (o) { return o.letter; });
      var s = selections[qId] || [];
      var ok = c.length === s.length && c.every(function (l) { return s.indexOf(l) > -1; });
      q.options.forEach(function (o) {
        var el = document.getElementById('opt-' + qId + '-' + o.letter);
        if (s.indexOf(o.letter) > -1) el.classList.add('selected');
        if (o.correct) el.classList.add('correct-show');
        else if (s.indexOf(o.letter) > -1 && !o.correct) el.classList.add('wrong-show');
        el.style.cursor = 'default';
        document.getElementById('rat-' + qId + '-' + o.letter).style.display = 'block';
      });
      document.getElementById('tip-' + qId).style.display = 'block';
      document.getElementById('qcard-' + qId).classList.add(ok ? 'answered-correct' : 'answered-wrong');
      var btn = document.getElementById('btn-' + qId);
      btn.disabled = true; btn.textContent = ok ? 'Correct!' : 'Review the reasoning';
    });
    updateProgress();
    if (Object.keys(answered).length === questions.length) showScore();
  }
  var last = localStorage.getItem(EXAM_ID + '-last');
  if (last) {
    var r = JSON.parse(last);
    document.getElementById('lastAttempt').style.display = 'block';
    document.getElementById('lastScore').textContent = r.score + '%';
    document.getElementById('lastDate').textContent = r.date;
  }
}

function toggleScenario() {
  var b = document.getElementById('scenarioBody');
  var c = document.getElementById('scenarioChev');
  var hidden = b.classList.toggle('collapsed');
  if (c) c.textContent = hidden ? '▼' : '▲';
}
function jumpToChart() {
  var b = document.getElementById('scenarioBody');
  if (b && b.classList.contains('collapsed')) toggleScenario();
  document.getElementById('scenario').scrollIntoView({ behavior: 'smooth' });
}

buildQuiz();
