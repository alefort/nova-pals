/* Shared core: progress for every fact, stardust, creature stage, strategies.
   Every game reads and writes the same record so practice anywhere counts everywhere. */
window.SM=(function(){
const $=s=>document.querySelector(s);
const INTERVAL=[0,1,2,4,8,16];            // days until next check, by box (0 = not learned)
const CORE=[3,4,6,7,8,9,12];              // the families that need real work
const PRIORITY=[2,10,5,11,9,4,3,6,12,8,7];// which factor makes the easier "anchor"
const FAST=3000, NEW_PER_DAY=4, STORE='starmap.v1';

const ONES=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function words(n){if(n<20)return ONES[n];if(n<100)return TENS[Math.floor(n/10)]+(n%10?'-'+ONES[n%10]:'');return 'one hundred'+(n%100?' and '+words(n%100):'')}
function plural(n){return n===6?'sixes':words(n)+'s'}
function today(){const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5)}
function K(a,b){return a<b?a+'x'+b:b+'x'+a}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function isCore(a,b){return CORE.includes(a)&&CORE.includes(b)}
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));window.scrollTo(0,0)}

/* ---------- state ---------- */
const DEFAULT_CREATURE={name:'',body:'round',color:'sky',eyes:'big',top:'none',pattern:'belly',acc:'none',bg:'night',
  owned:['body:round','body:bean','body:tall','color:sky','color:mint','color:sun','eyes:big','top:none','pattern:none','pattern:belly','acc:none','bg:night'],seenStage:0};
function fresh(){
  const t=today(),facts={};let i=0;
  for(let a=2;a<=12;a++)for(let b=a;b<=12;b++){
    const core=isCore(a,b);
    // pattern facts (2s, 5s, 10s, 11s) start lit but get checked over the first week
    facts[K(a,b)]={a,b,box:core?0:3,due:core?t:t+(i++%7),right:0,wrong:0,best:0};
  }
  return {facts,intro:false,scouted:false,days:[],sessions:0,sound:true,music:true,bestCombo:0,newLog:{day:0,n:0},
    dust:0,dustTotal:0,creature:JSON.parse(JSON.stringify(DEFAULT_CREATURE))};
}
function load(){
  let s=null;try{const r=localStorage.getItem(STORE);if(r)s=JSON.parse(r)}catch(e){}
  if(!s||!s.facts)return fresh();
  // upgrade older saves (from before the creature existed)
  const f=fresh();for(const k in f)if(s[k]===undefined)s[k]=f[k];
  for(const k in DEFAULT_CREATURE)if(s.creature[k]===undefined)s.creature[k]=JSON.parse(JSON.stringify(DEFAULT_CREATURE[k]));
  return s;
}
const api={};
api.st=load();
api.save=function(){try{localStorage.setItem(STORE,JSON.stringify(api.st))}catch(e){}};
api.reset=function(){api.st=fresh();api.save()};
api.facts=()=>Object.values(api.st.facts);
api.litCount=()=>api.facts().filter(f=>f.box>=3).length;
api.coreLit=()=>api.facts().filter(f=>isCore(f.a,f.b)&&f.box>=3).length;
api.novaCount=()=>api.facts().filter(f=>f.box===5).length;
api.streak=function(){const d=new Set(api.st.days),t=today();let n=0,x=d.has(t)?t:t-1;while(d.has(x)){n++;x--}return n};
/* any game can report a fact attempt; it feeds the same spaced-review schedule as Star Map */
api.practice=function(a,b,ok,ms){
  if(a<2||b<2||a>12||b>12)return;const f=api.st.facts[K(a,b)],t=today();if(!f)return;
  if(ok){f.right++;if(!f.best||ms<f.best)f.best=Math.round(ms);
    if(ms<FAST&&f.box>=1&&f.due<=t){f.box=Math.min(5,f.box+1);f.due=t+INTERVAL[f.box]}}
  else{f.wrong++;if(f.box>=3)f.box=2;if(f.box>=1)f.due=Math.min(f.due,t+1)}
};
api.once=fn=>{let t=0;return(...a)=>{const n=Date.now();if(n-t<1200)return;t=n;return fn(...a)}};
api.markDay=function(){const t=today();if(!api.st.days.includes(t))api.st.days.push(t)};
api.earn=function(n){api.st.dust+=n;api.st.dustTotal+=n;return n};

