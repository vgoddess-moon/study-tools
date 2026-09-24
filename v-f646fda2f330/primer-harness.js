/* Shared primer harness — reads globals EXAM_ID, EXAM_LABEL, BLOCKS, ALL_Q.
   Each per-chapter primer is a small shell that defines those four globals,
   links primer.css, then includes this file.

   Optional, opt-in per page:
     <div id="harnessFilterBar"></div>   → renders block/SATA/missed filter buttons
     elements with [data-loop="<blockKey>"] → shown/hidden to match the active block */
let answered={};
let selections={};
let __filterMode='all';

function _seedHash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function _shuffleAllOptions(){if(window.__optsShuffled)return;window.__optsShuffled=true;ALL_Q.forEach(function(q){if(!q.options||q.options.length<2)return;var a=q.options.slice();var rnd=mulberry32(_seedHash(EXAM_ID+'#'+q.id));for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}var L=['A','B','C','D','E','F'];for(var k=0;k<a.length;k++){a[k].letter=L[k];}q.options=a;});}

function _isCorrect(q){const c=q.options.filter(o=>o.correct).map(o=>o.letter);const s=selections[q.id]||[];return c.length===s.length&&c.every(l=>s.includes(l));}
// SATA partial credit: all right = 1.0, right but incomplete = 0.5, any wrong option selected = 0.
function _credit(q){
if(_isCorrect(q))return 1;
if(!q.sata)return 0;
const c=q.options.filter(o=>o.correct).map(o=>o.letter);const s=selections[q.id]||[];
if(!s.length||s.some(l=>!c.includes(l)))return 0;
return 0.5;
}
function _fmt(n){return n%1?n.toFixed(1):String(n);}
function _activeQ(){
if(__filterMode==='all')return ALL_Q;
if(__filterMode==='sata')return ALL_Q.filter(q=>q.sata);
if(__filterMode==='missed')return ALL_Q.filter(q=>window.__missedIds&&window.__missedIds.includes(q.id));
return ALL_Q.filter(q=>q.block===__filterMode);
}
function _answeredCount(){return _activeQ().filter(q=>answered[q.id]).length;}

function buildQuiz(){
_shuffleAllOptions();
const area=document.getElementById('quizArea');area.innerHTML='';
_activeQ().forEach((q,idx)=>{
const card=document.createElement('div');card.className='q-card';card.id='qcard-'+q.id;
let badges='<span class="badge badge-blk">CH '+q.chapter+'</span>';
if(q.type)badges+='<span class="badge badge-type">'+q.type+'</span>';
if(q.trap)badges+='<span class="badge badge-trap">Trap</span>';
if(q.sata)badges+='<span class="badge badge-sata">SATA</span>';
const optsHtml=q.options.map(o=>'<div class="opt" id="opt-'+q.id+'-'+o.letter+'" onclick="selectOption('+q.id+',\''+o.letter+'\','+(q.sata?true:false)+')"><div class="opt-letter">'+o.letter+'.</div><div class="opt-text">'+o.text+'<div class="opt-rationale" id="rat-'+q.id+'-'+o.letter+'">'+o.rationale+'</div></div></div>').join('');
const sataHint=q.sata?'<div class="sata-hint">Select ALL that apply</div>':'';
card.innerHTML='<div class="q-top"><span class="q-num">Q'+(idx+1)+'</span>'+badges+'</div><div class="q-stem">'+q.stem+'</div>'+sataHint+'<div class="opts">'+optsHtml+'</div><button class="btn-submit" id="btn-'+q.id+'" onclick="submitAnswer('+q.id+')" disabled>Submit</button><div class="vocab-tip" id="tip-'+q.id+'">'+q.vocabTip+'</div>';
area.appendChild(card);
});
loadState();
}

function selectOption(qId,letter,isSata){
if(answered[qId])return;if(!selections[qId])selections[qId]=[];
const el=document.getElementById('opt-'+qId+'-'+letter);
if(isSata){if(selections[qId].includes(letter)){selections[qId]=selections[qId].filter(l=>l!==letter);el.classList.remove('selected');}else{selections[qId].push(letter);el.classList.add('selected');}}
else{selections[qId].forEach(l=>{const p=document.getElementById('opt-'+qId+'-'+l);if(p)p.classList.remove('selected');});selections[qId]=[letter];el.classList.add('selected');}
document.getElementById('btn-'+qId).disabled=selections[qId].length===0;
}

