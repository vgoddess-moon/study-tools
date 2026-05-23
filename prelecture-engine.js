/* Shared pre-lecture primer engine. Each page sets:
   window.QUIZ_ID, window.QUIZ_LABEL, window.QUIZ_CH, window.QUIZ_QUESTIONS */
var EXAM_ID = window.QUIZ_ID;
var EXAM_LABEL = window.QUIZ_LABEL;
var CH = window.QUIZ_CH;
var questions = window.QUIZ_QUESTIONS || [];
var answered = {};
var selections = {};

document.getElementById('quizRoot').innerHTML =
  '<div class="last-attempt" id="lastAttempt"><div>Last Attempt: <span class="score-val" id="lastScore">&mdash;</span> &middot; <span id="lastDate">&mdash;</span></div></div>' +
  '<div class="progress-wrap"><div class="progress-bar" id="progressBar" style="width:0%"></div></div>' +
  '<div id="quizArea"></div>' +
  '<div class="score-card" id="scoreCard">' +
    '<h2>Primer Complete</h2>' +
    '<div class="big-score" id="finalScore">0%</div>' +
    '<p id="finalText" style="color:#94a3b8;margin-bottom:.5rem"></p>' +
    '<p style="color:#5eead4;font-size:.85rem">Now you\'re primed &mdash; lecture will feel like review instead of brand-new.</p>' +
    '<button class="btn-restart" onclick="restartQuiz()">Restart Primer</button>' +
  '</div>';

function buildQuiz(){
  var area=document.getElementById('quizArea');
  area.innerHTML='';
  questions.forEach(function(q,idx){
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
  if(Object.keys(answered).length===questions.length)showScore();
}

function updateProgress(){
  var pct=(Object.keys(answered).length/questions.length)*100;
  document.getElementById('progressBar').style.width=pct+'%';
}

function showScore(){
  var correct=0;
  questions.forEach(function(q){
    if(answered[q.id]){
      var correctLetters=q.options.filter(function(o){return o.correct;}).map(function(o){return o.letter;});
      var sel=selections[q.id]||[];
      if(correctLetters.length===sel.length&&correctLetters.every(function(l){return sel.indexOf(l)>-1;}))correct++;
    }
  });
  var pct=Math.round((correct/questions.length)*100);
  document.getElementById('finalScore').textContent=pct+'%';
  document.getElementById('finalText').textContent=correct+' of '+questions.length+' correct';
  document.getElementById('scoreCard').style.display='block';
  document.getElementById('scoreCard').scrollIntoView({behavior:'smooth'});
  var record={score:pct,correct:correct,total:questions.length,date:new Date().toLocaleDateString()};
  localStorage.setItem(EXAM_ID+'-last',JSON.stringify(record));
  localStorage.setItem(EXAM_ID+'-label',EXAM_LABEL);
  var hist=JSON.parse(localStorage.getItem('examHistory')||'[]');
  hist.push({examId:EXAM_ID,examLabel:EXAM_LABEL,date:new Date().toISOString(),score:pct,correct:correct,total:questions.length});
  localStorage.setItem('examHistory',JSON.stringify(hist.slice(-20)));
}

function restartQuiz(){
  answered={};
  selections={};
  localStorage.removeItem(EXAM_ID+'-state');
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
      q.options.forEach(function(o){
        var el=document.getElementById('opt-'+qId+'-'+o.letter);
        if(sel.indexOf(o.letter)>-1)el.classList.add('selected');
        if(o.correct)el.classList.add('correct-show');
        else if(sel.indexOf(o.letter)>-1&&!o.correct)el.classList.add('wrong-show');
        el.style.cursor='default';
        document.getElementById('rat-'+qId+'-'+o.letter).style.display='block';
      });
      document.getElementById('teach-'+qId).style.display='block';
      var card=document.getElementById('qcard-'+qId);
      card.classList.add(isCorrect?'answered-correct':'answered-wrong');
      var btn=document.getElementById('btn-'+qId);
      btn.disabled=true;
      btn.textContent=isCorrect?'Correct!':'Got it — read below';
    });
    updateProgress();
    if(Object.keys(answered).length===questions.length)showScore();
  }
  var last=localStorage.getItem(EXAM_ID+'-last');
  if(last){
    var r=JSON.parse(last);
    document.getElementById('lastAttempt').style.display='block';
    document.getElementById('lastScore').textContent=r.score+'%';
    document.getElementById('lastDate').textContent=r.date;
  }
}

buildQuiz();
