/* weak-tracker.js — remembers the questions you keep missing, across every quiz.

   Loaded by every quiz page under the Med Surg 2 and Maternity tabs. It watches
   each .q-card for the answered-correct / answered-wrong / answered-partial class,
   so it works with every quiz engine on the site without touching their code.

   THE RULE (the only place it lives):
     - Any miss puts the question on your weak list. A SATA at half credit is a miss.
     - It leaves the list after 2 correct answers in a row from two SEPARATE
       sittings, at least 3 hours apart. Two right answers back to back are
       short-term memory, so the second one is ignored until the gap has passed.
     - Any miss resets the count to zero. Mastered questions can come back for
       a final check, and a miss there puts them straight back on the list.

   Storage: localStorage key "weakQ". The System's sync code already exports every
   localStorage key, so this travels with it. weak-drill.html also has its own
   small copy/paste sync that merges instead of overwriting.

   Each entry keeps a full snapshot of the question (stem, options, rationales),
   because the drill page has no other way to get at questions that live inside
   other pages. */
(function(){
'use strict';
var KEY='weakQ', GAP_MS=3*3600*1000, NEED=2;

/*MAP-START*/
var MAP={"endocrine-loops.html":[["ms2","exam-5"]],"mat-ch10-primer.html":[["mat","exam-2"]],"mat-ch11-primer.html":[["mat","exam-2"]],"mat-ch12-primer.html":[["mat","exam-2"]],"mat-ch13-primer.html":[["mat","exam-2"]],"mat-ch14-primer.html":[["mat","exam-2"]],"mat-ch15-primer.html":[["mat","exam-3"]],"mat-ch2-primer.html":[["mat","exam-1"]],"mat-ch21-primer.html":[["mat","exam-3"]],"mat-ch22-primer.html":[["mat","exam-3"]],"mat-ch24-primer.html":[["mat","exam-3"]],"mat-ch25-primer.html":[["mat","exam-3"]],"mat-ch26-primer.html":[["mat","exam-3"]],"mat-ch3-primer.html":[["mat","exam-1"]],"mat-ch34-primer.html":[["mat","exam-3"]],"mat-ch4-primer.html":[["mat","exam-1"]],"mat-ch5-primer.html":[["mat","exam-1"]],"mat-ch6-primer.html":[["mat","exam-1"]],"mat-ch7-primer.html":[["mat","exam-1"]],"mat-ch8-primer.html":[["mat","exam-1"]],"mat-ch9-labor-primer.html":[["mat","exam-2"]],"mat-ch9-primer.html":[["mat","exam-2"]],"mat-ex1-mock-A.html":[["mat","exam-1"]],"mat-ex1-mock-B.html":[["mat","exam-1"]],"mat-ex1-mock-C.html":[["mat","exam-1"]],"mat-ex1-mock-D.html":[["mat","exam-1"]],"mat-ex1-retake-blueprint.html":[["mat","exam-1"]],"mat-ex2-gap1.html":[["mat","exam-2"]],"mat-ex2-gap2.html":[["mat","exam-2"]],"mat-ex3-bank.html":[["mat","exam-3"]],"mat-ex3-gap1.html":[["mat","exam-3"]],"mat-ex3-gap2.html":[["mat","exam-3"]],"mat-ex3-gap3.html":[["mat","exam-3"]],"mat-ex3-gap4.html":[["mat","exam-3"]],"mat-ex3-gap5.html":[["mat","exam-3"]],"mat-ex3-gap6.html":[["mat","exam-3"]],"mat-ex3-terms1.html":[["mat","exam-3"]],"mat-ex3-terms2.html":[["mat","exam-3"]],"mat-ex3-terms3.html":[["mat","exam-3"]],"mat-ex3-terms4.html":[["mat","exam-3"]],"mat-exam-sim.html":[["mat","exam-1"]],"mat-fhr-veal-chop.html":[["mat","exam-1"]],"mat-lecture1-callouts.html":[["mat","exam-1"]],"mat-retake-bank.html":[["mat","exam-1"]],"mat-sg-bank.html":[["mat","exam-1"]],"mat-sg-ex2-answers.html":[["mat","exam-2"]],"mat-sg-la-drill.html":[["mat","exam-1"]],"mat-vocab-patho.html":[["mat","exam-1"],["mat","exam-3"]],"ms2-ch33-primer.html":[["ms2","exam-2"]],"ms2-ch34-primer.html":[["ms2","exam-2"]],"ms2-ch35-primer.html":[["ms2","exam-2"]],"ms2-ch36-primer.html":[["ms2","exam-2"]],"ms2-ch37-primer.html":[["ms2","exam-2"]],"ms2-ch38-primer.html":[["ms2","exam-2"]],"ms2-ch39-primer.html":[["ms2","exam-3"]],"ms2-ch40-primer.html":[["ms2","exam-3"]],"ms2-ch41-primer.html":[["ms2","exam-3"]],"ms2-ch42-primer.html":[["ms2","exam-3"]],"ms2-ch43-primer.html":[["ms2","exam-3"]],"ms2-ch44-primer.html":[["ms2","exam-3"]],"ms2-ch45-primer.html":[["ms2","exam-4"]],"ms2-ch46-primer.html":[["ms2","exam-4"]],"ms2-ch47-primer.html":[["ms2","exam-4"]],"ms2-ch48-primer.html":[["ms2","exam-4"]],"ms2-ch49-primer.html":[["ms2","exam-4"]],"ms2-ch50-primer.html":[["ms2","exam-4"]],"ms2-ch51-primer.html":[["ms2","exam-4"]],"ms2-ch52-primer.html":[["ms2","exam-4"]],"ms2-ch53-primer.html":[["ms2","exam-5"]],"ms2-ch54-primer.html":[["ms2","exam-5"]],"ms2-ch55-primer.html":[["ms2","exam-5"]],"ms2-ch56-primer.html":[["ms2","exam-5"]],"ms2-ch61-62-emphasis.html":[["ms2","exam-1"]],"ms2-ch61-primer.html":[["ms2","exam-1"]],"ms2-ch62-primer.html":[["ms2","exam-1"]],"ms2-ch63-65-emphasis.html":[["ms2","exam-1"]],"ms2-ch63-primer.html":[["ms2","exam-1"]],"ms2-ch64-primer.html":[["ms2","exam-1"]],"ms2-ch65-primer.html":[["ms2","exam-1"]],"ms2-ex1-mock-A.html":[["ms2","exam-1"]],"ms2-ex1-mock-B.html":[["ms2","exam-1"]],"ms2-ex1-vocab-drill.html":[["ms2","exam-1"]],"ms2-ex2-igna-bank.html":[["ms2","exam-2"]],"ms2-ex2-labs-drugs.html":[["ms2","exam-2"]],"ms2-ex2-mock50.html":[["ms2","exam-2"]],"ms2-ex2-nerves-sci.html":[["ms2","exam-2"]],"ms2-ex2-recap-mock-1.html":[["ms2","exam-2"]],"ms2-ex2-recap-mock-2.html":[["ms2","exam-2"]],"ms2-ex2-recap-mock-3.html":[["ms2","exam-2"]],"ms2-ex2-retake-mock-A.html":[["ms2","exam-2"]],"ms2-ex2-retake-mock-B.html":[["ms2","exam-2"]],"ms2-ex2-sim.html":[["ms2","exam-2"]],"ms2-ex3-gap1.html":[["ms2","exam-3"]],"ms2-ex3-gap2.html":[["ms2","exam-3"]],"ms2-ex3-igna-bank.html":[["ms2","exam-3"]],"ms2-ex4-gap1.html":[["ms2","exam-4"]],"ms2-ex4-gap2.html":[["ms2","exam-4"]],"ms2-ex4-gap3.html":[["ms2","exam-4"]],"ms2-ex4-gap4.html":[["ms2","exam-4"]],"ms2-ex4-igna-bank.html":[["ms2","exam-4"]],"ms2-ex4-terms1.html":[["ms2","exam-4"]],"ms2-ex4-terms2.html":[["ms2","exam-4"]],"ms2-ex4-terms3.html":[["ms2","exam-4"]],"ms2-ex4-terms4.html":[["ms2","exam-4"]],"ms2-ex4-terms5.html":[["ms2","exam-4"]],"ms2-ex5-gap1.html":[["ms2","exam-5"]],"ms2-ex5-gap2.html":[["ms2","exam-5"]],"ms2-ex5-gap3.html":[["ms2","exam-5"]],"ms2-ex5-gap4.html":[["ms2","exam-5"]],"ms2-ex5-igna-bank.html":[["ms2","exam-5"]],"ms2-ex5-terms1.html":[["ms2","exam-5"]],"ms2-ex5-terms2.html":[["ms2","exam-5"]],"ms2-ex5-terms3.html":[["ms2","exam-5"]],"ms2-ex5-terms4.html":[["ms2","exam-5"]],"ms2-vocab-patho.html":[["ms2","exam-1"],["ms2","exam-2"],["ms2","exam-3"]]};
/*MAP-END*/

function load(){
  try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&o.q)return o;}catch(e){}
  return {v:1,q:{}};
}
function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));return true;}catch(e){return false;}}

