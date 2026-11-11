/* Game 1: Star Map. The foundation: scout, learn by strategy, spaced review. */
(function(){
const SM=window.SM,$=SM.$,{K,FAST,INTERVAL,NEW_PER_DAY}=SM;
const A=n=>SM.audio.play(n),FX=SM.fx,sleep=FX.sleep;

/* ---------- map ---------- */
function stateClass(f){return f.box===0?'s-dark':f.box<3?'s-learning':f.box<5?'s-lit':'s-nova'}
function renderMap(){
  const st=SM.st,F=SM.facts();
  $('#smChips').innerHTML=`<span class="pill"><i class="ic">${FX.I.star}</i><b>${SM.litCount()}</b>/${F.length} lit</span><span class="pill"><i class="ic">${FX.I.star}</i><b>${SM.novaCount()}</b> supernova</span><span class="pill"><i class="ic">${FX.I.dust}</i><b>${st.dust}</b></span>`;
  $('#goBtn').innerHTML=st.scouted?(st.days.includes(SM.today())?'Another flight':'Today\'s flight <small>5 min</small>'):'Scout the sky';
  let h='<div class="h">×</div>';for(let c=1;c<=12;c++)h+=`<div class="h">${c}</div>`;
  for(let r=1;r<=12;r++){h+=`<div class="h">${r}</div>`;
    for(let c=1;c<=12;c++){
      const cls=(r===1||c===1)?'s-free':stateClass(st.facts[K(r,c)]);
      h+=`<button class="cell ${cls}" data-r="${r}" data-c="${c}" aria-label="${r} times ${c}" style="--d:${(r+c)*18}ms"><span class="dot"></span></button>`;}}
  $('#map').innerHTML=h;
}
function open(){renderMap();SM.audio.music('hub');SM.show('starmap')}
$('#map').addEventListener('click',e=>{const b=e.target.closest('.cell');if(b){A('tap');openCard(+b.dataset.r,+b.dataset.c)}});
function openCard(r,c){
  let h;
  if(r===1||c===1){const n=r===1?c:r;h=`<h2>${r} × ${c} = ${n}</h2><p>1 group of anything is just itself. Free star!</p>`}
  else{
    const f=SM.st.facts[K(r,c)],s=SM.strategy(r,c),known=f.box>=1;
    const status={0:'Not lit yet',1:'Building',2:'Almost lit',3:'Lit',4:'Glowing',5:'Supernova'}[f.box];
    const note={0:'This is how you\'ll build it.',1:'Keep working it out. It gets faster every time.',2:'Nearly there!',3:'You know this one.',4:'Bright and strong.',5:'Locked in for good.'}[f.box];
    h=`<span class="tag">${status}</span><h2 class="disp">${r} × ${c} = ${known?s.p:'?'}</h2><p class="sub" style="margin:0">${note}${r!==c?` Same star as ${c} × ${r}.`:''}</p>
      <p class="sname">${s.name}</p><p>${s.idea}</p>${SM.arraySVG(s)}
      <div class="steps">${known?SM.chainHTML(s):s.steps.map(([l])=>`<div class="step done"><span>${l}</span><span class="slot">?</span></div>`).join('')}</div>
      <div class="bedmas">BEDMAS version: <b>${s.expr}</b>${known?` = ${s.p}`:''}</div>
      ${s.hook&&known?`<div class="hook">💡 ${s.hook}</div>`:''}`;
  }
  $('#sheet').innerHTML=h+'<button class="btn ghost" id="closeCard">Close</button>';
  $('#modal').classList.add('on');FX.anim($('#sheet'),[{transform:'translateY(60px)',opacity:0},{transform:'none',opacity:1}],{duration:320});
  $('#closeCard').onclick=closeCard;
}
function closeCard(){A('back');$('#modal').classList.remove('on')}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeCard()});
$('#goBtn').onclick=()=>{A('tap');const st=SM.st;if(!st.intro)return startIntro();st.scouted?startSession():startScout()};
$('#smBack').onclick=()=>{A('back');SM.hub.open()};