function submitAnswer(qId){
if(answered[qId])return;answered[qId]=true;
const q=ALL_Q.find(x=>x.id===qId);
const correct=q.options.filter(o=>o.correct).map(o=>o.letter);
const ok=correct.length===selections[qId].length&&correct.every(l=>selections[qId].includes(l));
q.options.forEach(o=>{const el=document.getElementById('opt-'+qId+'-'+o.letter);el.style.cursor='default';if(o.correct)el.classList.add('correct-show');else if(selections[qId].includes(o.letter)&&!o.correct)el.classList.add('wrong-show');document.getElementById('rat-'+qId+'-'+o.letter).style.display='block';});
document.getElementById('tip-'+qId).style.display='block';
const cr=_credit(q);
const card=document.getElementById('qcard-'+qId);card.classList.add(ok?'answered-correct':cr===0.5?'answered-partial':'answered-wrong');
const btn=document.getElementById('btn-'+qId);btn.disabled=true;btn.textContent=ok?'Correct!':cr===0.5?'Half credit — you missed one':'Review the reasoning';
updateProgress();saveState();
if(_answeredCount()===_activeQ().length)showScore();
}

function updateProgress(){const t=_activeQ().length;document.getElementById('progressBar').style.width=(t?_answeredCount()/t*100:0)+'%';}

function _buildBreakdown(){
const tally={};
_activeQ().forEach(q=>{if(!answered[q.id])return;const b=q.block;if(!tally[b])tally[b]={c:0,t:0};tally[b].t++;tally[b].c+=_credit(q);});
let html='';
Object.keys(BLOCKS).forEach(b=>{if(!tally[b])return;const t=tally[b];const pct=Math.round(t.c/t.t*100);const col=pct>=80?'#22c55e':pct>=66?'#fbbf24':'#f87171';html+='<div class="breakdown-row"><span class="bd-label">'+BLOCKS[b]+'</span><span class="bd-score" style="color:'+col+'">'+_fmt(t.c)+'/'+t.t+' &middot; '+pct+'%</span></div>';});
document.getElementById('breakdownArea').innerHTML=html;
}

function showScore(doSave){
const act=_activeQ();
let correct=0;act.forEach(q=>{if(answered[q.id])correct+=_credit(q);});
const total=act.length;
const pct=total?Math.round(correct/total*100):0;
document.getElementById('finalScore').textContent=pct+'%';document.getElementById('finalText').textContent=_fmt(correct)+' of '+total+' correct';
_buildBreakdown();
_syncMissedBtn();
document.getElementById('scoreCard').style.display='block';document.getElementById('scoreCard').scrollIntoView({behavior:'smooth'});
if(doSave===false)return;
const tag=__filterMode==='all'?'':' ['+_filterLabel(__filterMode)+']';
const rec={score:pct,correct:correct,total:total,date:new Date().toLocaleDateString(),filter:__filterMode};
localStorage.setItem(EXAM_ID+'-last',JSON.stringify(rec));localStorage.setItem(EXAM_ID+'-label',EXAM_LABEL);
const hist=JSON.parse(localStorage.getItem('examHistory')||'[]');
hist.push({examId:EXAM_ID,examLabel:EXAM_LABEL+tag,date:new Date().toISOString(),score:pct,correct:correct,total:total});
localStorage.setItem('examHistory',JSON.stringify(hist.slice(-1000)));
}

function _filterLabel(m){
if(m==='all')return 'All';
if(m==='sata')return 'SATA only';
if(m==='missed')return 'Drill missed';
return (typeof BLOCKS!=='undefined'&&BLOCKS[m])?BLOCKS[m]:m;
}

/* ---- Drill missed ---- */
function _missedIds(){return _activeQ().filter(q=>answered[q.id]&&!_isCorrect(q)).map(q=>q.id);}
function _syncMissedBtn(){
const btn=document.getElementById('drillMissedBtn');if(!btn)return;
const n=_missedIds().length;
btn.style.display=n>0?'block':'none';
btn.textContent='Drill missed — '+n+(n===1?' question':' questions');
}
function drillMissed(){
const ids=_missedIds();if(!ids.length)return;
window.__missedIds=ids;
ids.forEach(id=>{delete answered[id];delete selections[id];});
saveState();
__filterMode='missed';
_syncFilterBtns();_syncLoopSections();
document.getElementById('scoreCard').style.display='none';
buildQuiz();
document.getElementById('quizArea').scrollIntoView({behavior:'smooth',block:'start'});
}

