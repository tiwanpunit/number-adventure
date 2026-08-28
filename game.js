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

  let number = 1, stars = 0, step = 0, busy = false, jumped = false;

  const colors = {
    1:['#e9363e'], 2:['#f48a31','#f48a31'], 3:['#ffd33f','#ffd33f','#ffd33f'],
    4:['#62b94f','#62b94f','#62b94f','#62b94f'], 5:['#55c7e8','#55c7e8','#55c7e8','#55c7e8','#55c7e8'],
    6:['#7554b8','#7554b8','#7554b8','#7554b8','#7554b8','#7554b8'],
    7:['#e33d49','#f28a33','#f2d64b','#5dbd58','#4ab7d7','#4e74c9','#8c56b8'],
    8:['#e74c97','#e74c97','#e74c97','#e74c97','#e74c97','#e74c97','#e74c97','#e74c97'],
    9:['#8d929a','#8d929a','#8d929a','#8d929a','#8d929a','#8d929a','#8d929a','#8d929a','#8d929a'],
    10:['#ffffff','#e8383f','#ffffff','#e8383f','#ffffff','#e8383f','#ffffff','#e8383f','#ffffff','#e8383f']
  };

  function show(id){ screens.forEach(s=>s.classList.toggle('active', s.id===id)); }

  function speak(text){
    if(!voiceToggle.checked || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
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
    number=n; player.innerHTML=numberHTML(n); playerWrap.setAttribute('aria-label',`Numberblock ${n}`);
    playerWrap.classList.remove('transforming'); void playerWrap.offsetWidth; playerWrap.classList.add('transforming');
    if(announce) speak(n===0?'Zero!':`${n}!`);
  }

  function bubble(text, say=true){
    speech.textContent=text; speech.classList.remove('hidden');
    if(say) speak(text.replace(/[⭐🎉✨]/g,''));
  }
  function hideBubble(){speech.classList.add('hidden')}

  function setScene(html){sceneObjects.innerHTML=html}
  function setControls({jump=false,go=false}){jumpBtn.disabled=!jump; goBtn.disabled=!go}
  function hideChallenge(){challengePanel.classList.add('hidden'); answerButtons.innerHTML=''}

  function ask(prompt, options, correct, onCorrect){
    busy=true; setControls({});
    challengePrompt.textContent=prompt;
    answerButtons.innerHTML='';
    options.forEach(v=>{
      const b=document.createElement('button'); b.textContent=v; b.type='button';
      b.addEventListener('click',()=>{
        if(String(v)===String(correct)){
          speak(`Yes! ${prompt.replace('?',correct)}`);
          b.style.background='#d9f6df';
          setTimeout(()=>{hideChallenge(); busy=false; onCorrect();},450);
        } else {
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          bubble('Try another one!',true);
          setTimeout(hideBubble,850);
        }
      });
      answerButtons.appendChild(b);
    });
    challengePanel.classList.remove('hidden'); speak(prompt);
  }

  const scenes = [
    // 0 welcome
    () => {setNumber(1,false); companion.classList.add('hidden'); setScene('<div class="collectible">⭐</div>'); bubble('Hello One! Let’s find Zero and make some numbers!'); setControls({go:true});},
    // 1 star
    () => {hideBubble(); setScene('<div class="collectible">⭐</div>'); bubble('A star! Go and collect it!'); setControls({go:true});},
    // 2 jump rock
    () => {setScene('<div class="rock">🪨</div>'); bubble('A rock! Jump over it!'); jumped=false; setControls({jump:true,go:false});},
    // 3 join +1
    () => {setScene('<div class="gate"><div class="gate-sign">1 + 1 = ?</div></div>'); bubble('One more One wants to join you!'); ask('1 + 1 = ?', [1,2,3], 2, ()=>{setNumber(2); bubble('Two! Two Ones make Two! 🎉'); setTimeout(next,900)});},
    // 4 make 3
    () => {setScene('<div class="gate"><div class="gate-sign">2 + 1 = ?</div></div>'); ask('2 + 1 = ?', [2,3,4], 3, ()=>{setNumber(3); bubble('Three! Brilliant!'); setTimeout(next,850)});},
    // 5 subtract to 1
    () => {setScene('<div class="gate"><div class="gate-sign">3 − 2 = ?</div></div>'); bubble('This tiny tunnel only fits One!'); ask('3 − 2 = ?', [0,1,2], 1, ()=>{setNumber(1); bubble('Back to One!'); setTimeout(next,800)});},
    // 6 zero arrives
    () => {setScene('<div class="portal"></div>'); companion.innerHTML=zeroHTML(); companion.classList.remove('hidden'); bubble('Look! It’s Zero!'); setControls({go:true});},
    // 7 become zero
    () => {setScene('<div class="portal"></div>'); ask('1 − 1 = ?', [0,1,2], 0, ()=>{setNumber(0); companion.classList.add('hidden'); bubble('ZERO! Nothing left! Zero can slip through the empty portal!'); setTimeout(next,1100)});},
    // 8 zero + one
    () => {setScene('<div class="gate"><div class="gate-sign">0 + 1 = ?</div></div>'); ask('0 + 1 = ?', [0,1,2], 1, ()=>{setNumber(1); bubble('One is back!'); setTimeout(next,850)});},
    // 9 make 5
    () => {setScene('<div class="gate"><div class="gate-sign">1 + 4 = ?</div></div>'); ask('1 + 4 = ?', [4,5,6], 5, ()=>{setNumber(5); bubble('High five! You made Five! ✋'); setTimeout(next,900)});},
    // 10 make 10
    () => {setScene('<div class="gate"><div class="gate-sign">5 + 5 = ?</div></div>'); bubble('The big rainbow gate needs TEN!'); ask('5 + 5 = ?', [8,9,10], 10, ()=>{setNumber(10); stars+=2; starCount.textContent=stars; bubble('TEN! You opened the Number Garden! 🎉'); setTimeout(finish,1200)});}
  ];

  function next(){ if(step<scenes.length-1){step++; scenes[step]();} }

  function resetGame(){
    step=0; stars=0; starCount.textContent=0; busy=false; jumped=false; hideChallenge(); hideBubble(); setNumber(1,false); setControls({go:true}); scenes[0]();
  }

  jumpBtn.addEventListener('click',()=>{
    if(jumpBtn.disabled||busy) return;
    playerWrap.classList.remove('jump'); void playerWrap.offsetWidth; playerWrap.classList.add('jump');
    jumped=true; setControls({jump:false,go:true}); speak('Jump!');
    setTimeout(()=>bubble('Great jump! Now keep going!',false),500);
  });

  goBtn.addEventListener('click',()=>{
    if(goBtn.disabled||busy) return;
    if(step===0){stars++;starCount.textContent=stars;playerWrap.classList.add('bounce');setTimeout(()=>playerWrap.classList.remove('bounce'),500);}
    if(step===1){stars++;starCount.textContent=stars;playerWrap.classList.add('bounce');setTimeout(()=>playerWrap.classList.remove('bounce'),500);}
    next();
  });

  function finish(){
    $('#finishHero').innerHTML=numberHTML(10);
    $('#finishText').textContent=`You found Zero, made Ten, and collected ${stars} stars!`;
    speak('Amazing! You finished the Number Garden!');
    show('celebrationScreen');
  }

  $('#playBtn').addEventListener('click',()=>{show('gameScreen');resetGame();});
  $('#homeBtn').addEventListener('click',()=>{speechSynthesis?.cancel?.();show('homeScreen');});
  $('#againBtn').addEventListener('click',()=>{show('gameScreen');resetGame();});
  $('#celebrateHomeBtn').addEventListener('click',()=>show('homeScreen'));
  $('#parentBtn').addEventListener('click',()=>show('parentScreen'));
  $('#parentBackBtn').addEventListener('click',()=>show('homeScreen'));

  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();
