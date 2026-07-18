/* Shared primer harness — reads globals EXAM_ID, EXAM_LABEL, BLOCKS, ALL_Q.
   Each per-chapter primer is a small shell that defines those four globals,
   links primer.css, then includes this file. */
let answered={};
let selections={};

function _seedHash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function _shuffleAllOptions(){if(window.__optsShuffled)return;window.__optsShuffled=true;ALL_Q.forEach(function(q){if(!q.options||q.options.length<2)return;var a=q.options.slice();var rnd=mulberry32(_seedHash(EXAM_ID+'#'+q.id));for(var i=a.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}var L=['A','B','C','D','E','F'];for(var k=0;k<a.length;k++){a[k].letter=L[k];}q.options=a;});}

function buildQuiz(){
_shuffleAllOptions();
const area=document.getElementById('quizArea');area.innerHTML='';
ALL_Q.forEach((q,idx)=>{
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
const card=document.getElementById('qcard-'+qId);card.classList.add(ok?'answered-correct':'answered-wrong');
const btn=document.getElementById('btn-'+qId);btn.disabled=true;btn.textContent=ok?'Correct!':'Review the reasoning';
updateProgress();saveState();
if(Object.keys(answered).length===ALL_Q.length)showScore();
}

function updateProgress(){document.getElementById('progressBar').style.width=(Object.keys(answered).length/ALL_Q.length*100)+'%';}

function _buildBreakdown(){
const tally={};
ALL_Q.forEach(q=>{if(!answered[q.id])return;const b=q.block;if(!tally[b])tally[b]={c:0,t:0};tally[b].t++;const cc=q.options.filter(o=>o.correct).map(o=>o.letter);const s=selections[q.id]||[];if(cc.length===s.length&&cc.every(l=>s.includes(l)))tally[b].c++;});
let html='';
Object.keys(BLOCKS).forEach(b=>{if(!tally[b])return;const t=tally[b];const pct=Math.round(t.c/t.t*100);const col=pct>=80?'#22c55e':pct>=66?'#fbbf24':'#f87171';html+='<div class="breakdown-row"><span class="bd-label">'+BLOCKS[b]+'</span><span class="bd-score" style="color:'+col+'">'+t.c+'/'+t.t+' &middot; '+pct+'%</span></div>';});
document.getElementById('breakdownArea').innerHTML=html;
}

function showScore(doSave){
let correct=0;ALL_Q.forEach(q=>{if(answered[q.id]){const c=q.options.filter(o=>o.correct).map(o=>o.letter);const s=selections[q.id]||[];if(c.length===s.length&&c.every(l=>s.includes(l)))correct++;}});
const pct=Math.round(correct/ALL_Q.length*100);
document.getElementById('finalScore').textContent=pct+'%';document.getElementById('finalText').textContent=correct+' of '+ALL_Q.length+' correct';
_buildBreakdown();
document.getElementById('scoreCard').style.display='block';document.getElementById('scoreCard').scrollIntoView({behavior:'smooth'});
const rec={score:pct,correct:correct,total:ALL_Q.length,date:new Date().toLocaleDateString()};
if(doSave===false)return;
localStorage.setItem(EXAM_ID+'-last',JSON.stringify(rec));localStorage.setItem(EXAM_ID+'-label',EXAM_LABEL);
const hist=JSON.parse(localStorage.getItem('examHistory')||'[]').filter(function(e){return e.examId!==EXAM_ID;});
hist.push({examId:EXAM_ID,examLabel:EXAM_LABEL,date:new Date().toISOString(),score:pct,correct:correct,total:ALL_Q.length});
localStorage.setItem('examHistory',JSON.stringify(hist.slice(-100)));
}

function restartQuiz(){answered={};selections={};localStorage.removeItem(EXAM_ID+'-state');document.getElementById('scoreCard').style.display='none';window.__optsShuffled=false;buildQuiz();window.scrollTo({top:0,behavior:'smooth'});}
function saveState(){localStorage.setItem(EXAM_ID+'-state',JSON.stringify({answered:answered,selections:selections}));}
function loadState(){
const saved=localStorage.getItem(EXAM_ID+'-state');
if(saved){const st=JSON.parse(saved);answered=st.answered||{};selections=st.selections||{};
Object.keys(answered).forEach(qId=>{const q=ALL_Q.find(x=>x.id==qId);if(!q)return;const c=q.options.filter(o=>o.correct).map(o=>o.letter);const s=selections[qId]||[];const ok=c.length===s.length&&c.every(l=>s.includes(l));q.options.forEach(o=>{const el=document.getElementById('opt-'+qId+'-'+o.letter);if(el){if(s.includes(o.letter))el.classList.add('selected');if(o.correct)el.classList.add('correct-show');else if(s.includes(o.letter)&&!o.correct)el.classList.add('wrong-show');el.style.cursor='default';const r=document.getElementById('rat-'+qId+'-'+o.letter);if(r)r.style.display='block';}});const t=document.getElementById('tip-'+qId);if(t)t.style.display='block';const cd=document.getElementById('qcard-'+qId);if(cd)cd.classList.add(ok?'answered-correct':'answered-wrong');const btn=document.getElementById('btn-'+qId);if(btn){btn.disabled=true;btn.textContent=ok?'Correct!':'Review the reasoning';}});
updateProgress();if(Object.keys(answered).length===ALL_Q.length)showScore(false);}
const last=localStorage.getItem(EXAM_ID+'-last');
if(last){const r=JSON.parse(last);document.getElementById('lastAttempt').style.display='block';document.getElementById('lastScore').textContent=r.score+'%';document.getElementById('lastDate').textContent=r.date;}
}
buildQuiz();
