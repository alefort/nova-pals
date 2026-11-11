/* Game 6: Weekly Boss. His six trickiest facts this week become armour plates on a boss.
   Answer a plate's fact to crack it; quick answers land critical hits. Break all six and the boss falls.
   Nothing bad happens on a miss: the boss roars, the trick is shown, and he answers again.
   A new boss (with that week's trickiest facts) arrives every Monday. */
(function(){
const SM=window.SM,$=SM.$,FX=SM.fx,A=(n,x)=>SM.audio.play(n,x),sleep=FX.sleep;
const HP=3; // hits per plate (a quick answer is a critical: 2 hits)
const NAMES=['Grumblox','Snarlvex','Mathmaw','Krunchion','Voltusk','Glimmerjaw','Thundrax','Blorbix'];
const SKINS=[['#9775fa','#5f3dc4'],['#ff6b6b','#c92a2a'],['#20c997','#087f5b'],['#fd7e14','#d9480f'],['#4dabf7','#1864ab'],['#f06595','#a61e4d'],['#94d82d','#5c940d'],['#ffd43b','#e67700']];
const week=()=>Math.floor((SM.today()+3)/7); // weeks start on Monday

function bs(){const st=SM.st;if(!st.boss)st.boss={wk:-1,facts:[],beat:-1,wins:0,fights:0};return st.boss}
function trickiest(){ // the six facts that most need work: misses, low boxes, slow answers, the core families
  const F=SM.facts().filter(f=>f.a>=2&&f.b>=2&&f.a!==10&&f.b!==10&&f.a!==11&&f.b!==11);
  const score=f=>(f.box>=1?20:0)+f.wrong*4+(5-f.box)*3+(SM.isCore(f.a,f.b)?6:0)+(f.best?Math.min(f.best,9000)/1000:3)+Math.random();
  return F.sort((x,y)=>score(y)-score(x)).slice(0,6).map(f=>[f.a,f.b]);
}
function boss(){const b=bs(),w=week();if(b.wk!==w){b.wk=w;b.facts=trickiest();SM.save()}
  return {name:NAMES[w%NAMES.length],skin:SKINS[w%SKINS.length],facts:b.facts,beaten:b.beat===w}}

function art(skin,cls=''){const [c,d]=skin;
  return `<svg class="bossArt ${cls}" viewBox="0 0 240 220">
    <path d="M58 70 L34 8 L92 52 Z M182 70 L206 8 L148 52 Z" fill="#f3ead2" stroke="#3b1d0b" stroke-width="5" stroke-linejoin="round"/>
    <path d="M24 150 C14 80 60 40 120 40 C180 40 226 80 216 150 C210 196 170 214 120 214 C70 214 30 196 24 150 Z" fill="${c}" stroke="${d}" stroke-width="7"/>
    <path d="M40 110 C50 70 84 54 120 54 C156 54 190 70 200 110 C180 84 150 76 120 76 C90 76 60 84 40 110 Z" fill="#fff" opacity=".18"/>
    <path d="M10 140 q-6 -26 20 -30 q4 18 -6 40Z M230 140 q6 -26 -20 -30 q-4 18 6 40Z" fill="${c}" stroke="${d}" stroke-width="5"/>
    <g class="eyes"><ellipse cx="88" cy="96" rx="20" ry="18" fill="#fff" stroke="${d}" stroke-width="4"/><ellipse cx="152" cy="96" rx="20" ry="18" fill="#fff" stroke="${d}" stroke-width="4"/>
    <circle class="pupil" cx="92" cy="99" r="8" fill="#1a1033"/><circle class="pupil" cx="148" cy="99" r="8" fill="#1a1033"/></g>
    <path class="brow" d="M66 72 L106 84 M174 72 L134 84" stroke="${d}" stroke-width="8" stroke-linecap="round"/>
    <path d="M86 126 Q120 142 154 126" fill="none" stroke="${d}" stroke-width="6" stroke-linecap="round"/>
    <path d="M96 129 l6 10 l6 -8 M132 131 l6 8 l6 -10" fill="#fff" stroke="${d}" stroke-width="3" stroke-linejoin="round"/></svg>`}

/* ---------- home ---------- */
function open(){
  const b=bs(),B=boss();SM.audio.music('hub');
  $('#bArt').innerHTML=art(B.skin,'idle');
  $('#bTitle').innerHTML=`${B.name}<small>${B.beaten?'Defeated this week!':'This week\'s boss'}</small>`;
  $('#bFacts').innerHTML=B.facts.map(([a,c])=>`<span class="plate mini">${a} × ${c}</span>`).join('');
  const days=7-((SM.today()+3)%7);
  $('#bInfo').innerHTML=B.beaten?`<b>You beat ${B.name}!</b> Rematch for practice any time. A new boss with your newest tricky stars lands in ${days} day${days>1?'s':''}.`
    :`<b>${B.name} is wearing your 6 trickiest stars as armour.</b> Answer a plate's fact to crack it. Quick answers are critical hits. Break all six!`;
  $('#bStats').innerHTML=`<span class="pill"><i class="ic">${FX.I.star}</i><b>${b.wins}</b> ${b.wins===1?'boss':'bosses'} beaten</span><span class="pill"><i class="ic">${FX.I.dust}</i><b>${SM.st.dust}</b></span>`;
  $('#bGo').innerHTML=B.beaten?'Rematch <small>practice</small>':'Fight! <small>+30 stardust</small>';
  SM.show('bossHome');
}
$('#bBack').onclick=()=>{A('back');SM.hub.open()};
$('#bGo').onclick=()=>{A('tap');start()};

/* ---------- fight ---------- */
let G=null;
const pad=$('#bPad');
pad.innerHTML=[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>`<button data-k="${k}" class="${k==='✓'?'ok':k==='⌫'?'del':''}">${k}</button>`).join('');
pad.addEventListener('click',e=>{const b=e.target.closest('button');if(b)press(b.dataset.k)});
document.addEventListener('keydown',e=>{
  if(!$('#bossFight').classList.contains('on')||!G||$('#cine').classList.contains('on'))return;
  if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('⌫');else if(e.key==='Enter'){e.preventDefault();press('✓')}
});
function start(){
  const B=boss();bs().fights++;
  G={B,hp:B.facts.map(()=>HP),last:-1,hits:0,crits:0,facts:0,dust:0,shown:SM.st.dust,lock:true,typed:''};
  $('#bfDust').textContent=G.shown;$('#bfBuddy').innerHTML=SM.creature.svg(SM.st.creature,SM.stage());
  $('#bfName').textContent=B.name;
  $('#bfStage').innerHTML=`${art(B.skin)}<div class="plates" id="bfPlates">${B.facts.map(([a,c],i)=>`<div class="plate" data-p="${i}"><span>${a} × ${c}</span><svg viewBox="0 0 100 60" preserveAspectRatio="none" class="pcrack"></svg></div>`).join('')}</div>`;
  hpBar();SM.audio.music('boss');SM.show('bossFight');
  const st=$('#bfStage');FX.anim(st,[{transform:'translateY(-40px) scale(.6)',opacity:0},{transform:'translateY(6px) scale(1.04)',opacity:1,offset:.7},{transform:'none'}],{duration:700});
  setTimeout(()=>{A('roar');FX.shake(document.body,5);hint(`${B.name} appears!`)},450);
  setTimeout(ask,FX.calm?100:1600);
}
function hpBar(){const tot=G.B.facts.length*HP,left=G.hp.reduce((a,b)=>a+b,0);$('#bfHp').style.width=(100*left/tot)+'%';
  $('#bfStage').classList.toggle('rage',left>0&&G.hp.filter(h=>h>0).length<=2)}
function hint(t,warm){const h=$('#bfHint');h.textContent=t;h.classList.toggle('warm',!!warm);if(t)FX.enter(h)}
function ask(){
  if(!G)return;const alive=G.hp.map((h,i)=>h>0?i:-1).filter(i=>i>=0);
  let i=alive[Math.random()*alive.length|0];if(alive.length>1&&i===G.last)i=alive.find(j=>j!==G.last);
  G.cur=i;G.last=i;let [a,b]=G.B.facts[i];if(Math.random()<.5)[a,b]=[b,a];
  const form=Math.random()<.3?'miss':'times';G.q={a,b,form,ans:form==='miss'?a:a*b};
  G.typed='';G.missed=false;G.lock=false;G.t0=performance.now();$('#bfFix').innerHTML='';
  document.querySelectorAll('#bfPlates .plate').forEach(p=>p.classList.toggle('target',+p.dataset.p===i));
  $('#bfQ').innerHTML=form==='miss'?`<span class="ans small" id="bfAns"></span><span>× ${b} = ${a*b}</span>`:`<span>${a} × ${b} =</span><span class="ans small" id="bfAns"></span>`;
  FX.pop($('#bfQ'),1.06);hint('');
}
function press(k){const btn=pad.querySelector(`[data-k="${k}"]`);if(btn){btn.classList.remove('hit');void btn.offsetWidth;btn.classList.add('hit')}
  if(!G||G.lock)return;
  if(k==='✓')return enter();
  if(k==='⌫'){G.typed=G.typed.slice(0,-1);A('back')}else if(G.typed.length<3){G.typed+=k;A('key',+k)}
  $('#bfAns').textContent=G.typed;FX.pop($('#bfAns'),1.08);
}
async function enter(){
  if(!G.typed)return;const run=G,q=G.q,v=+G.typed,ms=performance.now()-G.t0,[fa,fb]=[q.a,q.b];
  if(v!==q.ans){
    A('roar');run.typed='';$('#bfAns').textContent='';FX.shake($('#bfQ'),6);
    const art=$('#bfStage .bossArt');FX.anim(art,[{transform:'none'},{transform:'translateY(14px) scale(1.08)'},{transform:'none'}],{duration:380});
    const me=$('#bfBuddy');me.classList.remove('oops');void me.offsetWidth;me.classList.add('oops');
    if(!run.missed){SM.practice(fa,fb,false,ms);run.missed=true}
    const st=SM.strategy(fa,fb);
    $('#bfFix').innerHTML=`<div class="panel tight"><p class="sname">${st.name}: <span class="mono">${st.expr}</span></p><div class="steps">${SM.chainHTML(st)}</div>${q.form==='miss'?`<p class="sub" style="margin:4px 0 0">${fa} × ${fb} = ${fa*fb}, so the missing number is <b>${fa}</b>.</p>`:''}</div>`;
    FX.enter($('#bfFix'));hint(`${run.B.name} blocked it! Use the trick and strike again.`,true);return;
  }
  run.lock=true;if(!run.missed){SM.practice(fa,fb,true,ms);run.facts++}
  const crit=!run.missed&&ms<SM.FAST,dmg=crit?2:1,i=run.cur,plate=$(`#bfPlates [data-p="${i}"]`),c=FX.center(plate);
  run.hp[i]=Math.max(0,run.hp[i]-dmg);run.hits++;if(crit)run.crits++;
  A(crit?'crit':'hit');FX.burst(c.x,c.y,{n:crit?30:16,colors:crit?['#fff3bf','#ffd43b','#fff']:['#fff','#ced4da',run.B.skin[0]],speed:crit?11:7});
  if(crit)FX.floatText(c.x,c.y-40,'CRITICAL!','bolt');
  const art=$('#bfStage .bossArt');FX.anim(art,[{transform:'none',filter:'brightness(1)'},{transform:'translateX(-10px) rotate(-3deg)',filter:'brightness(2)'},{transform:'none',filter:'brightness(1)'}],{duration:300});
  const CR=['<path d="M50 0 L42 24 L58 34 L46 60"/>','<path d="M0 30 L26 34 L42 24"/><path d="M100 22 L76 30 L58 34"/>'];
  plate.querySelector('.pcrack').innerHTML=CR.slice(0,HP-run.hp[i]).join('');
  plate.classList.add('hit');setTimeout(()=>plate.classList.remove('hit'),220);
  if(!run.missed)addDust(1,plate);
  if(run.hp[i]===0){await sleep(FX.calm?20:200);A('crack');plate.classList.add('gone');FX.burst(c.x,c.y,{n:24,colors:['#ced4da','#868e96','#fff'],speed:9,g:.25})}
  hpBar();
  await sleep(FX.calm?60:650);if(G!==run)return;
  if(run.hp.every(h=>h===0))return win();
  ask();
}
function addDust(n,el){const run=G;run.dust+=SM.earn(n);const pd=$('#bfDust');
  FX.fly(el,pd,n,i=>{run.shown++;pd.textContent=run.shown;A('coin',i);FX.pop(pd.parentNode,1.15)})}
async function win(){
  const run=G,b=bs(),w=week(),first=b.beat!==w,art=$('#bfStage .bossArt'),c=FX.center(art);
  hint(`${run.B.name} is defeated!`);A('roar');
  FX.anim(art,[{transform:'none'},{transform:'rotate(-6deg)'},{transform:'rotate(6deg)'},{transform:'scale(1.2)',filter:'brightness(3)',opacity:1},{transform:'scale(0)',opacity:0}],{duration:FX.calm?50:1100,fill:'forwards'});
  await sleep(FX.calm?50:900);A('fanfare');FX.burst(c.x,c.y,{n:90,colors:FX.RAINBOW,speed:15});FX.ring(c.x,c.y,{n:26,speed:11});FX.confetti();
  if(first){b.beat=w;b.wins++}
  const bonus=first?30:8;SM.markDay();SM.save();
  await sleep(FX.calm?100:1800);if(G!==run)return;G=null;run.dust+=SM.earn(bonus);SM.save();
  $('#sumBtn').onclick=()=>{A('tap');open()};
  const days=7-((SM.today()+3)%7);
  FX.results({title:'BOSS DEFEATED!',btn:'Back to the lair',dust:run.dust,rows:[
      [FX.I.bolt,'Hits landed',run.hits],[FX.I.combo,'Critical hits',run.crits],[FX.I.star,first?'Weekly boss bonus':'Rematch bonus',bonus,true],[FX.I.dust,'Stardust earned',run.dust,true]],
    extraSound:first?'fanfare':null,
    extra:`<div class="panel"><b>${first?`Trophy #${b.wins}!`:'Rematch complete.'}</b> A new boss arrives in ${days} day${days>1?'s':''}, wearing whichever stars are trickiest by then.</div>`});
}
$('#bfQuit').onclick=()=>{A('tap');if(confirm('Run from the boss? Stardust you earned is kept.')){G=null;SM.save();open()}};

SM.boss={open,state:()=>boss()};
})();