/* ---------- intro: 144 is really 28 ---------- */
const SLIDES=[
  {t:'The times table has 144 facts.',n:144,x:'That sounds like a lot. Let\'s see how many are actually hard.'},
  {t:'The 1s are free.',n:121,x:'1 × anything is just itself. You already know all of these.'},
  {t:'Every star has a twin.',n:66,x:'7 × 8 and 8 × 7 are the same star. Learn one, get both. That cuts it almost in half.'},
  {t:'Some families have a pattern.',n:28,x:'The 2s (double it), 5s (half of 10), 10s (add a zero) and 11s (twin digits) all follow tricks you already use.'},
  {t:'28. Not 144.',n:28,x:'Those blue ones are the only stars that need real work, and you probably know some already. Scout the sky to find out, and your egg will hatch.'}
];
let slide=0,shownNum=144;
function startIntro(){slide=0;shownNum=144;SM.show('intro');renderSlide()}
function renderSlide(){
  const s=SLIDES[slide];$('#iTitle').textContent=s.t;$('#iText').textContent=s.x;FX.enter($('#iTitle'));
  FX.countUp($('#iNumV'),shownNum,s.n,700,v=>SM.audio.play('tally'));shownNum=s.n;
  let h='';const easy=[2,5,10,11];
  for(let r=1;r<=12;r++)for(let c=1;c<=12;c++){
    let cls='';
    if(slide>=1&&(r===1||c===1))cls='lit';
    else if(slide>=2&&c<r)cls='twin';
    else if(slide>=3&&(easy.includes(r)||easy.includes(c)))cls='lit';
    else if(slide>=4)cls='core';
    h+=`<div class="${cls}" style="transition-delay:${(r+c)*15}ms"></div>`;
  }
  const g=$('#igrid');if(!g.children.length)g.innerHTML=h;else{const tmp=document.createElement('div');tmp.innerHTML=h;[...g.children].forEach((d,i)=>{d.className=tmp.children[i].className;d.style.transitionDelay=tmp.children[i].style.transitionDelay})}
  $('#iNext').textContent=slide===SLIDES.length-1?'Scout the sky →':'Next';
  if(slide===SLIDES.length-1)A('sparkle');
}
$('#iNext').onclick=()=>{A('tap');if(slide<SLIDES.length-1){slide++;renderSlide()}else{SM.st.intro=true;SM.save();startScout()}};

