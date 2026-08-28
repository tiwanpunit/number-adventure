(() => {
  const $ = selector => document.querySelector(selector);
  const screens = [...document.querySelectorAll('.screen')];
  const gameArea = $('#gameArea'), sceneObjects = $('#sceneObjects'), playerWrap = $('#playerWrap'), player = $('#player');
  const companion = $('#companion'), speech = $('#speechBubble'), challengePanel = $('#challengePanel');
  const challengePrompt = $('#challengePrompt'), answerButtons = $('#answerButtons'), jumpBtn = $('#jumpBtn'), goBtn = $('#goBtn');
  const starCount = $('#starCount'), progressFill = $('#progressFill'), voiceToggle = $('#voiceToggle');
  const stageGrid = $('#stageGrid'), stageProgressText = $('#stageProgressText');
  const STORAGE_KEY = 'number-adventure-progress-v1';
  const OBSTACLES = new Set(['rock','puddle','log']);

  let number = 1, stars = 0, running = false, paused = false, jumping = false;
  let distance = 0, lastTime = 0, raf = 0, speed = 185, activeEncounter = 0;
  let obstacleHit = false, currentStageIndex = 0, encounters = [];

  const colors = {
    1:['#e9363e'], 2:['#f28a31','#f28a31'], 3:['#f4d52f','#f4d52f','#f4d52f'],
    4:Array(4).fill('#55be45'), 5:Array(5).fill('#38afc8'), 6:Array(6).fill('#6341b4'),
    7:['#e43b44','#ee8b32','#f1d542','#62b94f','#45b8d3','#5074c7','#7650a9'],
    8:Array(8).fill('#df3791'), 9:Array(9).fill('#9ba0a5')
  };
  const gate = (x,prompt,options,correct,to,msg,finish=false) => ({x,type:'gate',label:prompt,prompt,options,correct,to,msg,finish});
  const star = x => ({x,type:'star'});
  const obstacle = (x,type='rock') => ({x,type});

  const STAGES = [
    {name:"Zero & One's Number Garden",short:'Number Garden',range:'0–10',start:1,theme:'garden',intro:"Hello One! Let's find Zero and make Ten!",encounters:[
      star(380),obstacle(760),gate(1160,'1 + 1 = ?',[1,2,3],2,2,'Two! Two Ones make Two!'),gate(1580,'2 + 1 = ?',[2,3,4],3,3,'Three! Brilliant!'),
      gate(2020,'3 − 2 = ?',[0,1,2],1,1,'Back to One!'),{x:2420,type:'zero'},gate(2820,'1 − 1 = ?',[0,1,2],0,0,'Zero! Nothing left!'),
      gate(3230,'0 + 1 = ?',[0,1,2],1,1,'One is back!'),gate(3650,'1 + 4 = ?',[4,5,6],5,5,'High five! You made Five!'),gate(4100,'5 + 5 = ?',[8,9,10],10,10,'Ten! You opened the Number Garden!',true)
    ]},
    {name:"Two's Teamwork Trail",short:'Teamwork Trail',range:'1–3',start:2,theme:'orange',intro:'Two is ready! Find partners that make a pair.',encounters:[
      star(340),obstacle(680,'puddle'),gate(1030,'2 + 1 = ?',[2,3,4],3,3,'Three joined the team!'),star(1320),obstacle(1600,'log'),gate(1950,'3 − 1 = ?',[1,2,3],2,2,'Two is back together!',true)
    ]},
    {name:"Three's Crown Run",short:'Crown Run',range:'1–4',start:3,theme:'sunny',intro:'Three has a crown and a number mission!',encounters:[
      star(330),obstacle(660),gate(1010,'3 + 1 = ?',[3,4,5],4,4,'Four makes a square!'),obstacle(1370,'puddle'),star(1590),gate(1920,'4 − 1 = ?',[2,3,4],3,3,'Three wins the crown!',true)
    ]},
    {name:"Four's Square Forest",short:'Square Forest',range:'2–5',start:4,theme:'forest',intro:'Four loves squares. Run through the square forest!',encounters:[
      star(330),obstacle(660,'log'),gate(1020,'4 + 1 = ?',[4,5,6],5,5,'Five! High five!'),star(1300),obstacle(1560),gate(1900,'5 − 1 = ?',[3,4,5],4,4,'Four is square again!',true)
    ]},
    {name:"Five's High-Five Hills",short:'High-Five Hills',range:'4–6',start:5,theme:'aqua',intro:'Five is ready for a high-five adventure!',encounters:[
      star(320),obstacle(650,'puddle'),gate(1000,'5 + 1 = ?',[5,6,7],6,6,'Six! Roll the dice!'),obstacle(1340,'log'),star(1570),gate(1910,'6 − 1 = ?',[4,5,6],5,5,'High five! You found Five!',true)
    ]},
    {name:"Six's Dice Dash",short:'Dice Dash',range:'5–7',start:6,theme:'purple',intro:'Six is rolling into a dice dash!',encounters:[
      star(320),obstacle(640),gate(990,'6 + 1 = ?',[6,7,8],7,7,'Lucky Seven!'),obstacle(1300,'puddle'),gate(1600,'7 − 2 = ?',[4,5,6],5,5,'Five!'),star(1830),gate(2150,'5 + 1 = ?',[5,6,7],6,6,'Six finishes the dice dash!',true)
    ]},
    {name:"Seven's Rainbow Road",short:'Rainbow Road',range:'6–8',start:7,theme:'rainbow',intro:'Seven has all the rainbow colours!',encounters:[
      star(320),obstacle(650,'log'),gate(1000,'7 + 1 = ?',[7,8,9],8,8,'Eight is an octoblock!'),star(1280),obstacle(1550),gate(1890,'8 − 1 = ?',[6,7,8],7,7,'Lucky Seven found the rainbow!',true)
    ]},
    {name:"Eight's Octoblock Bay",short:'Octoblock Bay',range:'7–9',start:8,theme:'pink',intro:'Eight has eight brilliant blocks!',encounters:[
      star(320),obstacle(650,'puddle'),gate(1000,'8 + 1 = ?',[8,9,10],9,9,'Nine makes a big square!'),obstacle(1340),star(1580),gate(1910,'9 − 1 = ?',[7,8,9],8,8,'Eight powers up!',true)
    ]},
    {name:"Nine's Square City",short:'Square City',range:'8–10',start:9,theme:'silver',intro:'Nine is a three-by-three square. Off we go!',encounters:[
      star(320),obstacle(650,'log'),gate(1010,'9 + 1 = ?',[8,9,10],10,10,'Ten! Two columns of five!'),star(1300),obstacle(1560,'puddle'),gate(1910,'10 − 1 = ?',[8,9,10],9,9,'Nine is square again!',true)
    ]},
    {name:"Ten's Treasure Run",short:'Treasure Run',range:'5–15',start:10,theme:'red',intro:'Ten is ready for the treasure run!',encounters:[
      star(320),obstacle(650),gate(1010,'10 + 5 = ?',[12,15,20],15,15,'Fifteen! Three lots of Five!'),obstacle(1380,'log'),star(1620),gate(1980,'15 − 5 = ?',[5,10,15],10,10,'Ten found the treasure!',true)
    ]},
    {name:'Welcome to Teen Town',short:'Teen Town',range:'10–20',start:10,theme:'teen',intro:'Ten is visiting the teen Numberblocks!',encounters:[
      star(320),obstacle(650,'puddle'),gate(1000,'10 + 1 = ?',[10,11,12],11,11,'Eleven! Ten and One!'),obstacle(1330),
      gate(1640,'11 + 1 = ?',[11,12,13],12,12,'Twelve!'),star(1900),gate(2220,'12 + 3 = ?',[14,15,16],15,15,'Fifteen!'),
      obstacle(2530,'log'),gate(2870,'15 + 5 = ?',[18,19,20],20,20,'Twenty! Two tall columns of Ten!',true)
    ]}
  ];

  const gridLayouts = {
    10:{cols:2,cells:Array(10).fill('#fffdf7'),outline:'#e33b43',face:'top ten'},
    11:{cols:2,cells:['#ed1b2e',null,...Array(10).fill('#fffdf7')],outline:'#e33b43',face:'bottom'},
    12:{cols:3,cells:Array.from({length:12},(_,i)=>[4,7].includes(i)?'#f06c22':'#fffdf7'),outline:'#e33b43',face:'middle'},
    13:{cols:3,cells:[null,'#f4d523','#f4d523','#fffdf7','#fffdf7','#f4d523',...Array(8).fill('#fffdf7'),null],outline:'#e33b43',face:'bottom'},
    14:{cols:2,cells:[...Array(4).fill('#43c91a'),...Array(10).fill('#fffdf7')],outline:'#e33b43',face:'bottom'},
    15:{cols:5,cells:[null,null,null,null,'#22b9cc',null,null,null,'#fffdf7','#22b9cc',null,null,'#fffdf7','#fffdf7','#22b9cc',null,'#fffdf7','#fffdf7','#fffdf7','#22b9cc','#fffdf7','#fffdf7','#fffdf7','#fffdf7','#22b9cc'],outline:'#e33b43',face:'bottom'},
    16:{cols:4,cells:[...Array(12).fill('#fffdf7'),...Array(4).fill('#5b2cb5')],outline:'#e33b43',face:'bottom'},
    17:{cols:4,cells:['#f2cf25','#46bd20','#22b8c9','#aa62c8','#f18d24','#fffdf7','#fffdf7','#5545b9','#e42531','#fffdf7','#fffdf7',null,null,'#fffdf7','#fffdf7',null,null,'#fffdf7','#fffdf7',null],outline:'#e33b43',face:'bottom'},
    18:{cols:3,cells:Array.from({length:18},(_,i)=>i%3===2?'#e72aab':'#fffdf7'),outline:'#e33b43',face:'bottom'},
    19:{cols:4,cells:Array.from({length:20},(_,i)=>i<10?'#fffdf7':i===19?null:'#858b8d'),outline:'#e33b43',face:'bottom'},
    20:{cols:2,cells:Array(20).fill('#fff3a5'),outline:'#e2b928',face:'middle'}
  };

  function loadProgress(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {highestUnlocked:Math.min(STAGES.length-1,Math.max(0,saved.highestUnlocked||0)),completed:Array.isArray(saved.completed)?saved.completed:[],starsByStage:saved.starsByStage||{},lastStage:Math.min(STAGES.length-1,Math.max(0,saved.lastStage||0))};
    }catch{return {highestUnlocked:0,completed:[],starsByStage:{},lastStage:0}}
  }
  let progress=loadProgress();
  const saveProgress=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress))}catch{}};

  function show(id){screens.forEach(screen=>screen.classList.toggle('active',screen.id===id));if(id!=='gameScreen')stopLoop()}
  function speak(text){
    if(!voiceToggle.checked||!('speechSynthesis'in window))return;
    speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text.replace(/[⭐🎉✨✋]/g,''));utterance.rate=.86;utterance.pitch=1.1;speechSynthesis.speak(utterance);
  }
  function zeroHTML(){return `<div class="zero-char"><div class="zero-label">0</div><div class="zero-ring"><div class="eyes"><i class="eye"></i><i class="eye"></i></div><i class="mouth"></i><i class="zero-cheek l"></i><i class="zero-cheek r"></i></div><i class="zero-arm l"></i><i class="zero-arm r"></i><i class="zero-hand l"></i><i class="zero-hand r"></i></div>`}

  function gridNumberHTML(n){
    const layout=gridLayouts[n]||gridLayouts[10];
    const cells=layout.cells.map(color=>color?`<i class="grid-cube" style="background:${color}"></i>`:'<i class="grid-empty"></i>').join('');
    return `<div class="nb nb-grid nb-${n}" style="--grid-cols:${layout.cols};--grid-outline:${layout.outline}"><div class="number-hat">${n}</div><div class="block-grid">${cells}</div><div class="grid-face face-${layout.face}${n===10?' star-eyes':''}"><div class="eyes"><i class="eye"><b></b></i><i class="eye"><b></b></i></div><i class="mouth"></i></div><i class="arm l"></i><i class="arm r"></i><i class="hand l"></i><i class="hand r"></i><i class="leg l"></i><i class="leg r"></i><i class="foot l"></i><i class="foot r"></i></div>`;
  }
  function numberHTML(n){
    if(n===0)return zeroHTML();if(n>=10)return gridNumberHTML(n);
    const cols=colors[n]||Array.from({length:n},(_,i)=>`hsl(${i*31%360} 70% 60%)`);
    const eyes=n===1?'<div class="eyes one-eye"><i class="eye"><b></b></i></div>':'<div class="eyes"><i class="eye"><b></b></i><i class="eye"><b></b></i></div>';
    const face=`${eyes}<i class="mouth"></i><i class="cheek l"></i><i class="cheek r"></i>`;
    const cubes=cols.map((color,i)=>`<div class="cube ${i===cols.length-1?'top-face':''}" style="--cube-color:${color};background:${color}">${i===cols.length-1?face:''}</div>`).join('');
    return `<div class="nb nb-${n}"><div class="number-hat">${n}</div>${cubes}<i class="arm l"></i><i class="arm r"></i><i class="hand l"></i><i class="hand r"></i><i class="leg l"></i><i class="leg r"></i><i class="foot l"></i><i class="foot r"></i></div>`;
  }
  function setNumber(value,announce=true){number=value;player.innerHTML=numberHTML(value);playerWrap.setAttribute('aria-label',`Numberblock ${value}`);playerWrap.classList.remove('transforming');void playerWrap.offsetWidth;playerWrap.classList.add('transforming');if(announce)speak(value===0?'Zero!':`${value}!`)}
  function bubble(text,say=true){speech.textContent=text;speech.classList.remove('hidden');if(say)speak(text)}
  function hideBubble(){speech.classList.add('hidden')}
  function hideChallenge(){challengePanel.classList.add('hidden');answerButtons.innerHTML=''}

  function obstacleHTML(type){
    if(type==='puddle')return '<span class="puddle-shape" aria-label="puddle"><i></i></span>';
    if(type==='log')return '<span class="log-shape" aria-label="log"><i></i></span>';
    return '<span class="rock-shape" aria-label="rock"><i></i></span>';
  }
  function buildWorld(){
    sceneObjects.innerHTML='';encounters.forEach((encounter,index)=>{
      const element=document.createElement('div');element.className=`world-object world-${encounter.type}`;element.dataset.index=index;
      if(encounter.type==='star')element.innerHTML='<span aria-hidden="true">⭐</span>';
      if(OBSTACLES.has(encounter.type))element.innerHTML=obstacleHTML(encounter.type);
      if(encounter.type==='gate')element.innerHTML=`<div class="gate"><div class="gate-sign">${encounter.label}</div></div>`;
      if(encounter.type==='zero')element.innerHTML=`<div class="meet-zero">${zeroHTML()}<div class="hello-zero">Hi!</div></div>`;
      sceneObjects.appendChild(element);
    });
  }
  function renderWorld(){
    const playerX=Math.max(90,gameArea.clientWidth*.16);
    [...sceneObjects.children].forEach((element,index)=>{const screenX=playerX+(encounters[index].x-distance);element.style.transform=`translate3d(${Math.round(screenX)}px,0,0)`;element.style.display=(screenX < -280||screenX > gameArea.clientWidth+280)?'none':'block'});
    gameArea.style.setProperty('--world-shift',`${-(distance%260)}px`);const finishX=encounters[encounters.length-1]?.x||1;progressFill.style.width=`${Math.min(100,distance/finishX*100)}%`;
  }
  function pauseRun(){paused=true;gameArea.classList.remove('is-running')}
  function resumeRun(){paused=false;hideBubble();gameArea.classList.add('is-running');startLoop()}

  function ask(encounter){
    pauseRun();jumpBtn.disabled=true;goBtn.disabled=true;challengePrompt.textContent=encounter.prompt;answerButtons.innerHTML='';
    encounter.options.forEach(value=>{
      const button=document.createElement('button');button.type='button';button.textContent=value;
      button.addEventListener('click',()=>{
        if(String(value)===String(encounter.correct)){
          button.classList.add('correct-answer');speak(`Yes! ${encounter.prompt.replace('?',encounter.correct)}`);
          setTimeout(()=>{hideChallenge();setNumber(encounter.to);bubble(encounter.msg,false);activeEncounter++;setTimeout(()=>{if(encounter.finish)finishStage();else{goBtn.disabled=false;goBtn.textContent='Keep Running ➜'}},650)},350);
        }else{button.classList.remove('shake');void button.offsetWidth;button.classList.add('shake');bubble('Try another one!');setTimeout(()=>{if(paused)hideBubble()},750)}
      });answerButtons.appendChild(button);
    });challengePanel.classList.remove('hidden');speak(encounter.prompt);
  }
  function handleEncounter(encounter){
    if(encounter.type==='star'){
      stars++;starCount.textContent=stars;sceneObjects.children[activeEncounter].classList.add('collected');playerWrap.classList.add('collect-pulse');setTimeout(()=>playerWrap.classList.remove('collect-pulse'),350);speak('Star!');activeEncounter++;return;
    }
    if(OBSTACLES.has(encounter.type)){
      if(jumping){speak('Great jump!');activeEncounter++;obstacleHit=false}
      else if(!obstacleHit){obstacleHit=true;pauseRun();bubble(`Oops! A ${encounter.type}! Tap JUMP to hop over it!`);jumpBtn.disabled=false;goBtn.disabled=true;distance=encounter.x-55;renderWorld()}
      return;
    }
    if(encounter.type==='zero'){pauseRun();bubble("Look! It's Zero! Zero means nothing at all.");activeEncounter++;goBtn.disabled=false;goBtn.textContent='Say Hi & Run ➜';return}
    if(encounter.type==='gate')ask(encounter);
  }
  function frame(time){
    if(!running||paused)return;if(!lastTime)lastTime=time;const dt=Math.min(40,time-lastTime)/1000;lastTime=time;distance+=speed*dt;renderWorld();
    const encounter=encounters[activeEncounter];if(encounter){const trigger=OBSTACLES.has(encounter.type)?48:25;if(distance>=encounter.x-trigger)handleEncounter(encounter)}raf=requestAnimationFrame(frame);
  }
  function startLoop(){if(!running)running=true;cancelAnimationFrame(raf);lastTime=0;raf=requestAnimationFrame(frame)}
  function stopLoop(){running=false;paused=true;cancelAnimationFrame(raf);gameArea.classList.remove('is-running')}
  function doJump(){
    if(jumping)return;jumping=true;playerWrap.classList.remove('jump');void playerWrap.offsetWidth;playerWrap.classList.add('jump');speak('Jump!');setTimeout(()=>{jumping=false;playerWrap.classList.remove('jump')},750);if(obstacleHit){obstacleHit=false;goBtn.disabled=true;resumeRun()}
  }

  function resetGame(){
    const stage=STAGES[currentStageIndex];encounters=stage.encounters;stopLoop();distance=0;activeEncounter=0;stars=0;starCount.textContent=0;obstacleHit=false;jumping=false;companion.classList.add('hidden');hideChallenge();setNumber(stage.start,false);buildWorld();renderWorld();
    $('#stageLabel').textContent=`Stage ${currentStageIndex+1}`;$('#worldName').textContent=stage.name;gameArea.dataset.theme=stage.theme;progressFill.style.width='0%';bubble(stage.intro);jumpBtn.disabled=true;goBtn.disabled=false;goBtn.textContent='Start Running ➜';
  }
  function startStage(index){if(index>progress.highestUnlocked)return;currentStageIndex=index;progress.lastStage=index;saveProgress();show('gameScreen');resetGame()}
  function renderStageSelect(){
    stageGrid.innerHTML='';STAGES.forEach((stage,index)=>{
      const locked=index>progress.highestUnlocked,completed=progress.completed.includes(index),best=progress.starsByStage[index]||0;
      const button=document.createElement('button');button.type='button';button.className=`stage-tile${locked?' locked':''}${completed?' completed':''}`;button.disabled=locked;
      button.innerHTML=`<span class="stage-number">${locked?'🔒':index+1}</span><span class="stage-copy"><strong>${stage.short}</strong><small>Numbers ${stage.range}</small></span><span class="stage-result">${completed?`✓ ⭐${best}`:'Play'}</span>`;
      if(!locked)button.addEventListener('click',()=>startStage(index));stageGrid.appendChild(button);
    });const count=progress.completed.length;stageProgressText.textContent=count?`${count} of ${STAGES.length} stages complete`:'Stage 1 is ready!';
  }
  function finishStage(){
    stopLoop();if(!progress.completed.includes(currentStageIndex))progress.completed.push(currentStageIndex);progress.starsByStage[currentStageIndex]=Math.max(progress.starsByStage[currentStageIndex]||0,stars);
    if(currentStageIndex<STAGES.length-1)progress.highestUnlocked=Math.max(progress.highestUnlocked,currentStageIndex+1);progress.lastStage=Math.min(STAGES.length-1,currentStageIndex+1);saveProgress();renderStageSelect();
    $('#finishHero').innerHTML=numberHTML(number);$('#finishText').textContent=`You finished ${STAGES[currentStageIndex].short} and collected ${stars} stars!`;
    const next=$('#nextStageBtn');next.classList.toggle('hidden',currentStageIndex===STAGES.length-1);next.textContent=`Next: ${STAGES[Math.min(STAGES.length-1,currentStageIndex+1)].short}`;speak('Amazing! Stage complete!');show('celebrationScreen');
  }

  jumpBtn.addEventListener('click',doJump);gameArea.addEventListener('pointerdown',()=>{if(!jumpBtn.disabled&&!paused)doJump()});
  window.addEventListener('keydown',event=>{if((event.code==='Space'||event.code==='ArrowUp')&&!jumpBtn.disabled){event.preventDefault();doJump()}});
  goBtn.addEventListener('click',()=>{if(goBtn.disabled)return;goBtn.disabled=true;jumpBtn.disabled=false;hideChallenge();hideBubble();paused=false;running=true;gameArea.classList.add('is-running');startLoop()});
  $('#playBtn').addEventListener('click',()=>startStage(Math.min(progress.lastStage,progress.highestUnlocked)));
  $('#chooseStagesBtn').addEventListener('click',()=>{renderStageSelect();show('stageScreen')});$('#stageBackBtn').addEventListener('click',()=>show('homeScreen'));
  $('#homeBtn').addEventListener('click',()=>{if('speechSynthesis'in window)speechSynthesis.cancel();show('homeScreen')});$('#againBtn').addEventListener('click',()=>startStage(currentStageIndex));
  $('#nextStageBtn').addEventListener('click',()=>startStage(Math.min(STAGES.length-1,currentStageIndex+1)));$('#celebrationStagesBtn').addEventListener('click',()=>{renderStageSelect();show('stageScreen')});
  $('#celebrateHomeBtn').addEventListener('click',()=>show('homeScreen'));$('#parentBtn').addEventListener('click',()=>show('parentScreen'));$('#parentBackBtn').addEventListener('click',()=>show('homeScreen'));
  window.addEventListener('resize',()=>{if($('#gameScreen').classList.contains('active'))renderWorld()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)pauseRun()});

  $('#homeZero').innerHTML=zeroHTML();$('#homeOne').innerHTML=numberHTML(1);renderStageSelect();
  $('#playBtn').textContent=progress.completed.length?`▶ Continue Stage ${Math.min(progress.lastStage,progress.highestUnlocked)+1}`:'▶ Start Adventure';
  if('serviceWorker'in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(registration=>registration.update()).catch(()=>{}))}
})();
