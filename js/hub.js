/* Title screen + hub: creature home and the six games. */
(function(){
const SM=window.SM,$=SM.$,FX=SM.fx,A=n=>SM.audio.play(n);

const GAMES=[
  {id:'starmap',name:'Star Map',does:'Learn each tricky star with a trick, then lock it in.',ready:true},
  {id:'bedmas',name:'Bracket Blaster',does:'BEDMAS expressions with tricky stars hidden inside.',ready:true,needScout:true},
  {id:'grid',name:'Claim the Grid',does:'Strategy duel. Claim products, get four in a row.',ready:true,needScout:true},
  {id:'forge',name:'Factor Forge',does:'Smash a number into every pair of stars that makes it.',ready:true,needScout:true},
  {id:'vault',name:'Vault Cracker',does:'Logic puzzles. Use products to crack the code.',ready:true,needScout:true},
  {id:'boss',name:'Weekly Boss',does:'Your 6 trickiest stars become a boss. Break its armour.',ready:true,needScout:true}
];

/* ---------- title ---------- */
function title(){
  const st=SM.st,word='NOVA PALS';
  $('#logo').innerHTML=[...word].map((ch,i)=>ch===' '?'<span class="sp"></span>':`<span style="animation-delay:${.15+i*.07}s">${ch}</span>`).join('');
  $('#titlePal').innerHTML=SM.creature.svg(st.creature,SM.stage());
  SM.show('title');
}
let started=false;
function start(e){
  if(started||!$('#title').classList.contains('on'))return;started=true;
  SM.audio.unlock();A('start');
  const c=FX.center($('#titlePal'));FX.burst(c.x,c.y,{n:40,colors:FX.RAINBOW,speed:9});
  setTimeout(()=>{SM.audio.music('hub');open()},350);
}
$('#title').addEventListener('click',start);
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')start(e)});

/* ---------- hub ---------- */
function nextGoal(){
  const s=SM.stage(),c=SM.coreLit(),n=SM.novaCount();
  if(s===0)return {txt:'Scout the sky in Star Map to hatch your egg',pct:0};
  if(s===1)return {txt:`${c}/8 tricky stars to evolve`,pct:c/8};
  if(s===2)return {txt:`${c}/16 tricky stars to evolve`,pct:c/16};
  if(s===3)return {txt:`${c}/28 tricky stars to evolve`,pct:c/28};
  if(s===4)return {txt:`${n}/20 supernovas to evolve`,pct:n/20};
  return {txt:'Fully evolved. Legendary!',pct:1};
}
function open(){
  const st=SM.st,s=SM.stage(),g=nextGoal(),k=SM.streak(),playedToday=st.days.includes(SM.today());
  $('#hud').innerHTML=`<span class="pill"><i class="ic">${FX.I.dust}</i><b>${st.dust}</b></span><span class="pill"><i class="ic">${FX.I.flame}</i><b>${k}</b> day${k===1?'':'s'}</span><span class="pill"><i class="ic">${FX.I.star}</i><b>${SM.litCount()}</b>/66</span><button class="gearBtn" id="gear" aria-label="Settings"><i class="ic">${FX.I.gear}</i></button>`;
  $('#hubCreature').innerHTML=SM.creature.svg(st.creature,s,{bg:true});
  $('#hubName').textContent=s===0?'A mysterious egg':(st.creature.name||'Your Nova Pal');
  $('#hubStage').textContent=SM.STAGES[s].name;
  $('#hubGoal').textContent=g.txt;
  requestAnimationFrame(()=>$('#hubGoalBar').style.width=Math.round(100*Math.min(1,g.pct))+'%');
  $('#dressBtn').style.display=s===0?'none':'block';
  $('#games').innerHTML=GAMES.map((x,i)=>`<button class="game${x.ready?'':' soon'}${i===0?' feature':''}" data-g="${x.id}" style="--i:${i}">
      <span class="gi">${FX.badge(x.id)}</span><span class="gt"><b>${x.name}</b><span>${x.does}</span></span>
      ${x.ready&&!(x.needScout&&!st.scouted)?(i===0&&!playedToday?'<span class="ribbon">Daily flight ready!</span>':x.id==='boss'&&!SM.boss.state().beaten?'<span class="ribbon">New boss!</span>':'')+'<span class="gs">PLAY</span>':`<span class="gs lock"><i class="ic">${FX.I.lock}</i></span>`}</button>`).join('');
  $('#gear').onclick=settings;
  renderGrownups();SM.show('hub');
}
$('#games').addEventListener('click',e=>{const b=e.target.closest('.game');if(!b)return;
  const g=b.dataset.g,msg=t=>{A('back');FX.shake(b,5);const s=b.querySelector('.gt span');s.dataset.orig=s.dataset.orig||s.textContent;s.textContent=t;setTimeout(()=>s.textContent=s.dataset.orig,2000)};
  if(g==='starmap'){A('tap');SM.starmap.open()}
  else if(g==='bedmas'){if(!SM.st.scouted)return msg('Hatch your egg in Star Map first!');A('tap');SM.bb.open()}
  else if(g==='grid'){if(!SM.st.scouted)return msg('Hatch your egg in Star Map first!');A('tap');SM.grid.open()}
  else if(g==='forge'){if(!SM.st.scouted)return msg('Hatch your egg in Star Map first!');A('tap');SM.forge.open()}
  else if(g==='vault'){if(!SM.st.scouted)return msg('Hatch your egg in Star Map first!');A('tap');SM.vault.open()}
  else if(g==='boss'){if(!SM.st.scouted)return msg('Hatch your egg in Star Map first!');A('tap');SM.boss.open()}});
$('#hubCreature').addEventListener('click',()=>{ // poke your pal
  const s=SM.stage(),c=FX.center($('#hubCreature'));
  if(s===0){A('crack');FX.shake($('#hubCreature'),6);return}
  A('boop');FX.burst(c.x,c.y-20,{n:10,colors:['#ff9bd2','#ff8a7a','#fff'],shape:'circle',speed:4,up:3,g:.05});
  const p=$('#hubCreature');p.classList.remove('happy');void p.offsetWidth;p.classList.add('happy');
});
$('#dressBtn').onclick=()=>{A('tap');SM.creature.openStudio()};
$('#stBack').onclick=()=>{A('back');open()};

function settings(){
  A('tap');const st=SM.st;
  $('#sheet').innerHTML=`<h2 class="disp">Settings</h2>
    <button class="toggle" id="tMusic"><span>Music</span><b class="${st.music?'on':''}">${st.music?'ON':'OFF'}</b></button>
    <button class="toggle" id="tSound"><span>Sound effects</span><b class="${st.sound?'on':''}">${st.sound?'ON':'OFF'}</b></button>
    <button class="btn ghost" id="closeCard">Done</button>`;
  $('#modal').classList.add('on');
  $('#tMusic').onclick=()=>{st.music=!st.music;SM.save();SM.audio.applyVol();settings()};
  $('#tSound').onclick=()=>{st.sound=!st.sound;SM.save();SM.audio.applyVol();settings()};
  $('#closeCard').onclick=()=>{A('back');$('#modal').classList.remove('on');open()};
}

function renderGrownups(){
  const st=SM.st,hard=SM.facts().filter(f=>f.wrong>0).sort((x,y)=>y.wrong-x.wrong).slice(0,6);
  $('#gu').innerHTML=`<ul>
    <li><b>Why it's built this way:</b> kids who reason well often struggle with rote recall because they re-derive every fact. This uses that strength: each tricky fact is taught as a strategy built from an easy one (8 × 7: double 7 three times, 14 → 28 → 56), also written as a BEDMAS expression. Repetition shortens the path until it becomes recall.</li>
    <li><b>Small number, visible progress:</b> 144 facts collapse to 28 that need real work. The map shows what he already owns.</li>
    <li><b>The creature grows from mastery, not time spent.</b> Evolution is tied to stars actually lit, so it can't be ground out. Stardust (for clothes and colours) comes from effort: correct answers, new stars, showing up daily. Nothing bad happens if he skips a day.</li>
    <li><b>No visible timer.</b> Speed is measured quietly. A fact only lights when it comes back in under 3 seconds, and only moves up after spaced checks on different days (1, 2, 4, 8, 16 days). Combos reward accuracy, not speed.</li>
    <li><b>Claim the Grid</b> is a strategy duel. Every square he claims means typing a product, and good play means thinking ahead in products ("if I leave the probes on 7 and 8, the robot can reach 56"). Three robot rivals get smarter as he beats them.</li>
    <li><b>Factor Forge</b> runs the table backwards: given 24, find every pair that makes it ("24 = 3 × ?"). Knowing a fact from both directions is what makes it stick, and it's the groundwork for division and fractions.</li>
    <li><b>Vault Cracker</b> is logic: clues like "A × B = 56" and "A is bigger than B" pin down a secret code. Every puzzle is checked to have exactly one answer.</li>
    <li><b>Weekly Boss</b> takes his six trickiest facts each Monday (most misses, slowest, least practised) and makes them the boss's armour. A miss never hurts him; it shows the trick and he tries again. Beating it once a week earns a trophy.</li>
    <li><b>Mostly wins:</b> each flight is mostly facts he knows, with at most ${SM.NEW_PER_DAY} new stars a day. Five minutes daily beats a long session weekly.</li>
  </ul>
  <p class="sub">Flights: ${st.sessions} · Days played: ${st.days.length} · Best combo: ${st.bestCombo||0} · Stardust earned all-time: ${st.dustTotal}</p>
  ${hard.length?`<p class="sub">Trickiest so far: ${hard.map(f=>`${f.a}×${f.b} (${f.wrong} misses)`).join(', ')}</p>`:''}
  <button class="btn ghost" id="unlockBtn" style="font-size:16px">${(st.bb&&st.bb.unlocked>=5)?'All Bracket Blaster levels unlocked':'Unlock all Bracket Blaster levels (to preview them)'}</button>
  <button class="btn ghost" id="resetBtn" style="font-size:16px">Reset all progress</button>`;
  $('#unlockBtn').onclick=()=>{if(st.bb&&st.bb.unlocked>=5)return;if(confirm('Unlock all 5 Bracket Blaster levels and Target mission? (He normally earns each level with 6 perfect blasts.)')){SM.bb.unlockAll();A('purchase');renderGrownups()}};
  $('#resetBtn').onclick=()=>{if(confirm('Erase all progress, stardust and the creature, and start over?')){SM.reset();open()}};
}

SM.hub={open};
title();
})();
