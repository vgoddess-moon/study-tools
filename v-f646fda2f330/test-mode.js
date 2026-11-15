/* test-mode.js — Study / Test switch on every quiz page.

   Loaded by weak-tracker.js next to quiz-timer.js, so it reaches the same pages, and it
   only switches itself on for the same two quiz engines:
     - the primer harness (primers, gap quizzes, key-term quizzes): submitAnswer(id)
     - the test-bank engine (banks, mocks, HESI pages, study-guide pages): submitQ(i)

   THE RULE:
     - Study mode = the page works exactly as before (rationales right after each answer).
     - Test mode = after Submit the answer locks with NO right/wrong, NO rationales, NO hints,
       NO weak-list toasts. Your pick stays outlined in blue so you can see what you chose.
     - When the score card appears (last question answered, or "Finish & grade"), everything
       is revealed: score, breakdown, and every rationale on every card.
     - "Finish & grade" counts unanswered questions as wrong, like the real exam.
     - Each graded Test-mode run is saved to localStorage "testModeLog", and the score card
       shows the average of the last 3 Test-mode runs on that page.
     - Default: Test on mock / sim / final pages and when a HESI page's Comp drill is picked;
       Study everywhere else. Once she flips it on a page, that choice is remembered there
       (localStorage "tm:<page>").

   The switch buttons have no onclick attribute and sit outside the quiz zone, so resume.js
   never logs or replays them. Nothing here changes how a question is scored. */
