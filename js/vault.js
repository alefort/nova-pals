/* Game 5: Vault Cracker. Logic puzzles built from products.
   Each vault has 2 or 3 dials (numbers 2 to 12) and a few clues like "A × B = 56" and "A is bigger than B".
   Work out the code and crack it. Every puzzle is checked to have exactly one answer. */
(function(){
const SM=window.SM,$=SM.$,FX=SM.fx,A=(n,x)=>SM.audio.play(n,x),sleep=FX.sleep;
const V=[2,3,4,5,6,7,8,9,10,11,12],TIERS=[1,1,2,2,3],LET=['A','B','C'],COL=['#38d9a9','#ff8cc6','#ffd43b'];
const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const chip=i=>`<b class="dl" style="--c:${COL[i]}">${LET[i]}</b>`;

/* ---------- puzzle generation ---------- */
function pickFact(){
  const F=SM.facts().filter(f=>f.box>=1&&f.a>=2&&f.b>=2),w=[];
  F.forEach(f=>{const k=SM.isCore(f.a,f.b)?(f.box<=2?6:f.box<5?3:1):1;for(let i=0;i<k;i++)w.push(f)});
  const f=w.length?w[Math.random()*w.length|0]:{a:r(3,9),b:r(3,9)};return Math.random()<.5?[f.a,f.b]:[f.b,f.a];
}
const C={ // clue makers: each returns {html, test, pair?}
  prod:(s,i,j)=>({k:'prod',html:`${chip(i)} × ${chip(j)} = <em>${s[i]*s[j]}</em>`,test:t=>t[i]*t[j]===s[i]*s[j],pair:[i,j],why:t=>`${t[i]} × ${t[j]} = ${t[i]*t[j]}, not ${s[i]*s[j]}`}),
  sq:(s,i)=>({k:'sq',html:`${chip(i)} × ${chip(i)} = <em>${s[i]*s[i]}</em>`,test:t=>t[i]*t[i]===s[i]*s[i],pair:[i,i],why:t=>`${t[i]} × ${t[i]} = ${t[i]*t[i]}, not ${s[i]*s[i]}`}),
  kmul:(s,i)=>{const k=[3,4,6,7,8,9][r(0,5)];return {k:'kmul',html:`${chip(i)} × ${k} = <em>${s[i]*k}</em>`,test:t=>t[i]*k===s[i]*k,kk:k,why:t=>`${t[i]} × ${k} = ${t[i]*k}, not ${s[i]*k}`}},
  gt:(s,i,j)=>{if(s[i]<s[j])[i,j]=[j,i];return {k:'gt',html:`${chip(i)} is bigger than ${chip(j)}`,test:t=>t[i]>t[j],why:t=>`${t[i]} isn't bigger than ${t[j]}`}},
  par:(s,i)=>{const odd=s[i]%2===1;return {k:'par',html:`${chip(i)} is ${odd?'odd':'even'}`,test:t=>(t[i]%2===1)===odd,why:t=>`${t[i]} is ${odd?'even':'odd'}`}},
  sum:(s,i,j)=>({k:'sum',html:`${chip(i)} + ${chip(j)} = <em>${s[i]+s[j]}</em>`,test:t=>t[i]+t[j]===s[i]+s[j],why:t=>`${t[i]} + ${t[j]} = ${t[i]+t[j]}, not ${s[i]+s[j]}`})
};
function tuples(D){let out=[[]];for(let d=0;d<D;d++)out=out.flatMap(t=>V.map(v=>[...t,v]));return out}
const T2=tuples(2),T3=tuples(3);
function makeVault(tier){
  const D=tier===1?2:3,ALL=D===2?T2:T3;
  for(let tries=0;tries<200;tries++){
    let s;const [a,b]=pickFact();
    if(D===2)s=[a,b];else{const [c]=pickFact();s=[a,b,c===a||c===b?r(2,12):c]}
    if(new Set(s).size<D)continue;
    const pairs=D===2?[[0,1]]:SM.shuffle([[0,1],[1,2],[0,2]]);
    const clues=[C.prod(s,...pairs[0])];if(D===3)clues.push(C.prod(s,...pairs[1]));
    let cand=ALL.filter(t=>clues.every(c=>c.test(t)));
    const pool=()=>{const i=r(0,D-1),j=(i+r(1,D-1))%D;return [C.gt(s,i,j),C.par(s,i),C.sum(s,i,j),C.kmul(s,i),C.sq(s,i),...(D===3?[C.prod(s,...pairs[2])]:[])]};
    for(let g=0;g<30&&cand.length>1&&clues.length<(tier===3?4:D+1);g++){
      const opts=pool().filter(c=>!clues.some(x=>x.html===c.html)).map(c=>({c,n:cand.filter(c.test).length})).filter(o=>o.n<cand.length);
      if(!opts.length)break;
      const tier3=tier===3?opts.filter(o=>o.c.k!=='prod'&&o.c.k!=='kmul'):opts; // gold vaults lean on logic clues
      const pickFrom=(tier3.length?tier3:opts).sort((x,y)=>x.n-y.n).slice(0,3);
      const o=pickFrom[Math.random()*pickFrom.length|0];clues.push(o.c);cand=cand.filter(o.c.test);
    }
    if(cand.length===1&&clues.length>=D)return {s,D,clues:SM.shuffle(clues),tier};
  }
  return {s:[7,8],D:2,clues:[C.prod([7,8],0,1),C.gt([7,8],1,0)],tier:1};
}

/* ---------- home ---------- */
function vs(){const st=SM.st;if(!st.vault)st.vault={missions:0,cracked:0,clean:0};return st.vault}
function open(){
  const v=vs();SM.audio.music('hub');
  $('#vStats').innerHTML=`<span class="pill"><i class="ic">${FX.I.bolt}</i><b>${v.cracked}</b> cracked</span><span class="pill"><i class="ic">${FX.I.star}</i><b>${v.clean}</b> first try</span><span class="pill"><i class="ic">${FX.I.dust}</i><b>${SM.st.dust}</b></span>`;
  SM.show('vaultHome');
}
$('#vBack').onclick=()=>{A('back');SM.hub.open()};
$('#vGo').onclick=SM.once(()=>{A('tap');start()});

/* ---------- play ---------- */
let G=null;
const DOOR=`<svg class="wheel" id="vWheel" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#adb5bd" stroke-width="7"/><g stroke="#adb5bd" stroke-width="7" stroke-linecap="round"><path d="M50 10v80M10 50h80M22 22l56 56M78 22l-56 56"/></g><circle cx="50" cy="50" r="13" fill="#868e96" stroke="#343a40" stroke-width="4"/></svg>`;
function start(){
  G={k:-1,cracked:0,clean:0,dust:0,shown:SM.st.dust};
  $('#vDust').textContent=G.shown;$('#vBuddy').innerHTML=SM.creature.svg(SM.st.creature,SM.stage());
  $('#vPick').innerHTML=V.map(v=>`<button class="fac" data-v="${v}">${v}</button>`).join('');
  SM.audio.music('play');SM.show('vault');setTimeout(next,FX.calm?0:450);
}
function next(){
  if(!G)return;G.k++;const p=makeVault(TIERS[G.k]);
  Object.assign(G,{p,val:Array(p.D).fill(null),sel:0,buf:'',miss:0,lock:false,locked:new Set()});
  $('#vPips').innerHTML=TIERS.map((t,i)=>`<i class="${i<G.k?'done':i===G.k?'now':''}"></i>`).join('');
  $('#vTier').textContent=['','Bronze vault','Silver vault','Gold vault'][p.tier];$('#vTier').className='tier t'+p.tier;
  $('#vDoor').className='door t'+p.tier;$('#vDoor').innerHTML=`<div class="bolts"></div><div class="dials" id="vDials"></div>${DOOR}<div class="treasure" id="vTreasure"></div>`;
  $('#vClues').innerHTML=p.clues.map((c,i)=>`<li data-c="${i}"><span class="ck"></span>${c.html}</li>`).join('');
  FX.anim($('#vDoor'),[{transform:'scale(.7)',opacity:0},{transform:'none',opacity:1}],{duration:420});
  [...$('#vClues').children].forEach((el,i)=>FX.anim(el,[{transform:'translateX(-30px)',opacity:0},{transform:'none',opacity:1}],{duration:320,delay:150+i*90,fill:'backwards'}));
  A('whoosh');hint(p.D===2?'Use the clues to find the 2 secret numbers.':'Use the clues to find the 3 secret numbers.');draw();
}
function draw(){
  $('#vDials').innerHTML=G.val.map((v,i)=>`<button class="dial${G.sel===i&&!G.lock?' sel':''}${G.locked.has(i)?' lockd':''}" data-d="${i}" style="--c:${COL[i]}"><small>${LET[i]}</small><b>${G.sel===i&&G.buf?G.buf:v==null?'?':v}</b></button>`).join('');
  $('#vCrack').disabled=G.lock||G.val.some(v=>v==null);
  document.querySelectorAll('#vPick .fac').forEach(b=>{b.disabled=G.lock||G.locked.has(G.sel);b.classList.toggle('probe',G.val[G.sel]===+b.dataset.v)});
}
function hint(t,warm){const h=$('#vHint');h.innerHTML=t;h.classList.toggle('warm',!!warm);if(t)FX.enter(h)}
$('#vDoor').addEventListener('click',e=>{const d=e.target.closest('.dial');if(!d||!G||G.lock)return;G.sel=+d.dataset.d;G.buf='';A('tap');draw()});
$('#vPick').addEventListener('click',e=>{const b=e.target.closest('.fac');if(b&&G&&!G.lock)set(+b.dataset.v)});
function set(v){
  if(G.locked.has(G.sel))return;const i0=G.sel;G.val[i0]=v;G.buf='';A('click',v);clearMarks();
  for(let k=1;k<=G.p.D;k++){const j=(i0+k)%G.p.D;if(G.val[j]==null&&!G.locked.has(j)){G.sel=j;break}}
  draw();FX.pop($(`#vDials [data-d="${i0}"]`),1.12);
}
function clearMarks(){document.querySelectorAll('#vClues li').forEach(li=>li.classList.remove('ok','no'))}
document.addEventListener('keydown',e=>{
  if(!$('#vault').classList.contains('on')||!G||G.lock||$('#cine').classList.contains('on'))return;
  if(/^[0-9]$/.test(e.key)){if(G.locked.has(G.sel))return;G.buf=(G.buf+e.key).slice(-2);A('key',+e.key);draw()}
  else if(e.key==='Backspace'){G.buf=G.buf.slice(0,-1);draw()}
  else if(e.key==='ArrowRight'||e.key==='Tab'||e.key==='ArrowLeft'){e.preventDefault();G.buf='';G.sel=(G.sel+(e.key==='ArrowLeft'?G.p.D-1:1))%G.p.D;A('tap');draw()}
  else if(e.key==='Enter'){e.preventDefault();
    if(G.buf){const v=+G.buf;if(V.includes(v))set(v);else{G.buf='';A('back');hint('Dials go from 2 to 12.',true);draw()}}
    else if(!G.val.some(v=>v==null))crack()}
});
$('#vCrack').onclick=()=>crack();
async function crack(){
  if(!G||G.lock||G.val.some(v=>v==null))return;
  const run=G,t=G.val,res=G.p.clues.map(c=>c.test(t));G.lock=true;draw();
  const lis=[...$('#vClues').children];A('creak');
  for(let i=0;i<lis.length;i++){await sleep(FX.calm?20:220);lis[i].classList.add(res[i]?'ok':'no');A(res[i]?'click':'back',i*3)}
  await sleep(FX.calm?50:300);if(G!==run)return;
  if(res.every(Boolean)){
    run.cracked++;vs().cracked++;if(!run.miss){run.clean++;vs().clean++;
      run.p.clues.forEach(c=>{if(c.pair)SM.practice(t[c.pair[0]],t[c.pair[1]],true,9999)})}
    A('unlock');const w=$('#vWheel');FX.anim(w,[{transform:'rotate(0)'},{transform:'rotate(300deg)'}],{duration:700,easing:'ease-in-out',fill:'forwards'});
    await sleep(FX.calm?50:650);const d=$('#vDoor');d.classList.add('open');A('fanfare');
    const c=FX.center(d);FX.burst(c.x,c.y,{n:50,colors:['#ffd43b','#fff3bf','#f59f00','#fff'],speed:11});FX.ring(c.x,c.y,{n:18,speed:8});
    FX.floatText(c.x,c.y-70,run.miss?'CRACKED!':'FIRST TRY!','bolt');
    const b=$('#vBuddy');b.classList.remove('happy');void b.offsetWidth;b.classList.add('happy');
    addDust(run.miss?2:4+run.p.tier,$('#vTreasure'));
    hint(`The code was ${t.map((v,i)=>`${LET[i]} = ${v}`).join(', ')}.`);SM.save();
    await sleep(FX.calm?200:2000);if(G!==run)return;
    if(run.k>=TIERS.length-1)finish();else next();
  }else{
    run.miss++;A('wrong');FX.shake($('#vDoor'),6);
    const bad=run.p.clues.findIndex((c,i)=>!res[i]);
    let msg=`Not yet: ${run.p.clues[bad].why(t)}.`;
    if(run.miss>=2){ // give one dial away, the one that's wrong
      const j=t.findIndex((v,i)=>v!==run.p.s[i]&&!run.locked.has(i));
      if(j>=0){run.val[j]=run.p.s[j];run.locked.add(j);msg+=` Clue from the vault: ${LET[j]} is ${run.p.s[j]}.`;A('sparkle')}
    }
    hint(msg,true);run.lock=false;
    run.sel=run.val.findIndex((v,i)=>!run.locked.has(i));if(run.sel<0)run.sel=0;draw();
  }
}
function addDust(n,el){const run=G;run.dust+=SM.earn(n);const pd=$('#vDust');
  FX.fly(el,pd,n,i=>{run.shown++;pd.textContent=run.shown;A('coin',i);FX.pop(pd.parentNode,1.15)})}
$('#vQuit').onclick=()=>{A('tap');if(confirm('Leave the vaults? Stardust you earned is kept.')){G=null;SM.save();open()}};
function finish(){
  const run=G;G=null;vs().missions++;run.dust+=SM.earn(5);SM.markDay();SM.save();
  $('#sumBtn').onclick=()=>{A('tap');open()};
  FX.results({title:'VAULTS CRACKED!',btn:'More vaults',dust:run.dust,rows:[
    [FX.I.bolt,'Vaults cracked',run.cracked],[FX.I.star,'First-try cracks',run.clean],[FX.I.dust,'Stardust earned',run.dust,true]]});
}

SM.vault={open,_t:{makeVault,T2,T3,code:()=>G&&G.p.s}};
})();
