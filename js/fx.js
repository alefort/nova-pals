/* FX: particle layer, living starfield, screen wipes, count-ups, cutscene stage. */
(function(){
const SM=window.SM,$=SM.$;
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- starfield background ---------- */
const sky=document.createElement('canvas');sky.id='sky';document.body.prepend(sky);
const sc=sky.getContext('2d');let SW,SH,stars=[],shoot=null;
function sizeSky(){const d=Math.min(2,devicePixelRatio||1);SW=innerWidth;SH=innerHeight;sky.width=SW*d;sky.height=SH*d;sc.setTransform(d,0,0,d,0,0);
  stars=[];[[70,.7,.04],[40,1.1,.09],[16,1.7,.18]].forEach(([n,r,v])=>{for(let i=0;i<n*(SW*SH)/(800*600)+n*.3;i++)stars.push({x:Math.random()*SW,y:Math.random()*SH,r,v,p:Math.random()*6.3,s:.5+Math.random()*1.5})})}
sizeSky();addEventListener('resize',sizeSky);
function drawSky(t){
  sc.clearRect(0,0,SW,SH);
  for(const s of stars){
    if(!calm){s.x-=s.v;s.y+=s.v*.35;if(s.x<-2)s.x=SW+2;if(s.y>SH+2)s.y=-2}
    sc.globalAlpha=.35+.65*Math.abs(Math.sin(s.p+t/1000*s.s));sc.fillStyle='#fff';sc.beginPath();sc.arc(s.x,s.y,s.r,0,7);sc.fill();
  }
  if(!calm){
    if(!shoot&&Math.random()<.003)shoot={x:Math.random()*SW*.8+SW*.2,y:Math.random()*SH*.4,l:0};
    if(shoot){shoot.l+=1;const k=shoot.l/45,x=shoot.x-shoot.l*9,y=shoot.y+shoot.l*4;
      const g=sc.createLinearGradient(x,y,x+90,y-40);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');
      sc.globalAlpha=1-k;sc.strokeStyle=g;sc.lineWidth=2;sc.beginPath();sc.moveTo(x,y);sc.lineTo(x+90,y-40);sc.stroke();if(k>=1)shoot=null}
  }
  sc.globalAlpha=1;
  if(!calm)requestAnimationFrame(drawSky);
}
requestAnimationFrame(drawSky);

/* ---------- particles ---------- */
const cv=document.createElement('canvas');cv.id='fx';document.body.appendChild(cv);
const cx=cv.getContext('2d');let W,H;
function size(){const d=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)}
size();addEventListener('resize',size);
const P=[];let running=false;
const GOLD=['#ffd66e','#fff4c4','#ffb547','#ffffff'],RAINBOW=['#ffd66e','#6fb8ff','#ff8a7a','#5ee6a0','#b69cff','#ff9bd2'];
function starPath(x,y,r,rot,pts,inner){cx.beginPath();for(let i=0;i<pts*2;i++){const rr=i%2?r*inner:r,a=rot+i*Math.PI/pts-Math.PI/2;cx.lineTo(x+rr*Math.cos(a),y+rr*Math.sin(a))}cx.closePath();cx.fill()}
function loop(){
  cx.clearRect(0,0,W,H);
  for(let i=P.length-1;i>=0;i--){const p=P[i];
    if(p.delay>0){p.delay--;continue}
    p.t++;if(p.t>=p.life){P.splice(i,1);if(p.done)try{p.done()}catch(e){console.warn(e)}continue}
    if(p.fly){const k=p.t/p.life,e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
      p.x=(1-e)*(1-e)*p.x0+2*(1-e)*e*p.cx+e*e*p.x1;p.y=(1-e)*(1-e)*p.y0+2*(1-e)*e*p.cy+e*e*p.y1;}
    else{p.vx*=p.drag;p.vy=p.vy*p.drag+p.g;p.x+=p.vx;p.y+=p.vy}
    p.rot+=p.vr;
    const fade=p.fly?1:Math.min(1,(p.life-p.t)/(p.life*.4));
    cx.globalAlpha=fade;cx.fillStyle=p.c;cx.globalCompositeOperation=p.s==='rect'?'source-over':'lighter';
    if(p.s==='star')starPath(p.x,p.y,p.r,p.rot,5,.45);
    else if(p.s==='spark')starPath(p.x,p.y,p.r,p.rot,4,.25);
    else if(p.s==='rect'){cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);cx.scale(1,Math.cos(p.t/6));cx.fillRect(-p.r,-p.r/2,p.r*2,p.r);cx.restore()}
    else{cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill()}
  }
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
  if(P.length)requestAnimationFrame(loop);else{running=false;cx.clearRect(0,0,W,H)}
}
function kick(){if(!running){running=true;requestAnimationFrame(loop)}}
function center(el){const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
function burst(x,y,o){o=o||{};if(calm&&!o.force)return;const n=o.n||18,cols=o.colors||GOLD;
  for(let i=0;i<n;i++){const a=Math.random()*6.283,sp=(o.speed||6)*(.4+Math.random()*.8);
    P.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(o.up||1.5),g:o.g==null?.18:o.g,drag:.94,r:(o.size||6)*(.5+Math.random()*.8),
      c:cols[Math.random()*cols.length|0],s:o.shape||(Math.random()<.6?'star':'spark'),rot:Math.random()*6,vr:(Math.random()-.5)*.3,t:0,life:40+Math.random()*30,delay:0})}
  kick();
}
function ring(x,y,o){o=o||{};const n=o.n||14,cols=o.colors||GOLD;
  for(let i=0;i<n;i++){const a=i/n*6.283;P.push({x,y,vx:Math.cos(a)*(o.speed||7),vy:Math.sin(a)*(o.speed||7),g:0,drag:.9,r:o.size||4,c:cols[i%cols.length],s:'spark',rot:0,vr:.2,t:0,life:30,delay:0})}kick()}
