/* Shared pre-lecture primer engine. Each page sets:
   window.QUIZ_ID, window.QUIZ_LABEL, window.QUIZ_CH, window.QUIZ_QUESTIONS */
var EXAM_ID = window.QUIZ_ID;
var EXAM_LABEL = window.QUIZ_LABEL;
var CH = window.QUIZ_CH;
var questions = window.QUIZ_QUESTIONS || [];
var answered = {};
var selections = {};

/* ---- encouragement / activation (personalized to Vivian's why) ---- */
function quizExam() {
  if (/exam4/.test(EXAM_ID || '')) return { key: 'Exam 4', date: '2026-06-25' };
  if (/exam5/.test(EXAM_ID || '')) return { key: 'Exam 5', date: '2026-07-09' };
  return null;
}
function daysUntil(dateStr) {
  var t = new Date(dateStr + 'T00:00:00'); t.setHours(0, 0, 0, 0);
  var now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 86400000);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
var ACTIVATE_LINES = [
  'You opened it. The hardest part is already done — now just answer one.',
  'Wrong answers in here are free. Spend them now so you don’t spend them on exam day.',
  'This is the seed. Everything you’re building toward grows from reps exactly like this one.',
  'You’re getting ahead, not cramming — that’s the whole flex.',
  'You’re becoming the nurse who knows this cold. Prove it one question at a time.',
  'Showing up tired still counts. Especially then.',
  'The lie-flat seat that folds into a bed. The freedom to pour into him. This rep buys a piece of it.',
  'Smart, not broke — built the right way. Keep going.',
  'Future-you, in scrubs and unbothered, is rooting for this exact moment.'
];
var REFRAME_HIGH = [
  'That’s pattern recognition, not luck. This topic is becoming yours.',
  'You’re not guessing anymore — you’re recognizing. That’s what exam-ready feels like.'
];
var REFRAME_MID = [
  'Solid rep. The ones you missed are your free preview — review them and you’ve banked the points.',
  'Good work. Those misses just became the easiest points you’ll grab all week.'
];
var REFRAME_LOW = [
  'You showed up and found exactly what to study. That’s not a fail — that’s a map. Brave work.',
  'Low score, high courage. You just turned unknowns into a to-do list. That IS the win.'
];
function populateActivate() {
  var ex = quizExam();
  var ce = document.getElementById('activateCount');
  if (ex) {
    var n = daysUntil(ex.date);
    ce.textContent = n > 0 ? (ex.key + ' in ' + n + ' day' + (n === 1 ? '' : 's')) : (n === 0 ? (ex.key + ' is today') : (ex.key + ' — keep it fresh'));
  } else {
    ce.textContent = 'Pre-lecture rep';
  }
  document.getElementById('activateLine').textContent = pick(ACTIVATE_LINES);
}

document.getElementById('quizRoot').innerHTML =
  '<div class="activate" id="activateCard"><div class="activate-count" id="activateCount"></div><div class="activate-line" id="activateLine"></div></div>' +
  '<div class="last-attempt" id="lastAttempt"><div>Last Attempt: <span class="score-val" id="lastScore">&mdash;</span> &middot; <span id="lastDate">&mdash;</span></div></div>' +
  '<div class="progress-wrap"><div class="progress-bar" id="progressBar" style="width:0%"></div></div>' +
  '<div id="quizArea"></div>' +
  '<div class="score-card" id="scoreCard">' +
    '<h2>Primer Complete</h2>' +
    '<div class="big-score" id="finalScore">0%</div>' +
    '<p id="finalText" style="color:#94a3b8;margin-bottom:.5rem"></p>' +
    '<p class="score-reframe" id="scoreReframe"></p>' +
    '<p style="color:#5eead4;font-size:.85rem;margin-top:.75rem">Now you\'re primed &mdash; lecture will feel like review instead of brand-new.</p>' +
    '<button class="btn-restart" onclick="restartQuiz()">Restart Primer</button>' +
  '</div>';
populateActivate();

function _seedHash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function _shuffleAllOptions(){if(window.__optsShuffled)return;window.__optsShuffled=true;questions.forEach(function(q){if(!q.options||q.options.length<2)return;var a=q.options.slice();var rnd=mulberry32(_seedHash((typeof EXAM_ID!=='undefined'&&EXAM_ID?EXAM_ID:'q')+'#'+q.id));for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}var L=['A','B','C','D','E','F','G','H'];for(var k=0;k<a.length;k++){a[k].letter=L[k];}q.options=a;});}
/* 'Drill missed' narrows the page to just the ones she got wrong. Everything
   that counts questions has to respect that narrowing or the progress bar and
   the score will be computed against the full set. */