(function(){
'use strict';
if(window.__tmLoaded)return;window.__tmLoaded=true;

var PAGE='tm:'+location.pathname.split('/').pop(), LOG='testModeLog';
var MOCKY=/mock|sim|final|blueprint|cumulative|comprehensive|predictive/i.test(location.pathname);
var touched=false, wasRevealed=false;

function engine(){
  if(typeof window.submitAnswer==='function'&&typeof window.selectOption==='function')return 'harness';
  if(typeof window.submitQ==='function'&&typeof window.toggleOpt==='function')return 'bank';
  return null;
}
function stored(){try{return localStorage.getItem(PAGE);}catch(e){return null;}}
function compPicked(){
  var b=document.querySelector('.fbtn.active');
  return !!b&&/(^|[^\w])Comp\b/.test(b.textContent);   // the button reads "★ Comp · 55"
}
function isOn(){
  var s=stored();
  if(s==='1')return true;
  if(s==='0')return false;
  return MOCKY||compPicked();
}
function setOn(v){try{localStorage.setItem(PAGE,v?'1':'0');}catch(e){}}
function answered(c){return /answered-/.test(c.className);}
function revealed(){
  var sc=document.getElementById('scoreCard');
  return !!sc&&sc.style.display!=='none'&&window.getComputedStyle(sc).display!=='none';
}
function hiding(){return isOn()&&!revealed();}
window.__tmHide=hiding;   // weak-tracker.js asks this before showing a toast

/* ---- remember what she picked (the engines drop .selected on submit) ---- */
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest&&e.target.closest('button');
  if(!b)return;
  var oc=b.getAttribute('onclick')||'';
  if(!/submit(Answer|Q)\(/.test(oc))return;
  var card=b.closest('.q-card');
  if(!card)return;
  card.querySelectorAll('.opt.tm-pick').forEach(function(o){o.classList.remove('tm-pick');});
  card.querySelectorAll('.opt.selected').forEach(function(o){o.classList.add('tm-pick');});
  if(!window.__rsReplaying)touched=true;
},true);

/* Harness pages reload their own saved answers; mark those picks from its `selections`. */
function markHarnessPicks(){
  var sel;try{sel=selections;}catch(e){return;}
  if(!sel)return;
  document.querySelectorAll('#quizArea .q-card[id^="qcard-"]').forEach(function(card){
    if(!answered(card)||card.querySelector('.tm-pick'))return;
    var id=card.id.slice(6),s=sel[id]||sel[Number(id)]||[];
    s.forEach(function(l){var o=document.getElementById('opt-'+id+'-'+l);if(o)o.classList.add('tm-pick');});
  });
}

/* Harness buttons say "Correct!" / "Review the reasoning"; hold that back until the end. */
function lockButtons(hide){
  document.querySelectorAll('#quizArea .q-card .btn-submit').forEach(function(btn){
    var card=btn.closest('.q-card');
    if(hide&&card&&answered(card)){
      if(btn.dataset.tm===undefined){btn.dataset.tm=btn.textContent;}
      if(btn.textContent!=='Answer locked')btn.textContent='Answer locked';
    }else if(btn.dataset.tm!==undefined){
      if(answered(card))btn.textContent=btn.dataset.tm;
      delete btn.dataset.tm;
    }
  });
}

/* ---- the Test-mode log ---- */
function readLog(){try{return JSON.parse(localStorage.getItem(LOG)||'[]');}catch(e){return [];}}
function logRun(){
  var fs=document.getElementById('finalScore'),pct=fs?parseInt(fs.textContent,10):NaN;
  if(isNaN(pct))return;
  var cards=document.querySelectorAll('#quizArea .q-card'),n=0;
  cards.forEach(function(c){if(c.style.display!=='none')n++;});
  var label=window._runLabel||(typeof __filterMode!=='undefined'?String(__filterMode):'');
  var log=readLog();
  log.push({p:location.pathname.split('/').pop(),t:document.title,s:pct,n:n,f:label,d:new Date().toISOString()});
  try{localStorage.setItem(LOG,JSON.stringify(log.slice(-500)));}catch(e){}
}
function note(){
  var sc=document.getElementById('scoreCard');if(!sc)return;
  var el=document.getElementById('tmNote');
  var page=location.pathname.split('/').pop();
  var mine=readLog().filter(function(r){return r.p===page;});
  if(!mine.length){if(el)el.remove();return;}
  var last=mine.slice(-3),avg=Math.round(last.reduce(function(a,r){return a+r.s;},0)/last.length);
  if(!el){el=document.createElement('div');el.id='tmNote';sc.appendChild(el);}
  el.innerHTML='📝 <b>Test-mode average here: '+avg+'%</b> (last '+last.length+' cold run'+(last.length>1?'s':'')+': '
    +last.map(function(r){return r.s+'%';}).join(', ')+'). This is the number to trust — study-mode scores run high.';
}

/* ---- Finish & grade ---- */
var finArmed=0;
function finish(){
  var f=document.getElementById('tmFinish');
  if(!finArmed){
    var open=0;document.querySelectorAll('#quizArea .q-card').forEach(function(c){if(c.style.display!=='none'&&!answered(c))open++;});
    finArmed=setTimeout(function(){finArmed=0;paintFinish();},4000);
    f.textContent=open?'Tap again: '+open+' unanswered count as wrong':'Tap again to grade';
    return;
  }
  clearTimeout(finArmed);finArmed=0;
  touched=true;
  if(typeof window.showScore==='function')window.showScore();
}
function paintFinish(){
  var f=document.getElementById('tmFinish');if(!f||finArmed)return;
  var any=document.querySelector('#quizArea .q-card[class*="answered-"]');
  f.style.display=hiding()&&any?'':'none';
  f.textContent='Finish & grade';
}

/* ---- toggle ---- */
function syncToggle(){
  var t=document.getElementById('tmToggle');if(!t)return;
  var on=isOn();
  t.classList.toggle('on',on);
  t.innerHTML=on?'📝 Test mode: <b>On</b>':'📖 Study mode';
}
function addToggle(){
  var qa=document.getElementById('quizArea');
  if(!qa||document.getElementById('tmToggle'))return;
  // End of the filter bar, like the timer: earlier would shift the DOM paths resume.js recorded.
  var bar=document.getElementById('filterBar')||document.getElementById('harnessFilterBar');
  var t=document.createElement('button');t.type='button';t.id='tmToggle';
  t.title='Test mode hides right/wrong, rationales and hints until the end, then grades the whole set. Study mode shows them after every question.';
  t.addEventListener('click',function(){setOn(!isOn());tick();});
  if(bar)bar.appendChild(t);else qa.parentNode.insertBefore(t,qa);
  syncToggle();
}

function tick(){
  if(!document.getElementById('tmToggle'))addToggle();   // the harness may rebuild its filter bar
  syncToggle();
  var hide=hiding(),rev=revealed();
  document.body.classList.toggle('tm-hide',hide);
  if(hide)markHarnessPicks();
  lockButtons(hide);
  if(rev&&!wasRevealed&&isOn()&&touched&&!window.__rsReplaying){logRun();touched=false;}
  if(rev)note();
  wasRevealed=rev;
  paintFinish();
}

function css(){
  var st=document.createElement('style');st.id='tmCss';
  st.textContent=
   '#tmToggle{display:inline-flex;align-items:center;gap:.35rem;margin:.25rem .35rem;padding:.5rem .9rem;border-radius:999px;'
  +'border:1px solid #334155;background:#13181f;color:#94a3b8;font:600 .82rem/1.2 inherit;font-family:inherit;cursor:pointer}'
  +'#tmToggle.on{border-color:#60a5fa;color:#93c5fd;background:#0f1d33}#tmToggle b{color:inherit}'
  +'body.tm-hide .opt-rationale,body.tm-hide .vocab-tip,body.tm-hide .q-teach,body.tm-hide .q-undo,'
  +'body.tm-hide .mk-fab,body.tm-hide #wqPill{display:none!important}'
  +'body.tm-hide .q-card[class*="answered-"]{border-color:#475569!important}'
  +'body.tm-hide .opt.correct-show,body.tm-hide .opt.wrong-show{border-color:#334155!important;background:transparent!important}'
  +'body.tm-hide .opt.correct-show .opt-letter,body.tm-hide .opt.wrong-show .opt-letter{background:#1e293b!important;color:#cbd5e1!important;border-color:#334155!important}'
  +'body.tm-hide .opt.tm-pick{border-color:#60a5fa!important;background:#0f1d33!important}'
  +'body.tm-hide .opt.tm-pick .opt-letter{background:#1d4ed8!important;color:#fff!important;border-color:#60a5fa!important}'
  +'#tmFinish{position:fixed;left:50%;bottom:.9rem;transform:translateX(-50%);z-index:9997;padding:.6rem 1.1rem;border-radius:999px;'
  +'border:1px solid #60a5fa;background:#0f1d33;color:#bfdbfe;font:700 .85rem/1.2 system-ui,sans-serif;cursor:pointer;'
  +'box-shadow:0 2px 12px rgba(0,0,0,.5);max-width:calc(100vw - 2rem)}'
  +'#tmNote{margin-top:.8rem;padding:.6rem .8rem;border-radius:10px;background:#0f1d33;border:1px solid #1e3a8a;color:#bfdbfe;font-size:.85rem;line-height:1.45}';
  document.head.appendChild(st);
}

function boot(){
  if(!engine()||!document.getElementById('quizArea'))return;
  css();addToggle();
  var f=document.createElement('button');f.type='button';f.id='tmFinish';f.style.display='none';
  f.addEventListener('click',finish);document.body.appendChild(f);
  tick();
  setInterval(tick,300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