function hash(s){
  s=String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  var h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h.toString(36)+s.length.toString(36);
}
function pageName(){
  var p=(location.pathname||'').split('/').pop();
  return p||'index.html';
}

/* ---- the rule ---- */
function status(e,now){
  now=now||Date.now();
  if(e.st==='m')return 'mastered';
  if(e.s>=1&&e.lc&&now-e.lc<GAP_MS)return 'cooling';
  return 'ready';
}
function readyAt(e){return e.lc?e.lc+GAP_MS:0;}

function apply(o,snap,correct,now){
  var e=o.q[snap.k],before=e?JSON.stringify(e):null,event='';
  if(!correct){
    if(!e){e=snap;e.m=0;e.fm=now;o.q[snap.k]=e;event='added';}
    else{
      // Keep the freshest copy of the wording; the bank may have been edited.
      e.stem=snap.stem;e.opts=snap.opts;e.sata=snap.sata;e.teach=snap.teach||e.teach;e.ch=snap.ch||e.ch;
      event=e.st==='m'?'back':'again';
    }
    e.s=0;e.lc=0;e.st='w';e.m=(e.m||0)+1;e.ts=now;e.pg=snap.pg;e.lbl=snap.lbl||e.lbl;
  }else{
    if(!e)return {before:null,event:''};      // never missed: nothing to track
    if(e.st==='m'){e.ts=now;event='kept';}
    else if(!e.lc){e.s=1;e.lc=now;e.ts=now;event='first';}
    else if(now-e.lc>=GAP_MS){
      e.s++;e.lc=now;e.ts=now;event='next';
      if(e.s>=NEED){e.st='m';e.mt=now;event='mastered';}
    }else event='same-sitting';
  }
  return {before:before,event:event};
}