function _activeQ(){
  return (window.__missedIds&&window.__missedIds.length)
    ? questions.filter(function(q){return window.__missedIds.indexOf(q.id)>-1;})
    : questions;
}
function _isCorrect(q){
  var c=q.options.filter(function(o){return o.correct;}).map(function(o){return o.letter;});
  var s=selections[q.id]||[];
  return c.length===s.length&&c.every(function(l){return s.indexOf(l)>-1;});
}
function _answeredCount(){
  return _activeQ().filter(function(q){return answered[q.id];}).length;
}
function drillMissed(){
  var ids=_activeQ().filter(function(q){return answered[q.id]&&!_isCorrect(q);})
    .map(function(q){return q.id;});
  if(!ids.length)return;
  window.__missedIds=ids;
  ids.forEach(function(id){delete answered[id];delete selections[id];});
  saveState();
  document.getElementById('scoreCard').style.display='none';
  buildQuiz();
  document.getElementById('quizArea').scrollIntoView({behavior:'smooth',block:'start'});
}
function _buildMissedBtn(){
  var card=document.getElementById('scoreCard');
  if(!card)return;
  var btn=document.getElementById('drillMissedBtn');
  if(!btn){
    btn=document.createElement('button');
    btn.className='btn-missed';btn.id='drillMissedBtn';btn.type='button';
    btn.setAttribute('onclick','drillMissed()');
    var restart=card.querySelector('.btn-restart');
    if(restart&&restart.parentNode===card)card.insertBefore(btn,restart.nextSibling);
    else card.appendChild(btn);
  }
  var n=_activeQ().filter(function(q){return answered[q.id]&&!_isCorrect(q);}).length;
  btn.style.display=n>0?'block':'none';
  btn.textContent='Drill missed — '+n+(n===1?' question':' questions');
}

function buildQuiz(){_shuffleAllOptions();
  var area=document.getElementById('quizArea');
  area.innerHTML='';
  _activeQ().forEach(function(q,idx){
    var card=document.createElement('div');
    card.className='q-card';
    card.id='qcard-'+q.id;
    var isSata=q.sata===true;
    var sataBadge=isSata?'<span class="badge badge-sata">SATA</span>':'';
    card.innerHTML=
      '<div class="q-top">'+
      '<span class="q-num">Q'+(idx+1)+'</span>'+
      '<span class="badge badge-ch">Ch '+CH+'</span>'+
      sataBadge+
      '</div>'+
      '<div class="q-stem">'+q.stem+(isSata?'<em>(Select all that apply)</em>':'')+'</div>'+
      '<div class="opts" id="opts-'+q.id+'">'+
      q.options.map(function(o){
        return '<div class="opt" id="opt-'+q.id+'-'+o.letter+'" onclick="toggleOpt('+q.id+',\''+o.letter+'\','+isSata+')">'+
          '<span class="opt-letter">'+o.letter+'.</span>'+
          '<div><span class="opt-text">'+o.text+'</span><div class="opt-rationale" id="rat-'+q.id+'-'+o.letter+'">'+o.rationale+'</div></div>'+
          '</div>';
      }).join('')+
      '</div>'+
      '<button class="btn-submit" id="btn-'+q.id+'" onclick="submitQ('+q.id+')">Submit Answer</button>'+
      '<div class="teach" id="teach-'+q.id+'"><strong>Primer takeaway:</strong> '+q.teach+'</div>';
    area.appendChild(card);
  });
  loadState();
}

function toggleOpt(qId,letter,isSata){
  if(answered[qId])return;
  if(!selections[qId])selections[qId]=[];
  if(isSata){
    var idx=selections[qId].indexOf(letter);
    if(idx>-1)selections[qId].splice(idx,1);
    else selections[qId].push(letter);
  }else{
    selections[qId]=[letter];
  }
  var q=questions.find(function(x){return x.id===qId;});
  q.options.forEach(function(o){
    var el=document.getElementById('opt-'+qId+'-'+o.letter);
    el.classList.toggle('selected',selections[qId].indexOf(o.letter)>-1);
  });
}

function submitQ(qId){
  if(answered[qId])return;
  if(!selections[qId]||selections[qId].length===0)return;
  answered[qId]=true;
  var q=questions.find(function(x){return x.id===qId;});
  var correctLetters=q.options.filter(function(o){return o.correct;}).map(function(o){return o.letter;});
  var isCorrect=correctLetters.length===selections[qId].length&&correctLetters.every(function(l){return selections[qId].indexOf(l)>-1;});
  q.options.forEach(function(o){
    var el=document.getElementById('opt-'+qId+'-'+o.letter);
    el.style.cursor='default';
    if(o.correct)el.classList.add('correct-show');
    else if(selections[qId].indexOf(o.letter)>-1&&!o.correct)el.classList.add('wrong-show');
    document.getElementById('rat-'+qId+'-'+o.letter).style.display='block';
  });
  document.getElementById('teach-'+qId).style.display='block';
  var card=document.getElementById('qcard-'+qId);
  card.classList.add(isCorrect?'answered-correct':'answered-wrong');
  document.getElementById('btn-'+qId).disabled=true;
  document.getElementById('btn-'+qId).textContent=isCorrect?'Correct!':'Got it — read below';
  updateProgress();
  saveState();
  if(_answeredCount()===_activeQ().length)showScore(true);
}

