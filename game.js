(() => {
  const $ = s => document.querySelector(s);
  const screens = [...document.querySelectorAll('.screen')];
  const els = {
    game: $('#gameArea'), scene: $('#sceneObjects'), playerWrap: $('#playerWrap'), player: $('#player'),
    speech: $('#speechBubble'), oldPanel: $('#challengePanel'), oldPrompt: $('#challengePrompt'),
    oldAnswers: $('#answerButtons'), jump: $('#jumpBtn'), go: $('#goBtn'), stars: $('#starCount'),
    progress: $('#progressFill'), voice: $('#voiceToggle'), stageGrid: $('#stageGrid'),
    stageProgress: $('#stageProgressText'), overlay: $('#missionOverlay'), card: $('#missionCard'),
    mascot: $('#missionMascot'), title: $('#missionTitle'), prompt: $('#missionPrompt'),
    equation: $('#missionEquation'), play: $('#missionPlay'), actions: $('#missionActions')
  };
  const STORAGE_KEY = 'number-adventure-progress-v1';
  const IS_LOCAL_TEST = /^(localhost|127\.0\.0\.1|::1|\[::1\])$/.test(location.hostname);
  const OBSTACLES = new Set(['rock', 'puddle', 'log']);
  const MISSION_TYPES = new Set(['build', 'compare', 'missing', 'path', 'split', 'array', 'order', 'tunnel', 'mirror', 'train', 'zeroMagic', 'balance']);
  const gate = (x, prompt, options, correct, to, msg, finish = false) => ({x, type: 'gate', label: prompt, prompt, options, correct, to, msg, finish});
  const star = x => ({x, type: 'star'});
  const obstacle = (x, type = 'rock') => ({x, type});

  const STAGES = [
    {name: "Zero & One's Number Garden", short: 'Number Garden', range: '0–10', start: 1, theme: 'garden', intro: "Hello One! Let's find Zero and make Ten!", encounters: [
      star(380), obstacle(760), gate(1160, '1 + 1 = ?', [1,2,3], 2, 2, 'Two! Two Ones make Two!'), gate(1580, '2 + 1 = ?', [2,3,4], 3, 3, 'Three! Brilliant!'),
      gate(2020, '3 − 2 = ?', [0,1,2], 1, 1, 'Back to One!'), {x:2420,type:'zero'}, gate(2820, '1 − 1 = ?', [0,1,2], 0, 0, 'Zero! Nothing left!'),
      gate(3230, '0 + 1 = ?', [0,1,2], 1, 1, 'One is back!'), gate(3650, '1 + 4 = ?', [4,5,6], 5, 5, 'High five! You made Five!'), gate(4100, '5 + 5 = ?', [8,9,10], 10, 10, 'Ten! You opened the Number Garden!', true)
    ]},
    {name:"Two's Teamwork Trail",short:'Teamwork Trail',range:'1–3',start:2,theme:'orange',intro:'Two is ready! Find partners that make a pair.',encounters:[star(340),obstacle(680,'puddle'),gate(1030,'2 + 1 = ?',[2,3,4],3,3,'Three joined the team!'),star(1320),obstacle(1600,'log'),gate(1950,'3 − 1 = ?',[1,2,3],2,2,'Two is back together!',true)]},
    {name:"Three's Crown Run",short:'Crown Run',range:'1–4',start:3,theme:'sunny',intro:'Three has a crown and a number mission!',encounters:[star(330),obstacle(660),gate(1010,'3 + 1 = ?',[3,4,5],4,4,'Four makes a square!'),obstacle(1370,'puddle'),star(1590),gate(1920,'4 − 1 = ?',[2,3,4],3,3,'Three wins the crown!',true)]},
    {name:"Four's Square Forest",short:'Square Forest',range:'2–5',start:4,theme:'forest',intro:'Four loves squares. Run through the square forest!',encounters:[star(330),obstacle(660,'log'),gate(1020,'4 + 1 = ?',[4,5,6],5,5,'Five! High five!'),star(1300),obstacle(1560),gate(1900,'5 − 1 = ?',[3,4,5],4,4,'Four is square again!',true)]},
    {name:"Five's High-Five Hills",short:'High-Five Hills',range:'4–6',start:5,theme:'aqua',intro:'Five is ready for a high-five adventure!',encounters:[star(320),obstacle(650,'puddle'),gate(1000,'5 + 1 = ?',[5,6,7],6,6,'Six! Roll the dice!'),obstacle(1340,'log'),star(1570),gate(1910,'6 − 1 = ?',[4,5,6],5,5,'High five! You found Five!',true)]},
    {name:"Six's Dice Dash",short:'Dice Dash',range:'5–7',start:6,theme:'purple',intro:'Six is rolling into a dice dash!',encounters:[star(320),obstacle(640),gate(990,'6 + 1 = ?',[6,7,8],7,7,'Lucky Seven!'),obstacle(1300,'puddle'),gate(1600,'7 − 2 = ?',[4,5,6],5,5,'Five!'),star(1830),gate(2150,'5 + 1 = ?',[5,6,7],6,6,'Six finishes the dice dash!',true)]},
    {name:"Seven's Rainbow Road",short:'Rainbow Road',range:'6–8',start:7,theme:'rainbow',intro:'Seven has all the rainbow colours!',encounters:[star(320),obstacle(650,'log'),gate(1000,'7 + 1 = ?',[7,8,9],8,8,'Eight is an octoblock!'),star(1280),obstacle(1550),gate(1890,'8 − 1 = ?',[6,7,8],7,7,'Lucky Seven found the rainbow!',true)]},
    {name:"Eight's Octoblock Bay",short:'Octoblock Bay',range:'7–9',start:8,theme:'pink',intro:'Eight has eight brilliant blocks!',encounters:[star(320),obstacle(650,'puddle'),gate(1000,'8 + 1 = ?',[8,9,10],9,9,'Nine makes a big square!'),obstacle(1340),star(1580),gate(1910,'9 − 1 = ?',[7,8,9],8,8,'Eight powers up!',true)]},
    {name:"Nine's Square City",short:'Square City',range:'8–10',start:9,theme:'silver',intro:'Nine is a three-by-three square. Off we go!',encounters:[star(320),obstacle(650,'log'),gate(1010,'9 + 1 = ?',[8,9,10],10,10,'Ten! Two columns of five!'),star(1300),obstacle(1560,'puddle'),gate(1910,'10 − 1 = ?',[8,9,10],9,9,'Nine is square again!',true)]},
    {name:"Ten's Treasure Run",short:'Treasure Run',range:'5–15',start:10,theme:'red',intro:'Ten is ready for the treasure run!',encounters:[star(320),obstacle(650),gate(1010,'10 + 5 = ?',[12,15,20],15,15,'Fifteen! Three lots of Five!'),obstacle(1380,'log'),star(1620),gate(1980,'15 − 5 = ?',[5,10,15],10,10,'Ten found the treasure!',true)]},
    {name:'Welcome to Teen Town',short:'Teen Town',range:'10–20',start:10,theme:'teen',intro:'Ten is visiting the teen Numberblocks!',encounters:[star(320),obstacle(650,'puddle'),gate(1000,'10 + 1 = ?',[10,11,12],11,11,'Eleven! Ten and One!'),obstacle(1330),gate(1640,'11 + 1 = ?',[11,12,13],12,12,'Twelve!'),star(1900),gate(2220,'12 + 3 = ?',[14,15,16],15,15,'Fifteen!'),obstacle(2530,'log'),gate(2870,'15 + 5 = ?',[18,19,20],20,20,'Twenty! Two tall columns of Ten!',true)]},
    {name:"Twenty's Numberblock Factory",short:'Numberblock Factory',range:'10–20',start:10,theme:'factory',intro:'The Numberblock Factory needs a brilliant builder!',encounters:[
      star(360),obstacle(720,'log'),
      {x:1180,type:'build',target:14,pieces:[8,6,5,4,2,1],allowMultipleSolutions:true,title:'Build Fourteen',prompt:'🧱 → 14',to:14,msg:'Fourteen is built! The first factory door is open.'},
      star(1560),obstacle(1900,'puddle'),obstacle(2280),
      {x:2720,type:'missing',expression:'14 + ? = 18',choices:[2,3,4,5],correct:4,to:18,title:'Fix the Power',prompt:'14 + ? = 18',msg:'Eighteen powers the factory!'},
      star(3140),obstacle(3500,'log'),
      {x:3980,type:'path',current:18,target:20,paths:[{label:'+2',result:20},{label:'+5',result:23},{label:'−3',result:15}],to:20,title:'Choose the Conveyor',prompt:'18 → 20 ?',msg:'Twenty! The big assembly line is ready.'},
      star(4380),obstacle(4740,'puddle'),
      {x:5280,type:'build',target:20,pieces:[10,8,6,5,4,2],allowMultipleSolutions:true,title:'Factory Finale',prompt:'🧱 → 20',to:20,msg:'The whole Numberblock Factory is shining!',finish:true,finale:true}
    ]},
    {name:"Blockzilla's Bigger-Better Mountain",short:'Bigger-Better Mountain',range:'6–20',start:13,theme:'mountain',intro:'Blockzilla is waiting high on the comparison mountain!',encounters:[
      star(340),obstacle(680),{x:1080,type:'compare',left:8,right:6,question:'bigger',title:'Bigger Boulder',prompt:'Choose bigger',msg:'Eight is bigger than Six!'},
      obstacle(1450,'log'),star(1760),{x:2160,type:'compare',left:12,right:15,question:'smaller',title:'Little Ledge',prompt:'Choose smaller',msg:'Twelve is smaller than Fifteen!'},
      obstacle(2520,'puddle'),{x:2920,type:'compare',left:18,right:16,question:'bigger',title:'Blockzilla Roars',prompt:'Choose bigger',msg:'Eighteen is bigger than Sixteen!'},
      star(3280),obstacle(3620),{x:4020,type:'compare',left:9,right:14,question:'smaller',title:'Cloudy Climb',prompt:'Choose smaller',msg:'Nine is smaller than Fourteen!'},
      obstacle(4380,'log'),star(4720),{x:5200,type:'compare',left:20,right:20,question:'equal',title:'Mountain Top',prompt:'= ?',msg:'Yes! Twenty equals Twenty!',finish:true,finale:true}
    ]},
    {name:'Missing Number Caves',short:'Missing Number Caves',range:'5–20',start:14,theme:'caves',intro:'Some numbers are hiding inside the sparkling caves!',encounters:[
      star(320),obstacle(660,'puddle'),{x:1080,type:'missing',expression:'7 + ? = 12',choices:[3,4,5,6],correct:5,to:12,title:'Crystal Cave',prompt:'7 + ? = 12',msg:'Five was hiding there!'},
      obstacle(1460),star(1780),{x:2200,type:'missing',expression:'? + 8 = 15',choices:[5,6,7,9],correct:7,to:15,title:'Echo Cave',prompt:'? + 8 = 15',msg:'Seven plus Eight makes Fifteen!'},
      obstacle(2580,'log'),star(2920),{x:3340,type:'missing',expression:'18 − ? = 10',choices:[6,7,8,9],correct:8,to:10,title:'Moon Cave',prompt:'18 − ? = 10',msg:'Eighteen take away Eight leaves Ten!'},
      obstacle(3720,'puddle'),obstacle(4100),{x:4620,type:'missing',expression:'? + ? = 20',choices:[5,7,8,10,10,12,13,15],total:20,to:20,title:'Twin Crystal Finale',prompt:'? + ? = 20',msg:'Two hidden partners made Twenty!',finish:true,finale:true}
    ]},
    {name:"Ten's Treasure Temple",short:'Treasure Temple',range:'10–50',start:15,theme:'temple',intro:'Collect number treasures and unlock the great vault!',encounters:[
      {x:300,type:'collect',value:5},obstacle(650,'log'),star(900),{x:1260,type:'path',current:10,target:30,paths:[{label:'+20',result:30},{label:'+10',result:20},{label:'−5',result:5}],to:30,title:'Door of Thirty',prompt:'10 → 30 ?',msg:'Thirty opens the sun door!'},
      obstacle(1660),{x:1940,type:'collect',value:10},obstacle(2260,'puddle'),{x:2700,type:'missing',expression:'30 + ? = 40',choices:[5,8,10,15],correct:10,to:40,title:'Golden Stair',prompt:'30 + ? = 40',msg:'Ten more makes Forty!'},
      star(3060),obstacle(3400,'log'),{x:3820,type:'path',current:30,target:40,paths:[{label:'+5',result:35},{label:'+10',result:40},{label:'+20',result:50}],to:40,title:'Door of Forty',prompt:'30 → 40 ?',msg:'Forty lights the treasure hall!'},
      {x:4200,type:'collect',value:20},obstacle(4540),{x:4960,type:'order',numbers:[40,10,30,20],direction:'up',title:'Treasure Key Bridge',prompt:'10 < ? < ? < 40',msg:'Ten, Twenty, Thirty, Forty—the key bridge is complete!'},obstacle(5320,'log'),{x:5900,type:'build',target:50,pieces:[30,25,20,15,10,5],allowMultipleSolutions:true,to:50,title:'Treasure Vault Finale',prompt:'🧱 → 50',msg:'Fifty! The treasure vault is open!',finish:true,finale:true}
    ]},
    {name:"Two's Double Trouble",short:'Double Trouble',range:'1–32',start:16,theme:'mirror',intro:'Magic mirrors make two of every Numberblock!',encounters:[
      star(320),obstacle(660),{x:1080,type:'mirror',start:2,steps:[4],title:'First Magic Mirror',prompt:'2 + 2 = ?',msg:'Two and Two make Four!',to:4},
      obstacle(1460,'puddle'),star(1780),{x:2180,type:'mirror',start:4,steps:[8],title:'Shimmering Mirror',prompt:'4 + 4 = ?',msg:'Four and Four make Eight!',to:8},
      obstacle(2560,'log'),{x:2980,type:'mirror',start:8,steps:[16],title:'Tall Mirror',prompt:'8 + 8 = ?',msg:'Eight and Eight make Sixteen!',to:16},
      star(3340),obstacle(3680),{x:4100,type:'mirror',start:12,steps:[24],title:'Double Twelve',prompt:'12 + 12 = ?',msg:'Twelve and Twelve make Twenty-four!',to:24},
      obstacle(4460,'puddle'),{x:5000,type:'mirror',start:1,steps:[2,4,8,16,32],title:'Mirror Hall Finale',prompt:'1 → 2 → 4 → 8 → 16 → 32',msg:'One, Two, Four, Eight, Sixteen, Thirty-two!',to:32,finish:true,finale:true}
    ]},
    {name:'Halfway River Rescue',short:'Halfway River Rescue',range:'5–30',start:17,theme:'river',intro:'Two boats need equal Numberblock crews!',encounters:[
      star(320),obstacle(650,'puddle'),{x:1080,type:'split',whole:10,pieces:[5,5],containers:2,title:'Two Little Boats',prompt:'10 → ⛵ = ⛵',msg:'Five and Five share Ten!',to:5},
      obstacle(1480,'log'),star(1800),{x:2220,type:'split',whole:16,pieces:[8,8],containers:2,title:'River Bend',prompt:'16 → ⛵ = ⛵',msg:'Eight in each boat!',to:8},
      obstacle(2600),{x:3020,type:'split',whole:20,pieces:[10,10],containers:2,title:'Wide Water',prompt:'20 → ⛵ = ⛵',msg:'Ten and Ten make Twenty!',to:10},
      star(3400),obstacle(3740,'puddle'),obstacle(4100,'log'),{x:4680,type:'split',whole:30,pieces:[15,15],containers:2,title:'Rescue Finale',prompt:'30 → ⛵ = ⛵',msg:'Fifteen and Fifteen saved the river!',to:15,finish:true,finale:true}
    ]},
    {name:"Six's Array Adventure",short:'Array Adventure',range:'6–24',start:18,theme:'array',intro:'Rows and columns make amazing number pictures!',encounters:[
      star(320),obstacle(660),{x:1080,type:'array',total:6,valid:[[2,3],[3,2]],options:[[1,6],[2,3],[3,2]],title:'Turn Six Around',prompt:'▦ = 6',msg:'Two by Three and Three by Two both make Six!'},
      obstacle(1480,'log'),star(1800),{x:2220,type:'array',total:12,valid:[[3,4]],options:[[2,5],[3,4],[4,4]],title:'Build Twelve',prompt:'3 × 4 = ?',msg:'Three rows of Four make Twelve!',to:12},
      obstacle(2600,'puddle'),{x:3020,type:'array',total:20,valid:[[5,4]],options:[[4,4],[5,4],[6,3]],title:'Twenty Tiles',prompt:'5 × 4 = ?',msg:'Five rows of Four make Twenty!',to:20},
      star(3400),obstacle(3740),obstacle(4100,'log'),{x:4680,type:'array',total:24,valid:[[4,6],[3,8]],options:[[4,6],[5,5],[3,8]],requiredCorrect:2,title:'Array Finale',prompt:'▦ = 24  ×2',msg:'Four by Six and Three by Eight make Twenty-four!',to:24,finish:true,finale:true}
    ]},
    {name:'Times-Table Train',short:'Times-Table Train',range:'19–30',start:19,theme:'train',intro:'Load equal groups into the Number Train!',encounters:[
      star(320),obstacle(660,'log'),{x:1080,type:'train',groups:5,perGroup:4,total:20,options:[16,20,25],title:'Five Carriages',prompt:'5 × 4 = ?',msg:'Five groups of Four make Twenty!',to:20},
      obstacle(1480),star(1800),{x:2220,type:'train',groups:6,perGroup:5,total:30,options:[25,30,35],title:'Six Carriages',prompt:'6 × 5 = ?',msg:'Six groups of Five make Thirty!',to:30},
      obstacle(2600,'puddle'),{x:3020,type:'train',groups:7,perGroup:4,total:28,options:[24,28,32],title:'Seven Carriages',prompt:'7 × 4 = ?',msg:'Seven groups of Four make Twenty-eight!',to:28},
      star(3400),obstacle(3740,'log'),obstacle(4100),{x:4680,type:'train',total:30,perGroup:5,reverse:true,options:[5,6,7],title:'Train Yard Finale',prompt:'30 ÷ 5 = ?',msg:'Six carriages carry Thirty!',to:30,finish:true,finale:true}
    ]},
    {name:"Zero's Nothingness Dimension",short:'Nothingness Dimension',range:'0–25',start:20,theme:'zero',intro:'Zero can make things vanish—and bring the world back!',encounters:[
      star(320),obstacle(650),{x:1080,type:'zeroMagic',mode:'vanish',expression:'17 − 17 = 0',answer:0,choices:[0,1,17],title:'Vanish to Zero',prompt:'17 − 17 = ?',msg:'Nothing is left. That is Zero!',to:0},
      obstacle(1480,'puddle'),{x:1900,type:'zeroMagic',mode:'multiply',expression:'8 × 0 = 0',answer:0,choices:[0,8,80],title:'Zero Swirl',prompt:'8 × 0 = ?',msg:'Every group is empty: Zero!',to:0},
      star(2260),obstacle(2600,'log'),{x:3020,type:'zeroMagic',mode:'identity',expression:'25 + 0 = 25',answer:25,choices:[0,20,25],title:'Zero Changes Nothing',prompt:'25 + 0 = ?',msg:'Twenty-five stays Twenty-five!',to:25},
      obstacle(3400),{x:3820,type:'tunnel',equations:[{label:'0 + 1 = 0',correct:false},{label:'0 + 1 = 1',correct:true}],title:'Empty Tunnels',prompt:'✅ ?',msg:'One comes back from Zero!',to:1},
      star(4200),obstacle(4540,'puddle'),{x:5100,type:'zeroMagic',mode:'rebuild',sequence:[0,1,2,5,10,20],title:'Rebuild the World',prompt:'0 → 1 → 2 → 5 → 10 → 20',msg:'From Zero, the whole bright world returns!',to:20,finish:true,finale:true}
    ]},
    {name:"Aryan's Numberblock Challenge Castle",short:'Aryan’s Challenge Castle',range:'0–100',start:21,theme:'castle',intro:'Five castle rooms lead to the Make One Hundred celebration!',encounters:[
      star(300),obstacle(620,'log'),{x:1020,type:'compare',left:47,right:39,question:'bigger',title:'Room One: Blockzilla',prompt:'Choose bigger',msg:'Forty-seven is bigger than Thirty-nine!',to:47},
      obstacle(1400),star(1700),{x:2100,type:'missing',expression:'36 + ? = 50',choices:[12,14,16,24],correct:14,to:50,title:'Room Two: Missing Number',prompt:'36 + ? = 50',msg:'Thirty-six plus Fourteen makes Fifty!'},
      obstacle(2480,'puddle'),{x:2900,type:'build',target:60,pieces:[40,30,20,15,10,5],allowMultipleSolutions:true,to:60,title:'Room Three: Build Portal',prompt:'🧱 → 60',msg:'Sixty opens the third room!'},
      star(3280),obstacle(3620),{x:4040,type:'array',total:56,valid:[[7,8]],options:[[6,8],[7,8],[7,7]],title:'Room Four: Array Hall',prompt:'7 × 8 = ?',msg:'Seven times Eight makes Fifty-six!',to:56},
      obstacle(4420,'log'),star(4720),{x:5140,type:'path',current:64,target:100,paths:[{label:'+26',result:90},{label:'+36',result:100},{label:'+46',result:110}],to:100,title:'Room Five: Path to 100',prompt:'64 → 100 ?',msg:'Sixty-four plus Thirty-six makes One Hundred!'},
      obstacle(5520,'puddle'),obstacle(5880),{x:6500,type:'build',target:100,pieces:[50,50,80,20,{value:100,character:25,label:'25 × 4'},{value:100,character:10,label:'10 × 10'}],allowMultipleSolutions:true,to:100,title:'FINAL: MAKE 100',prompt:'🧱 → 100',msg:'You made One Hundred and completed Aryan’s Challenge Castle!',finish:true,finale:true,grandFinale:true}
    ]},
    {name:'Balancing Bridge',short:'Balancing Bridge',range:'1–22',start:22,theme:'balance',intro:'The bridges move when the two sides are different!',encounters:[
      star(260),{x:620,type:'balance',target:1,fixedSide:[],available:[1],tutorial:true,title:'Try the Bridge',prompt:'1 = ?',msg:'One and One are the same. Balanced!'},
      obstacle(980,'log'),star(1260),{x:1640,type:'balance',target:15,fixedSide:[],available:[10,5,4,3,2],allowMultipleSolutions:true,title:'Bridge 1',prompt:'15 = ?',msg:'Both sides make Fifteen. Balanced!'},
      obstacle(2020,'puddle'),{x:2420,type:'balance',target:12,fixedSide:[],available:[7,6,5,3,2,1],allowMultipleSolutions:true,title:'Bridge 2',prompt:'12 = ?',msg:'Different Numberblocks can balance Twelve!'},
      star(2780),obstacle(3100),{x:3500,type:'balance',target:13,fixedSide:[9],available:[1,2,3,4,5,6],allowMultipleSolutions:true,title:'Bridge 3',prompt:'13 = 9 + ?',msg:'Nine and Four balance Thirteen!'},
      obstacle(3880,'log'),star(4160),{x:4540,type:'balance',target:14,fixedSide:[8],available:[1,2,3,4,5,6],allowMultipleSolutions:true,title:'Bridge 4',prompt:'14 = 8 + ?',msg:'The two sides both make Fourteen!'},
      obstacle(4920,'puddle'),obstacle(5260),star(5520),{x:5980,type:'balance',target:18,fixedSide:[],available:[10,8,7,6,5,4,3,2],allowMultipleSolutions:true,title:'Final Giant Bridge',prompt:'18 = ?',msg:'All safety locks are on. Pattern Palace is opening!',to:18,finish:true,finale:true}
    ]}
  ];

  const rainbow=['#e43b44','#ee8b32','#f1d542','#62b94f','#45b8d3','#5074c7','#7650a9'];
  const lightRainbow=['#f5a2a7','#f8c08b','#f8e999','#b5dfa9','#a8dfeb','#aebfe8','#c1afe0'];
  const digitPalette={
    1:{solid:'#e9363e',light:'#f5a3a7'},2:{solid:'#f28a31',light:'#ffd1a5'},3:{solid:'#f4d52f',light:'#fff0a0'},
    4:{solid:'#55be45',light:'#b7e3ac'},5:{solid:'#38afc8',light:'#afe2eb'},6:{solid:'#6341b4',light:'#c1b3e3'},
    8:{solid:'#df3791',light:'#f2acd2'}
  };
  const nineColors=['#d9dcdf','#d9dcdf','#d9dcdf','#aeb3b8','#aeb3b8','#aeb3b8','#777d83','#777d83','#777d83'];
  const colors={1:['#e9363e'],2:Array(2).fill('#f28a31'),3:Array(3).fill('#f4d52f'),4:Array(4).fill('#55be45'),5:Array(5).fill('#38afc8'),6:Array(6).fill('#6341b4'),7:rainbow,8:Array(8).fill('#df3791'),9:nineColors};
  const cell=(fill,outline)=>({fill,outline});
  function digitCells(digit,light=false,count=digit){
    if(digit===7)return Array.from({length:count},(_,i)=>cell((light?lightRainbow:rainbow)[i%7],light?'#8d77ad':'#5e438a'));
    if(digit===9)return Array.from({length:count},(_,i)=>cell(light?'#e4e5e7':nineColors[i%9],'#676d73'));
    const palette=digitPalette[digit]||digitPalette[1];
    return Array.from({length:count},()=>cell(light?palette.light:palette.solid,palette.solid));
  }
  const tenCells=()=>Array.from({length:10},()=>cell('#fffdf7','#e33b43'));
  function placeValueLayout(n){
    if(n<20)return{cols:n<12?2:n<14?3:n<16?2:n<18?4:n<19?3:4,cells:[...tenCells(),...digitCells(n-10)],outline:'#e33b43',face:n===10?'top ten':'bottom'};
    if(n===100)return{cols:10,cells:Array.from({length:100},()=>cell('#ef5963','#c92732')),outline:'#c92732',face:'middle'};
    const tens=Math.floor(n/10),ones=n%10;
    return{cols:5,cells:[...digitCells(tens,true,tens*10),...digitCells(ones)],outline:digitPalette[tens]?.solid||'#637083',face:'middle'};
  }
  const specialLayouts=Object.fromEntries(Array.from({length:11},(_,i)=>[i+10,placeValueLayout(i+10)]));

  let number=1, stars=0, running=false, paused=false, jumping=false, distance=0, lastTime=0, raf=0, speed=185;
  let activeEncounter=0, obstacleHit=false, currentStageIndex=0, encounters=[], selectedPiece=null;
  function loadProgress(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');return{highestUnlocked:Math.min(STAGES.length-1,Math.max(0,s.highestUnlocked||0)),completed:Array.isArray(s.completed)?s.completed.filter(i=>i<STAGES.length):[],starsByStage:s.starsByStage||{},lastStage:Math.min(STAGES.length-1,Math.max(0,s.lastStage||0))}}catch{return{highestUnlocked:0,completed:[],starsByStage:{},lastStage:0}}}
  let progress=loadProgress();
  const saveProgress=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress))}catch{}};
  function show(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));if(id!=='gameScreen')stopLoop()}
  function speak(text){if(!els.voice.checked||!('speechSynthesis'in window))return;speechSynthesis.cancel();let words=String(text).replace(/^🧱 → (\d+)$/,'Build $1').replace(/^⬆️ \?$/,'Which is bigger?').replace(/^⬇️ \?$/,'Which is smaller?').replace(/^= \?$/,'Are they equal?').replace(/^(\d+) → (\d+) \?$/,'Which path makes $2?').replace(/^(\d+) → ⛵ = ⛵$/,'Split $1 equally between two boats.').replace(/^▦ = (\d+)\s*$/,'Find an array that makes $1.').replace(/^▦ = (\d+)\s+×2$/,'Find two arrays that make $1.').replace(/^✅ \?$/,'Choose the true equation.').replace(/→/g,' then ').replace(/[⭐🎉✨✋🧱⛵▦✅]/g,'').replace(/−/g,' minus ');const u=new SpeechSynthesisUtterance(words);u.rate=.84;u.pitch=1.08;speechSynthesis.speak(u)}
  function zeroHTML(){return '<div class="zero-char"><div class="zero-label">0</div><div class="zero-ring"><div class="eyes"><i class="eye"></i><i class="eye"></i></div><i class="mouth"></i><i class="zero-cheek l"></i><i class="zero-cheek r"></i></div><i class="zero-arm l"></i><i class="zero-arm r"></i><i class="zero-hand l"></i><i class="zero-hand r"></i></div>'}
  function gridNumberHTML(n){const l=specialLayouts[n]||placeValueLayout(n);const size=n>60?10:n>30?13:n>20?16:n>14?23:28;const cells=l.cells.map(c=>c?`<i class="grid-cube" style="background:${c.fill||c};${c.outline?`--cell-outline:${c.outline}`:''}"></i>`:'<i class="grid-empty"></i>').join('');return `<div class="nb nb-grid nb-${n}" style="--grid-cols:${l.cols};--grid-outline:${l.outline};--cell-size:${size}px"><div class="number-hat">${n}</div><div class="block-grid">${cells}</div><div class="grid-face face-${l.face}${n===10?' star-eyes':''}"><div class="eyes"><i class="eye"><b></b></i><i class="eye"><b></b></i></div><i class="mouth"></i></div><i class="arm l"></i><i class="arm r"></i><i class="hand l"></i><i class="hand r"></i><i class="leg l"></i><i class="leg r"></i><i class="foot l"></i><i class="foot r"></i></div>`}
  function numberHTML(n){if(n===0)return zeroHTML();if(n>=10)return gridNumberHTML(n);const cols=colors[n]||[];const eyes=n===1?'<div class="eyes one-eye"><i class="eye"><b></b></i></div>':'<div class="eyes"><i class="eye"><b></b></i><i class="eye"><b></b></i></div>';const cubes=cols.map((c,i)=>`<div class="cube ${i===cols.length-1?'top-face':''}" style="--cube-color:${c};background:${c}">${i===cols.length-1?`${eyes}<i class="mouth"></i><i class="cheek l"></i><i class="cheek r"></i>`:''}</div>`).join('');return `<div class="nb nb-${n}"><div class="number-hat">${n}</div>${cubes}<i class="arm l"></i><i class="arm r"></i><i class="hand l"></i><i class="hand r"></i><i class="leg l"></i><i class="leg r"></i><i class="foot l"></i><i class="foot r"></i></div>`}
  function selectableNumberHTML(n){if(n<5||n>=10)return numberHTML(n);const cols=n===5?5:n===6||n===9?3:4,cellColors=[...colors[n]],outline=digitPalette[n]?.solid||(n===7?'#5e438a':'#676d73');while(cellColors.length%cols)cellColors.push(null);const cells=cellColors.map(c=>c?`<i class="grid-cube" style="background:${c}"></i>`:'<i class="grid-empty"></i>').join('');return `<div class="nb nb-grid nb-choice-grid nb-${n}" style="--grid-cols:${cols};--grid-outline:${outline};--cell-size:24px"><div class="number-hat">${n}</div><div class="block-grid">${cells}</div><div class="grid-face face-middle"><div class="eyes"><i class="eye"><b></b></i><i class="eye"><b></b></i></div><i class="mouth"></i></div><i class="arm l"></i><i class="arm r"></i><i class="hand l"></i><i class="hand r"></i><i class="leg l"></i><i class="leg r"></i><i class="foot l"></i><i class="foot r"></i></div>`}
  function visualScale(n,maxHeight,cap=.75,compact=false,maxWidth=Infinity){
    if(n===0)return Math.min(cap,maxHeight/175,maxWidth/112);
    if(n<10){
      if(compact&&n>=5){const cols=n===5?5:n===6||n===9?3:4,rows=Math.ceil(n/cols);return Math.min(cap,maxHeight/(rows*24+72),maxWidth/(cols*24+54))}
      const size=n>=7?46:n>=4?55:n===1?74:62;return Math.min(cap,maxHeight/(n*size+72),maxWidth/(size+54))
    }
    const layout=specialLayouts[n]||placeValueLayout(n),size=n>60?10:n>30?13:n>20?16:n>14?23:28;
    return Math.min(cap,maxHeight/(Math.ceil(n/layout.cols)*size+72),maxWidth/(layout.cols*size+54))
  }
  function setNumber(value,announce=true){number=value;els.player.innerHTML=numberHTML(value);els.playerWrap.setAttribute('aria-label',`Numberblock ${value}`);els.playerWrap.classList.remove('transforming');void els.playerWrap.offsetWidth;els.playerWrap.classList.add('transforming');if(announce)speak(value===0?'Zero!':value)}
  function bubble(text,say=true){els.speech.textContent=text;els.speech.classList.remove('hidden');if(say)speak(text)}
  function hideBubble(){els.speech.classList.add('hidden')}
  function pauseRun(){paused=true;els.game.classList.remove('is-running')}
  function readyToRun(){els.go.disabled=false;els.go.textContent='Keep Running ➜'}
  function friendlyWrong(node,msg='Nearly! Try another one.'){if(node){node.classList.remove('shake');void node.offsetWidth;node.classList.add('shake')}bubble(msg);setTimeout(()=>{if(paused)hideBubble()},900)}

  function obstacleHTML(type){if(type==='puddle')return '<span class="puddle-shape"><i></i></span>';if(type==='log')return '<span class="log-shape"><i></i></span>';return '<span class="rock-shape"><i></i></span>'}
  function marker(enc){
    if(enc.type==='build')return '<div class="world-portal-marker"><b>?</b><span>BUILD</span></div>';
    if(enc.type==='missing')return '<div class="world-cave-marker"><b>?</b></div>';
    if(enc.type==='path')return '<div class="world-path-marker"><i></i><i></i><i></i></div>';
    if(enc.type==='compare')return '<div class="world-blockzilla">🦖</div>';
    if(enc.type==='split')return '<div class="world-river-crossing"><i class="river-bank near"></i><div class="river-water"><i></i><i></i><i></i></div><i class="river-bank far"></i><div class="river-boat"><i class="boat-mast"></i><i class="boat-sail"></i><i class="boat-hull"></i><b>?</b></div></div>';
    if(enc.type==='mirror')return '<div class="world-mirror-frame"><i class="mirror-glass"></i><i class="mirror-glint"></i><b>×2</b><span></span></div>';
    if(enc.type==='array')return `<div class="world-array-board"><div>${Array(12).fill('<i></i>').join('')}</div><b>3 × 4</b></div>`;
    if(enc.type==='order')return '<div class="world-order-stones"><i>1</i><i>2</i><i>3</i><i>4</i></div>';
    if(enc.type==='tunnel')return '<div class="world-tunnel-arch"><b>✓</b><i></i></div>';
    if(enc.type==='train')return '<div class="world-train-set"><i class="train-engine"></i><i class="train-car"></i><i class="train-car"></i><span></span><span></span><span></span></div>';
    if(enc.type==='zeroMagic')return '<div class="world-zero-portal"><i></i><b>0</b></div>';
    if(enc.type==='balance')return '<div class="world-balance-marker"><i class="marker-plank"></i><i class="marker-pivot"></i><b>?</b><b>?</b></div>';
    return '<div class="world-mission-marker">★</div>'
  }
  function buildWorld(){els.scene.innerHTML='';encounters.forEach((enc,i)=>{const d=document.createElement('div');d.className=`world-object world-${enc.type}`;d.dataset.index=i;if(enc.type==='star')d.innerHTML='<span>⭐</span>';if(enc.type==='collect')d.innerHTML=`<span class="world-number-collect">${numberHTML(enc.value)}</span>`;if(OBSTACLES.has(enc.type))d.innerHTML=obstacleHTML(enc.type);if(enc.type==='gate')d.innerHTML=`<div class="gate"><div class="gate-sign">${enc.label}</div></div>`;if(enc.type==='zero')d.innerHTML=`<div class="meet-zero">${zeroHTML()}<div class="hello-zero">Hi!</div></div>`;if(MISSION_TYPES.has(enc.type))d.innerHTML=marker(enc);els.scene.appendChild(d)})}
  function renderWorld(){const px=Math.max(90,els.game.clientWidth*.16);[...els.scene.children].forEach((e,i)=>{const x=px+(encounters[i].x-distance);e.style.transform=`translate3d(${Math.round(x)}px,0,0)`;e.style.display=x < -320||x>els.game.clientWidth+320?'none':'block'});els.game.style.setProperty('--world-shift',`${-(distance%260)}px`);els.progress.style.width=`${Math.min(100,distance/(encounters.at(-1)?.x||1)*100)}%`}

  function ask(enc){pauseRun();els.jump.disabled=true;els.go.disabled=true;els.oldPrompt.textContent=enc.prompt;els.oldAnswers.innerHTML='';enc.options.forEach(v=>{const b=document.createElement('button');b.textContent=v;b.addEventListener('click',()=>{if(String(v)===String(enc.correct)){b.classList.add('correct-answer');speak(`Yes! ${enc.prompt.replace('?',enc.correct)}`);setTimeout(()=>{els.oldPanel.classList.add('hidden');setNumber(enc.to);bubble(enc.msg,false);activeEncounter++;setTimeout(()=>enc.finish?finishStage():readyToRun(),650)},350)}else friendlyWrong(b)});els.oldAnswers.appendChild(b)});els.oldPanel.classList.remove('hidden');speak(enc.prompt)}
  function resetMission(enc,kind){selectedPiece=null;els.card.className=`mission-card mission-${kind}${enc.finale?' mission-finale':''}`;els.title.textContent=enc.title||'Number Mission';els.prompt.textContent=enc.prompt||'';els.equation.textContent='';els.play.innerHTML='';els.actions.innerHTML='';els.mascot.innerHTML='';els.overlay.classList.remove('hidden')}
  function action(label,cls,fn){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',fn);return b}
  function choosePiece(b){els.play.querySelectorAll('.piece-card.selected').forEach(p=>p.classList.remove('selected'));selectedPiece=b;b.classList.add('selected');speak(`${b.dataset.value}. Now tap the glowing place.`)}
  function makePiece(value,index,onDrop){
    const piece=typeof value==='object'?value:{value,character:value,label:null};const character=piece.character??piece.value;const b=action('','piece-card',()=>{});b.dataset.value=piece.value;b.dataset.term=piece.label||piece.value;b.dataset.index=index;b.setAttribute('aria-label',`${piece.label||`Numberblock ${piece.value}`}. Drag it, or tap it then tap the target.`);b.style.setProperty('--piece-scale',visualScale(character,119,.86,true,98));b.style.setProperty('--piece-compact-scale',visualScale(character,92,.76,true,78));b.style.setProperty('--piece-small-scale',visualScale(character,78,.66,true,64));b.innerHTML=`<span class="piece-character">${selectableNumberHTML(character)}</span>${piece.label&&piece.label!==String(character)?`<b class="piece-formula">${piece.label}</b>`:''}`;
    let pid=null,sx=0,sy=0,moved=false;
    const move=e=>{if(pid!==e.pointerId)return;const dx=e.clientX-sx,dy=e.clientY-sy;moved ||= Math.hypot(dx,dy)>8;b.style.translate=`${dx}px ${dy}px`};
    const finish=e=>{if(pid!==e.pointerId)return;b.classList.remove('dragging');b.style.translate='';pid=null;if(moved){const target=[...els.play.querySelectorAll('[data-drop-target]')].find(t=>{const r=t.getBoundingClientRect();return e.clientX>=r.left-35&&e.clientX<=r.right+35&&e.clientY>=r.top-35&&e.clientY<=r.bottom+35});target?onDrop(b,target):choosePiece(b)}else choosePiece(b)};
    b.addEventListener('pointerdown',e=>{if(b.disabled)return;pid=e.pointerId;sx=e.clientX;sy=e.clientY;moved=false;b.classList.add('dragging')});
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
    return b
  }
  function bindTarget(target,fn){target.addEventListener('click',()=>{if(selectedPiece&&!selectedPiece.disabled)fn(selectedPiece,target)})}
  function resolveWorldEncounter(enc,index,done){
    if(enc.type!=='split'){done();return}
    const crossing=els.scene.children[index];
    if(!crossing){done();return}
    const passenger=crossing.querySelector('.river-boat b');if(passenger)passenger.textContent=enc.to??enc.whole/enc.containers;
    els.playerWrap.classList.add('river-riding');crossing.classList.add('split-solved');speak(`${passenger?.textContent||'The Numberblock'} sails across the river!`);
    setTimeout(()=>{
      distance+=Math.min(300,crossing.offsetWidth+60);renderWorld();
      els.playerWrap.classList.remove('river-riding');els.playerWrap.classList.add('river-arrived');
      setTimeout(()=>{els.playerWrap.classList.remove('river-arrived');done()},420)
    },1320)
  }
  function completeMission(enc,result){
    els.card.classList.add('mission-success');els.equation.textContent=result||enc.msg;els.prompt.textContent=enc.msg||'Brilliant number work!';speak(enc.msg||'Brilliant number work!');if(enc.to!==undefined)setNumber(enc.to,false);els.actions.innerHTML='';
    const label=enc.type==='split'?(enc.finish?'Sail and celebrate! ⛵':'Sail across! ⛵'):(enc.finish?'Celebrate! 🎉':'Adventure on! ➜');
    els.actions.appendChild(action(label,'mission-continue',()=>{const index=activeEncounter;els.overlay.classList.add('hidden');activeEncounter++;els.go.disabled=true;resolveWorldEncounter(enc,index,()=>enc.finish?finishStage():readyToRun())}))
  }
  function subsetPossible(values,target){const sums=new Set([0]);values.forEach(v=>[...sums].forEach(s=>sums.add(s+v)));return sums.has(target)}

  function renderBuild(enc){resetMission(enc,'build');els.mascot.innerHTML='<div class="portal-spark">✨</div>';let total=0,used=[];const target=action('','hollow-target',()=>{});target.dataset.dropTarget='build';if(enc.target>50)target.classList.add('hollow-large');const tray=document.createElement('div');tray.className='piece-tray';const update=()=>{target.innerHTML=`<div class="hollow-label">${enc.target}</div><div class="hollow-grid" style="--hollow-cols:${enc.target>50?10:enc.target>15?5:enc.target>9?4:3}">${Array.from({length:enc.target},(_,i)=>`<i class="${i<total?'filled':''}"></i>`).join('')}</div><div class="hollow-face">${total===enc.target?'●‿●':'○‿○'}</div>`;els.equation.textContent=used.length?`${used.join(' + ')} = ${total}${total===enc.target?'':` / ${enc.target}`}`:`0 / ${enc.target}`};const add=b=>{const v=Number(b.dataset.value);const rest=[...tray.querySelectorAll('.piece-card:not(:disabled)')].filter(p=>p!==b).map(p=>Number(p.dataset.value));if(total+v>enc.target||!subsetPossible(rest,enc.target-total-v)){friendlyWrong(b,`${b.dataset.term} does not fit yet. Try another builder!`);return}used.push(b.dataset.term);total+=v;b.disabled=true;b.classList.add('used');selectedPiece=null;update();if(total===enc.target){target.classList.add('complete');setTimeout(()=>completeMission(enc,`${used.join(' + ')} = ${enc.target}`),650)}else speak(`${total}. Keep building to ${enc.target}.`)};bindTarget(target,add);enc.pieces.forEach((v,i)=>tray.appendChild(makePiece(v,i,add)));els.play.append(target,tray);els.actions.appendChild(action('Start again ↻','mission-reset',()=>renderBuild(enc)));update();speak(enc.prompt||`Build ${enc.target}.`)}
  function renderCompare(enc){resetMission(enc,'compare');els.mascot.innerHTML='<div class="blockzilla-face">🦖<span>Blockzilla</span></div>';const arena=document.createElement('div');arena.className='compare-arena';let answer=enc.question==='equal'?(enc.left===enc.right?'both':'not-equal'):enc.left===enc.right?'both':enc.question==='smaller'?(enc.left<enc.right?'left':'right'):(enc.left>enc.right?'left':'right');const choose=(choice,b)=>{if(!(answer===choice||answer==='both'&&['left','right'].includes(choice))){els.mascot.classList.add('blockzilla-sad');setTimeout(()=>els.mascot.classList.remove('blockzilla-sad'),700);friendlyWrong(b,'Blockzilla says: have another look!');return}b.classList.add('chosen-correct');els.mascot.classList.add('blockzilla-happy');completeMission(enc,enc.left===enc.right?`${enc.left} = ${enc.right}`:`${Math.max(enc.left,enc.right)} > ${Math.min(enc.left,enc.right)}`)};['left','right'].forEach(side=>{const value=enc[side],b=action('',`compare-number compare-${side}`,()=>choose(side,b));b.innerHTML=`<span>${selectableNumberHTML(value)}</span>`;b.setAttribute('aria-label',`Numberblock ${value}`);b.style.setProperty('--compare-scale',visualScale(value,180,1,true));b.style.setProperty('--compare-compact-scale',visualScale(value,135,.9,true));b.style.setProperty('--compare-small-scale',visualScale(value,112,.78,true));arena.appendChild(b)});els.play.appendChild(arena);speak(enc.prompt||`Which Numberblock is ${enc.question}?`)}
  function renderMissing(enc){resetMission(enc,'missing');let answers=[];const needed=(enc.expression.match(/\?/g)||[]).length;const expression=document.createElement('div');expression.className='missing-expression';const slots=[];let si=0;enc.expression.split(/(\?)/).forEach(part=>{if(part!=='?'){const s=document.createElement('span');s.textContent=part;expression.appendChild(s)}else{const slot=action('?','missing-slot',()=>{});slot.dataset.dropTarget=`slot-${si++}`;slots.push(slot);expression.appendChild(slot)}});const tray=document.createElement('div');tray.className='piece-tray';const correct=()=>needed===1?answers[0]===enc.correct:enc.acceptPairs?enc.acceptPairs.some(pair=>pair[0]===answers[0]&&pair[1]===answers[1]||pair[1]===answers[0]&&pair[0]===answers[1]):answers.reduce((a,b)=>a+b,0)===enc.total;const place=(b,explicit)=>{const slot=explicit?.classList.contains('missing-slot')?explicit:slots.find(s=>!s.dataset.filled);if(!slot||slot.dataset.filled)return;const v=Number(b.dataset.value);answers.push(v);slot.dataset.filled='true';slot.textContent=v;slot.classList.add('filled');b.disabled=true;selectedPiece=null;if(answers.length===needed){if(correct()){let ai=0;completeMission(enc,enc.expression.replace(/\?/g,()=>answers[ai++]))}else{friendlyWrong(expression,'Good try! Let the Numberblocks hop out and try again.');setTimeout(()=>renderMissing(enc),900)}}else speak('Great! Fill the other question mark.')};slots.forEach(s=>bindTarget(s,place));enc.choices.forEach((v,i)=>tray.appendChild(makePiece(v,i,place)));els.play.append(expression,tray);els.actions.appendChild(action('Start again ↻','mission-reset',()=>renderMissing(enc)));speak(enc.prompt||enc.expression)}
  function renderPath(enc){resetMission(enc,'path');els.mascot.innerHTML=`<div class="path-current">${numberHTML(enc.current)}</div>`;const paths=document.createElement('div');paths.className='path-doors';enc.paths.forEach((p,i)=>{const b=action('',`physical-path path-${i+1}`,()=>{if(p.result!==enc.target){friendlyWrong(b,`${p.label} makes ${p.result}. Choose another path!`);return}b.classList.add('path-open');setNumber(p.result,false);completeMission(enc,`${enc.current} ${p.label} = ${p.result}`)});b.innerHTML=`<span class="door-top">${p.label}</span><span class="door-result">?</span><i class="path-road"></i>`;b.setAttribute('aria-label',`Path ${p.label}`);paths.appendChild(b)});els.play.appendChild(paths);speak(enc.prompt||`Choose the path that makes ${enc.target}.`)}
  function renderSplit(enc){
    resetMission(enc,'split');els.mascot.innerHTML=`<div class="split-whole">${numberHTML(enc.whole)}</div>`;const boats=document.createElement('div');boats.className='split-boats';const totals=Array(enc.containers||2).fill(0);let placed=0;
    const check=()=>{if(placed<enc.pieces.length)return;const equal=totals.every(v=>v===totals[0]);if(equal){completeMission(enc,`${enc.whole} = ${totals.join(' + ')}`)}else{friendlyWrong(boats,'The boats need equal crews. Try the split again!');setTimeout(()=>renderSplit(enc),900)}};
    for(let i=0;i<totals.length;i++){
      const boat=action('', 'split-boat',()=>{});boat.dataset.dropTarget=`boat-${i}`;boat.dataset.boat=i;
      boat.innerHTML='<span class="split-boat-art"><i class="split-mast"></i><i class="split-sail"></i><i class="split-hull"></i></span><b>0</b><i class="boat-cargo"></i>';
      const place=b=>{const value=Number(b.dataset.value);totals[i]+=value;placed++;boat.querySelector('b').textContent=totals[i];boat.querySelector('.boat-cargo').innerHTML+=`<em>${numberHTML(value)}</em>`;b.disabled=true;b.classList.add('used');selectedPiece=null;check()};bindTarget(boat,place);boat._place=place;boats.appendChild(boat)
    }
    const tray=document.createElement('div');tray.className='piece-tray';enc.pieces.forEach((v,i)=>tray.appendChild(makePiece(v,i,(b,target)=>target._place(b))));els.play.append(boats,tray);els.actions.appendChild(action('Start again ↻','mission-reset',()=>renderSplit(enc)));speak(enc.prompt)
  }
  function arrayPicture(rows,cols){return `<span class="array-grid" style="--array-cols:${cols}">${Array(rows*cols).fill('<i></i>').join('')}</span><b>${rows} × ${cols}</b>`}
  function renderArray(enc){
    resetMission(enc,'array');let found=0;const needed=enc.requiredCorrect||enc.valid.length;const choices=document.createElement('div');choices.className='array-choices';const valid=enc.valid.map(v=>v.join('x'));
    enc.options.forEach(pair=>{const key=pair.join('x');const b=action('','array-choice',()=>{if(!valid.includes(key)){friendlyWrong(b,`${pair[0]} rows of ${pair[1]} makes ${pair[0]*pair[1]}. Try another array!`);return}if(b.classList.contains('array-found'))return;b.classList.add('array-found');found++;els.equation.textContent=`${pair[0]} rows of ${pair[1]} = ${pair[0]*pair[1]}`;speak(`Yes! ${pair[0]} rows of ${pair[1]}.`);if(found>=needed)setTimeout(()=>completeMission(enc,valid.map(v=>v.replace('x',' × ')).join(' and ') + ` = ${enc.total}`),500)});b.innerHTML=arrayPicture(pair[0],pair[1]);b.setAttribute('aria-label',`${pair[0]} rows of ${pair[1]}`);choices.appendChild(b)});els.play.appendChild(choices);speak(enc.prompt)
  }
  function renderOrder(enc){
    resetMission(enc,'order');const ordered=[...enc.numbers].sort((a,b)=>enc.direction==='down'?b-a:a-b);let step=0;const bridge=document.createElement('div');bridge.className='order-bridge';ordered.forEach(()=>bridge.innerHTML+='<i>?</i>');const tray=document.createElement('div');tray.className='order-tray';
    enc.numbers.forEach((v,i)=>{const b=action('','order-number',()=>{if(v!==ordered[step]){friendlyWrong(b,'That stepping stone comes later. Try another!');return}bridge.children[step].textContent=v;bridge.children[step].classList.add('ready');b.disabled=true;step++;if(step===ordered.length)completeMission(enc,ordered.join(' < '))});b.style.setProperty('--order-scale',visualScale(v,112,.78,true,92));b.innerHTML=selectableNumberHTML(v);tray.appendChild(b)});els.play.append(bridge,tray);speak(enc.prompt)
  }
  function renderTunnel(enc){
    resetMission(enc,'tunnel');const wrap=document.createElement('div');wrap.className='tunnel-choices';enc.equations.forEach(eq=>{const b=action('','true-tunnel',()=>{if(!eq.correct){friendlyWrong(b,'That tunnel wobbles. Try the other one!');return}b.classList.add('tunnel-open');completeMission(enc,eq.label)});b.innerHTML=`<span>${eq.label}</span><i></i>`;wrap.appendChild(b)});els.play.appendChild(wrap);speak(enc.prompt)
  }
  function renderMirror(enc){
    resetMission(enc,'mirror');let current=enc.start,index=0;const hall=document.createElement('div');hall.className='mirror-hall';els.play.appendChild(hall);
    const showStep=()=>{const answer=enc.steps[index];const choices=[answer,answer+2,Math.max(0,answer-2)].filter((v,i,a)=>a.indexOf(v)===i).sort(()=>.5-Math.random());hall.innerHTML=`<div class="mirror-source">${selectableNumberHTML(current)}<span>+</span>${selectableNumberHTML(current)}</div><div class="magic-mirror">✨</div><div class="mirror-choices"></div>`;const box=hall.querySelector('.mirror-choices');choices.forEach(v=>{const b=action('','mirror-answer',()=>{if(v!==answer){friendlyWrong(b,'The mirror shimmers. Look for the double!');return}b.classList.add('mirror-correct');els.equation.textContent=`${current} + ${current} = ${answer}`;current=answer;index++;if(index===enc.steps.length)setTimeout(()=>completeMission(enc,[enc.start,...enc.steps].join(' → ')),450);else setTimeout(showStep,450)});b.innerHTML=selectableNumberHTML(v);b.setAttribute('aria-label',`Numberblock ${v}`);box.appendChild(b)})};showStep();speak(enc.prompt)
  }
  function trainPicture(groups,per){return `<span class="tiny-train"><i>🚂</i>${Array.from({length:groups},()=>`<b>${Array(per).fill('<em></em>').join('')}</b>`).join('')}</span>`}
  function renderTrain(enc){
    resetMission(enc,'train');const scene=document.createElement('div');scene.className='train-scene';const groups=enc.reverse?'?':enc.groups;scene.innerHTML=enc.reverse?`<div class="train-total">${numberHTML(enc.total)}<span>Split into groups of ${enc.perGroup}</span></div>`:`${trainPicture(enc.groups,enc.perGroup)}<div class="train-sum">${enc.groups} groups of ${enc.perGroup}</div>`;const choices=document.createElement('div');choices.className='train-answers';enc.options.forEach(v=>{const correct=enc.reverse?v===enc.total/enc.perGroup:v===enc.total;const b=action('', 'train-answer',()=>{if(!correct){friendlyWrong(b,'That train load does not fit. Try another!');return}b.classList.add('train-correct');completeMission(enc,enc.reverse?`${enc.total} ÷ ${enc.perGroup} = ${v}`:`${enc.groups} × ${enc.perGroup} = ${v}`)});b.innerHTML=enc.reverse?`${trainPicture(v,Math.min(enc.perGroup,5))}<strong>${v} carriages</strong>`:`${selectableNumberHTML(v)}`;choices.appendChild(b)});els.play.append(scene,choices);speak(enc.prompt)
  }
  function renderZeroMagic(enc){
    resetMission(enc,'zero-magic');els.mascot.innerHTML=zeroHTML();const voidScene=document.createElement('div');voidScene.className=`zero-scene zero-${enc.mode}`;
    if(enc.mode==='rebuild'){let i=0;const rebuild=()=>{const value=enc.sequence[i];voidScene.innerHTML=`<div class="rebuild-world rebuilt-${Math.min(i,4)}"><i>☀️</i><i>🌳</i><i>🏠</i><i>🌈</i></div><button class="rebuild-number" aria-label="Bring back Numberblock ${value}">${numberHTML(value)}</button>`;voidScene.querySelector('button').addEventListener('click',()=>{els.equation.textContent=enc.sequence.slice(0,i+1).join(' → ');i++;if(i===enc.sequence.length)completeMission(enc,enc.sequence.join(' → '));else rebuild()})};rebuild();els.play.appendChild(voidScene);speak(enc.prompt);return}
    const disappearing=Number(enc.expression.match(/\d+/)?.[0])||1;voidScene.innerHTML=`<div class="zero-expression">${enc.expression}</div><div class="zero-objects">${Array.from({length:3},()=>`<i>${selectableNumberHTML(disappearing)}</i>`).join('')}<strong>→</strong>${zeroHTML()}</div><div class="zero-answers"></div>`;const answers=voidScene.querySelector('.zero-answers');enc.choices.forEach(v=>{const b=action('','zero-answer',()=>{if(v!==enc.answer){friendlyWrong(b,'Zero smiles. Try another Numberblock!');return}voidScene.classList.add('zero-vanishing');setTimeout(()=>completeMission(enc,enc.expression),650)});b.innerHTML=selectableNumberHTML(v);b.setAttribute('aria-label',`Numberblock ${v}`);answers.appendChild(b)});els.play.appendChild(voidScene);speak(enc.prompt)
  }
  function renderBalance(enc){
    resetMission(enc,'balance');let placed=[],locked=false,checkToken=0;const fixed=[...(enc.fixedSide||[])],fixedTotal=fixed.reduce((a,b)=>a+b,0);
    const scene=document.createElement('div');scene.className='balance-scene';scene.innerHTML='<div class="balance-machine"><div class="balance-plank"><div class="balance-pan balance-left"><div class="balance-load"></div><strong></strong></div><div class="balance-pan balance-right" data-drop-target="balance"><div class="balance-load"></div><strong></strong></div></div><div class="balance-pivot"><i></i></div><div class="balance-locks"><i></i><i></i></div></div>';
    const machine=scene.querySelector('.balance-machine'),leftLoad=scene.querySelector('.balance-left .balance-load'),rightLoad=scene.querySelector('.balance-right .balance-load'),leftTotal=scene.querySelector('.balance-left strong'),rightTotal=scene.querySelector('.balance-right strong'),rightPan=scene.querySelector('.balance-right');
    const character=(value,removable=false,source=null)=>{const node=action('','balance-character'+(removable?' removable':''),e=>{e.stopPropagation();if(!removable||locked)return;placed=placed.filter(p=>p.node!==node);node.remove();source.disabled=false;source.classList.remove('used','selected');selectedPiece=null;update()});node.style.setProperty('--balance-scale',visualScale(value,90,.62,true,82));node.innerHTML=selectableNumberHTML(value);node.setAttribute('aria-label',removable?`Remove Numberblock ${value}`:`Numberblock ${value}`);return node};
    leftLoad.appendChild(character(enc.target));fixed.forEach(v=>rightLoad.appendChild(character(v)));
    const tray=document.createElement('div');tray.className='piece-tray balance-tray';
    const update=()=>{const added=placed.reduce((sum,p)=>sum+p.value,0),right=fixedTotal+added,difference=right-enc.target,tilt=Math.max(-14,Math.min(14,difference*2.7));machine.style.setProperty('--balance-tilt',`${tilt}deg`);machine.style.setProperty('--balance-counter',`${-tilt}deg`);machine.classList.toggle('tilt-left',difference<0);machine.classList.toggle('tilt-right',difference>0);machine.classList.toggle('is-balanced',difference===0);leftTotal.textContent=enc.target;rightTotal.textContent=right;const terms=[...fixed,...placed.map(p=>p.value)];els.equation.textContent=`${enc.target} ${difference===0?'=':difference<0?'>':'<'} ${terms.length?terms.join(' + '):0}`;const token=++checkToken;if(difference===0&&!locked)setTimeout(()=>{if(token!==checkToken||locked)return;locked=true;machine.classList.add('balance-locked');completeMission(enc,`${enc.target} = ${terms.join(' + ')}`)},800)};
    const add=b=>{if(locked||b.disabled)return;const value=Number(b.dataset.value),node=character(value,true,b);placed.push({value,node,source:b});rightLoad.appendChild(node);b.disabled=true;b.classList.remove('selected');b.classList.add('used');selectedPiece=null;update();speak(`${fixedTotal+placed.reduce((sum,p)=>sum+p.value,0)} on this side.`)};
    rightPan.addEventListener('click',()=>{const choice=tray.querySelector('.piece-card.selected');if(choice&&!choice.disabled)add(choice)});enc.available.forEach((v,i)=>{const piece=makePiece(v,i,add);piece.addEventListener('click',()=>{if(piece.classList.contains('selected')&&!piece.disabled)add(piece)});tray.appendChild(piece)});els.play.append(scene,tray);els.actions.appendChild(action('Start again ↻','mission-reset',()=>renderBalance(enc)));update();speak(enc.tutorial?'Watch One balance One.':enc.prompt||'Make both sides the same.');
    if(enc.tutorial)setTimeout(()=>{const one=tray.querySelector('.piece-card');if(one&&!one.disabled)add(one)},700)
  }
  const renderers={build:renderBuild,compare:renderCompare,missing:renderMissing,path:renderPath,split:renderSplit,array:renderArray,order:renderOrder,tunnel:renderTunnel,mirror:renderMirror,train:renderTrain,zeroMagic:renderZeroMagic,balance:renderBalance};
  function openMission(enc){pauseRun();els.jump.disabled=true;els.go.disabled=true;hideBubble();(renderers[enc.type]||renderPath)(enc)}

  function handleEncounter(enc){if(enc.type==='star'||enc.type==='collect'){stars++;els.stars.textContent=stars;els.scene.children[activeEncounter].classList.add('collected');els.playerWrap.classList.add('collect-pulse');setTimeout(()=>els.playerWrap.classList.remove('collect-pulse'),350);speak(enc.type==='collect'?`Numberblock ${enc.value} treasure!`:'Star!');activeEncounter++;return}if(OBSTACLES.has(enc.type)){if(jumping){speak('Great jump!');activeEncounter++;obstacleHit=false}else if(!obstacleHit){obstacleHit=true;pauseRun();bubble(`Oops! A ${enc.type}! Tap JUMP to hop over it!`);els.jump.disabled=false;els.go.disabled=true;distance=enc.x-55;renderWorld()}return}if(enc.type==='zero'){pauseRun();bubble("Look! It's Zero! Zero means nothing at all.");activeEncounter++;readyToRun();return}if(enc.type==='gate')ask(enc);if(MISSION_TYPES.has(enc.type))openMission(enc)}
  function frame(time){if(!running||paused)return;if(!lastTime)lastTime=time;distance+=speed*Math.min(40,time-lastTime)/1000;lastTime=time;renderWorld();const enc=encounters[activeEncounter];if(enc&&distance>=enc.x-(OBSTACLES.has(enc.type)?48:MISSION_TYPES.has(enc.type)?45:25))handleEncounter(enc);raf=requestAnimationFrame(frame)}
  function startLoop(){if(!running)running=true;cancelAnimationFrame(raf);lastTime=0;raf=requestAnimationFrame(frame)}
  function stopLoop(){running=false;paused=true;cancelAnimationFrame(raf);els.game.classList.remove('is-running')}
  function doJump(){if(jumping)return;jumping=true;els.playerWrap.classList.remove('jump');void els.playerWrap.offsetWidth;els.playerWrap.classList.add('jump');speak('Jump!');setTimeout(()=>{jumping=false;els.playerWrap.classList.remove('jump')},750);if(obstacleHit){obstacleHit=false;els.go.disabled=true;paused=false;hideBubble();els.game.classList.add('is-running');startLoop()}}
  function resetGame(){const s=STAGES[currentStageIndex];encounters=s.encounters;stopLoop();distance=0;activeEncounter=0;stars=0;els.stars.textContent=0;obstacleHit=false;jumping=false;els.overlay.classList.add('hidden');els.oldPanel.classList.add('hidden');setNumber(s.start,false);buildWorld();renderWorld();$('#stageLabel').textContent=`Stage ${currentStageIndex+1}`;$('#worldName').textContent=s.name;els.game.dataset.theme=s.theme;els.progress.style.width='0%';bubble(s.intro);els.jump.disabled=true;els.go.disabled=false;els.go.textContent='Start Running ➜'}
  function startStage(i){if(!IS_LOCAL_TEST&&i>progress.highestUnlocked)return;currentStageIndex=i;progress.lastStage=i;saveProgress();show('gameScreen');resetGame()}
  function renderStageSelect(){els.stageGrid.innerHTML='';STAGES.forEach((s,i)=>{const locked=!IS_LOCAL_TEST&&i>progress.highestUnlocked,done=progress.completed.includes(i),best=progress.starsByStage[i]||0;const b=action('','stage-tile'+(locked?' locked':'')+(done?' completed':''),()=>startStage(i));b.disabled=locked;b.innerHTML=`<span class="stage-number">${locked?'🔒':i+1}</span><span class="stage-copy"><strong>${s.short}</strong><small>Numbers ${s.range}</small></span><span class="stage-result">${done?`✓ ⭐${best}`:'Play'}</span>`;els.stageGrid.appendChild(b)});els.stageProgress.textContent=IS_LOCAL_TEST?'Local testing • all stages unlocked':progress.completed.length?`${progress.completed.length} of ${STAGES.length} stages complete`:'Stage 1 is ready!'}
  function finishStage(){
    stopLoop();if(!progress.completed.includes(currentStageIndex))progress.completed.push(currentStageIndex);progress.starsByStage[currentStageIndex]=Math.max(progress.starsByStage[currentStageIndex]||0,stars);if(currentStageIndex<STAGES.length-1)progress.highestUnlocked=Math.max(progress.highestUnlocked,currentStageIndex+1);progress.lastStage=Math.min(STAGES.length-1,currentStageIndex+1);saveProgress();renderStageSelect();
    const grand=currentStageIndex===20;$('#celebrationScreen').classList.toggle('grand-celebration',grand);$('#finishHero').innerHTML=grand?`<div class="castle-party">${[10,20,25,50,100].map(numberHTML).join('')}</div>`:numberHTML(number);$('#finishText').textContent=grand?'Aryan’s Challenge Castle is complete! You made One Hundred!':`You finished ${STAGES[currentStageIndex].short} and collected ${stars} stars!`;
    const next=$('#nextStageBtn');next.classList.toggle('hidden',currentStageIndex===STAGES.length-1);next.textContent=`Next: ${STAGES[Math.min(STAGES.length-1,currentStageIndex+1)].short}`;speak(grand?'A spectacular One Hundred celebration! You completed the castle!':'Amazing! Stage complete!');show('celebrationScreen')
  }

  els.jump.addEventListener('click',doJump);els.game.addEventListener('pointerdown',e=>{if(e.target===els.game&&!els.jump.disabled&&!paused)doJump()});window.addEventListener('keydown',e=>{if(['Space','ArrowUp'].includes(e.code)&&!els.jump.disabled){e.preventDefault();doJump()}});
  els.go.addEventListener('click',()=>{if(els.go.disabled)return;els.go.disabled=true;els.jump.disabled=false;els.oldPanel.classList.add('hidden');hideBubble();paused=false;running=true;els.game.classList.add('is-running');startLoop()});
  $('#playBtn').addEventListener('click',()=>startStage(Math.min(progress.lastStage,progress.highestUnlocked)));$('#chooseStagesBtn').addEventListener('click',()=>{renderStageSelect();show('stageScreen')});$('#stageBackBtn').addEventListener('click',()=>show('homeScreen'));
  $('#homeBtn').addEventListener('click',()=>{if('speechSynthesis'in window)speechSynthesis.cancel();els.overlay.classList.add('hidden');show('homeScreen')});$('#againBtn').addEventListener('click',()=>startStage(currentStageIndex));$('#nextStageBtn').addEventListener('click',()=>startStage(Math.min(STAGES.length-1,currentStageIndex+1)));$('#celebrationStagesBtn').addEventListener('click',()=>{renderStageSelect();show('stageScreen')});$('#celebrateHomeBtn').addEventListener('click',()=>show('homeScreen'));$('#parentBtn').addEventListener('click',()=>show('parentScreen'));$('#parentBackBtn').addEventListener('click',()=>show('homeScreen'));
  window.addEventListener('resize',()=>{if($('#gameScreen').classList.contains('active'))renderWorld()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)pauseRun()});
  $('#homeZero').innerHTML=zeroHTML();$('#homeOne').innerHTML=numberHTML(1);renderStageSelect();$('#playBtn').textContent=progress.completed.length?`▶ Continue Stage ${Math.min(progress.lastStage,progress.highestUnlocked)+1}`:'▶ Start Adventure';
  const previewParams=new URLSearchParams(location.search),previewStage=IS_LOCAL_TEST?Number(previewParams.get('stage')):0;
  if(previewStage>=1&&previewStage<=STAGES.length){
    startStage(previewStage-1);const missionNumber=Number(previewParams.get('mission'));
    if(missionNumber){const mission=encounters.filter(e=>MISSION_TYPES.has(e.type))[missionNumber-1];if(mission){activeEncounter=encounters.indexOf(mission);distance=Math.max(0,mission.x-45);renderWorld();openMission(mission)}}
  }
  if('serviceWorker'in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(r=>r.update()).catch(()=>{}))}
})();