function confetti(n){for(let i=0;i<(n||120);i++)P.push({x:Math.random()*W,y:-20-Math.random()*H*.4,vx:(Math.random()-.5)*3,vy:2+Math.random()*3,g:.06,drag:.995,r:5+Math.random()*4,
  c:RAINBOW[i%RAINBOW.length],s:'rect',rot:Math.random()*6,vr:(Math.random()-.5)*.25,t:0,life:150+Math.random()*80,delay:Math.random()*30|0});kick()}
/* stardust flies from one element to another; onEach fires as each mote lands */
function fly(from,to,n,onEach,onAll){
  const a=from.x!=null?from:center(from),b=to.x!=null?to:center(to);let left=n;
  if(calm||!n){for(let i=0;i<n;i++)onEach&&onEach(i);onAll&&onAll();return}
  for(let i=0;i<n;i++){const idx=i;
    P.push({fly:true,x0:a.x+(Math.random()-.5)*30,y0:a.y+(Math.random()-.5)*30,x1:b.x,y1:b.y,cx:(a.x+b.x)/2+(Math.random()-.5)*260,cy:Math.min(a.y,b.y)-60-Math.random()*120,
      x:a.x,y:a.y,r:7,c:GOLD[i%3],s:'spark',rot:0,vr:.25,t:0,life:42+Math.random()*10,delay:i*4,
      done:()=>{onEach&&onEach(idx);if(--left===0&&onAll)onAll();ring(b.x,b.y,{n:6,speed:3,size:3})}})}
  kick();
}

/* ---------- DOM juice ---------- */
function anim(el,frames,opts){if(!el||calm&&!(opts&&opts.force))return null;return el.animate(frames,Object.assign({duration:300,easing:'cubic-bezier(.3,1.5,.5,1)'},opts||{}))}
const pop=(el,s)=>anim(el,[{transform:'scale(1)'},{transform:`scale(${s||1.25})`},{transform:'scale(1)'}],{duration:280});
const shake=(el,a)=>anim(el,[0,-1,1,-1,1,0].map(k=>({transform:`translateX(${k*(a||8)}px)`})),{duration:360,easing:'ease-out'});
const enter=el=>anim(el,[{transform:'scale(.6) rotate(-4deg)',opacity:0},{transform:'scale(1) rotate(0)',opacity:1}],{duration:420});
function floatText(x,y,txt,cls){const d=document.createElement('div');d.className='float '+(cls||'');d.textContent=txt;d.style.left=x+'px';d.style.top=y+'px';
  document.body.appendChild(d);setTimeout(()=>d.remove(),1100)}
function countUp(el,from,to,ms,tick){return new Promise(res=>{if(from===to||calm){el.textContent=to;return res()}
  const t0=performance.now();let last=from;(function f(now){const k=Math.min(1,(now-t0)/ms),v=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));
    if(v!==last){last=v;el.textContent=v;tick&&tick(v)}k<1?requestAnimationFrame(f):res()})(t0)})}

