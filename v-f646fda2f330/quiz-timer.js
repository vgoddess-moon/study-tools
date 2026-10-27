/* quiz-timer.js — optional 25-second clock on each question.

   Loaded by weak-tracker.js, so it reaches every page that tracker reaches. It only
   switches itself on for the two quiz engines it knows how to answer:
     - the primer harness (primers, gap quizzes, key-term quizzes): submitAnswer(id)
     - the test-bank engine (Ignatavicius banks, Med-Surg Success, Mat Ex3 bank): submitQ(i)

   THE RULE:
     - Off by default. A toggle sits above the questions; the choice is remembered
       (localStorage "quizTimer") on this device.
     - The clock runs on the question you are looking at: the current card in
       one-at-a-time view, otherwise the first unanswered card in view.
     - Tapping any option stops the clock. Clearing every option starts it again
       where it left off.
     - It pauses while the tab is hidden.
     - At 25 seconds with nothing picked, the question submits itself blank: the
       rationales show and it counts as wrong (so it also lands on the weak list).

   resume.js only replays taps, so a time-out is done by clicking a hidden button
   that lives in every card. That click is logged like any other tap and replays
   after a reload. */
(function(){
'use strict';
if(window.__qtLoaded)return;window.__qtLoaded=true;

var LIMIT=25000, TICK=200, KEY='quizTimer';
var elapsed=new WeakMap();

function engine(){
  if(typeof window.submitAnswer==='function'&&typeof window.selectOption==='function')return 'harness';
  if(typeof window.submitQ==='function'&&typeof window.toggleOpt==='function')return 'bank';
  return null;
}
function isOn(){try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}}
function setOn(v){try{localStorage.setItem(KEY,v?'1':'0');}catch(e){}}
function answered(c){return /answered-/.test(c.className);}
function picked(c){return !!c.querySelector('.opt.selected');}
function shown(c){return c.offsetParent!==null&&c.style.display!=='none';}

/* ---- answer a card blank ---- */
function timeOut(card){
  if(!card||answered(card))return;
  card.querySelectorAll('.opt.selected').forEach(function(o){o.classList.remove('selected');});
  var m;
  if((m=/^qcard-(.+)$/.exec(card.id))&&typeof window.submitAnswer==='function'){
    var id=isNaN(m[1])?m[1]:Number(m[1]);
    try{selections[id]=[];}catch(e){}            // harness keeps picks in a global `selections`
    window.submitAnswer(id);
  }else if((m=/^q(\d+)$/.exec(card.id))&&typeof window.submitQ==='function'){
    try{state.lastTap=0;}catch(e){}               // the bank ignores a submit within 350 ms of a tap
    window.submitQ(Number(m[1]));
  }
  if(answered(card)&&!card.querySelector('.qt-up')){
    var up=document.createElement('div');up.className='qt-up';
    up.textContent='⏱ Time’s up — counted wrong. Read the rationales, then move on.';
    card.appendChild(up);
  }
  elapsed.set(card,0);
}
window.__qtTimeOut=timeOut;   // resume.js calls this if it replays a time-out before this file has wired the cards
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest&&e.target.closest('.qt-fire');
  if(b)timeOut(b.closest('.q-card'));
});

/* ---- per-card pieces ---- */
function wire(card){
  if(card.querySelector('.qt-fire')||!card.id)return;
  if(window.getComputedStyle(card).position==='static')card.style.position='relative';
  var bar=document.createElement('div');bar.className='qt-bar';bar.innerHTML='<i></i>';
  var num=document.createElement('div');num.className='qt-num';
  var fire=document.createElement('button');fire.type='button';fire.className='qt-fire';
  fire.id='qt-'+card.id;fire.tabIndex=-1;fire.setAttribute('aria-hidden','true');
  // Appended last so the DOM paths resume.js records for other taps do not shift.
  card.appendChild(bar);card.appendChild(num);card.appendChild(fire);
}
function wireAll(){document.querySelectorAll('#quizArea .q-card').forEach(wire);}

/* ---- which card is "the question you are on" ---- */
function current(){
  if(document.body.classList.contains('focus-on')){
    var f=document.querySelector('#quizArea .q-card.focus-cur');
    return f&&!answered(f)?f:null;
  }
  var cards=document.querySelectorAll('#quizArea .q-card'),vh=window.innerHeight||800;
  for(var i=0;i<cards.length;i++){
    var c=cards[i];if(answered(c)||!shown(c))continue;
    var r=c.getBoundingClientRect();
    if(r.bottom<90)continue;                    // scrolled past it
    return r.top<vh*0.6?c:null;                 // next open card must be on screen
  }
  return null;
}