/* Record one answer. Returns an undo token. */
function record(snap,correct){
  var o=load(),r=apply(o,snap,correct,Date.now());
  if(r.event)save(o);
  return {k:snap.k,before:r.before,event:r.event};
}
function undo(tok){
  if(!tok||!tok.event)return;
  var o=load();
  if(tok.before===null)delete o.q[tok.k];
  else o.q[tok.k]=JSON.parse(tok.before);
  save(o);
}

/* ---- queries ---- */
function entries(){var o=load();return Object.keys(o.q).map(function(k){return o.q[k];});}
function inScope(e,panel,block){
  if(!panel||panel==='all')return true;
  var places=MAP[e.pg];
  if(!places)return false;
  for(var i=0;i<places.length;i++){
    if(places[i][0]===panel&&(!block||block==='all'||places[i][1]===block))return true;
  }
  return false;
}
function count(panel,block){
  var now=Date.now(),c={weak:0,ready:0,cooling:0,mastered:0};
  entries().forEach(function(e){
    if(!inScope(e,panel,block))return;
    var s=status(e,now);
    if(s==='mastered')c.mastered++;
    else{c.weak++;c[s]++;}
  });
  return c;
}

/* ---- sync: merge two lists, newest edit per question wins ---- */
function mergeObjs(a,b){
  var out={v:1,q:{}};
  [a,b].forEach(function(src){
    if(!src||!src.q)return;
    Object.keys(src.q).forEach(function(k){
      var e=src.q[k],cur=out.q[k];
      if(!cur||(e.ts||0)>(cur.ts||0))out.q[k]=e;
    });
  });
  return out;
}
function exportCode(){
  var json=JSON.stringify(load());
  return 'WQ1:'+btoa(unescape(encodeURIComponent(json)));
}
function importCode(str){
  str=String(str||'').trim();
  if(str.indexOf('WQ1:')!==0)throw new Error('That is not a weak-list code.');
  var remote=JSON.parse(decodeURIComponent(escape(atob(str.slice(4)))));
  var local=load(),before=Object.keys(local.q).length;
  var merged=mergeObjs(local,remote);
  if(!save(merged))throw new Error('Browser storage is full.');
  return {total:Object.keys(merged.q).length,added:Object.keys(merged.q).length-before};
}

