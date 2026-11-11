/* Audio: every sound and the music are synthesized live with WebAudio. No files needed.
   SFX are short and soft on purpose: wrong answers get a gentle "bwomp", never a buzzer. */
(function(){
const SM=window.SM;
let ctx=null,sfxBus,musBus,noiseBuf;
const m2f=m=>440*Math.pow(2,(m-69)/12);

function init(){
  if(ctx)return ctx;
  try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;comp.connect(ctx.destination);
  // a little room so it doesn't sound like a calculator
  const verb=ctx.createConvolver(),len=ctx.sampleRate*1.4,ir=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}
  verb.buffer=ir;const wet=ctx.createGain();wet.gain.value=.22;verb.connect(wet).connect(comp);
  sfxBus=ctx.createGain();sfxBus.connect(comp);sfxBus.connect(verb);
  musBus=ctx.createGain();musBus.connect(comp);musBus.connect(verb);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  applyVol();
  document.addEventListener('visibilitychange',()=>{if(!ctx)return;document.hidden?ctx.suspend():ctx.resume()});
  return ctx;
}
function applyVol(){if(!ctx)return;sfxBus.gain.value=SM.st.sound?.6:0;musBus.gain.value=SM.st.music?.17:0}
function unlock(){init();if(ctx&&ctx.state==='suspended')ctx.resume();if(want&&!timer)startMusic()}
const T=()=>ctx.currentTime+.01;

function note(f,t,d,o){o=o||{};
  const os=ctx.createOscillator(),g=ctx.createGain();os.type=o.type||'square';os.frequency.setValueAtTime(f,t);
  if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+d);
  if(o.det)os.detune.value=o.det;
  const v=o.vol||.2,a=o.a||.005;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  let out=g;if(o.lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;g.connect(fl);out=fl}
  os.connect(g);out.connect(o.bus||sfxBus);os.start(t);os.stop(t+d+.05);
}
function noise(t,d,o){o=o||{};
  const s=ctx.createBufferSource();s.buffer=noiseBuf;const f=ctx.createBiquadFilter();f.type=o.ft||'bandpass';
  f.frequency.setValueAtTime(o.f||2000,t);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,t+d);f.Q.value=o.q||1;
  const g=ctx.createGain();g.gain.setValueAtTime(o.vol||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f).connect(g).connect(o.bus||sfxBus);s.start(t);s.stop(t+d+.05);
}

const SFX={
  tap(){note(m2f(86),T(),.05,{type:'square',vol:.06,lp:3000})},
  key(d){note(m2f(72+[0,2,4,5,7,9,11,12,14,16][d|0]),T(),.08,{type:'triangle',vol:.16})},
  back(){note(m2f(67),T(),.07,{type:'triangle',vol:.12,to:m2f(60)})},
  correct(combo){const t=T(),b=72+Math.min(combo|0,12);
    [0,4,7,12].forEach((s,i)=>note(m2f(b+s),t+i*.045,.18,{type:'square',vol:.07,lp:4200}));
    note(m2f(b+24),t+.18,.35,{type:'sine',vol:.07})},
  lightning(){const t=T();note(1600,t,.3,{type:'sine',vol:.06,to:4200});noise(t,.18,{f:7000,vol:.05});note(m2f(103),t+.12,.25,{type:'sine',vol:.05})},
  wrong(){const t=T();note(m2f(55),t,.16,{type:'triangle',vol:.16});note(m2f(50),t+.13,.3,{type:'triangle',vol:.14})},
  coin(i){const t=T(),u=(i|0)%5;note(m2f(83+u),t,.05,{type:'square',vol:.05,lp:5000});note(m2f(88+u),t+.05,.14,{type:'square',vol:.05,lp:5000})},
  tick(i){note(m2f(76+((i|0)%12)),T(),.04,{type:'square',vol:.04,lp:4000})},
  whoosh(){noise(T(),.32,{ft:'bandpass',f:350,to:2600,q:.7,vol:.09})},
  crack(){const t=T();noise(t,.1,{ft:'highpass',f:1800,vol:.4});noise(t+.03,.08,{ft:'bandpass',f:900,vol:.25});note(m2f(38),t,.12,{type:'square',vol:.08,lp:500})},
  pop(){note(m2f(70),T(),.14,{type:'sine',vol:.2,to:m2f(86)})},
  boop(){const t=T(),r=Math.random()*5|0;note(m2f(79+r),t,.09,{type:'sine',vol:.16,to:m2f(86+r)});note(m2f(84+r),t+.08,.12,{type:'sine',vol:.12,to:m2f(91+r)})},
  sparkle(){const t=T();[0,4,7,11,12,16,19].forEach((s,i)=>note(m2f(91+s),t+i*.035,.16,{type:'sine',vol:.045}))},
  rise(d){const t=T();note(m2f(48),t,d,{type:'sawtooth',vol:.05,to:m2f(84),lp:1800,a:d*.8});noise(t,d,{f:300,to:6000,vol:.05})},
  slam(){const t=T();note(m2f(36),t,.25,{type:'sine',vol:.3,to:m2f(24)});noise(t,.2,{ft:'lowpass',f:900,vol:.25})},
  fanfare(){const t=T();
    [[72,0,.12],[76,.12,.12],[79,.24,.12],[84,.36,.18],[79,.56,.1],[84,.66,.7]].forEach(([m,dt,d])=>note(m2f(m),t+dt,d,{type:'square',vol:.08,lp:3600}));
    [48,55,60,64,67].forEach(m=>note(m2f(m),t+.66,.9,{type:'triangle',vol:.07}))},
  hatch(){const t=T();[60,64,67,72,76,79,84].forEach((m,i)=>note(m2f(m),t+i*.06,.4,{type:'square',vol:.06,lp:3000}));SFX.sparkle()},
  purchase(){SFX.coin(0);setTimeout(()=>{SFX.coin(3);SFX.sparkle()},90)},
  start(){const t=T();[60,67,72,76,79,84,88].forEach((m,i)=>note(m2f(m),t+i*.07,.35,{type:'square',vol:.06,lp:3200}));note(m2f(36),t,.6,{type:'triangle',vol:.15})},
  tally(){note(m2f(96),T(),.03,{type:'square',vol:.03,lp:6000})},
  click(i){const t=T();noise(t,.03,{ft:'highpass',f:3500,vol:.18});note(m2f(64+((i|0)%12)),t,.04,{type:'square',vol:.04,lp:2500})},
  unlock(){const t=T();[0,.09,.18].forEach((d,i)=>{noise(t+d,.05,{ft:'highpass',f:2500,vol:.2});note(m2f(60+i*5),t+d,.06,{type:'square',vol:.05,lp:2000})});
    note(m2f(40),t+.32,.4,{type:'triangle',vol:.2,to:m2f(47)});noise(t+.32,.35,{ft:'lowpass',f:700,vol:.2})},
  creak(){note(m2f(45),T(),.7,{type:'sawtooth',vol:.04,to:m2f(52),lp:600,a:.1})},
  roar(){const t=T();note(m2f(40),t,.6,{type:'sawtooth',vol:.09,to:m2f(31),lp:900,a:.04});note(m2f(41),t,.6,{type:'sawtooth',vol:.07,to:m2f(30),lp:700,a:.04,det:30});noise(t,.55,{f:500,to:200,q:.8,vol:.18})},
  hit(){const t=T();note(m2f(43),t,.14,{type:'square',vol:.14,to:m2f(31),lp:1400});noise(t,.12,{ft:'highpass',f:1500,vol:.3})},
  crit(){SFX.hit();const t=T();[84,91,96].forEach((m,i)=>note(m2f(m),t+.05+i*.04,.14,{type:'square',vol:.06,lp:5000}));noise(t+.05,.2,{f:6000,vol:.06})}
};
function play(name,arg){if(!ctx||ctx.state!=='running')return;try{SFX[name](arg)}catch(e){}}