/* ---------- creature growth is tied to real mastery ---------- */
const STAGES=[
  {name:'Egg',need:'Scout the sky to hatch it'},
  {name:'Hatchling',need:'Light 8 of the 28 tricky stars'},
  {name:'Sprout',need:'Light 16 of the 28 tricky stars',gain:'grew arms and feet'},
  {name:'Flyer',need:'Light all 28 tricky stars',gain:'grew wings'},
  {name:'Glow',need:'Reach 20 supernova stars',gain:'started to glow and grew a tail'},
  {name:'Cosmic',need:'Fully evolved!',gain:'became COSMIC: stars orbit it now'}
];
api.STAGES=STAGES;
api.stage=function(){
  if(!api.st.scouted)return 0;const c=api.coreLit(),n=api.novaCount();
  if(c>=28&&n>=20)return 5;if(c>=28)return 4;if(c>=16)return 3;if(c>=8)return 2;return 1;
};

/* ---------- strategies: how each star is built ---------- */
const HOOKS={
  '7x8':'5, 6, 7, 8 → 56 = 7 × 8. The digits count in order!',
  '3x4':'1, 2, 3, 4 → 12 = 3 × 4. Counting in order again.',
  '12x12':'144 has its own name: a "gross". Biggest star on the map.',
  '6x8':'6 × 8 = 48, same as 4 × 12. Two stars, one number.',
  '4x12':'4 × 12 = 48, same as 6 × 8. Two stars, one number.',
  '8x8':'64 is the number of squares on a chessboard (8 by 8).',
  '6x7':'6 × 7 = 42. Some people call 42 the answer to everything.',
  '3x12':'36 inches in a yard: 3 feet × 12 inches.',
  '4x6':'24 hours in a day: 4 groups of 6.',
  '6x12':'72 = 6 dozen eggs.'
};
function strategy(a,b){
  let anchor,o;
  if(a===b||PRIORITY.indexOf(a)<=PRIORITY.indexOf(b)){anchor=a;o=b}else{anchor=b;o=a}
  const p=a*b;let s;
  switch(anchor){
    case 2: s={name:'Double it',idea:`2 groups of ${o} is just ${o} doubled.`,steps:[[`${o} + ${o}`,p]],bands:[2]};break;
    case 10:s={name:'Add a zero',idea:`10 groups of ${o}: write ${o}, then put a zero on the end.`,steps:[[`${o} with a zero on the end`,p]],bands:[10]};break;
    case 5: s={name:'Half of ten',idea:`5 groups is half of 10 groups. Do the easy ×10, then cut it in half.`,steps:[[`10 × ${o}`,10*o],[`half of ${10*o}`,p]],bands:[5]};break;
    case 11:s=o<=9?{name:'Twin digits',idea:`11 × a single digit just writes that digit twice.`,steps:[[`${o} written twice`,p]],bands:[10,1]}
                  :{name:'Ten plus one',idea:`11 groups = 10 groups + 1 more group.`,steps:[[`10 × ${o}`,10*o],[`${10*o} + ${o}`,p]],bands:[10,1]};break;
    case 9: s={name:'Ten, take one away',idea:`9 groups is 10 groups with one group taken away.`,steps:[[`10 × ${o}`,10*o],[`${10*o} − ${o}`,p]],bands:[9],ghost:1};break;
    case 4: s={name:'Double, double',idea:`4 groups = double it, then double it again.`,steps:[[`${o} doubled`,2*o],[`${2*o} doubled`,p]],bands:[2,2]};break;
    case 3: s={name:'Double plus one',idea:`3 groups = 2 groups + 1 more group.`,steps:[[`${o} doubled`,2*o],[`${2*o} + ${o}`,p]],bands:[2,1]};break;
    case 6: s={name:'Five plus one',idea:`6 groups = 5 groups + 1 more group.`,steps:[[`5 × ${o}`,5*o],[`${5*o} + ${o}`,p]],bands:[5,1]};break;
    case 12:s={name:'Ten plus two',idea:`12 groups = 10 groups + 2 groups.`,steps:[[`10 × ${o}`,10*o],[`2 × ${o}`,2*o],[`${10*o} + ${2*o}`,p]],bands:[10,2]};break;
    case 8: s={name:'Triple double',idea:`8 groups = double, double, double (2 → 4 → 8).`,steps:[[`${o} doubled`,2*o],[`${2*o} doubled`,4*o],[`${4*o} doubled`,p]],bands:[2,2,4]};break;
    case 7: s={name:'Five plus two',idea:`7 groups = 5 groups + 2 groups.`,steps:[[`5 × ${o}`,5*o],[`2 × ${o}`,2*o],[`${5*o} + ${2*o}`,p]],bands:[5,2]};break;
  }
  s.anchor=anchor;s.o=o;s.p=p;
  // the same strategy written as a BEDMAS expression
  s.expr={2:`${o} + ${o}`,10:`10 × ${o}`,5:`(10 × ${o}) ÷ 2`,11:`(10 × ${o}) + ${o}`,9:`(10 × ${o}) − ${o}`,
    4:`(${o} × 2) × 2`,3:`(${o} × 2) + ${o}`,6:`(5 × ${o}) + ${o}`,12:`(10 × ${o}) + (2 × ${o})`,
    8:`((${o} × 2) × 2) × 2`,7:`(5 × ${o}) + (2 × ${o})`}[anchor];
  s.hook=HOOKS[K(a,b)]||'';
  if(!s.hook&&a===b)s.hook=`${a} × ${a} is a square number. The dots make a perfect square.`;
  if(!s.hook&&anchor===9&&o<=10)s.hook=`9s secret: the digits of ${p} add up to 9 (${String(p).split('').join(' + ')} = 9).`;
  return s;
}
function difficulty(f){const s=strategy(f.a,f.b);return PRIORITY.indexOf(s.anchor)*20+s.o}
function arraySVG(s){
  const cols=s.o,colors=['var(--b1)','var(--b2)','var(--b3)'];let y=0,out='';
  s.bands.forEach((n,bi)=>{
    const y0=y;
    for(let r=0;r<n;r++){for(let c=0;c<cols;c++)out+=`<circle cx="${c+.5}" cy="${y+.5}" r=".37" fill="${colors[bi%3]}"/>`;y++}
    out+=`<text x="${cols+.4}" y="${y0+n/2+.25}" font-size=".75">${n} × ${cols}</text>`;
    y+=.45;
  });
  if(s.ghost){for(let c=0;c<cols;c++)out+=`<circle cx="${c+.5}" cy="${y+.5}" r=".33" fill="none" stroke="var(--faint)" stroke-width=".07" stroke-dasharray=".18 .12"/>`;
    out+=`<text x="${cols+.4}" y="${y+.75}" font-size=".75">take away</text>`;y++;}
  return `<svg class="arr" viewBox="-.2 -.2 ${cols+4.2} ${y+.2}" role="img" aria-label="${s.anchor} rows of ${s.o} dots">${out}</svg>`;
}
function chainHTML(s){return s.steps.map(([l,v])=>`<div class="step done"><span>${l}</span><span class="slot">${v}</span></div>`).join('')}

/* juice lives in audio.js and fx.js; these are kept as shortcuts */
function chime(){api.audio&&api.audio.play('correct',0)}
function fanfare(){api.audio&&api.audio.play('fanfare')}

Object.assign(api,{$,INTERVAL,CORE,PRIORITY,FAST,NEW_PER_DAY,words,plural,today,K,shuffle,isCore,show,
  strategy,difficulty,arraySVG,chainHTML,chime,fanfare});
return api;
})();
