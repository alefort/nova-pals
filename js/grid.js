/* Game 3: Claim the Grid. A strategy duel against a robot rival.
   Two probes sit on a strip of factors. Each turn you move ONE probe, say the product, and claim that square.
   Four in a row wins. The catch: your rival moves from wherever you leave the probes, so planning means
   thinking in products: "if I move to 7, they can reach 56 and 63..." */
(function(){
const SM=window.SM,$=SM.$,FX=SM.fx,A=(n,x)=>SM.audio.play(n,x),sleep=FX.sleep;
const F=[2,3,4,5,6,7,8,9,12];              // 81 pairs, exactly 36 different products: a full 6 x 6 board
const PROD=[...new Set(F.flatMap(a=>F.map(b=>a*b)))].sort((a,b)=>a-b),IDX={};PROD.forEach((p,i)=>IDX[p]=i);
const ME=1,CPU=2;
const RIVALS=[
  {name:'Bleep',rank:'Cadet',color:'#ffa94d',dark:'#c2410c',blurb:'Still learning. Makes wild moves.'},
  {name:'Zorp',rank:'Captain',color:'#ff8787',dark:'#c92a2a',blurb:'Blocks your rows. Never hands you a win.'},
  {name:'Mega-Zorp',rank:'Admiral',color:'#b197fc',dark:'#5f3dc4',blurb:'Plans ahead. Watches where you can move next.'}
];

/* ---------- lines: every run of four on the 6 x 6 board ---------- */
const WIN=[],BY=PROD.map(()=>[]);
for(let r=0;r<6;r++)for(let c=0;c<6;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
  const w=[0,1,2,3].map(k=>[r+dr*k,c+dc*k]);
  if(w.every(([y,x])=>y>=0&&y<6&&x>=0&&x<6)){const ids=w.map(([y,x])=>y*6+x);WIN.push(ids);ids.forEach(i=>BY[i].push(ids))}
}
const wins=(o,i,who)=>BY[i].find(w=>w.every(j=>j===i||o[j]===who))||null;
function moves(o,t,b){const out=[];
  for(const f of F){if(f!==t){const i=IDX[f*b];if(!o[i])out.push({row:'t',f,t:f,b,i})}
                    if(f!==b){const i=IDX[t*f];if(!o[i])out.push({row:'b',f,t,b:f,i})}}
  return out}
function heur(o,i,who){const opp=3-who;let s=0;
  for(const w of BY[i]){let m=0,x=0;for(const j of w){if(j===i)continue;if(o[j]===who)m++;else if(o[j]===opp)x++}
    if(!x)s+=[1,5,25,0][m];if(!m)s+=[0,3,14,120][x]}
  const r=i/6|0,c=i%6;return s+(2.5-Math.abs(2.5-r))*.3+(2.5-Math.abs(2.5-c))*.3}
function cpuPick(o,t,b,lvl){
  const ms=moves(o,t,b);if(!ms.length)return null;
  if(lvl===0&&Math.random()<.35)return ms[Math.random()*ms.length|0];
  let best=null,bs=-Infinity;
  for(const m of ms){let s;
    if(wins(o,m.i,CPU))s=lvl===0&&Math.random()<.4?50:1e6;
    else{const o2=o.slice();o2[m.i]=CPU;const rep=moves(o2,m.t,m.b);s=heur(o,m.i,CPU);
      if(lvl>=1&&rep.some(r=>wins(o2,r.i,ME)))s-=1e5;
      if(lvl===2)s-=.6*Math.max(0,...rep.map(r=>heur(o2,r.i,ME)));
      s*=lvl===0?.4+Math.random()*1.2:lvl===1?.75+Math.random()*.5:.95+Math.random()*.1}
    if(s>bs){bs=s;best=m}}
  return best;
}

/* ---------- state ---------- */
function gs(){const st=SM.st;if(!st.grid)st.grid={rival:0,unlocked:0,games:0,won:[0,0,0],lost:0,draws:0};return st.grid}
function robot(r,cls=''){
  return `<svg class="bot ${cls}" viewBox="0 0 100 100"><line x1="50" y1="8" x2="50" y2="24" stroke="${r.dark}" stroke-width="4"/><circle class="ant" cx="50" cy="9" r="7" fill="#ffd66e" stroke="#7a4d00" stroke-width="2.5"/>
    <rect x="14" y="24" width="72" height="62" rx="20" fill="${r.color}" stroke="${r.dark}" stroke-width="4"/><rect x="14" y="24" width="72" height="26" rx="20" fill="#fff" opacity=".18"/>
    <rect x="6" y="46" width="10" height="20" rx="5" fill="${r.dark}"/><rect x="84" y="46" width="10" height="20" rx="5" fill="${r.dark}"/>
    <rect x="25" y="38" width="50" height="26" rx="12" fill="#10163a"/><g class="eyes"><circle cx="39" cy="51" r="6" fill="#7df9ff"/><circle cx="61" cy="51" r="6" fill="#7df9ff"/></g>
    <path d="M38 74h24" stroke="${r.dark}" stroke-width="4" stroke-linecap="round"/></svg>`}

/* ---------- home ---------- */
function open(){
  const g=gs();SM.audio.music('hub');
  $('#gRivals').innerHTML=RIVALS.map((r,i)=>{const lock=i>g.unlocked;
    return `<button class="rival${i===g.rival?' on':''}${lock?' locked':''}" data-r="${i}" ${lock?'disabled':''}>${robot(r)}<b>${lock?'???':r.name}</b><span>${r.rank}</span>${g.won[i]?`<em>${g.won[i]} win${g.won[i]>1?'s':''}</em>`:''}${lock?`<i class="ic lk">${FX.I.lock}</i>`:''}</button>`}).join('');
  const r=RIVALS[g.rival];
  $('#gRule').innerHTML=`<b>Rival: ${r.name} the ${r.rank}.</b> ${r.blurb}<ul class="how">
    <li>Each turn, move <b>one</b> probe to a new number.</li><li>Multiply top × bottom and claim that square.</li>
    <li>Get <b>4 in a row</b>: across, down or diagonal.</li><li>Careful: your rival moves from where you leave the probes!</li></ul>`;
  $('#gStats').innerHTML=`<span class="pill"><i class="ic">${FX.I.star}</i><b>${g.won.reduce((a,b)=>a+b,0)}</b> ${g.won.reduce((a,b)=>a+b,0)===1?'win':'wins'}</span><span class="pill"><i class="ic">${FX.I.bolt}</i><b>${g.games}</b> ${g.games===1?'duel':'duels'}</span><span class="pill"><i class="ic">${FX.I.dust}</i><b>${SM.st.dust}</b></span>`;
  SM.show('gridHome');
}
$('#gRivals').addEventListener('click',e=>{const t=e.target.closest('.rival');if(!t||t.disabled)return;A('tap');gs().rival=+t.dataset.r;SM.save();open()});
$('#gBack').onclick=()=>{A('back');SM.hub.open()};
$('#gGo').onclick=()=>{A('tap');start()};

/* ---------- duel ---------- */
let G=null;
const pad=$('#gPad');
pad.innerHTML=[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>`<button data-k="${k}" class="${k==='✓'?'ok':k==='⌫'?'del':''}">${k}</button>`).join('');
pad.addEventListener('click',e=>{const b=e.target.closest('button');if(b)press(b.dataset.k)});
document.addEventListener('keydown',e=>{
  if(!$('#grid').classList.contains('on')||!G||$('#cine').classList.contains('on'))return;
  if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('⌫');else if(e.key==='Enter'){e.preventDefault();press('✓')}
});

function start(){
  const g=gs(),lvl=g.rival,R=RIVALS[lvl];
  let t=F[Math.random()*F.length|0],b=F[Math.random()*F.length|0];
  G={lvl,R,o:PROD.map(()=>0),t,b,st:t,sb:b,turn:ME,mv:null,typed:'',lock:false,last:-1,
     claims:0,first:0,dust:0,shown:SM.st.dust,facts:0};
  $('#gMe').innerHTML=SM.creature.svg(SM.st.creature,SM.stage());$('#gBot').innerHTML=robot(R);
  $('#gBotName').textContent=R.name;$('#gDust').textContent=G.shown;
  $('#grid').style.setProperty('--cpu',R.color);$('#grid').style.setProperty('--cpuDark',R.dark);
  $('#gFix').innerHTML='';SM.audio.music('play');SM.show('grid');
  render(true);setTimeout(myTurn,FX.calm?0:500);
}
function score(){$('#gMeN').textContent=G.o.filter(x=>x===ME).length;$('#gBotN').textContent=G.o.filter(x=>x===CPU).length}
function render(fresh){
  $('#gBoard').innerHTML=PROD.map((p,i)=>`<div class="cell${G.o[i]===ME?' me':G.o[i]===CPU?' cpu':''}${i===G.last?' last':''}" data-i="${i}"><span>${p}</span></div>`).join('');
  if(fresh)[...$('#gBoard').children].forEach((el,i)=>FX.anim(el,[{transform:'scale(0)',opacity:0},{transform:'none',opacity:1}],{duration:300,delay:(i%6+(i/6|0))*35,fill:'backwards',easing:'cubic-bezier(.3,1.5,.5,1)'}));
  strips();score();
}
function strips(){
  const mine=G.turn===ME&&!G.lock;
  const row=(k,v,s)=>F.map(f=>`<button class="fac${f===v?' probe':''}${mine&&f===s&&f!==v?' ghost':''}" data-row="${k}" data-f="${f}" ${mine?'':'tabindex="-1"'}>${f}</button>`).join('');
  $('#gTop').innerHTML=row('t',G.t,G.st);$('#gBotRow').innerHTML=row('b',G.b,G.sb);
  $('#gStrips').classList.toggle('wait',!mine);
}
function prompt(txt,ans,cls){$('#gQ').innerHTML=txt;const a=$('#gAns');a.textContent=ans;a.className='ans small'+(cls?' '+cls:'');$('#gPrompt').style.visibility=txt?'visible':'hidden'}
function hint(t,warm){const h=$('#gHint');h.textContent=t;h.classList.toggle('warm',!!warm);if(t)FX.enter(h)}
function banner(t,who){const b=$('#gTurn');b.textContent=t;b.className='turn '+who;FX.pop(b,1.08)}

function myTurn(){
  if(!G)return;G.turn=ME;G.st=G.t;G.sb=G.b;G.mv=null;G.typed='';G.lock=false;
  if(!anyMove())return blocked();
  banner('Your move','me');hint('Move one probe to a new number.');prompt('','');strips();
}
function anyMove(){return moves(G.o,G.t,G.b).length>0}
$('#gStrips').addEventListener('click',e=>{const b=e.target.closest('.fac');if(!b||!G||G.turn!==ME||G.lock)return;
  const row=b.dataset.row,f=+b.dataset.f;G.t=G.st;G.b=G.sb;
  if((row==='t'&&f===G.st)||(row==='b'&&f===G.sb)){G.mv=null;A('back');strips();prompt('','');hint('Move one probe to a new number.');return}
  if(row==='t')G.t=f;else G.b=f;G.mv={row,f};G.typed='';G.missed=false;G.wrongOnce=false;G.t0=performance.now();
  A('tap');strips();FX.pop($(`#gStrips [data-row="${row}"][data-f="${f}"]`),1.2);
  prompt(`${G.t} × ${G.b} =`,'');hint('');$('#gFix').innerHTML='';FX.pop($('#gPrompt'),1.05);
});
function press(k){const b=pad.querySelector(`[data-k="${k}"]`);if(b){b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit')}
  if(!G||G.turn!==ME||G.lock)return;
  if(!G.mv){if(k!=='✓'){A('back');hint('Move a probe first, then type the answer.',true);FX.shake($('#gStrips'),5)}return}
  if(k==='✓')return enter();
  if(k==='⌫'){G.typed=G.typed.slice(0,-1);A('back')}else if(G.typed.length<3){G.typed+=k;A('key',+k)}
  $('#gAns').textContent=G.typed;FX.pop($('#gAns'),1.08);
}
async function enter(){
  if(!G.typed)return;const a=G.t,b=G.b,v=a*b,ms=performance.now()-G.t0;
  if(+G.typed!==v){
    A('wrong');FX.shake($('#gAns'));G.missed=true;G.typed='';$('#gAns').textContent='';
    if(!G.wrongOnce){SM.practice(a,b,false,ms);G.wrongOnce=true}
    const st=SM.strategy(a,b);
    $('#gFix').innerHTML=`<div class="panel tight"><p class="sname">${st.name}: <span class="mono">${st.expr}</span></p><div class="steps">${SM.chainHTML(st)}</div></div>`;
    FX.enter($('#gFix'));hint(`Use the trick, then type ${a} × ${b}.`,true);return;
  }
  if(!G.missed){SM.practice(a,b,true,ms);G.facts++}
  const i=IDX[v],cell=$(`#gBoard [data-i="${i}"]`);
  if(G.o[i]){
    A('back');FX.shake(cell,6);cell.classList.add('nope');setTimeout(()=>cell.classList.remove('nope'),900);
    hint(`Right, ${v}! But ${v} is already claimed. Try a different move.`,true);
    G.t=G.st;G.b=G.sb;G.mv=null;G.typed='';strips();prompt('','');return;
  }
  G.lock=true;$('#gFix').innerHTML='';prompt(`${a} × ${b} =`,v,'good');A('correct',G.claims%6);
  G.claims++;if(!G.missed){G.first++;addDust(1,cell)}
  if(await claim(i,ME))return;
  await sleep(450);cpuTurn();
}
async function claim(i,who){
  G.o[i]=who;G.last=i;render();
  const el=$(`#gBoard [data-i="${i}"]`),c=FX.center(el);
  FX.anim(el,[{transform:'scale(.4) rotate(-12deg)'},{transform:'scale(1.25)'},{transform:'none'}],{duration:420,easing:'cubic-bezier(.3,1.5,.5,1)'});
  FX.burst(c.x,c.y,{n:16,colors:who===ME?['#c3fae8','#38d9a9','#fff']:[G.R.color,'#fff',G.R.dark]});
  const w=wins(G.o,i,who);
  if(w){G.lock=true;await sleep(350);w.forEach((j,k)=>{const e=$(`#gBoard [data-i="${j}"]`);e.classList.add('win');e.style.animationDelay=k*90+'ms'});
    end(who);return true}
  if(!G.o.includes(0)){blocked();return true}
  return false;
}
async function cpuTurn(){
  if(!G)return;const run=G;run.turn=CPU;run.lock=true;strips();prompt('','');
  banner(`${run.R.name} is thinking…`,'cpu');hint('');
  const bot=$('#gBot');bot.classList.add('think');
  await sleep(FX.calm?100:650+Math.random()*450);if(G!==run)return;
  const m=cpuPick(run.o,run.t,run.b,run.lvl);bot.classList.remove('think');
  if(!m)return blocked();
  run.t=m.t;run.b=m.b;A('whoosh');strips();FX.pop($(`#gStrips [data-row="${m.row}"][data-f="${m.f}"]`),1.3);
  await sleep(FX.calm?80:500);if(G!==run)return;
  prompt(`${run.t} × ${run.b} =`,run.t*run.b,'cpu');A('boop');
  await sleep(FX.calm?80:700);if(G!==run)return;
  if(await claim(m.i,CPU))return;
  await sleep(300);myTurn();
}
function addDust(n,el){const run=G;run.dust+=SM.earn(n);const pd=$('#gDust');
  FX.fly(el,pd,n,i=>{run.shown++;pd.textContent=run.shown;A('coin',i);FX.pop(pd.parentNode,1.15)})}
function blocked(){ // no free square can be reached: most squares wins
  const m=G.o.filter(x=>x===ME).length,c=G.o.filter(x=>x===CPU).length;
  hint(`No free squares can be reached. Most squares wins: you ${m}, ${G.R.name} ${c}.`);
  end(m>c?ME:c>m?CPU:null,true);
}
async function end(who,byCount){
  const run=G;run.turn=0;run.lock=true;strips();
  const g=gs();g.games++;let unlocked=false;
  if(who===ME){g.won[run.lvl]++;banner(byCount?'MOST SQUARES!':'FOUR IN A ROW!','me');A('fanfare');FX.confetti();
    if(run.lvl===g.unlocked&&g.unlocked<2){g.unlocked++;g.rival=g.unlocked;unlocked=true}}
  else if(who===CPU){g.lost++;banner(byCount?`${run.R.name} has more squares`:`${run.R.name} got four in a row`,'cpu');A('wrong')}
  else{g.draws++;banner('Grid locked! A tie.','me');A('slam')}
  const bonus=who===ME?15+(unlocked?10:0):who===CPU?5:8;
  SM.markDay();SM.save();
  await sleep(byCount?3000:who?2200:1500);if(G!==run)return;G=null;
  run.dust+=SM.earn(bonus);SM.save();
  $('#sumBtn').onclick=()=>{A('tap');open()};
  const next=RIVALS[g.unlocked];
  FX.results({title:who===ME?'GRID CLAIMED!':who===CPU?'SO CLOSE!':'GRID LOCKED!',btn:'Next duel',dust:run.dust,rows:[
      [FX.I.star,'Squares claimed',run.claims],[FX.I.combo,'First-try answers',run.first],[FX.I.bolt,who===ME?'Victory bonus':'Good fight bonus',bonus,true],[FX.I.dust,'Stardust earned',run.dust,true]],
    extraSound:unlocked?'fanfare':null,
    extra:unlocked?`<div class="panel rivalNew">${robot(next)}<div><b>New rival: ${next.name} the ${next.rank}</b><br><span class="sub">${next.blurb}</span></div></div>`
      :who===CPU?`<div class="panel"><b>Tip:</b> before you move, check which squares ${run.R.name} could reach from where you leave the probes.</div>`:''});
}
$('#gQuit').onclick=()=>{A('tap');if(confirm('Leave this duel? Stardust you earned is kept.')){G=null;SM.save();open()}};

SM.grid={open,_t:{PROD,WIN,wins,moves,cpuPick}};
})();