/* ---------- music: a tiny 4-bar sequencer with two moods ---------- */
const SONGS={
  // dreamy: Fmaj7 · Em7 · Dm7 · Cmaj7
  hub:{bpm:80,drums:false,lead:'triangle',chords:[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]]},
  // bouncy: C · Am · F · G
  play:{bpm:108,drums:true,lead:'square',chords:[[48,52,55,60],[45,48,52,57],[41,45,48,53],[43,47,50,55]]},
  // tense: Am · F · G · E
  boss:{bpm:132,drums:true,lead:'square',chords:[[45,48,52,57],[41,45,48,53],[43,47,50,55],[40,44,47,52]]}
};
const ARP=[0,1,2,3,2,1,2,3];
let cur=null,want=null,timer=null,step=0,nextT=0,melody=[];
function makeMelody(s){ // a fresh but repeating hook each time the track starts
  melody=[];for(let bar=0;bar<4;bar++)for(let i=0;i<16;i+=2){
    const keep=(i%4===0)?.7:.3;melody.push(Math.random()<keep?s.chords[bar][Math.random()*4|0]+24:null)}
}
function playStep(s,st,t,dt){
  const bar=(st/16|0)%4,i=st%16,ch=s.chords[bar];
  if(i===0)ch.forEach(m=>{note(m2f(m+12),t,dt*16,{type:'sawtooth',vol:.018,lp:900,a:.3,bus:musBus,det:(Math.random()-.5)*14})});
  if(i===0||i===8||(s.drums&&(i===6||i===14)))note(m2f(ch[0]-12),t,dt*(i%8?2:5),{type:'triangle',vol:.22,bus:musBus});
  if(i%2===0)note(m2f(ch[ARP[(i/2)%8]]+12),t,dt*1.6,{type:s.lead,vol:s.drums?.035:.05,lp:2000,bus:musBus});
  if(i%2===0){const m=melody[bar*8+i/2];if(m&&st>=64)note(m2f(m),t,dt*3,{type:'sine',vol:.045,bus:musBus})}
  if(s.drums){
    if(i===0||i===8){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);
      g.gain.setValueAtTime(.35,t);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g).connect(musBus);o.start(t);o.stop(t+.2)}
    if(i===4||i===12)noise(t,.12,{f:1800,q:.8,vol:.07,bus:musBus});
    if(i%2===1)noise(t,.03,{ft:'highpass',f:7500,vol:.03,bus:musBus});
  }
}
function sched(){const s=SONGS[cur];if(!s)return;const dt=60/s.bpm/4;
  while(nextT<ctx.currentTime+.15){playStep(s,step,nextT,dt);nextT+=dt;step=(step+1)%128}}
function startMusic(){if(!ctx||!want)return;cur=want;step=0;nextT=ctx.currentTime+.08;makeMelody(SONGS[cur]);clearInterval(timer);timer=setInterval(sched,30)}
function music(name){if(want===name)return;want=name;if(!ctx)return;clearInterval(timer);timer=null;if(name)startMusic()}

SM.audio={unlock,play,music,applyVol};
})();