/* ---- Filter bar (opt-in: page must contain #harnessFilterBar) ---- */
function applyBlockFilter(mode){
const switching=mode!==__filterMode;
__filterMode=mode;
// Entering a single loop (or SATA-only) is a fresh drill. restartQuiz() only clears
// what is in scope, so answers from an earlier pass over the full set used to survive
// and reappear pre-clicked. 'all' is exempt because it is the review view and wiping
// it would throw away a half-finished full run; 'missed' is exempt because
// drillMissed() already cleared exactly those ids.
if(switching&&mode!=='missed'&&mode!=='all'){
_activeQ().forEach(q=>{delete answered[q.id];delete selections[q.id];});
saveState();}
_syncFilterBtns();_syncLoopSections();
document.getElementById('scoreCard').style.display='none';
buildQuiz();
window.scrollTo({top:0,behavior:'smooth'});
}
function _syncFilterBtns(){
document.querySelectorAll('#harnessFilterBar .fbtn').forEach(b=>{
b.classList.toggle('active',b.getAttribute('data-f')===__filterMode);});
const note=document.getElementById('harnessFilterNote');
if(note){const n=_activeQ().length;
note.textContent=__filterMode==='all'?'All '+n+' questions, every loop mixed together. Use this once each loop already holds on its own.'
:__filterMode==='sata'?n+' select-all questions. Scored at half credit: all right = full point, right but incomplete = half, one wrong option = zero.'
:__filterMode==='missed'?n+' question'+(n===1?'':'s')+' you missed, reset and reshuffled. Answer them again.'
:n+' questions from '+_filterLabel(__filterMode)+' only. The teaching panel above matches this loop.';}
}
function _syncLoopSections(){
const secs=document.querySelectorAll('[data-loop]');if(!secs.length)return;
secs.forEach(el=>{
const show=(__filterMode==='all'||__filterMode==='sata'||__filterMode==='missed')||el.getAttribute('data-loop')===__filterMode;
el.style.display=show?'':'none';});
}
function _buildFilterBar(){
const bar=document.getElementById('harnessFilterBar');if(!bar)return;
let html='<span class="filter-label">Loop:</span>';
html+='<button class="fbtn fbtn-hot active" data-f="all" onclick="applyBlockFilter(\'all\')">All '+ALL_Q.length+'</button>';
const short=window.BLOCK_SHORT||{};
Object.keys(BLOCKS).forEach(b=>{
const n=ALL_Q.filter(q=>q.block===b).length;if(!n)return;
html+='<button class="fbtn" data-f="'+b+'" onclick="applyBlockFilter(\''+b+'\')">'+(short[b]||BLOCKS[b])+' &middot; '+n+'</button>';});
const ns=ALL_Q.filter(q=>q.sata).length;
if(ns)html+='<button class="fbtn fbtn-sata" data-f="sata" onclick="applyBlockFilter(\'sata\')">SATA only &middot; '+ns+'</button>';
// The page restores the last session on load, so landing on it shows whatever was
// already answered. Without this there is no way to wipe that and start over.
html+='<button class="fbtn fbtn-fresh" data-f="__fresh" onclick="clearAllAnswers()">Start fresh</button>';
bar.innerHTML=html;
if(!document.getElementById('harnessFilterNote')){
const note=document.createElement('div');note.className='filter-note';note.id='harnessFilterNote';
bar.parentNode.insertBefore(note,bar.nextSibling);}
_syncFilterBtns();
}
function clearAllAnswers(){
answered={};selections={};
localStorage.removeItem(EXAM_ID+'-state');
window.__missedIds=null;
if(__filterMode==='missed')__filterMode='all';
_syncFilterBtns();_syncLoopSections();
document.getElementById('scoreCard').style.display='none';
window.__optsShuffled=false;
buildQuiz();
window.scrollTo({top:0,behavior:'smooth'});
}

