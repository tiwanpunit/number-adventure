(() => {
  const $ = s => document.querySelector(s);
  const screens = [...document.querySelectorAll('.screen')];
  const gameArea = $('#gameArea');
  const sceneObjects = $('#sceneObjects');
  const playerWrap = $('#playerWrap');
  const player = $('#player');
  const companion = $('#companion');
  const speech = $('#speechBubble');
  const challengePanel = $('#challengePanel');
  const challengePrompt = $('#challengePrompt');
  const answerButtons = $('#answerButtons');
  const jumpBtn = $('#jumpBtn');
  const goBtn = $('#goBtn');
  const starCount = $('#starCount');
  const voiceToggle = $('#voiceToggle');

  let number = 1, stars = 0, running = false, paused = false, jumping = false;
  let distance = 0, lastTime = 0, raf = 0, speed = 185, activeEncounter = 0;
  let obstacleHit = false;

  const colors = {
    1:['#e9363e'], 2:['#f48a31','#f48a31'], 3:['#ffd33f','#ffd33f','#ffd33f'],
    4:['#62b94f','#62b94f','#62b94f','#62b94f'], 5:['#55c7e8','#55c7e8','#55c7e8','#55c7e8','#55c7e8'],
    6:['#7554b8','#7554b8','#7554b8','#7554b8','#7554b8','#7554b8'],
    7:['#e33d49','#f28a33','#f2d64b','#5dbd58','#4ab7d7','#4e74c9','#8c56b8'],
    8:Array(8).fill('#e74c97'), 9:Array(9).fill('#8d929a'),
    10:['#ffffff','#e8383f','#ffffff','#e8383f','#ffffff','#e8383f','#ffffff','#e8383f','#ffffff','#e8383f']
  };

  const encounters = [
    {x:420,type:'star'},
    {x:820,type:'rock'},
    {x:1250,type:'gate',label:'1 + 1 = ?',prompt:'1 + 1 = ?',options:[1,2,3],correct:2,to:2,msg:'Two! Two Ones make Two! 🎉'},
    {x:1800,type:'gate',label:'2 + 1 = ?',prompt:'2 + 1 = ?',options:[2,3,4],correct:3,to:3,msg:'Three! Brilliant!'},
    {x:2350,type:'gate',label:'3 − 2 = ?',prompt:'3 − 2 = ?',options:[0,1,2],correct:1,to:1,msg:'Back to One!'},
    {x:2850,type:'zero',label:'Meet Zero!'},
    {x:3250,type:'gate',label:'1 − 1 = ?',prompt:'1 − 1 = ?',options:[0,1,2],correct:0,to:0,msg:'ZERO! Nothing left! Zero can pass through the empty portal!'},
    {x:3750,type:'gate',label:'0 + 1 = ?',prompt:'0 + 1 = ?',options:[0,1,2],correct:1,to:1,msg:'One is back!'},
    {x:4250,type:'gate',label:'1 + 4 = ?',prompt:'1 + 4 = ?',options:[4,5,6],correct:5,to:5,msg:'High five! You made Five! ✋'},
    {x:4800,type:'gate',label:'5 + 5 = ?',prompt:'5 + 5 = ?',options:[8,9,10],correct:10,to:10,msg:'TEN! You opened the Number Garden! 🎉',finish:true}
  ];

  function show(id){
    screens.forEach(s=>s.classList.toggle('active', s.id===id));
    if(id!=='gameScreen') stopLoop();
  }

  function speak(text){
    if(!voiceToggle.checked || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[⭐🎉✨✋]/g,''));
    u.rate=.86; u.pitch=1.1;
    speechSynthesis.speak(u);
  }

  function zeroHTML(){
    return `<div class="zero-char"><div class="zero-label">0</div><div class="zero-ring"><div class="eyes"><i class="eye"></i><i class="eye"></i></div><i class="mouth"></i></div></div>`;
  }

  function numberHTML(n){
    if(n===0) return zeroHTML();
    const cols = colors[n] || Array.from({length:n},(_,i)=>`hsl(${(i*31)%360} 70% 60%)`);
    const cubes = cols.map((c,i)=>`<div class="cube ${i===cols.length-1?'top-face':''}" style="background:${c}">${i===cols.length-1?'<div class="eyes"><i class="eye"></i><i class="eye"></i></div><i class="mouth"></i>':''}</div>`).join('');
    return `<div class="nb"><div class="number-hat">${n}</div>${cubes}<i class="arm l"></i><i class="arm r"></i><i class="leg l"></i><i class="leg r"></i><i class="foot l"></i><i class="foot r"></i></div>`;
  }

  function setNumber(n, announce=true){
    number=n; player.innerHTML=numberHTML(n);
    playerWrap.setAttribute('aria-label',`Numberblock ${n}`);
    playerWrap.classList.remove('transforming'); void playerWrap.offsetWidth; playerWrap.classList.add('transforming');
    if(announce) speak(n===0?'Zero!':`${n}!`);
  }

  function bubble(text, say=true){
    speech.textContent=text; speech.classList.remove('hidden');
    if(say) speak(text);
  }
  function hideBubble(){ speech.classList.add('hidden'); }
  function hideChallenge(){ challengePanel.classList.add('hidden'); answerButtons.innerHTML=''; }

  function buildWorld(){
    sceneObjects.innerHTML='';
    encounters.forEach((e,i)=>{
      const el=document.createElement('div');
      el.className=`world-object world-${e.type}`;
      el.dataset.index=i;
      if(e.type==='star') el.innerHTML='<span aria-hidden="true">⭐</span>';
      if(e.type==='rock') el.innerHTML='🪨';
      if(e.type==='gate') el.innerHTML=`<div class="gate"><div class="gate-sign">${e.label}</div></div>`;
      if(e.type==='zero') el.innerHTML=`<div class="meet-zero">${zeroHTML()}<div class="hello-zero">Hi One!</div></div>`;
      sceneObjects.appendChild(el);
    });
  }

  function renderWorld(){
    const playerX = Math.max(90, gameArea.clientWidth * .16);
    [...sceneObjects.children].forEach((el,i)=>{
      const e=encounters[i];
      const screenX = playerX + (e.x-distance);
      el.style.transform=`translate3d(${Math.round(screenX)}px,0,0)`;
      el.style.display=(screenX < -260 || screenX > gameArea.clientWidth+260)?'none':'block';
    });
    gameArea.style.setProperty('--world-shift', `${-(distance % 260)}px`);
  }

  function pauseRun(){ paused=true; gameArea.classList.remove('is-running'); }
  function resumeRun(){ paused=false; hideBubble(); gameArea.classList.add('is-running'); startLoop(); }

  function ask(e){
    pauseRun();
    jumpBtn.disabled=true; goBtn.disabled=true;
    challengePrompt.textContent=e.prompt;
    answerButtons.innerHTML='';
    e.options.forEach(v=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=v;
      b.addEventListener('click',()=>{
        if(String(v)===String(e.correct)){
          b.style.background='#d9f6df'; speak(`Yes! ${e.prompt.replace('?',e.correct)}`);
          setTimeout(()=>{
            hideChallenge(); setNumber(e.to); bubble(e.msg,false);
            activeEncounter++;
            setTimeout(()=>{
              if(e.finish){ finish(); }
              else { goBtn.disabled=false; goBtn.textContent='Keep Running ➜'; }
            },650);
          },350);
        } else {
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          bubble('Try another one!',true); setTimeout(()=>{ if(paused) hideBubble(); },750);
        }
      });
      answerButtons.appendChild(b);
    });
    challengePanel.classList.remove('hidden');
    speak(e.prompt);
  }

  function handleEncounter(e){
    if(e.type==='star'){
      stars++; starCount.textContent=stars;
      const el=sceneObjects.children[activeEncounter];
      el.classList.add('collected');
      speak('Star!'); activeEncounter++; return;
    }
    if(e.type==='rock'){
      const cleared = jumping;
      if(cleared){ speak('Great jump!'); activeEncounter++; obstacleHit=false; }
      else if(!obstacleHit){
        obstacleHit=true; pauseRun(); bubble('Oops! The rock is coming. Tap JUMP, then keep running!');
        jumpBtn.disabled=false; goBtn.disabled=true;
        distance=e.x-85; renderWorld();
      }
      return;
    }
    if(e.type==='zero'){
      pauseRun(); bubble('Look! It’s Zero! Zero has a special empty portal.');
      activeEncounter++; goBtn.disabled=false; goBtn.textContent='Say Hi & Run ➜';
      return;
    }
    if(e.type==='gate') ask(e);
  }

  function frame(t){
    if(!running || paused) return;
    if(!lastTime) lastTime=t;
    const dt=Math.min(40,t-lastTime)/1000; lastTime=t;
    distance += speed*dt;
    renderWorld();

    const e=encounters[activeEncounter];
    if(e){
      const trigger = e.type==='rock' ? 70 : 25;
      if(distance >= e.x-trigger) handleEncounter(e);
    }
    raf=requestAnimationFrame(frame);
  }

  function startLoop(){
    if(!running) running=true;
    cancelAnimationFrame(raf); lastTime=0; raf=requestAnimationFrame(frame);
  }
  function stopLoop(){ running=false; paused=true; cancelAnimationFrame(raf); gameArea.classList.remove('is-running'); }

  function doJump(){
    if(jumping) return;
    jumping=true;
    playerWrap.classList.remove('jump'); void playerWrap.offsetWidth; playerWrap.classList.add('jump');
    speak('Jump!');
    setTimeout(()=>{ jumping=false; playerWrap.classList.remove('jump'); },750);
    if(obstacleHit){
      obstacleHit=false; jumpBtn.disabled=true; goBtn.disabled=false; goBtn.textContent='Keep Running ➜';
      bubble('Great! Now run past the rock!',false);
    }
  }

  function resetGame(){
    stopLoop(); distance=0; activeEncounter=0; stars=0; starCount.textContent=0;
    obstacleHit=false; jumping=false; companion.classList.add('hidden');
    hideChallenge(); setNumber(1,false); buildWorld(); renderWorld();
    bubble('Hello One! Let’s find Zero and make some numbers!');
    jumpBtn.disabled=true; goBtn.disabled=false; goBtn.textContent='Start Running ➜';
  }

  jumpBtn.addEventListener('click',doJump);
  gameArea.addEventListener('pointerdown',()=>{ if(!jumpBtn.disabled && !paused) doJump(); });

  goBtn.addEventListener('click',()=>{
    if(goBtn.disabled) return;
    goBtn.disabled=true; jumpBtn.disabled=false;
    hideChallenge(); hideBubble();
    paused=false; running=true; gameArea.classList.add('is-running');
    startLoop();
  });

  function finish(){
    stopLoop();
    $('#finishHero').innerHTML=numberHTML(10);
    $('#finishText').textContent=`You found Zero, made Ten, and collected ${stars} stars!`;
    speak('Amazing! You finished the Number Garden!');
    show('celebrationScreen');
  }

  $('#playBtn').addEventListener('click',()=>{show('gameScreen');resetGame();});
  $('#homeBtn').addEventListener('click',()=>{ if('speechSynthesis' in window) speechSynthesis.cancel(); show('homeScreen'); });
  $('#againBtn').addEventListener('click',()=>{show('gameScreen');resetGame();});
  $('#celebrateHomeBtn').addEventListener('click',()=>show('homeScreen'));
  $('#parentBtn').addEventListener('click',()=>show('parentScreen'));
  $('#parentBackBtn').addEventListener('click',()=>show('homeScreen'));
  window.addEventListener('resize',()=>{ if($('#gameScreen').classList.contains('active')) renderWorld(); });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden && running && !paused) pauseRun();
  });

  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();