/* ---- the clock ---- */
var active=null,last=0;
function paint(card,ms,running){
  var left=Math.max(0,LIMIT-ms),bar=card.querySelector('.qt-bar i'),num=card.querySelector('.qt-num');
  if(!bar||!num)return;
  bar.style.width=(left/LIMIT*100)+'%';
  var s=Math.ceil(left/1000);
  num.textContent=running?s+'s':'⏸ '+s+'s';
  card.classList.toggle('qt-low',left<=8000);
}
function tick(){
  if(!document.getElementById('qtToggle'))addToggle();   // the harness may rebuild its filter bar
  if(active&&active!==current())active.classList.remove('qt-live');
  document.querySelectorAll('#quizArea .q-card .qt-up').forEach(function(u){
    if(!answered(u.parentNode))u.remove();      // Undo on the bank brings the card back
  });
  // Count real time, not ticks: phones throttle timers, so 200 ms ticks can run slow.
  var now=Date.now(),dt=last?Math.min(now-last,1000):TICK;last=now;
  if(!isOn()||window.__rsReplaying){active=null;return;}
  var c=current();active=c;
  if(!c)return;
  c.classList.add('qt-live');
  var ms=elapsed.get(c)||0,running=!picked(c)&&!document.hidden;
  if(running){ms+=dt;elapsed.set(c,ms);}
  paint(c,ms,running);
  if(running&&ms>=LIMIT){
    var b=c.querySelector('.qt-fire');
    if(b)b.click();else timeOut(c);
    c.classList.remove('qt-live','qt-low');
  }
}

/* ---- toggle ---- */
function syncToggle(){
  var t=document.getElementById('qtToggle');if(!t)return;
  var on=isOn();
  t.classList.toggle('on',on);
  t.innerHTML='⏱ 25-second timer: <b>'+(on?'On':'Off')+'</b>';
  document.body.classList.toggle('qt-on',on);
}
function addToggle(){
  var qa=document.getElementById('quizArea');
  if(!qa||document.getElementById('qtToggle'))return;
  // Goes at the END of the filter bar: inserting it anywhere earlier would shift the
  // DOM paths resume.js has recorded for taps on elements without an id.
  var bar=document.getElementById('filterBar')||document.getElementById('harnessFilterBar');
  var t=document.createElement('button');t.type='button';t.id='qtToggle';
  t.title='Each question gets 25 seconds. If time runs out before you pick an answer, it is marked wrong and the rationales show.';
  t.addEventListener('click',function(){setOn(!isOn());syncToggle();if(isOn())wireAll();});
  if(bar)bar.appendChild(t);else qa.parentNode.insertBefore(t,qa);
  syncToggle();
}
function css(){
  var st=document.createElement('style');st.id='qtCss';
  st.textContent=
   '#qtToggle{display:inline-flex;align-items:center;gap:.35rem;margin:.25rem .35rem;padding:.5rem .9rem;border-radius:999px;'
  +'border:1px solid #334155;background:#13181f;color:#94a3b8;font:600 .82rem/1.2 inherit;font-family:inherit;cursor:pointer}'
  +'#qtToggle.on{border-color:#f59e0b;color:#fbbf24;background:#1f1a0e}#qtToggle b{color:inherit}'
  +'.qt-bar,.qt-num,.qt-fire{display:none}'
  +'.qt-on .q-card.qt-live .qt-bar{display:block;position:absolute;left:0;right:0;top:0;height:4px;background:#1e293b;border-radius:12px 12px 0 0;overflow:hidden}'
  +'.qt-bar i{display:block;height:100%;width:100%;background:#22c55e;transition:width .2s linear}'
  +'.q-card.qt-low .qt-bar i{background:#ef4444}'
  +'.qt-on .q-card.qt-live .qt-num{display:block;position:absolute;top:8px;right:10px;padding:.1rem .45rem;border-radius:999px;'
  +'background:#0c0f14;border:1px solid #334155;color:#94a3b8;font:700 .75rem/1.3 monospace}'
  +'.q-card.qt-low .qt-num{color:#f87171;border-color:#7f1d1d}'
  +'.qt-on .q-card.qt-live .q-top{padding-right:3.6rem}'
  +'.qt-up{margin-top:.6rem;padding:.5rem .7rem;border-radius:8px;background:#2a1215;border:1px solid #7f1d1d;color:#fca5a5;font-size:.82rem;font-weight:600}';
  document.head.appendChild(st);
}

function boot(){
  if(!engine()||!document.getElementById('quizArea'))return;
  css();addToggle();wireAll();
  new MutationObserver(wireAll).observe(document.getElementById('quizArea'),{childList:true});
  setInterval(tick,TICK);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