function updateProgress(){
  var pct=(_answeredCount()/_activeQ().length)*100;
  document.getElementById('progressBar').style.width=pct+'%';
}

function showScore(doSave){
  var active=_activeQ(),total=active.length,correct=0;
  active.forEach(function(q){if(answered[q.id]&&_isCorrect(q))correct++;});
  var pct=Math.round((correct/total)*100);
  document.getElementById('finalScore').textContent=pct+'%';
  document.getElementById('finalText').textContent=correct+' of '+total+' correct';
  document.getElementById('scoreReframe').textContent = pct>=85 ? pick(REFRAME_HIGH) : pct>=70 ? pick(REFRAME_MID) : pick(REFRAME_LOW);
  document.getElementById('scoreCard').style.display='block';
  document.getElementById('scoreCard').scrollIntoView({behavior:'smooth'});
  _buildMissedBtn();
  if(doSave===true){
    // A missed-only rerun is tagged so a 4/4 on the ones she already got wrong
    // never reads as a full pass in the history.
    var drill=!!(window.__missedIds&&window.__missedIds.length);
    var record={score:pct,correct:correct,total:total,date:new Date().toLocaleDateString()};
    if(!drill){
      localStorage.setItem(EXAM_ID+'-last',JSON.stringify(record));
      localStorage.setItem(EXAM_ID+'-label',EXAM_LABEL);
    }
    var hist=JSON.parse(localStorage.getItem('examHistory')||'[]');
    hist.push({examId:EXAM_ID,examLabel:EXAM_LABEL+(drill?' (missed drill)':''),
      date:new Date().toISOString(),score:pct,correct:correct,total:total});
    localStorage.setItem('examHistory',JSON.stringify(hist.slice(-1000)));
  }
}

function restartQuiz(){
  answered={};
  selections={};
  window.__missedIds=null;
  localStorage.removeItem(EXAM_ID+'-state');
  window.__optsShuffled=false;
  document.getElementById('scoreCard').style.display='none';
  buildQuiz();
}

function saveState(){
  localStorage.setItem(EXAM_ID+'-state',JSON.stringify({answered:answered,selections:selections}));
}

function loadState(){
  var saved=localStorage.getItem(EXAM_ID+'-state');
  if(saved){
    var state=JSON.parse(saved);
    answered=state.answered||{};
    selections=state.selections||{};
    Object.keys(answered).forEach(function(qId){
      var q=questions.find(function(x){return x.id==qId;});
      if(!q)return;
      var correctLetters=q.options.filter(function(o){return o.correct;}).map(function(o){return o.letter;});
      var sel=selections[qId]||[];
      var isCorrect=correctLetters.length===sel.length&&correctLetters.every(function(l){return sel.indexOf(l)>-1;});
      // In a missed-only drill the other cards are not rendered, so every
      // lookup here can legitimately come back null.
      var card=document.getElementById('qcard-'+qId);
      if(!card)return;
      q.options.forEach(function(o){
        var el=document.getElementById('opt-'+qId+'-'+o.letter);
        if(!el)return;
        if(sel.indexOf(o.letter)>-1)el.classList.add('selected');
        if(o.correct)el.classList.add('correct-show');
        else if(sel.indexOf(o.letter)>-1&&!o.correct)el.classList.add('wrong-show');
        el.style.cursor='default';
        var r=document.getElementById('rat-'+qId+'-'+o.letter);
        if(r)r.style.display='block';
      });
      var teach=document.getElementById('teach-'+qId);
      if(teach)teach.style.display='block';
      card.classList.add(isCorrect?'answered-correct':'answered-wrong');
      var btn=document.getElementById('btn-'+qId);
      if(btn){btn.disabled=true;btn.textContent=isCorrect?'Correct!':'Got it — read below';}
    });
    updateProgress();
    if(_activeQ().length&&_answeredCount()===_activeQ().length)showScore(false);
  }
  var last=localStorage.getItem(EXAM_ID+'-last');
  if(last){
    var r=JSON.parse(last);
    document.getElementById('lastAttempt').style.display='block';
    document.getElementById('lastScore').textContent=r.score+'%';
    document.getElementById('lastDate').textContent=r.date;
  }
}

// A drill must open clean. Restoring the previous run meant landing on the page
// with questions already clicked and Submit locked. The score itself lives under
// EXAM_ID+'-last' and still shows in the "last attempt" card.
localStorage.removeItem(EXAM_ID+'-state');
buildQuiz();