/* ---------- screen wipe: every screen change becomes a transition ---------- */
const wipe=document.createElement('div');wipe.id='wipe';wipe.innerHTML='<svg viewBox="0 0 100 100"><path d="M50 8 L61 38 L93 38 L67 57 L77 89 L50 70 L23 89 L33 57 L7 38 L39 38Z"/></svg>';document.body.appendChild(wipe);
const rawShow=SM.show;let busy=false,pending=null;
SM.show=async function(id){
  const cur=document.querySelector('.screen.on');
  if(calm||!cur||cur.id===id){rawShow(id);return}
  if(busy){pending=id;return}busy=true;
  SM.audio&&SM.audio.play('whoosh');
  wipe.style.display='block';
  await wipe.animate([{clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(75% at 50% 50%)'}],{duration:240,easing:'ease-in',fill:'forwards'}).finished;
  rawShow(pending||id);pending=null;
  await wipe.animate([{clipPath:'circle(75% at 50% 50%)'},{clipPath:'circle(0% at 50% 50%)'}],{duration:260,easing:'ease-out',fill:'forwards'}).finished;
  wipe.style.display='none';busy=false;
  if(pending){const p=pending;pending=null;SM.show(p)} // a tap that landed mid-transition still counts
};

/* ---------- cutscene stage (hatch, evolve) ---------- */
const cine=document.createElement('div');cine.id='cine';cine.innerHTML='<div class="cineGlow"></div><div class="cinePic" id="cinePic"></div><div class="cineText" id="cineText"></div><div class="cineUI" id="cineUI"></div><div class="flash" id="flash"></div>';
document.body.appendChild(cine);
const Cine={
  open(){cine.classList.add('on');$('#cineText').innerHTML='';$('#cineUI').innerHTML='';},
  close(){return cine.animate([{opacity:1},{opacity:0}],{duration:300}).finished.then(()=>cine.classList.remove('on'))},
  pic(html){$('#cinePic').innerHTML=html},
  text(html){const t=$('#cineText');t.innerHTML=html;enter(t)},
  ui(html){const u=$('#cineUI');u.innerHTML=html;enter(u);return u},
  flash(){return $('#flash').animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],{duration:900}).finished},
  waitTap(sel){return new Promise(r=>{const b=document.querySelector(sel);const go=e=>{e&&e.preventDefault&&e.preventDefault();removeEventListener('keydown',k);SM.audio.play('tap');r()};
    const k=e=>{if(e.key==='Enter'&&e.target.tagName!=='INPUT'||e.key==='Enter'&&e.target.id==='cineName')go(e)};b.addEventListener('click',go,{once:true});addEventListener('keydown',k)})}
};
async function hatch(c){
  Cine.open();const egg=s=>SM.creature.svg(c,0,{crack:s,cls:'big'});
  Cine.pic(egg(0));Cine.text('Something is happening…');await sleep(900);
  for(let s=1;s<=3;s++){Cine.pic(egg(s));SM.audio.play('crack');shake($('#cinePic'),6+s*4);burst(innerWidth/2,innerHeight*.4,{n:6,colors:['#f3ead2','#fff'],speed:4,force:1});await sleep(s<3?800:600)}
  SM.audio.play('rise',.9);anim($('#cinePic'),[{transform:'scale(1)'},{transform:'scale(1.15)'}],{duration:900,fill:'forwards',easing:'ease-in'});await sleep(850);
  Cine.flash();await sleep(220);
  Cine.pic(SM.creature.svg(c,1,{cls:'big'}));SM.audio.play('hatch');confetti(140);burst(innerWidth/2,innerHeight*.4,{n:40,colors:RAINBOW,speed:10,force:1});
  Cine.text('<h1 class="logoText">It hatched!</h1>');await sleep(700);
  Cine.ui(`<label for="cineName">Give your Nova Pal a name</label><input id="cineName" class="name" maxlength="14" placeholder="Name" autocomplete="off"><button class="btn" id="cineGo">That's the one!</button>`);
  setTimeout(()=>{const i=$('#cineName');i&&i.focus()},100);
  await Cine.waitTap('#cineGo');
  const name=($('#cineName').value||'').trim().slice(0,14)||'Nova';c.name=name;SM.save();
  Cine.text(`<h1 class="logoText">Hi, ${name}!</h1>`);$('#cineUI').innerHTML='';SM.audio.play('boop');anim($('#cinePic'),[{transform:'translateY(0)'},{transform:'translateY(-30px)'},{transform:'translateY(0)'}],{duration:500});
  await sleep(1300);await Cine.close();
}
async function evolve(c,from,to){
  Cine.open();Cine.pic(SM.creature.svg(c,from,{cls:'big'}));Cine.text(`What? ${c.name||'Your Nova Pal'} is changing!`);
  await sleep(900);SM.audio.play('rise',2.2);
  const p=$('#cinePic');
  for(let i=0;i<7;i++){Cine.pic(SM.creature.svg(c,i%2?to:from,{cls:'big glowy'}));await sleep(Math.max(90,380-i*50))}
  Cine.flash();await sleep(250);
  Cine.pic(SM.creature.svg(c,to,{cls:'big'}));SM.audio.play('fanfare');confetti(160);burst(innerWidth/2,innerHeight*.4,{n:50,colors:RAINBOW,speed:11,force:1});
  anim(p,[{transform:'scale(.7)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:600,force:1});
  Cine.text(`<h1 class="logoText">${SM.STAGES[to].name}!</h1><p>${c.name||'Your Nova Pal'} ${SM.STAGES[to].gain}.</p>`);
  Cine.ui('<button class="btn" id="cineGo">Awesome!</button>');await Cine.waitTap('#cineGo');await Cine.close();
}

/* ---------- icons (drawn, not emoji, so they look like game UI) ---------- */
const I={
  star:'<svg viewBox="0 0 24 24"><path fill="#ffd66e" stroke="#b8862a" stroke-width="1.6" stroke-linejoin="round" d="M12 2.5l2.8 6 6.4.7-4.8 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.8 9.2l6.4-.7z"/></svg>',
  dust:'<svg viewBox="0 0 24 24"><path fill="#b69cff" stroke="#6b4fd1" stroke-width="1.4" stroke-linejoin="round" d="M12 1.5c.9 5 2.6 7.6 9.5 10.5-6.9 2.9-8.6 5.5-9.5 10.5-.9-5-2.6-7.6-9.5-10.5C9.4 9.1 11.1 6.5 12 1.5z"/><path fill="#fff" opacity=".7" d="M10 8.5c.4 1.6 1 2.3 2.3 3-1.3.5-1.9 1.3-2.3 3-.3-1.5-1-2.4-2.4-3 1.4-.6 2-1.4 2.4-3z"/></svg>',
  flame:'<svg viewBox="0 0 24 24"><path fill="#ff8a3d" stroke="#c2410c" stroke-width="1.4" stroke-linejoin="round" d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-4.5 2.5-6 .3 2 1 3 2 3.5C10 8 11 5 12 2z"/><path fill="#ffd66e" d="M12 13c1.5 1.5 2.5 2.5 2.5 4a2.5 2.5 0 0 1-5 0c0-1.5 1-2.5 2.5-4z"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><path fill="#9aa5d6" d="M10.3 2h3.4l.5 2.6 1.7.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.7 2.6.5v3.4l-2.6.5-.8 1.7 1.5 2.2-2.4 2.4-2.2-1.5-1.7.8-.5 2.6h-3.4l-.5-2.6-1.7-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.7L2 13.7v-3.4l2.6-.5.8-1.7-1.5-2.2 2.4-2.4 2.2 1.5 1.7-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></svg>',
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#5a6497"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#5a6497" stroke-width="2.5"/></svg>',
  bolt:'<svg viewBox="0 0 24 24"><path fill="#ffd66e" stroke="#b8862a" stroke-width="1.4" stroke-linejoin="round" d="M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.5z"/></svg>',
  combo:'<svg viewBox="0 0 24 24"><path fill="#ff8a7a" stroke="#c2410c" stroke-width="1.4" stroke-linejoin="round" d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-4.5 2.5-6 .3 2 1 3 2 3.5C10 8 11 5 12 2z"/></svg>'
};
/* game badges for the hub */
const BADGE={
  starmap:['#3b5bdb','#7048e8','<path fill="#ffd66e" stroke="#7a4d00" stroke-width="2" stroke-linejoin="round" d="M32 9l6.3 13.6 14.9 1.6-11.1 10 3.1 14.6L32 41.4 18.8 48.8l3.1-14.6-11.1-10 14.9-1.6z"/><circle cx="50" cy="12" r="2.5" fill="#fff"/><circle cx="12" cy="50" r="2" fill="#fff"/>'],
  bedmas:['#0ca678','#1971c2','<text x="32" y="44" text-anchor="middle" font-family="Lilita One,Fredoka" font-size="30" fill="#fff" stroke="#063" stroke-width="1.5">( × )</text>'],
  grid:['#e8590c','#d6336c','<g fill="#fff" opacity=".95"><rect x="12" y="12" width="11" height="11" rx="3"/><rect x="26.5" y="12" width="11" height="11" rx="3" opacity=".4"/><rect x="41" y="12" width="11" height="11" rx="3"/><rect x="12" y="26.5" width="11" height="11" rx="3" opacity=".4"/><rect x="26.5" y="26.5" width="11" height="11" rx="3"/><rect x="41" y="26.5" width="11" height="11" rx="3" opacity=".4"/><rect x="12" y="41" width="11" height="11" rx="3"/><rect x="26.5" y="41" width="11" height="11" rx="3" opacity=".4"/><rect x="41" y="41" width="11" height="11" rx="3"/></g>'],
  forge:['#f08c00','#c92a2a','<rect x="14" y="16" width="30" height="13" rx="3" fill="#dee2e6" stroke="#495057" stroke-width="2" transform="rotate(-30 29 22)"/><rect x="30" y="26" width="6" height="26" rx="2" fill="#a0522d" stroke="#5c2c0c" stroke-width="2" transform="rotate(-30 33 39)"/><circle cx="48" cy="46" r="3" fill="#ffd66e"/><circle cx="53" cy="40" r="2" fill="#ffd66e"/>'],
  vault:['#495057','#1864ab','<circle cx="32" cy="32" r="18" fill="#adb5bd" stroke="#343a40" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="#343a40"/><g stroke="#343a40" stroke-width="3" stroke-linecap="round"><path d="M32 14v6M32 44v6M14 32h6M44 32h6"/></g>'],
  boss:['#862e9c','#c2255c','<path d="M14 40c0-12 8-22 18-22s18 10 18 22v8H14z" fill="#9775fa" stroke="#3b1d6b" stroke-width="2.5"/><path d="M18 22l4-10 5 8M46 22l-4-10-5 8" fill="#f3ead2" stroke="#3b1d6b" stroke-width="2"/><circle cx="25" cy="34" r="4" fill="#fff"/><circle cx="39" cy="34" r="4" fill="#fff"/><circle cx="26" cy="35" r="2" fill="#000"/><circle cx="40" cy="35" r="2" fill="#000"/><path d="M24 44l4-3 4 3 4-3 4 3" fill="none" stroke="#fff" stroke-width="2"/>']
};
function badge(id){const [a,b,art]=BADGE[id];const g='bg'+id;
  return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="16" fill="url(#${g})"/><rect x="2" y="2" width="60" height="30" rx="16" fill="#fff" opacity=".12"/>${art}</svg>`}

/* ---------- shared results screen ---------- */
async function results(o){
  const st=SM.st,start=st.dust-o.dust;
  $('#sumBody').innerHTML=`<div class="resTop"><span class="pill" id="sumDustPill"><i class="ic">${I.dust}</i><b id="sumDust">${start}</b></span></div>
    <div class="banner" id="banner">${o.title}</div>
    <div class="resPal" id="resPal">${SM.creature.svg(st.creature,SM.stage(),{bg:true})}</div>
    <div class="tally" id="tally"></div><div id="resExtra"></div>`;
  const btn=$('#sumBtn');btn.textContent=o.btn||'Back to the hub';btn.style.visibility='hidden';
  SM.audio.music(o.music||'hub');SM.show('summary');await sleep(calm?0:600);
  SM.audio.play('slam');anim($('#banner'),[{transform:'translateY(-80px) scale(1.4)',opacity:0},{transform:'none',opacity:1}],{duration:450});
  anim($('#resPal'),[{transform:'scale(0)'},{transform:'scale(1)'}],{duration:500,delay:150});
  await sleep(500);
  for(const [icon,label,val,isDust] of o.rows){
    const row=document.createElement('div');row.className='trow';row.innerHTML=`<i class="ic">${icon}</i><span>${label}</span><b>0</b>`;
    $('#tally').appendChild(row);enter(row);
    await countUp(row.querySelector('b'),0,val,Math.min(900,200+val*40),()=>SM.audio.play('tally'));
    if(isDust&&val){SM.audio.play('coin');let shown=start;await new Promise(r=>fly(row.querySelector('b'),$('#sumDustPill'),Math.min(val,24),i=>{shown=Math.min(st.dust,start+Math.round((i+1)*val/Math.min(val,24)));$('#sumDust').textContent=shown;SM.audio.play('coin',i);pop($('#sumDustPill'),1.12)},r));$('#sumDust').textContent=st.dust}
    await sleep(160);
  }
  if(o.extra){const x=$('#resExtra');x.innerHTML=o.extra;[...x.children].forEach((el,i)=>anim(el,[{transform:'translateY(20px)',opacity:0},{transform:'none',opacity:1}],{duration:400,delay:i*180,fill:'backwards'}));
    if(o.extraSound)SM.audio.play(o.extraSound)}
  await sleep(400);btn.style.visibility='visible';pop(btn,1.08);
}

SM.fx={results,sleep,burst,ring,confetti,fly,center,pop,shake,enter,anim,floatText,countUp,hatch,evolve,I,badge,calm,RAINBOW,GOLD};
})();
