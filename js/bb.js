/* Game 2: Bracket Blaster. BEDMAS expressions with tricky facts hidden inside.
   Tap the operation BEDMAS says goes first, solve that step, watch the expression collapse. */
(function(){
const SM=window.SM,$=SM.$,FX=SM.fx,A=(n,x)=>SM.audio.play(n,x),sleep=FX.sleep;
const PER_MISSION=8;
const LEVELS=[null,
  {name:'Multiply first',rule:'× and ÷ happen before + and −, even when they come later.'},
  {name:'Brackets',rule:'Anything in ( brackets ) goes first. Always.'},
  {name:'Double trouble',rule:'Two multiplications in one blast. Do both before you add or subtract.'},
  {name:'Divide & conquer',rule:'÷ is a times fact backwards: 56 ÷ 8 asks "8 × what = 56?" When × and ÷ are side by side, go left to right.'},
  {name:'Power up',rule:'Exponents come right after brackets. 7² means 7 × 7.'}
];

/* ---------- state ---------- */
function bb(){const st=SM.st;if(!st.bb)st.bb={level:1,unlocked:1,missions:0,blasts:0,perfect:0};return st.bb}

/* ---------- expression building ---------- */
const N=v=>({t:'n',v}),O=v=>({t:'op',v}),L=()=>({t:'('}),R=()=>({t:')'}),E=()=>({t:'pow'});
const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function pickFact(){ // weighted toward facts he's still building
  const F=SM.facts().filter(f=>f.box>=1),w=[];
  F.forEach(f=>{const k=SM.isCore(f.a,f.b)?(f.box<=2?6:f.box<5?3:1):1;for(let i=0;i<k;i++)w.push(f)});
  const f=w.length?w[Math.random()*w.length|0]:{a:r(3,9),b:r(3,9)};
  return Math.random()<.5?[f.a,f.b]:[f.b,f.a];
}
const GEN={
  1:[()=>{const [x,y]=pickFact();return Math.random()<.5?[N(r(2,20)),O('+'),N(x),O('×'),N(y)]:[N(x),O('×'),N(y),O('−'),N(r(1,Math.min(20,x*y-1)))]},
     ()=>{const [x,y]=pickFact();return [N(r(2,15)),O('+'),N(x),O('×'),N(y),O('+'),N(r(2,9))]},
     ()=>{const [x,y]=pickFact();const a=r(30,60)+x*y;return [N(a),O('−'),N(x),O('×'),N(y)]}],
  2:[()=>{const [x,y]=pickFact(),a=r(1,x-1);return [L(),N(a),O('+'),N(x-a),R(),O('×'),N(y)]},
     ()=>{const [x,y]=pickFact(),c=r(1,9);return [N(y),O('×'),L(),N(x+c),O('−'),N(c),R()]},
     ()=>{const [x,y]=pickFact(),a=r(1,x-1);return [L(),N(a),O('+'),N(x-a),R(),O('×'),N(y),O('+'),N(r(2,12))]}],
  3:[()=>{const [a,b]=pickFact(),[c,d]=pickFact();return [N(a),O('×'),N(b),O('+'),N(c),O('×'),N(d)]},
     ()=>{let [a,b]=pickFact(),[c,d]=pickFact();if(a*b<c*d)[a,b,c,d]=[c,d,a,b];return [N(a),O('×'),N(b),O('−'),N(c),O('×'),N(d)]},
     ()=>{const [x,y]=pickFact(),[c,d]=pickFact(),a=r(1,x-1);return [L(),N(a),O('+'),N(x-a),R(),O('×'),N(y),O('+'),N(c),O('×'),N(d)]}],
  4:[()=>{const [x,y]=pickFact();return [N(r(2,20)),O('+'),N(x*y),O('÷'),N(x)]},
     ()=>{const [x,y]=pickFact();return [N(x*y),O('÷'),N(x),O('×'),N(r(2,5))]},
     ()=>{const [x,y]=pickFact(),[c,d]=pickFact();return [N(x*y),O('÷'),N(y),O('+'),N(c),O('×'),N(d)]}],
  5:[()=>{const [x]=pickFact(),[a,b]=pickFact();return [N(x),E(),O('+'),N(a),O('×'),N(b)]},
     ()=>{const [x]=pickFact(),a=r(1,x-1);return [L(),N(a),O('+'),N(x-a),R(),E(),O('−'),N(r(1,9))]},
     ()=>{const [x]=pickFact(),[a,b]=pickFact();return x*x>=a*b?[N(x),E(),O('−'),N(a),O('×'),N(b)]:[N(a),O('×'),N(b),O('−'),N(x),E()]}]
};

/* ---------- BEDMAS engine ---------- */
const lvl=t=>t.t==='pow'?3:(t.v==='×'||t.v==='÷')?2:1;
function groups(tk){ // innermost bracket groups, or the whole thing if no brackets
  const res=[],stack=[];
  tk.forEach((x,i)=>{if(x.t==='(')stack.push(i);else if(x.t===')'){const s=stack.pop();if(!tk.slice(s+1,i).some(y=>y.t==='('))res.push([s+1,i])}});
  return res.length?res:[[0,tk.length]];
}
function validOps(tk){
  const out=[];
  for(const [s,e] of groups(tk)){
    const ops=[];for(let i=s;i<e;i++)if(tk[i].t==='op'||tk[i].t==='pow')ops.push(i);
    if(!ops.length)continue;const top=Math.max(...ops.map(i=>lvl(tk[i])));
    if(top===3)ops.filter(i=>lvl(tk[i])===3).forEach(i=>out.push(i));
    else if(top===2){let prev=false;for(const i of ops){if(lvl(tk[i])===2){if(!prev)out.push(i);prev=true}else prev=false}} // leftmost of each × ÷ chain
    else out.push(ops[0]); // + − strictly left to right
  }
  return out;
}
function nextLetter(tk){if(tk.some(x=>x.t==='('))return 'B';const v=validOps(tk);if(!v.length)return '';const t=tk[v[0]];
  return t.t==='pow'?'E':t.v==='÷'?'D':t.v==='×'?'M':t.v==='+'?'A':'S'}
function step(tk,i){ // returns {a,b,op,val,from,to}
  const t=tk[i];
  if(t.t==='pow'){const a=tk[i-1].v;return {a,b:2,op:'^',val:a*a,from:i-1,to:i}}
  const a=tk[i-1].v,b=tk[i+1].v,val={'+':a+b,'−':a-b,'×':a*b,'÷':a/b}[t.v];
  return {a,b,op:t.v,val,from:i-1,to:i+1};
}
function apply(tk,st){
  const out=tk.slice(0,st.from).concat([N(st.val)],tk.slice(st.to+1));let idx=st.from;
  for(let i=0;i<out.length-2;i++)if(out[i].t==='('&&out[i+1].t==='n'&&out[i+2].t===')'){out.splice(i+2,1);out.splice(i,1);if(i<idx)idx--;i=-1} // (n) → n
  out.idx=idx;return out;
}
function ok(tk){let x=tk;for(let g=0;g<12&&x.length>1;g++){const v=validOps(x);if(!v.length)return false;const s=step(x,v[0]);if(s.val<0||!Number.isInteger(s.val))return false;x=apply(x,s)}return x.length===1}
function make(level){
  for(let tries=0;tries<50;tries++){
    const pool=[level,level,Math.max(1,level-1)],g=GEN[pool[Math.random()*pool.length|0]];
    const tk=g[Math.random()*g.length|0]();if(ok(tk))return tk;
  }
  return [N(3),O('+'),N(4),O('×'),N(5)];
}

/* ---------- home ---------- */
function open(){
  const b=bb();SM.audio.music('hub');
  $('#bbLevels').innerHTML=LEVELS.slice(1).map((l,i)=>{const n=i+1,lock=n>b.unlocked;
    return `<button class="lvl${n===b.level?' on':''}${lock?' locked':''}" data-l="${n}" ${lock?'disabled':''}><b>${lock?`<i class="ic">${FX.I.lock}</i>`:n}</b><span>${l.name}</span></button>`}).join('');
  $('#bbRule').innerHTML=`<b>Level ${b.level}: ${LEVELS[b.level].name}</b><br>${LEVELS[b.level].rule}`;
  $('#bbStats').innerHTML=`<span class="pill"><i class="ic">${FX.I.bolt}</i><b>${b.blasts}</b> blasted</span><span class="pill"><i class="ic">${FX.I.star}</i><b>${b.perfect}</b> perfect</span><span class="pill"><i class="ic">${FX.I.dust}</i><b>${SM.st.dust}</b></span>`;
  const t=$('#bbTgt'),lk=b.unlocked<2;t.classList.toggle('locked',lk);
  t.innerHTML=lk?`<i class="ic">${FX.I.lock}</i> Target mission <small>unlock Level 2</small>`:`Target mission <small>${b.targets?b.targets+' hit':'work it backwards'}</small>`;
  SM.show('bbHome');
}
$('#bbLevels').addEventListener('click',e=>{const t=e.target.closest('.lvl');if(!t||t.disabled)return;A('tap');bb().level=+t.dataset.l;SM.save();open()});
$('#bbBack').onclick=()=>{A('back');SM.hub.open()};
$('#bbGo').onclick=SM.once(()=>{A('tap');start()});
$('#bbTgt').onclick=()=>{const t=$('#bbTgt');if(bb().unlocked<2){A('back');FX.shake(t,5);const r=$('#bbRule'),o=r.innerHTML;
  r.innerHTML='<b>Target mission needs brackets.</b><br>Get 6 perfect blasts in a Level 1 mission to unlock Level 2 and Target.';FX.enter(r);setTimeout(()=>{if(r.innerHTML.startsWith('<b>Target'))r.innerHTML=o},3500);return}
  A('tap');tStart()};

/* ---------- play ---------- */
let G=null;
const pad=$('#bbPad');
pad.innerHTML=[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>`<button data-k="${k}" class="${k==='✓'?'ok':k==='⌫'?'del':''}">${k}</button>`).join('');
pad.addEventListener('click',e=>{const b=e.target.closest('button');if(b)press(b.dataset.k)});
function press(k){const b=pad.querySelector(`[data-k="${k}"]`);if(b){b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit')}
  if(!G||G.lock)return;
  if(k==='✓')return enter();
  if(!G.sel){A('back');hint('Tap an operation first. Which one does BEDMAS say goes first?');FX.shake($('#bbExpr'),5);return}
  if(k==='⌫'){G.typed=G.typed.slice(0,-1);A('back')}else if(G.typed.length<3){G.typed+=k;A('key',+k)}
  $('#bbAns').textContent=G.typed;FX.pop($('#bbAns'),1.08);
}
document.addEventListener('keydown',e=>{
  if(!$('#bb').classList.contains('on')||!G||$('#cine').classList.contains('on'))return;
  if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('⌫');
  else if(e.key==='Enter'){e.preventDefault();if(G.lock)return;if(!G.sel&&G.cursor!=null)tapOp(G.cursor);else press('✓')}
  else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();if(G.sel)return;const ops=G.tk.map((t,i)=>t.t==='op'||t.t==='pow'?i:-1).filter(i=>i>=0);
    let j=ops.indexOf(G.cursor);j=j<0?0:(j+(e.key==='ArrowRight'?1:-1)+ops.length)%ops.length;G.cursor=ops[j];A('tap');render()}
});

function start(){
  const b=bb();
  G={level:b.level,n:0,perfectN:0,dust:0,shown:SM.st.dust,steps:0,stepsRight:0,factsRight:0,combo:0,best:0};
  $('#bbDust').textContent=G.shown;$('#bbBuddy').innerHTML=SM.creature.svg(SM.st.creature,SM.stage());
  SM.audio.music('play');SM.show('bb');setTimeout(newExpr,FX.calm?0:450);
}
function newExpr(){
  if(!G)return;G.tk=make(G.level);G.sel=null;G.typed='';G.clean=true;G.showHint=false;G.lock=false;G.cursor=null;
  $('#bbPips').innerHTML=Array.from({length:PER_MISSION},(_,i)=>`<i class="${i<G.n?'done':i===G.n?'now':''}"></i>`).join('');
  render(true);hint('');$('#bbFix').innerHTML='';
}
function render(fresh){
  const valid=new Set(validOps(G.tk));
  $('#bbExpr').innerHTML=G.tk.map((t,i)=>{
    const sel=G.sel&&i>=G.sel.from&&i<=G.sel.to?' sel':'',cur=G.cursor===i?' cursor':'';
    if(t.t==='n')return `<span class="tk num${sel}" data-i="${i}">${t.v}</span>`;
    if(t.t==='(' || t.t===')')return `<span class="tk br">${t.t}</span>`;
    if(t.t==='pow')return `<button class="tk pow${sel}${cur}" data-i="${i}" aria-label="squared">2</button>`;
    return `<button class="tk op${sel}${cur}" data-i="${i}" aria-label="${t.v}">${t.v}</button>`;
  }).join('');
  if(fresh)[...$('#bbExpr').children].forEach((el,i)=>FX.anim(el,[{transform:'translateY(-30px) scale(.5)',opacity:0},{transform:'none',opacity:1}],{duration:380,delay:i*40,fill:'backwards'}));
  const L=nextLetter(G.tk);
  document.querySelectorAll('#bbStrip span').forEach(s=>s.classList.toggle('next',!!(G.showHint&&s.dataset.l===L)));
  $('#bbPrompt').style.visibility=G.sel?'visible':'hidden';
  if(G.sel){const s=G.sel;$('#bbQ').textContent=s.op==='^'?`${s.a}² =`:`${s.a} ${s.op} ${s.b} =`;$('#bbAns').textContent=G.typed}
}
$('#bbExpr').addEventListener('click',e=>{const b=e.target.closest('.op,.pow');if(b&&G&&!G.lock)tapOp(+b.dataset.i)});
function tapOp(i){
  if(G.sel){if(i!==G.sel.i){A('back');hint('Finish this step first!')}return}
  if(!validOps(G.tk).includes(i)){
    A('wrong');G.clean=false;G.showHint=true;
    const el=$(`#bbExpr [data-i="${i}"]`);FX.shake(el,6);
    const L=nextLetter(G.tk),why={B:'Brackets first! Look inside the ( ).',E:'Exponents next! Do the ² first.',D:'÷ and × come before + and −.',M:'× and ÷ come before + and −.',A:'Left to right now!',S:'Left to right now!'}[L];
    const t=G.tk[i];hint((t.v==='×'||t.v==='÷')&&(L==='M'||L==='D')?'Same level: go left to right!':why);render();return;
  }
  A('pop');G.showHint=false;const s=step(G.tk,i);s.i=i;G.sel=s;G.typed='';G.t0=performance.now();hint('');render();
  FX.pop($('#bbPrompt'),1.05);
}
function hint(t){const h=$('#bbHint');h.textContent=t;if(t)FX.enter(h)}
function factOf(s){ // the times-table fact inside this step, if any
  if(s.op==='×')return [s.a,s.b];if(s.op==='÷')return [s.b,s.val];if(s.op==='^')return [s.a,s.a];return null}
function enter(){
  if(!G.sel||!G.typed)return;const s=G.sel,v=+G.typed,ms=performance.now()-G.t0,fact=factOf(s);
  if(v===s.val){
    if(fact&&!s.missed)SM.practice(fact[0],fact[1],true,ms);
    G.steps++;if(!s.missed)G.stepsRight++;if(fact&&!s.missed)G.factsRight++;
    A('correct',G.combo+G.stepsRight%6);G.lock=true;
    document.querySelectorAll('#bbExpr .sel').forEach(el=>FX.anim(el,[{transform:'scale(1)',opacity:1},{transform:'scale(.3)',opacity:0}],{duration:220,fill:'forwards',easing:'ease-in'}));
    const run=G;setTimeout(()=>{if(G!==run)return;
      G.tk=apply(G.tk,s);G.sel=null;G.cursor=null;G.typed='';$('#bbFix').innerHTML='';render();
      const born=$(`#bbExpr [data-i="${G.tk.idx}"]`);
      if(born){born.classList.add('born');const c=FX.center(born);FX.burst(c.x,c.y,{n:14});addDust(1,born)}
      if(G.tk.length===1)blast();else G.lock=false;
    },230);
  }else{
    A('wrong');FX.shake($('#bbAns'));s.missed=true;G.clean=false;G.typed='';$('#bbAns').textContent='';
    if(fact&&!s.wrongOnce){SM.practice(fact[0],fact[1],false,ms);s.wrongOnce=true}
    if(fact){const st=SM.strategy(fact[0],fact[1]);
      $('#bbFix').innerHTML=`<div class="panel tight"><p class="sname">${st.name}: <span class="mono">${st.expr}</span></p><div class="steps">${SM.chainHTML(st)}</div>${s.op==='÷'?`<p class="sub" style="margin:4px 0 0">${s.b} × <b>${s.val}</b> = ${s.a}, so ${s.a} ÷ ${s.b} = <b>${s.val}</b></p>`:''}</div>`;
      FX.enter($('#bbFix'))}
    else hint(`It's ${s.val}. Type ${s.val}.`);
  }
}
function addDust(n,el){const run=G;run.dust+=SM.earn(n);const pd=$('#bbDust');
  FX.fly(el,pd,n,i=>{run.shown++;pd.textContent=run.shown;A('coin',i);FX.pop(pd.parentNode,1.15)})}
async function blast(){const run=G;
  const el=$('#bbExpr .num'),c=FX.center(el);
  G.n++;bb().blasts++;
  if(G.clean){G.perfectN++;bb().perfect++;G.combo++;G.best=Math.max(G.best,G.combo)}else G.combo=0;
  A('fanfare');FX.burst(c.x,c.y,{n:50,colors:FX.RAINBOW,speed:12});FX.ring(c.x,c.y,{n:20,speed:9});
  FX.floatText(c.x,c.y-50,G.clean?'PERFECT BLAST!':'BLASTED!','bolt');
  FX.anim(el,[{transform:'scale(1)'},{transform:'scale(1.8)',opacity:1},{transform:'scale(2.4)',opacity:0}],{duration:700,fill:'forwards'});
  const b=$('#bbBuddy');b.classList.remove('happy');void b.offsetWidth;b.classList.add('happy');
  if(G.clean)addDust(3,el);
  SM.save();await sleep(1300);if(G!==run)return;
  if(G.n>=PER_MISSION)finish();else newExpr();
}
$('#bbQuit').onclick=()=>{A('tap');if(confirm('Leave this mission? Stardust you earned is kept.')){G=null;SM.save();open()}};

async function finish(){
  const run=G,b=bb();G=null;b.missions++;
  run.dust+=SM.earn(5);
  let up=false;
  if(run.perfectN>=6&&run.level===b.unlocked&&b.unlocked<5){b.unlocked++;b.level=b.unlocked;up=true;run.dust+=SM.earn(20)}
  SM.markDay();
  SM.save();
  $('#sumBtn').onclick=()=>{A('tap');open()};
  FX.results({title:up?'LEVEL UP!':'MISSION COMPLETE!',btn:'Keep blasting',dust:run.dust,rows:[
      [FX.I.bolt,'Expressions blasted',run.n],[FX.I.star,'Perfect blasts',run.perfectN],[FX.I.combo,'Times facts solved',run.factsRight],[FX.I.dust,'Stardust earned',run.dust,true]],
    extraSound:up?'fanfare':null,
    extra:up?`<div class="panel"><b>Level ${b.level} unlocked: ${LEVELS[b.level].name}</b><br><span class="sub">${LEVELS[b.level].rule}</span></div>`
      :(run.level===b.unlocked&&b.unlocked<5?`<div class="panel"><b>${run.perfectN}/8 perfect.</b> Get 6 perfect blasts to unlock Level ${b.unlocked+1}.</div>`:'')});
}


/* ---------- target mode: work it backwards ----------
   He gets a target and some tiles, and builds the expression himself.
   The target is usually a tricky product, so he has to recall the fact in reverse (56? that's 7 × 8). */
const TPER=6;
const TGEN=[ // [generator, needs brackets]
  ()=>{const [x,y]=pickFact();if(x<3)return null;const a=r(1,x-1);return {nums:[a,x-a,y],ops:['+','×'],t:x*y,f:[x,y]}},
  ()=>{const [x,y]=pickFact(),d=r(1,6);return {nums:[x+d,d,y],ops:['−','×'],t:x*y,f:[x,y]}},
  ()=>{const [x,y]=pickFact(),a=r(2,15);return {nums:[a,x,y],ops:['+','×'],t:a+x*y,f:[x,y]}},
  ()=>{const [x,y]=pickFact();if(x*y<6)return null;const a=r(1,Math.min(15,x*y-1));return {nums:[x,y,a],ops:['×','−'],t:x*y-a,f:[x,y]}}
];
function puzzle(){
  for(let i=0;i<40;i++){const g=Math.random()<.65?TGEN[r(0,1)]:TGEN[r(2,3)],p=g();if(!p)continue;
    p.nums=SM.shuffle(p.nums.map((v,k)=>({v,k})));p.ops=SM.shuffle(p.ops.slice());return p}
  return {nums:[{v:3,k:0},{v:4,k:1},{v:8,k:2}],ops:['+','×'],t:56,f:[7,8]};
}
function solve(tk){ // run BEDMAS on what he built, keeping each step for the replay
  let x=tk.slice();const steps=[];
  for(let g=0;g<20&&x.length>1;g++){const v=validOps(x);if(!v.length)return null;const s=step(x,v[0]);steps.push({tk:x,s});x=apply(x,s)}
  return x.length===1?{val:x[0].v,steps}:null;
}
let T=null;
function tStart(){
  T={n:0,first:0,dust:0,shown:SM.st.dust,facts:0};
  $('#tgDust').textContent=T.shown;$('#tgBuddy').innerHTML=SM.creature.svg(SM.st.creature,SM.stage());
  SM.audio.music('play');SM.show('bbt');setTimeout(tNew,FX.calm?0:450);
}
function tNew(){
  if(!T)return;T.p=puzzle();T.built=[];T.miss=0;T.lock=false;T.t0=performance.now();
  $('#tgPips').innerHTML=Array.from({length:TPER},(_,i)=>`<i class="${i<T.n?'done':i===T.n?'now':''}"></i>`).join('');
  $('#tgT').textContent=T.p.t;FX.pop($('#tgT'),1.25);A('whoosh');
  $('#tgEqn').textContent='';tHint(`Make ${T.p.t} using every tile.`);tRender();
}
function opens(){let o=0;T.built.forEach(x=>{if(x.t==='(')o++;if(x.t===')')o--});return o}
function wantNum(){const l=T.built[T.built.length-1];return !l||l.t==='op'||l.t==='('}
function canClose(){ // only close a bracket that has an operation inside it
  let d=0;for(let i=T.built.length-1;i>=0;i--){const x=T.built[i];if(x.t===')')d++;else if(x.t==='('){if(!d)return false;d--}else if(x.t==='op'&&!d)return true}return false}
function complete(){return T.built.filter(x=>x.t==='n').length===T.p.nums.length&&T.built.filter(x=>x.t==='op').length===T.p.ops.length&&opens()===0}
function tTk(x){return x.t==='n'?N(x.v):x.t==='op'?O(x.v):{t:x.t}}
function tRender(tk,sel,born){
  const show=tk||T.built.map(tTk);
  $('#tgBuild').innerHTML=show.length?show.map((t,i)=>{const c=(sel&&i>=sel.from&&i<=sel.to?' sel':'')+(born===i?' born':'');
    return t.t==='n'?`<span class="tk num${c}">${t.v}</span>`:t.t==='op'?`<span class="tk op${c}" style="display:inline-flex;align-items:center;justify-content:center">${t.v}</span>`:`<span class="tk br">${t.t}</span>`}).join('')
    :'<span class="tk ph">Tap the tiles below to build</span>';
  if(tk)return;
  const usedN=new Set(T.built.filter(x=>x.t==='n').map(x=>x.k)),usedO=new Set(T.built.filter(x=>x.t==='op').map(x=>x.k));
  const wn=wantNum(),left=T.p.nums.length-usedN.size,dis=b=>b||T.lock?'disabled':'';
  $('#tgTray').innerHTML=`<div class="row">${T.p.nums.map(n=>`<button class="tile n${usedN.has(n.k)?' used':''}" data-n="${n.k}" ${dis(usedN.has(n.k)||!wn)}>${n.v}</button>`).join('')}</div>
    <div class="row">${T.p.ops.map((o,k)=>`<button class="tile o${usedO.has(k)?' used':''}" data-o="${k}" ${dis(usedO.has(k)||wn)}>${o}</button>`).join('')}
    <button class="tile b" data-b="(" ${dis(!wn||left<2||opens()>=2)}>(</button><button class="tile b" data-b=")" ${dis(wn||!opens()||!canClose())}>)</button></div>`;
  $('#tgFire').disabled=!complete()||T.lock;$('#tgUndo').disabled=!T.built.length||T.lock;
}
function tHint(t){const h=$('#tgHint');h.textContent=t;if(t)FX.enter(h)}
$('#tgTray').addEventListener('click',e=>{const b=e.target.closest('.tile');if(!b||b.disabled||!T||T.lock)return;
  if(b.dataset.n!=null){const n=T.p.nums.find(x=>x.k===+b.dataset.n);T.built.push({t:'n',v:n.v,k:n.k});A('key',n.v)}
  else if(b.dataset.o!=null){T.built.push({t:'op',v:T.p.ops[+b.dataset.o],k:+b.dataset.o});A('pop')}
  else{T.built.push({t:b.dataset.b});A('tap')}
  $('#tgEqn').textContent='';tRender();const last=$('#tgBuild').lastElementChild;if(last)FX.pop(last,1.2);
  if(complete())tHint('Ready? Fire!');
});
function tUndo(){if(!T||T.lock||!T.built.length)return;T.built.pop();A('back');tRender();tHint('')}
$('#tgUndo').onclick=tUndo;
$('#tgFire').onclick=()=>tFire();
document.addEventListener('keydown',e=>{
  if(!$('#bbt').classList.contains('on')||!T||$('#cine').classList.contains('on'))return;
  if(e.key==='Backspace')tUndo();else if(e.key==='Enter'){e.preventDefault();tFire()}
  else{const m={'(':'[data-b="("]',')':'[data-b=")"]','+':'[data-o]','-':'[data-o]','*':'[data-o]','x':'[data-o]'}[e.key];
    let el=null;if(/^[0-9]$/.test(e.key))el=[...document.querySelectorAll('#tgTray [data-n]')].find(b=>!b.disabled&&b.textContent===e.key);
    else if(m)el=[...document.querySelectorAll('#tgTray '+m)].find(b=>!b.disabled&&(m!=='[data-o]'||b.textContent===({'+':'+','-':'−','*':'×','x':'×'}[e.key])));
    if(el)el.click()}
});
async function replay(res,speed){ // collapse his expression one BEDMAS step at a time
  for(const {tk,s} of res.steps){
    tRender(tk,s);$('#tgEqn').textContent=`${s.a} ${s.op} ${s.b} = ${s.val}`;A('tick');await sleep(speed);
    const nx=apply(tk,s);tRender(nx,null,nx.idx);await sleep(speed*.5);
  }
}
async function tFire(){
  if(!T||T.lock||!complete())return;T.lock=true;tRender();
  const run=T,tk=T.built.map(tTk),res=solve(tk),sp=FX.calm?120:520;tHint('');
  if(!res){run.lock=false;tRender();return tHint('Hmm, that one can’t be worked out. Try again!')}
  await replay(res,sp);if(T!==run)return;
  if(res.val===run.p.t){
    const el=$('#tgBuild .num'),c=FX.center(el);run.n++;bb().targets=(bb().targets||0)+1;
    res.steps.forEach(({s})=>{if(s.op==='×'){SM.practice(s.a,s.b,!run.miss,performance.now()-run.t0);run.facts++}});
    A('fanfare');FX.burst(c.x,c.y,{n:50,colors:FX.RAINBOW,speed:12});FX.ring(c.x,c.y,{n:20,speed:9});
    FX.floatText(c.x,c.y-50,run.miss?'TARGET HIT!':'BULLSEYE!','bolt');
    const b=$('#tgBuddy');b.classList.remove('happy');void b.offsetWidth;b.classList.add('happy');
    if(!run.miss)run.first++;tDust(run.miss?1:3,el);SM.save();await sleep(1500);
    if(T!==run)return;if(run.n>=TPER)tFinish();else tNew();
  }else{
    A('wrong');FX.shake($('#tgBuild'),6);run.miss++;
    const [x,y]=run.p.f,need=x*y===run.p.t;
    tHint(run.miss===1?`That makes ${res.val}, not ${run.p.t}.${need?' Brackets can change the order!':''}`
      :need?`Clue: ${run.p.t} = ${x} × ${y}. Can you make a ${x}?`:`Clue: you'll need ${x} × ${y} = ${x*y} in there.`);
    await sleep(sp*1.6);if(T!==run)return;$('#tgEqn').textContent='';run.lock=false;tRender();
  }
}
function tDust(n,el){const run=T;run.dust+=SM.earn(n);const pd=$('#tgDust');
  FX.fly(el,pd,n,i=>{run.shown++;pd.textContent=run.shown;A('coin',i);FX.pop(pd.parentNode,1.15)})}
$('#tgQuit').onclick=()=>{A('tap');if(confirm('Leave this mission? Stardust you earned is kept.')){T=null;SM.save();open()}};
function tFinish(){
  const run=T;T=null;run.dust+=SM.earn(5);SM.markDay();SM.save();
  $('#sumBtn').onclick=()=>{A('tap');open()};
  FX.results({title:'TARGETS DOWN!',btn:'Keep blasting',dust:run.dust,rows:[
    [FX.I.bolt,'Targets hit',run.n],[FX.I.star,'First-try bullseyes',run.first],[FX.I.combo,'Times facts used',run.facts],[FX.I.dust,'Stardust earned',run.dust,true]]});
}

SM.bb={open,unlockAll(){const b=bb();b.unlocked=5;SM.save()}};
})();