/* ---- snapshot a finished card out of the page ---- */
function txt(el){return el?el.textContent.replace(/\s+/g,' ').trim():'';}
function snapshot(card){
  var stemEl=card.querySelector('.q-stem');
  if(!stemEl)return null;
  var stem=txt(stemEl);
  var optEls=card.querySelectorAll('.opt');
  if(!stem||optEls.length<2)return null;
  var opts=[],nCorrect=0;
  for(var i=0;i<optEls.length;i++){
    var oe=optEls[i],te=oe.querySelector('.opt-text')||oe;
    var rEl=oe.querySelector('.opt-rationale');
    var clone=te.cloneNode(true),rc=clone.querySelector('.opt-rationale');
    if(rc)rc.parentNode.removeChild(rc);
    var c=oe.classList.contains('correct-show');
    if(c)nCorrect++;
    opts.push({t:txt(clone),c:c,r:txt(rEl)});
  }
  if(!nCorrect)return null;                    // card not fully revealed yet
  var teachEl=card.querySelector('.q-teach,.key-block,.vocab-tip');
  var chEl=card.querySelector('.badge-blk,.badge-ch');
  return {
    k:hash(stem),pg:pageName(),lbl:txt(document.querySelector('h1'))||document.title,
    stem:stem,opts:opts,
    sata:!!card.querySelector('.sata-hint')||nCorrect>1,
    ch:txt(chEl),teach:txt(teachEl)
  };
}

/* ---- on-page feedback ---- */
var toastEl=null,toastT=0,pillEl=null;
function toast(msg,color){
  if(!document.body)return;
  if(!toastEl){
    toastEl=document.createElement('div');
    toastEl.style.cssText='position:fixed;left:50%;bottom:4.2rem;transform:translateX(-50%);z-index:9999;'
      +'background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:.5rem .9rem;border-radius:999px;'
      +'font:600 .8rem system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.5);max-width:90vw;text-align:center;'
      +'pointer-events:none;transition:opacity .25s;opacity:0';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent=msg;toastEl.style.borderColor=color||'#334155';toastEl.style.opacity='1';
  clearTimeout(toastT);toastT=setTimeout(function(){toastEl.style.opacity='0';},2400);
}
function drillHref(){
  var places=MAP[pageName()],q='';
  if(places&&places[0])q='?panel='+places[0][0]+'&block='+places[0][1];
  return 'weak-drill.html'+q;
}
function updatePill(){
  if(!document.body)return;
  var places=MAP[pageName()],c=places&&places[0]?count(places[0][0],places[0][1]):count();
  if(!c.weak){if(pillEl)pillEl.style.display='none';return;}
  if(!pillEl){
    pillEl=document.createElement('a');
    pillEl.style.cssText='position:fixed;left:.75rem;bottom:.75rem;z-index:9998;background:#1a0e00;'
      +'border:1px solid #f97316;color:#fb923c;padding:.45rem .8rem;border-radius:999px;'
      +'font:700 .78rem system-ui,sans-serif;text-decoration:none;box-shadow:0 2px 12px rgba(0,0,0,.5)';
    document.body.appendChild(pillEl);
  }
  pillEl.href=drillHref();pillEl.style.display='';
  pillEl.textContent='Drill weak ('+c.weak+')';
}

/* ---- observer ---- */
function startObserver(){
  if(window.WEAKQ_NO_OBSERVE||!window.MutationObserver||!document.body)return;
  // Pages restore saved answers on load by adding these same classes. Only
  // answers made after the first real tap or keypress count as new attempts.
  var active=false;
  ['pointerdown','touchstart','keydown','click'].forEach(function(ev){
    document.addEventListener(ev,function(e){
      active=true;
      if(ev==='click'&&e.target&&e.target.closest){
        var u=e.target.closest('.q-undo'),card=u&&u.closest('.q-card');
        if(card)card._wqUndo=true;
      }
    },true);
  });
  function answered(c){
    var l=c.classList;
    return l.contains('answered-correct')||l.contains('answered-wrong')||l.contains('answered-partial');
  }
  function handle(card){
    var has=answered(card);
    if(has&&!card._wq&&active){
      var snap=snapshot(card);
      if(!snap)return;
      var tok=record(snap,card.classList.contains('answered-correct'));
      card._wq=tok;
      if(tok.event==='added'||tok.event==='back')toast('Added to your weak list','#f97316');
      else if(tok.event==='again')toast('Still weak — count back to zero','#f97316');
      else if(tok.event==='mastered')toast('Mastered — off your weak list','#22c55e');
      else if(tok.event==='first')toast('Right! One more correct, in a later sitting, retires it','#fbbf24');
      else if(tok.event==='next')toast('Right again','#22c55e');
      else if(tok.event==='same-sitting')toast('Right — counts again after a break','#64748b');
      updatePill();
    }else if(!has&&card._wq){
      if(card._wqUndo){undo(card._wq);updatePill();}
      card._wq=null;card._wqUndo=false;
    }
  }
  new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      var t=muts[i].target;
      if(t.classList&&t.classList.contains('q-card'))handle(t);
    }
  }).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
  updatePill();
}