function _buildMissedBtn(){
const card=document.getElementById('scoreCard');if(!card||document.getElementById('drillMissedBtn'))return;
const btn=document.createElement('button');
btn.className='btn-missed';btn.id='drillMissedBtn';btn.type='button';
btn.setAttribute('onclick','drillMissed()');
btn.textContent='Drill missed';
const restart=card.querySelector('.btn-restart');
if(restart&&restart.parentNode===card)card.insertBefore(btn,restart.nextSibling);else card.appendChild(btn);
}

function restartQuiz(){
_activeQ().forEach(q=>{delete answered[q.id];delete selections[q.id];});
saveState();
// 'missed' is a transient drill, not a scope to stay stuck in — pages without a
// filter bar have no other way back to the full set.
if(__filterMode==='missed'){__filterMode='all';_syncFilterBtns();_syncLoopSections();}
document.getElementById('scoreCard').style.display='none';window.__optsShuffled=false;buildQuiz();window.scrollTo({top:0,behavior:'smooth'});}
function saveState(){localStorage.setItem(EXAM_ID+'-state',JSON.stringify({answered:answered,selections:selections}));}
function loadState(){
const saved=localStorage.getItem(EXAM_ID+'-state');
if(saved){const st=JSON.parse(saved);answered=st.answered||{};selections=st.selections||{};
Object.keys(answered).forEach(qId=>{const q=ALL_Q.find(x=>x.id==qId);if(!q)return;const c=q.options.filter(o=>o.correct).map(o=>o.letter);const s=selections[qId]||[];const ok=c.length===s.length&&c.every(l=>s.includes(l));q.options.forEach(o=>{const el=document.getElementById('opt-'+qId+'-'+o.letter);if(el){if(s.includes(o.letter))el.classList.add('selected');if(o.correct)el.classList.add('correct-show');else if(s.includes(o.letter)&&!o.correct)el.classList.add('wrong-show');el.style.cursor='default';const r=document.getElementById('rat-'+qId+'-'+o.letter);if(r)r.style.display='block';}});const t=document.getElementById('tip-'+qId);if(t)t.style.display='block';const cr=_credit(q);const cd=document.getElementById('qcard-'+qId);if(cd)cd.classList.add(ok?'answered-correct':cr===0.5?'answered-partial':'answered-wrong');const btn=document.getElementById('btn-'+qId);if(btn){btn.disabled=true;btn.textContent=ok?'Correct!':cr===0.5?'Half credit — you missed one':'Review the reasoning';}});
updateProgress();if(_activeQ().length&&_answeredCount()===_activeQ().length)showScore(false);}
const last=localStorage.getItem(EXAM_ID+'-last');
if(last){const r=JSON.parse(last);document.getElementById('lastAttempt').style.display='block';document.getElementById('lastScore').textContent=r.score+'%';document.getElementById('lastDate').textContent=r.date;}
}

function _buildMustKnows(){
const src=document.querySelector('.svg-card');
if(!src||document.querySelector('.mk-fab'))return;
const titleEl=src.querySelector('h3');
const title=titleEl?titleEl.textContent:'Labs & Must-Knows';
const fab=document.createElement('button');
fab.className='mk-fab';fab.type='button';
fab.setAttribute('aria-label','Show labs and must-knows');
fab.innerHTML='<span class="mk-ico">&#128204;</span>Must-Knows';
const overlay=document.createElement('div');
overlay.className='mk-overlay';
const panel=document.createElement('div');
panel.className='mk-panel';
panel.innerHTML='<div class="mk-panel-head"><h3>'+title+'</h3><button class="mk-close" type="button" aria-label="Close">&times;</button></div>'+src.outerHTML;
overlay.appendChild(panel);
document.body.appendChild(fab);document.body.appendChild(overlay);
function open(){overlay.classList.add('open');}
function close(){overlay.classList.remove('open');}
fab.addEventListener('click',open);
panel.querySelector('.mk-close').addEventListener('click',close);
overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
}

_buildFilterBar();
_buildMissedBtn();
// A drill page must open clean. Restoring the previous run meant landing on the
// page with questions already clicked, rationales open and Submit locked — the
// opposite of what a drill is for. The score itself is kept separately under
// EXAM_ID+'-last' and still shows in the "last attempt" card.
localStorage.removeItem(EXAM_ID+'-state');
buildQuiz();
_buildMustKnows();