/* ---------- play engine ---------- */
let S=null;
const pad=$('#pad');
pad.innerHTML=[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>`<button data-k="${k}" class="${k==='✓'?'ok':k==='⌫'?'del':''}">${k}</button>`).join('');
pad.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;press(b.dataset.k)});
function press(k){const b=pad.querySelector(`[data-k="${k}"]`);if(b){b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit')}
  k==='⌫'?back():k==='✓'?enter():digit(k)}
document.addEventListener('keydown',e=>{
  if($('#cine').classList.contains('on'))return;
  if($('#modal').classList.contains('on')){if(e.key==='Escape')closeCard();return}
  if($('#summary').classList.contains('on')&&e.key==='Enter'){const b=$('#sumBtn');if(b.style.visibility!=='hidden'){e.preventDefault();b.click()}return}
  if(!$('#play').classList.contains('on')||!S)return;
  if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('⌫');else if(e.key==='Enter'){e.preventDefault();press('✓')}
});
function target(){return S.phase==='teach'?document.querySelector('.step.cur .slot'):$('#ans')}
function paint(){const t=target();if(t)t.textContent=S.typed}
function digit(d){if(!S||S.lock||S.phase==='teachDone'||S.typed.length>=3)return;S.typed+=d;SM.audio.play('key',+d);paint();FX.pop(target(),1.08)}
function back(){if(!S||S.lock)return;S.typed=S.typed.slice(0,-1);A('back');paint()}
function enter(){if(!S||S.lock)return;
  if(S.phase==='teach')return teachEnter();
  if(S.phase==='teachDone'){A('tap');return next()}
  if(!S.typed)return;
  S.phase==='fix'?fixEnter():answer();
}
function progress(){const k=S.i/Math.max(1,S.queue.length);$('#barFill').style.width=(100*k)+'%';$('#rocket').style.left=`calc(${100*k}% - 14px)`}
function rec(f){const k=K(f.a,f.b);return S.res[k]||(S.res[k]={wrong:false,fast:false,correct:false,taught:false})}
function buddy(){$('#buddy').innerHTML=SM.creature.svg(SM.st.creature,SM.stage())}
function react(kind){const b=$('#buddy');b.classList.remove('happy','oops');void b.offsetWidth;b.classList.add(kind)}
function setCombo(){const c=$('#combo');
  if(S.combo>=2){c.innerHTML=`<i class="ic">${FX.I.combo}</i>${S.combo}<small>COMBO</small>`;c.className='combo on'+(S.combo>=5?' hot':'')+(S.combo>=10?' blaze':'');FX.pop(c,1.3)}
  else c.className='combo'}
function begin(mode,queue){
  S={mode,queue,i:0,res:{},typed:'',fastCount:0,dust:0,combo:0,best:0,shown:SM.st.dust,correctN:0};
  buddy();$('#playDust').textContent=S.shown;setCombo();
  SM.audio.music('play');SM.show('play');setTimeout(present,SM.fx.calm?0:450);
}
function addDust(n,fromEl){ // award now, animate motes into the counter
  const run=S;run.dust+=SM.earn(n);const pd=$('#playDust');
  FX.fly(fromEl,pd,n,i=>{run.shown++;pd.textContent=run.shown;SM.audio.play('coin',i);FX.pop(pd.parentNode,1.15)});
}

function startScout(){
  const core=SM.facts().filter(f=>SM.isCore(f.a,f.b)).sort((x,y)=>SM.difficulty(x)-SM.difficulty(y));
  begin('scout',core.map(f=>({f})));
}
function startSession(){
  const st=SM.st,t=SM.today(),F=SM.facts();
  if(st.newLog.day!==t)st.newLog={day:t,n:0};
  const due=SM.shuffle(F.filter(f=>f.box>=1&&f.due<=t)).sort((x,y)=>x.box-y.box).slice(0,12);
  const dueK=new Set(due.map(f=>K(f.a,f.b)));
  const room=Math.max(0,NEW_PER_DAY-st.newLog.n);
  const news=F.filter(f=>f.box===0).sort((x,y)=>SM.difficulty(x)-SM.difficulty(y)).slice(0,Math.min(room,due.length>8?1:2));
  const filler=SM.shuffle(F.filter(f=>f.box>=3&&!dueK.has(K(f.a,f.b))));
  let q=SM.shuffle(due).map(f=>({f}));
  while(q.length<10&&filler.length)q.push({f:filler.pop()});
  const put=(pos,item)=>q.splice(Math.min(pos,q.length),0,item);
  news.forEach((f,n)=>{const p=n===0?Math.min(1,q.length):Math.min(q.length,9);
    put(p,{f,teach:true});put(p+2,{f});put(p+5,{f});put(p+9,{f});});
  if(!q.length)q=SM.shuffle(F).slice(0,12).map(f=>({f})); // everything mastered: victory lap
  st.newLog.n+=news.length;SM.save();
  begin('play',q);
}
function present(){
  if(!S)return;progress();S.typed='';S.lock=false;
  const it=S.queue[S.i];
  $('#notyet').style.display=S.mode==='scout'?'block':'none';
  if(it.teach)return showTeach(it.f);
  S.phase='ask';$('#askView').style.display='block';$('#teachView').innerHTML='';
  const flip=Math.random()<.5;it.x=flip?it.f.b:it.f.a;it.y=flip?it.f.a:it.f.b;
  $('#q').innerHTML=`${it.x}<span class="times">×</span>${it.y}`;
  const a=$('#ans');a.className='ans';a.textContent='';$('#fb').className='fb';$('#fb').textContent=S.mode==='scout'?`Scouting ${S.i+1} of ${S.queue.length}`:'';$('#fix').innerHTML='';
  FX.enter($('#qcard'));
  S.t0=performance.now();
}
function answer(){
  const it=S.queue[S.i],f=it.f,p=f.a*f.b,ms=performance.now()-S.t0,v=+S.typed,ans=$('#ans'),c=FX.center(ans);
  if(S.mode==='scout'){S.res[K(f.a,f.b)]={correct:v===p,ms};
    if(v===p){ans.classList.add('good');SM.audio.play('correct',S.i/3);FX.burst(c.x,c.y,{n:16});react('happy');addDust(2,ans)}
    else{$('#fb').textContent='Noted. We\'ll build that one together.';A('back')}
    S.lock=true;return setTimeout(next,v===p?650:950);}
  const r=rec(f),first=!r.wrong&&!S.retry;
  if(v===p){
    r.correct=true;f.right++;S.correctN++;
    if(first){S.combo++;S.best=Math.max(S.best,S.combo)}
    const fast=ms<FAST;let dust=2+(fast?1:0)+(S.combo>=5?1:0);
    if(fast){r.fast=true;S.fastCount++}
    if(!f.best||ms<f.best)f.best=Math.round(ms);
    ans.classList.add('good');SM.audio.play('correct',S.combo);
    FX.burst(c.x,c.y,{n:14+Math.min(S.combo,10)*3,speed:6+Math.min(S.combo,10)*.4});
    if(fast){setTimeout(()=>A('lightning'),90);FX.floatText(c.x,c.y-40,'LIGHTNING!','bolt')}
    FX.floatText(c.x+70,c.y,'+'+dust,'plus');
    react('happy');setCombo();addDust(dust,ans);
    $('#fb').className='fb good';$('#fb').textContent=fast?'':['Yes!','Got it!','Nice!','That\'s it!','Boom!'][Math.random()*5|0];
    S.lock=true;setTimeout(next,750);
  }else{
    r.wrong=true;f.wrong++;S.combo=0;setCombo();
    const s=SM.strategy(f.a,f.b);S.phase='fix';S.typed='';ans.textContent='';
    A('wrong');FX.shake($('#qcard'));react('oops');
    $('#fb').textContent='Not quite. Here\'s the path:';
    $('#fix').innerHTML=`<p class="sname" style="text-align:center">${s.name}: <span class="mono">${s.expr}</span></p><div class="steps">${SM.chainHTML(s)}</div><p style="text-align:center;color:var(--dim)">Now you type it.</p>`;
    FX.enter($('#fix'));
    S.queue.splice(Math.min(S.i+3,S.queue.length),0,{f}); // bring it back a few questions later
  }
}
function fixEnter(){
  const it=S.queue[S.i],p=it.f.a*it.f.b;
  if(+S.typed===p){$('#ans').classList.add('good');A('pop');react('happy');S.lock=true;setTimeout(next,550)}
  else{FX.shake($('#ans'));A('back');S.typed='';$('#ans').textContent='';$('#fb').textContent=`It's ${p}. Type ${p}.`}
}
$('#notyet').onclick=()=>{if(!S||S.lock||S.mode!=='scout')return;A('tap');const f=S.queue[S.i].f;S.res[K(f.a,f.b)]={correct:false,ms:0};
  $('#fb').textContent='No problem. That one goes on the build list.';S.lock=true;setTimeout(next,700)};

/* teach a new star */
function showTeach(f){
  const s=SM.strategy(f.a,f.b);S.phase='teach';S.teach={s,step:0,tries:0};rec(f).taught=true;
  $('#askView').style.display='none';$('#notyet').style.display='none';
  $('#teachView').innerHTML=`<div class="newstar"><i class="ic">${FX.I.star}</i>NEW STAR</div>
    <h2 class="disp big">${s.anchor} × ${s.o}</h2><p class="sub" style="margin:0;text-align:center">${s.anchor} groups of ${s.o}</p>
    <div class="panel tight"><p class="sname">${s.name}</p><p style="margin:2px 0">${s.idea}</p>${SM.arraySVG(s)}
    <div class="bedmas">In BEDMAS: <b>${s.expr}</b></div></div>
    <div class="steps">${s.steps.map(([l],i)=>`<div class="step${i===0?' cur':''}"><span>${l} =</span><span class="slot"></span></div>`).join('')}</div>
    <div id="tEnd"></div>`;
  A('sparkle');FX.enter($('.newstar'));
  const c=FX.center($('.newstar'));FX.burst(c.x,c.y,{n:24,colors:FX.RAINBOW});
}
function teachEnter(){
  if(!S.typed)return;const T=S.teach,want=T.s.steps[T.step][1],row=document.querySelectorAll('.step')[T.step];
  if(+S.typed===want){
    row.classList.remove('cur');row.classList.add('done');FX.pop(row,1.04);SM.audio.play('correct',T.step*2);T.step++;T.tries=0;S.typed='';
    if(T.step<T.s.steps.length){document.querySelectorAll('.step')[T.step].classList.add('cur')}
    else{
      react('happy');S.phase='teachDone';
      $('#tEnd').innerHTML=`<div class="final">So ${T.s.anchor} × ${T.s.o} = <b>${T.s.p}</b></div>
        <p class="say">Say it out loud once:<br><i>"${SM.words(T.s.anchor)} ${SM.plural(T.s.o)} are ${SM.words(T.s.p)}"</i></p>
        ${T.s.hook?`<div class="hook">💡 ${T.s.hook}</div>`:''}<p class="say">Press ✓ when you've said it.</p>`;
      const fb=$('#tEnd .final b');setTimeout(()=>{const c=FX.center(fb);FX.burst(c.x,c.y,{n:30});A('fanfare')},150);
      $('#tEnd').scrollIntoView({behavior:'smooth',block:'center'});
    }
  }else{
    T.tries++;S.typed='';row.querySelector('.slot').textContent='';FX.shake(row,6);A('back');
    if(T.tries>=2)row.querySelector('span').textContent=`${T.s.steps[T.step][0]} = ${want} (type it)`;
  }
}

function next(){if(!S)return;S.i++;if(S.i>=S.queue.length)return finish();present()}
$('#quit').onclick=()=>{A('tap');if(confirm('Land early? Stars from this flight still count.'))finish()};

/* ---------- results ---------- */
const MINDSET=[
  'Slow is the first step of fast. Every time you work a star out, the path in your brain gets shorter.',
  'Your brain doesn\'t store facts by trying hard once. It stores them by meeting them again a few days later. That\'s exactly what you just did.',
  'Being a strong thinker and being fast at recall are different skills. You already have the first one. The second one is just reps.',
  'Mistakes today mean that star comes back sooner. That\'s the system working, not you failing.',
  'Five minutes a day beats an hour once a week. It\'s how memory works.'
];
const results=o=>{$('#sumBtn').onclick=()=>{A('tap');SM.hub.open()};return FX.results(o)};
async function finish(){
  if(!S)return;const st=SM.st,t=SM.today(),run=S;S=null;
  if(run.mode==='scout'){
    let lit=0,building=0,toLearn=0;
    for(const k in run.res){const f=st.facts[k],r=run.res[k];
      if(r.correct&&r.ms<FAST){f.box=3;f.due=t+3;lit++}else if(r.correct){f.box=1;f.due=t+1;building++}else{f.box=0;f.due=t;toLearn++}}
    st.scouted=true;st.creature.seenStage=1;run.dust+=SM.earn(20);SM.save();
    SM.audio.music(null);
    await FX.hatch(st.creature);
    if(SM.stage()>1){await FX.evolve(st.creature,1,SM.stage());st.creature.seenStage=SM.stage();SM.save()}
    const left=SM.facts().filter(f=>f.box<3).length;
    return results({title:'SKY SCOUTED!',dust:run.dust,rows:[
      [FX.I.bolt,'Tricky stars you already know',lit],[FX.I.star,'Stars you can work out',building],[FX.I.combo,'Stars to build',toLearn],[FX.I.dust,'Stardust',run.dust,true]],
      extra:`<div class="panel"><b>${left}</b> stars left to light. Two new stars a day plus a little practice, and the whole sky is lit in a few weeks of 5-minute flights.</div>`});
  }
  const out={nw:[],up:[],nova:[]};
  for(const k in run.res){const f=st.facts[k],r=run.res[k];
    if(r.taught&&f.box===0){f.box=1;f.due=t+1;out.nw.push(f)}
    else if(r.wrong){f.box=1;f.due=t+1}
    else if(r.correct&&f.due<=t){
      if(r.fast){const was=f.box;f.box=Math.min(5,f.box+1);f.due=t+INTERVAL[f.box];
        if(f.box===5&&was<5)out.nova.push(f);else if(f.box>=3&&was<3)out.up.push(f)}
      else f.due=t+1;
    }
  }
  if(Object.keys(run.res).length){
    const first=!st.days.includes(t);
    if(first)st.days.push(t);st.sessions++;
    run.dust+=SM.earn(out.nw.length*10+out.up.length*15+out.nova.length*30+10);
    if(first)run.dust+=SM.earn(10+Math.min(20,SM.streak()*2)); // daily bonus grows with the streak
  }
  st.bestCombo=Math.max(st.bestCombo||0,run.best);SM.save();
  const now=SM.stage(),was=st.creature.seenStage||1;
  if(now>was){SM.audio.music(null);await FX.evolve(st.creature,was,now);st.creature.seenStage=now;SM.save()}
  const lab=a=>a.map(f=>`<span class="starchip"><i class="ic">${FX.I.star}</i>${f.a} × ${f.b}</span>`).join('');
  results({title:'FLIGHT COMPLETE!',dust:run.dust,rows:[
    [FX.I.star,'Correct answers',run.correctN],[FX.I.bolt,'Lightning answers',run.fastCount],[FX.I.combo,'Best combo',run.best],[FX.I.dust,'Stardust earned',run.dust,true]],
    extraSound:out.nw.length+out.up.length+out.nova.length?'sparkle':null,
    extra:`${out.nw.length?`<div class="panel"><b>New stars found</b><div class="starchips">${lab(out.nw)}</div><span class="sub">They'll come back tomorrow to see if they stuck.</span></div>`:''}
    ${out.up.length?`<div class="panel"><b>Newly lit</b><div class="starchips">${lab(out.up)}</div></div>`:''}
    ${out.nova.length?`<div class="panel"><b>Supernova!</b> Locked in for good<div class="starchips">${lab(out.nova)}</div></div>`:''}
    <div class="panel quote">${MINDSET[Math.random()*MINDSET.length|0]}</div>`});
}
$('#sumBtn').onclick=()=>{A('tap');SM.hub.open()};

SM.starmap={open};
})();