window.WeakQ={
  KEY:KEY,GAP_MS:GAP_MS,NEED:NEED,MAP:MAP,
  load:load,save:save,hash:hash,record:record,undo:undo,entries:entries,
  status:status,readyAt:readyAt,count:count,inScope:inScope,
  exportCode:exportCode,importCode:importCode,mergeObjs:mergeObjs,
  snapshot:snapshot
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver);
else startObserver();
})();

/* One-at-a-time view for the bank/mock engine (submitQ/toggleOpt pages). Primer-engine pages get theirs from primer-harness.js. */
(function(){
'use strict';
function boot(){
if(window.ALL_Q||window.__bankFocus||typeof window.submitQ!=='function'||typeof window.buildQuiz!=='function')return;
var area=document.getElementById('quizArea');if(!area)return;
window.__bankFocus=true;
var fi=0;
function on(){try{return localStorage.getItem('primerFocus')!=='0';}catch(e){return true;}}
function cards(){return Array.prototype.slice.call(document.querySelectorAll('#quizArea .q-card'));}
var st=document.createElement('style');
st.textContent='.focus-bar{position:sticky;bottom:0;z-index:30;display:none;align-items:center;gap:.5rem;background:#0c0f14ee;backdrop-filter:blur(6px);border-top:1px solid #1e293b;padding:.6rem .5rem;margin:0 -.5rem}'
+'.focus-on .focus-bar{display:flex}.focus-bar button{border:none;border-radius:8px;padding:.7rem 1rem;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit}'
+'.fb-prev{background:#1e293b;color:#e2e8f0}.fb-next{background:#7c3aed;color:#fff;flex:1}.fb-next.ready{background:#22c55e;color:#04210f;box-shadow:0 0 0 2px #22c55e55}'
+'.fb-prev:disabled{opacity:.35;cursor:not-allowed}.fb-count{color:#94a3b8;font-size:.8rem;min-width:5.5rem;text-align:center}'
+'.fb-mode{background:transparent;color:#94a3b8;border:1px solid #334155!important;font-size:.72rem!important;padding:.45rem .6rem!important}'
+'.focus-on #quizArea .q-card{display:none}.focus-on #quizArea .q-card.focus-cur{display:block}.focus-on .mk-fab{bottom:5rem}.focus-on a[href*="weak-drill"]{bottom:4.6rem!important}'
+'.focus-toggle-top{display:flex;justify-content:flex-end;margin:.25rem 0 .75rem}.focus-toggle-top button{background:transparent;color:#94a3b8;border:1px solid #334155;border-radius:8px;padding:.4rem .8rem;font-size:.75rem;cursor:pointer;font-family:inherit}';
document.head.appendChild(st);
var bar=document.createElement('div');bar.className='focus-bar';bar.id='focusBar';
bar.innerHTML='<button type="button" class="fb-prev" id="fbPrev">&#8249; Prev</button><span class="fb-count" id="fbCount"></span><button type="button" class="fb-next" id="fbNext">Next &#8250;</button><button type="button" class="fb-mode" id="fbMode">Show all</button>';
area.parentNode.insertBefore(bar,area.nextSibling);
var top=document.createElement('div');top.className='focus-toggle-top';top.innerHTML='<button type="button" id="fbModeTop"></button>';
area.parentNode.insertBefore(top,area);
function done(c){return /answered-/.test(c.className);}
function bumpBar(){var cs=cards();if(!cs.length)return;
document.getElementById('fbCount').textContent='Question '+(fi+1)+' of '+cs.length;
document.getElementById('fbPrev').disabled=fi<=0;
var nx=document.getElementById('fbNext');nx.classList.toggle('ready',!!cs[fi]&&done(cs[fi]));nx.innerHTML=fi>=cs.length-1?'Finish &#8250;':'Next &#8250;';
document.getElementById('fbModeTop').textContent='One at a time: '+(on()?'on':'off');
document.getElementById('fbMode').textContent=on()?'Show all':'One at a time';}
function show(i,scroll){var cs=cards();if(!cs.length)return;fi=Math.max(0,Math.min(cs.length-1,i));
cs.forEach(function(c,k){c.classList.toggle('focus-cur',k===fi);});bumpBar();
if(scroll&&on()){var t=cs[fi].getBoundingClientRect().top+window.pageYOffset-70;window.scrollTo({top:Math.max(0,t),behavior:'smooth'});}}
function refresh(keep){document.body.classList.toggle('focus-on',on());if(cards().length)show(keep?fi:0,false);}
function next(){var cs=cards();if(fi<cs.length-1){show(fi+1,true);return;}
var open=cs.findIndex(function(c){return !done(c);});if(open>=0){show(open,true);return;}
var sc=document.getElementById('scoreCard');if(sc){sc.style.display='block';sc.scrollIntoView({behavior:'smooth'});}}
function toggle(){try{localStorage.setItem('primerFocus',on()?'0':'1');}catch(e){}refresh(true);}
document.getElementById('fbPrev').onclick=function(){show(fi-1,true);};
document.getElementById('fbNext').onclick=next;
document.getElementById('fbMode').onclick=toggle;document.getElementById('fbModeTop').onclick=toggle;
var orig=window.buildQuiz;window.buildQuiz=function(){var r=orig.apply(this,arguments);refresh(false);return r;};
if(window.MutationObserver)new MutationObserver(function(){bumpBar();}).observe(area,{attributes:true,attributeFilter:['class'],subtree:true});
refresh(false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* ---- Remote / keyboard control (Scope mini remote and any keyboard) ----
   Works on both quiz engines through the shared DOM: .q-card, .opt, .btn-submit, .q-undo, #fbNext, #fbPrev.
   Scope remote as tested 2026-10-10: top B=1, right A=4, left=2, bottom=Space, small left=y, small right=h, big=u (it can also emit ArrowUp/ArrowDown).
   Keyboard: A to D pick an option directly. Preference key: remoteKeys ('0' = off). */
(function(){
var KEY='remoteKeys',idx=0,lastCard=null,lastU=0,lastPick=0,active=false,pill=null,panel=null;
function on(){try{return localStorage.getItem(KEY)!=='0';}catch(e){return true;}}
function cards(){return [].slice.call(document.querySelectorAll('#quizArea .q-card'));}
function isDone(c){return /answered-/.test(c.className);}
function cur(){var f=document.querySelector('#quizArea .q-card.focus-cur');if(f)return f;var cs=cards();for(var i=0;i<cs.length;i++){if(!isDone(cs[i]))return cs[i];}return cs[cs.length-1]||null;}
function opts(c){return c?[].slice.call(c.querySelectorAll('.opt')):[];}
function paint(c){[].forEach.call(document.querySelectorAll('.opt.rm-cur'),function(e){e.classList.remove('rm-cur');});if(!active||!c||isDone(c))return;var o=opts(c);if(o[idx])o[idx].classList.add('rm-cur');}
function sync(){var c=cur();if(c!==lastCard){lastCard=c;idx=0;}paint(c);return c;}
function selCount(c){return c.querySelectorAll('.opt.selected').length;}
function move(c,d){var o=opts(c);if(!o.length)return;idx=(idx+d+o.length)%o.length;paint(c);if(o[idx].scrollIntoView)o[idx].scrollIntoView({block:'nearest'});}
function pick(c,i){var o=opts(c);if(!o[i])return;idx=i;lastPick=Date.now();o[i].click();paint(c);}
function submit(c){var b=c.querySelector('.btn-submit');if(!b||b.disabled)return false;var wait=Math.max(0,420-(Date.now()-lastPick));setTimeout(function(){b.click();},wait);return true;}
function next(c){if(!isDone(c))return;var n=document.getElementById('fbNext');if(n){n.click();return;}var cs=cards(),i=cs.indexOf(c);if(cs[i+1])cs[i+1].scrollIntoView({block:'start'});}
function prev(c){var p=document.getElementById('fbPrev');if(p){p.click();return;}var cs=cards(),i=cs.indexOf(c);if(i>0)cs[i-1].scrollIntoView({block:'start'});}
function undo(c){var u=c.querySelector('.q-undo');if(u)u.click();}
function smart(c){if(isDone(c)){next(c);return;}if(selCount(c)>0){submit(c);return;}pick(c,idx);}
function scrollPage(d){window.scrollBy({top:d*Math.round(window.innerHeight*0.6),behavior:'smooth'});}
function typing(e){var t=e.target;return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable);}
function handle(e){
if(!on()||typing(e)||e.ctrlKey||e.metaKey||e.altKey)return;
var k=e.key,c=sync();if(!c)return;
var ar=(k==='ArrowUp'||k==='ArrowDown');
if(ar&&Date.now()-lastU<200){e.preventDefault();return;} /* big button sends u plus arrows */
var done=isDone(c),used=true;
if(k==='h'||k==='ArrowDown'){if(done)scrollPage(1);else move(c,1);}
else if(k==='y'||k==='ArrowUp'){if(done)scrollPage(-1);else move(c,-1);}
else if(k===' '){if(done)scrollPage(1);else pick(c,idx);}
else if(k==='4'){if(!done)submit(c);else next(c);}
else if(k==='1'){undo(c);}
else if(k==='2'){prev(c);}
else if(k==='u'||k==='Enter'){lastU=Date.now();smart(c);}
else if(/^[a-dA-D]$/.test(k)&&!done){pick(c,k.toLowerCase().charCodeAt(0)-97);}
else used=false;
if(used){active=true;e.preventDefault();setTimeout(function(){paint(sync());},60);}
}
function ui(){
var st=document.createElement('style');st.textContent='.opt.rm-cur{outline:3px solid #7dd3fc;outline-offset:2px}#rmPill{position:fixed;left:10px;bottom:10px;z-index:60;width:34px;height:34px;border-radius:50%;background:#13181f;color:#7dd3fc;border:1px solid #1e3a4f;font-size:16px;cursor:pointer;padding:0;line-height:1}#rmPanel{position:fixed;left:10px;bottom:52px;z-index:60;background:#13181f;color:#e2e8f0;border:1px solid #1e3a4f;border-radius:10px;padding:10px 12px;font:13px/1.55 system-ui,sans-serif;max-width:260px;display:none}#rmPanel b{color:#7dd3fc}#rmPanel button{margin-top:6px;background:#0c1f2e;color:#7dd3fc;border:1px solid #1e3a4f;border-radius:8px;padding:6px 10px;font-size:13px}';
document.head.appendChild(st);
pill=document.createElement('button');pill.id='rmPill';pill.type='button';pill.title='Remote keys';pill.textContent='⌨';
panel=document.createElement('div');panel.id='rmPanel';
function fill(){panel.innerHTML='<b>Remote keys</b> '+(on()?'on':'off')+'<br>Small L / R: option up / down<br>Bottom: pick the highlighted option<br>Big: pick, submit, next (one button)<br>A (right): submit &middot; B (top): undo<br>Left: previous question<br>After submit, up / down scroll the rationale<br>Keyboard: A to D pick an option<br><button type="button" id="rmTog">'+(on()?'Turn off':'Turn on')+'</button>';
document.getElementById('rmTog').onclick=function(){try{localStorage.setItem(KEY,on()?'0':'1');}catch(x){}active=false;paint(null);fill();};}
pill.onclick=function(){panel.style.display=panel.style.display==='block'?'none':'block';fill();};
document.body.appendChild(pill);document.body.appendChild(panel);
}
function boot(){if(!document.getElementById('quizArea'))return;ui();document.addEventListener('keydown',handle,true);setInterval(function(){if(active)sync();},400);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
