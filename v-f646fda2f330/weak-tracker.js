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
var MAP={"endocrine-loops.html":[["ms2","exam-5"]],"mat-ch10-primer.html":[["mat","exam-2"]],"mat-ch11-primer.html":[["mat","exam-2"]],"mat-ch12-primer.html":[["mat","exam-2"]],"mat-ch13-primer.html":[["mat","exam-2"]],"mat-ch14-primer.html":[["mat","exam-2"]],"mat-ch15-primer.html":[["mat","exam-3"]],"mat-ch2-primer.html":[["mat","exam-1"]],"mat-ch21-primer.html":[["mat","exam-3"]],"mat-ch22-primer.html":[["mat","exam-3"]],"mat-ch24-primer.html":[["mat","exam-3"]],"mat-ch25-primer.html":[["mat","exam-3"]],"mat-ch26-primer.html":[["mat","exam-3"]],"mat-ch3-primer.html":[["mat","exam-1"]],"mat-ch34-primer.html":[["mat","exam-3"]],"mat-ch4-primer.html":[["mat","exam-1"]],"mat-ch5-primer.html":[["mat","exam-1"]],"mat-ch6-primer.html":[["mat","exam-1"]],"mat-ch7-primer.html":[["mat","exam-1"]],"mat-ch8-primer.html":[["mat","exam-1"]],"mat-ch9-labor-primer.html":[["mat","exam-2"]],"mat-ch9-primer.html":[["mat","exam-2"]],"mat-ex1-mock-A.html":[["mat","exam-1"]],"mat-ex1-mock-B.html":[["mat","exam-1"]],"mat-ex1-mock-C.html":[["mat","exam-1"]],"mat-ex1-mock-D.html":[["mat","exam-1"]],"mat-ex1-retake-blueprint.html":[["mat","exam-1"]],"mat-ex2-gap1.html":[["mat","exam-2"]],"mat-ex2-gap2.html":[["mat","exam-2"]],"mat-ex3-bank.html":[["mat","exam-3"]],"mat-ex3-gap1.html":[["mat","exam-3"]],"mat-ex3-gap2.html":[["mat","exam-3"]],"mat-ex3-gap3.html":[["mat","exam-3"]],"mat-ex3-gap4.html":[["mat","exam-3"]],"mat-ex3-gap5.html":[["mat","exam-3"]],"mat-ex3-gap6.html":[["mat","exam-3"]],"mat-ex3-terms1.html":[["mat","exam-3"]],"mat-ex3-terms2.html":[["mat","exam-3"]],"mat-ex3-terms3.html":[["mat","exam-3"]],"mat-ex3-terms4.html":[["mat","exam-3"]],"mat-exam-sim.html":[["mat","exam-1"]],"mat-fhr-veal-chop.html":[["mat","exam-1"]],"mat-lecture1-callouts.html":[["mat","exam-1"]],"mat-retake-bank.html":[["mat","exam-1"]],"mat-sg-bank.html":[["mat","exam-1"]],"mat-sg-ex2-answers.html":[["mat","exam-2"]],"mat-sg-la-drill.html":[["mat","exam-1"]],"mat-vocab-patho.html":[["mat","exam-1"],["mat","exam-3"]],"ms2-ch33-primer.html":[["ms2","exam-2"]],"ms2-ch34-primer.html":[["ms2","exam-2"]],"ms2-ch35-primer.html":[["ms2","exam-2"]],"ms2-ch36-primer.html":[["ms2","exam-2"]],"ms2-ch37-primer.html":[["ms2","exam-2"]],"ms2-ch38-primer.html":[["ms2","exam-2"]],"ms2-ch39-primer.html":[["ms2","exam-3"]],"ms2-ch40-primer.html":[["ms2","exam-3"]],"ms2-ch41-primer.html":[["ms2","exam-3"]],"ms2-ch42-primer.html":[["ms2","exam-3"]],"ms2-ch43-primer.html":[["ms2","exam-3"]],"ms2-ch44-primer.html":[["ms2","exam-3"]],"ms2-ch45-primer.html":[["ms2","exam-4"]],"ms2-ch46-primer.html":[["ms2","exam-4"]],"ms2-ch47-primer.html":[["ms2","exam-4"]],"ms2-ch48-primer.html":[["ms2","exam-4"]],"ms2-ch49-primer.html":[["ms2","exam-4"]],"ms2-ch50-primer.html":[["ms2","exam-4"]],"ms2-ch51-primer.html":[["ms2","exam-4"]],"ms2-ch52-primer.html":[["ms2","exam-4"]],"ms2-ch53-primer.html":[["ms2","exam-5"]],"ms2-ch54-primer.html":[["ms2","exam-5"]],"ms2-ch55-primer.html":[["ms2","exam-5"]],"ms2-ch56-primer.html":[["ms2","exam-5"]],"ms2-ch61-62-emphasis.html":[["ms2","exam-1"]],"ms2-ch61-primer.html":[["ms2","exam-1"]],"ms2-ch62-primer.html":[["ms2","exam-1"]],"ms2-ch63-65-emphasis.html":[["ms2","exam-1"]],"ms2-ch63-primer.html":[["ms2","exam-1"]],"ms2-ch64-primer.html":[["ms2","exam-1"]],"ms2-ch65-primer.html":[["ms2","exam-1"]],"ms2-ex1-mock-A.html":[["ms2","exam-1"]],"ms2-ex1-mock-B.html":[["ms2","exam-1"]],"ms2-ex1-vocab-drill.html":[["ms2","exam-1"]],"ms2-ex2-igna-bank.html":[["ms2","exam-2"]],"ms2-ex2-labs-drugs.html":[["ms2","exam-2"]],"ms2-ex2-mock50.html":[["ms2","exam-2"]],"ms2-ex2-nerves-sci.html":[["ms2","exam-2"]],"ms2-ex2-recap-mock-1.html":[["ms2","exam-2"]],"ms2-ex2-recap-mock-2.html":[["ms2","exam-2"]],"ms2-ex2-recap-mock-3.html":[["ms2","exam-2"]],"ms2-ex2-retake-mock-A.html":[["ms2","exam-2"]],"ms2-ex2-retake-mock-B.html":[["ms2","exam-2"]],"ms2-ex2-sim.html":[["ms2","exam-2"]],"ms2-ex3-gap1.html":[["ms2","exam-3"]],"ms2-ex3-gap2.html":[["ms2","exam-3"]],"ms2-ex3-igna-bank.html":[["ms2","exam-3"]],"ms2-ex4-gap1.html":[["ms2","exam-4"]],"ms2-ex4-gap2.html":[["ms2","exam-4"]],"ms2-ex4-gap3.html":[["ms2","exam-4"]],"ms2-ex4-gap4.html":[["ms2","exam-4"]],"ms2-ex4-igna-bank.html":[["ms2","exam-4"]],"ms2-ex4-terms1.html":[["ms2","exam-4"]],"ms2-ex4-terms2.html":[["ms2","exam-4"]],"ms2-ex4-terms3.html":[["ms2","exam-4"]],"ms2-ex4-terms4.html":[["ms2","exam-4"]],"ms2-ex4-terms5.html":[["ms2","exam-4"]],"ms2-ex5-igna-bank.html":[["ms2","exam-5"]],"ms2-ex5-terms1.html":[["ms2","exam-5"]],"ms2-ex5-terms2.html":[["ms2","exam-5"]],"ms2-ex5-terms3.html":[["ms2","exam-5"]],"ms2-ex5-terms4.html":[["ms2","exam-5"]],"ms2-vocab-patho.html":[["ms2","exam-1"],["ms2","exam-2"],["ms2","exam-3"]]};
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
