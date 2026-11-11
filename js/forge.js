/* Game 4: Factor Forge. A hot number sits on the anvil. Find every pair of stars (2 to 12) that makes it.
   Each pair is a hammer strike; find them all and the number shatters into gems.
   It is the times table run backwards: "24 = 3 × ?" is recall from the product side. */
(function(){
const SM=window.SM,$=SM.$,FX=SM.fx,A=(n,x)=>SM.audio.play(n,x),sleep=FX.sleep;
const FS=[2,3,4,5,6,7,8,9,10,11,12],PER=6;
const BIG=[12,18,20,24,30,36,40,48,60,72]; // numbers with three or more pairs, or two interesting ones
const pairs=n=>FS.filter(a=>n%a===0&&a<=n/a&&n/a<=12).map(a=>[a,n/a]);

function fs(){const st=SM.st;if(!st.forge)st.forge={missions:0,numbers:0,pairs:0};return st.forge}
function pickNumbers(){ // mostly products of facts he is still building, plus a couple of many-pair numbers
  const F=SM.facts().filter(f=>f.box>=1&&f.a>=2&&f.b>=2),w=[];
  F.forEach(f=>{const k=SM.isCore(f.a,f.b)?(f.box<=2?6:f.box<5?3:1):1;for(let i=0;i<k;i++)w.push(f.a*f.b)});
  const out=[],big=SM.shuffle(BIG.slice());
  while(out.length<PER){
    const n=(out.length===2||out.length===5)?big.pop():w.length?w[Math.random()*w.length|0]:[24,36,56,42,63,48][out.length];
    if(n&&!out.includes(n)&&n>=6)out.push(n);
  }
  return out;
}

/* ---------- home ---------- */
function open(){
  const f=fs();SM.audio.music('hub');
  $('#fStats').innerHTML=`<span class="pill"><i class="ic">${FX.I.bolt}</i><b>${f.numbers}</b> smashed</span><span class="pill"><i class="ic">${FX.I.star}</i><b>${f.pairs}</b> pairs</span><span class="pill"><i class="ic">${FX.I.dust}</i><b>${SM.st.dust}</b></span>`;
  $('#fDemo').innerHTML=`<div class="fdemo"><b class="hot">24</b><span>→</span><span class="ingot">2 × 12</span><span class="ingot">3 × 8</span><span class="ingot">4 × 6</span></div>`;
  SM.show('forgeHome');
}
$('#fBack').onclick=()=>{A('back');SM.hub.open()};
$('#fGo').onclick=SM.once(()=>{A('tap');start()});

/* ---------- play ---------- */
let G=null;
const pad=$('#fPad');
pad.innerHTML=[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>`<button data-k="${k}" class="${k==='✓'?'ok':k==='⌫'?'del':''}">${k}</button>`).join('');
pad.addEventListener('click',e=>{const b=e.target.closest('button');if(b)press(b.dataset.k)});
document.addEventListener('keydown',e=>{
  if(!$('#forge').classList.contains('on')||!G||$('#cine').classList.contains('on'))return;
  if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('⌫');else if(e.key==='Enter'){e.preventDefault();press('✓')}
  else if(e.key==='Escape'&&G.sel){G.sel=null;G.typed='';A('back');draw()}
});
const STRIKE=`<svg viewBox="0 0 120 120" class="hammer" id="fHammer"><g><rect x="54" y="40" width="12" height="72" rx="5" fill="#a0522d" stroke="#5c2c0c" stroke-width="3"/><rect x="26" y="14" width="68" height="34" rx="8" fill="#ced4da" stroke="#495057" stroke-width="4"/><rect x="26" y="14" width="68" height="12" rx="6" fill="#fff" opacity=".45"/></g></svg>`;
const ANVIL=`<svg viewBox="0 0 220 90" class="anvil"><path d="M18 8h184l-10 16h-34l-8 30h22l6 22H42l6-22h22l-8-30H38z" fill="#495057" stroke="#212529" stroke-width="4" stroke-linejoin="round"/><path d="M18 8h184l-6 9H24z" fill="#868e96"/></svg>`;

function start(){
  G={nums:pickNumbers(),k:-1,smashed:0,pairsN:0,clean:0,dust:0,shown:SM.st.dust,lock:true};
  $('#fDust').textContent=G.shown;$('#fBuddy').innerHTML=SM.creature.svg(SM.st.creature,SM.stage());
  $('#fStage').innerHTML=`<div class="glow"></div>${STRIKE}<div class="block" id="fBlock"><b id="fNum"></b><svg viewBox="0 0 100 100" class="cracks" id="fCracks" preserveAspectRatio="none"></svg></div>${ANVIL}`;
  SM.audio.music('play');SM.show('forge');setTimeout(next,FX.calm?0:450);
}
function next(){
  if(!G)return;G.k++;const n=G.nums[G.k];
  Object.assign(G,{n,all:pairs(n),found:[],duds:new Set(),sel:null,typed:'',miss:false,lock:false});
  $('#fPips').innerHTML=Array.from({length:PER},(_,i)=>`<i class="${i<G.k?'done':i===G.k?'now':''}"></i>`).join('');
  $('#fNum').textContent=n;$('#fCracks').innerHTML='';$('#fIngots').innerHTML='';$('#fFix').innerHTML='';
  const bl=$('#fBlock');bl.className='block';FX.anim(bl,[{transform:'translateY(-160px) scale(.6)',opacity:0},{transform:'translateY(6px) scale(1.05,.92)',opacity:1,offset:.75},{transform:'none'}],{duration:550,easing:'ease-in'});
  setTimeout(()=>{A('slam');const c=FX.center(bl);FX.burst(c.x,c.y+40,{n:12,colors:['#ffd66e','#ff922b','#fff'],speed:5})},400);
  hint(`Find every pair that makes ${n}.`);draw();
}
function draw(){
  const left=G.all.length-G.found.length;
  $('#fCount').innerHTML=G.all.map((_,i)=>`<i class="${i<G.found.length?'on':''}"></i>`).join('')+`<span>${left?`${left} pair${left>1?'s':''} left`:'All found!'}</span>`;
  $('#fFacs').innerHTML=FS.map(f=>{const got=G.found.some(p=>p.includes(f)),dud=G.duds.has(f);
    return `<button class="fac${got?' got':''}${dud?' dud':''}${G.sel===f?' probe':''}" data-f="${f}" ${G.lock?'disabled':''}>${f}</button>`}).join('');
  const P=$('#fPrompt');
  if(G.found.length===G.all.length)P.innerHTML='';
  else if(G.sel){P.innerHTML=`<span>${G.n} = ${G.sel} ×</span><span class="ans small" id="fAns">${G.typed}</span>`}
  else P.innerHTML=`<span class="dim">${G.n} = <u>${G.typed||'?'}</u> × ?</span>`;
}
function hint(t,warm){const h=$('#fHint');h.textContent=t;h.classList.toggle('warm',!!warm);if(t)FX.enter(h)}
$('#fFacs').addEventListener('click',e=>{const b=e.target.closest('.fac');if(b&&G&&!G.lock)pick(+b.dataset.f)});
function pick(f){
  const n=G.n,q=n/f;G.typed='';$('#fFix').innerHTML='';
  const done=G.found.find(p=>p.includes(f));
  if(done){A('back');G.sel=null;hint(`Already forged: ${done[0]} × ${done[1]}. Find another!`);FX.shake($(`#fIngots [data-p="${done[0]}"]`)||$('#fIngots'),5);return draw()}
  if(!Number.isInteger(q)){A('back');G.duds.add(f);G.sel=null;hint(`${f} doesn't go into ${n} evenly. No pair there.`,true);draw();FX.shake($(`#fFacs [data-f="${f}"]`),5);return}
  if(q<2||q>12){A('back');G.duds.add(f);G.sel=null;hint(`${n} = ${f} × ${q}, but ${q} is off the star chart (2 to 12).`,true);draw();return}
  A('tap');G.sel=f;G.t0=performance.now();G.wrongOnce=false;hint('');draw();FX.pop($('#fPrompt'),1.06);
}
function press(k){const b=pad.querySelector(`[data-k="${k}"]`);if(b){b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit')}
  if(!G||G.lock)return;
  if(k==='✓'){if(!G.sel){const f=+G.typed;if(!G.typed)return;if(!FS.includes(f)){A('back');G.typed='';hint('Pick a star from 2 to 12.',true);return draw()}return pick(f)}return enter()}
  if(k==='⌫'){if(!G.typed&&G.sel){G.sel=null;A('back');return draw()}G.typed=G.typed.slice(0,-1);A('back')}
  else if(G.typed.length<2){G.typed+=k;A('key',+k)}
  draw();const a=$('#fAns')||$('#fPrompt u');if(a)FX.pop(a,1.08);
}
async function enter(){
  if(!G.typed)return;const f=G.sel,q=G.n/f,v=+G.typed,ms=performance.now()-G.t0;
  if(v!==q){
    A('wrong');G.miss=true;G.typed='';draw();FX.shake($('#fPrompt'));
    if(!G.wrongOnce){SM.practice(f,q,false,ms);G.wrongOnce=true}
    const st=SM.strategy(f,q);
    $('#fFix').innerHTML=`<div class="panel tight"><p class="sub" style="margin:0 0 6px">What times ${f} makes ${G.n}? Here's ${f} × ${q}:</p><p class="sname">${st.name}: <span class="mono">${st.expr}</span></p><div class="steps">${SM.chainHTML(st)}</div></div>`;
    FX.enter($('#fFix'));return;
  }
  if(!G.wrongOnce)SM.practice(f,q,true,ms);
  const p=[Math.min(f,q),Math.max(f,q)];G.found.push(p);G.sel=null;G.typed='';G.pairsN++;fs().pairs++;$('#fFix').innerHTML='';
  G.lock=true;draw();const run=G;await strike();if(G!==run)return;
  const ing=document.createElement('span');ing.className='ingot';ing.dataset.p=p[0];ing.textContent=`${p[0]} × ${p[1]}`;$('#fIngots').appendChild(ing);
  FX.anim(ing,[{transform:'translateY(-60px) scale(.3)',opacity:0},{transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.3,1.5,.5,1)'});
  addDust(1,ing);
  if(G.found.length===G.all.length)return smash();
  G.lock=false;hint(`${G.n} = ${p[0]} × ${p[1]}. ${G.all.length-G.found.length===1?'One more pair!':'Keep going!'}`);draw();
}
async function strike(){
  const h=$('#fHammer'),bl=$('#fBlock'),c=FX.center(bl);
  const sw=FX.anim(h,[{transform:'rotate(0)'},{transform:'rotate(-35deg)',offset:.45},{transform:'rotate(48deg)'}],{duration:330,easing:'ease-in'});if(sw)await sw.finished.catch(()=>{});
  A('slam');FX.shake(bl,4);FX.burst(c.x,c.y-30,{n:22,colors:['#ffd66e','#ff922b','#fff3bf'],speed:8,up:4});
  const cr=$('#fCracks'),k=G.found.length,paths=['M50 0 L44 30 L56 46 L48 70','M0 40 L22 46 L30 62 L44 60','M100 30 L78 40 L72 58 L60 62','M30 100 L38 80 L52 76','M70 100 L64 82 L74 70'];
  cr.innerHTML=paths.slice(0,Math.ceil(k/G.all.length*paths.length)).map(d=>`<path d="${d}"/>`).join('');
  bl.classList.add('hit');setTimeout(()=>bl.classList.remove('hit'),200);
  FX.anim(h,[{transform:'rotate(48deg)'},{transform:'rotate(0)'}],{duration:FX.calm?60:260,easing:'ease-out',fill:'forwards'});
  await sleep(FX.calm?50:200);
}
async function smash(){
  const run=G,bl=$('#fBlock'),c=FX.center(bl);run.smashed++;fs().numbers++;
  if(!run.miss){run.clean++;}
  A('fanfare');FX.burst(c.x,c.y,{n:60,colors:FX.RAINBOW,speed:13});FX.ring(c.x,c.y,{n:22,speed:9});
  FX.anim(bl,[{transform:'scale(1)',opacity:1},{transform:'scale(1.5)',opacity:0}],{duration:450,fill:'forwards'});
  FX.floatText(c.x,c.y-60,run.miss?'SMASHED!':'CLEAN SMASH!','bolt');
  const b=$('#fBuddy');b.classList.remove('happy');void b.offsetWidth;b.classList.add('happy');
  hint(`${run.n}: ${run.all.map(p=>p.join(' × ')).join(',  ')}`);draw();
  if(!run.miss)addDust(3,bl);SM.save();
  await sleep(FX.calm?200:1900);if(G!==run)return;
  if(run.k>=PER-1)finish();else next();
}
function addDust(n,el){const run=G;run.dust+=SM.earn(n);const pd=$('#fDust');
  FX.fly(el,pd,n,i=>{run.shown++;pd.textContent=run.shown;A('coin',i);FX.pop(pd.parentNode,1.15)})}
$('#fQuit').onclick=()=>{A('tap');if(confirm('Leave the forge? Stardust you earned is kept.')){G=null;SM.save();open()}};
function finish(){
  const run=G;G=null;fs().missions++;run.dust+=SM.earn(5);SM.markDay();SM.save();
  $('#sumBtn').onclick=()=>{A('tap');open()};
  FX.results({title:'FORGE COMPLETE!',btn:'Forge again',dust:run.dust,rows:[
    [FX.I.bolt,'Numbers smashed',run.smashed],[FX.I.combo,'Pairs forged',run.pairsN],[FX.I.star,'Clean smashes',run.clean],[FX.I.dust,'Stardust earned',run.dust,true]]});
}

SM.forge={open,_t:{pairs}};
})();
