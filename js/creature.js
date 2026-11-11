/* The creature: drawn from parts, grows with mastery, dressed with stardust. */
(function(){
const SM=window.SM,$=SM.$;

const COLORS={sky:'#6fb8ff',mint:'#5ee6a0',sun:'#ffd66e',coral:'#ff8a7a',grape:'#b69cff',bubble:'#ff9bd2',lava:'#ff6b3d',ice:'#bdf3ff',midnight:'#5566e0',gold:'#f5c542'};
// [id, name, cost, minimum stage]
const CAT={
  color:[['sky','Sky',0],['mint','Mint',0],['sun','Sunny',0],['coral','Coral',40],['grape','Grape',40],['bubble','Bubblegum',60],['lava','Lava',60],['ice','Ice',60],['midnight','Midnight',80],['gold','Pure gold',250,3]],
  body:[['round','Round',0],['bean','Bean',0],['tall','Tall',0]],
  eyes:[['big','Big eyes',0],['happy','Happy',40],['sleepy','Sleepy',40],['cyclops','One eye',70],['star','Star eyes',90]],
  top:[['none','Nothing',0],['ears','Ears',50],['sprout','Sprout',60],['antennae','Antennae',60],['horns','Horns',80],['flame','Flame head',150,2]],
  pattern:[['none','Plain',0],['belly','Belly',0],['spots','Spots',50],['stripes','Stripes',60],['sparkles','Sparkles',100]],
  acc:[['none','Nothing',0],['bowtie','Bow tie',60],['scarf','Scarf',80],['cap','Cap',90],['headphones','Headphones',120],['goggles','Goggles',120],['wizard','Wizard hat',220,2],['crown','Crown',300,3]],
  bg:[['night','Night sky',0],['aurora','Aurora',100],['ocean','Deep sea',120],['volcano','Volcano',150],['moon','Moon base',150]]
};
const TABS=[['color','Colour'],['body','Shape'],['eyes','Eyes'],['top','Head'],['pattern','Pattern'],['acc','Gear'],['bg','Home']];

function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
  const f=v=>Math.round(amt<0?v*(1+amt):v+(255-v)*amt);return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}

let uid=0;
function bodyShape(b){
  if(b==='bean')return{T:60,d:'<path d="M100 60 C150 60 165 100 162 135 C159 170 135 185 100 185 C65 185 41 170 38 135 C35 100 50 60 100 60Z"/>'};
  if(b==='tall')return{T:52,d:'<rect x="52" y="52" width="96" height="133" rx="48"/>'};
  return{T:67,d:'<ellipse cx="100" cy="126" rx="62" ry="59"/>'};
}
function background(bg,id){
  const stars=[[30,30],[160,22],[120,50],[50,80],[175,90],[20,140],[90,20]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" opacity=".8"/>`).join('');
  switch(bg){
    case 'aurora':return `<rect width="200" height="200" fill="#081a2b"/>${stars}<path d="M0 60 Q50 20 100 55 T200 40 L200 90 Q150 60 100 95 T0 85Z" fill="#5ee6a0" opacity=".35"/><path d="M0 95 Q60 60 110 90 T200 75 L200 110 Q140 90 100 115 T0 120Z" fill="#b69cff" opacity=".3"/><rect y="182" width="200" height="18" fill="#12304a"/>`;
    case 'ocean':return `<rect width="200" height="200" fill="url(#${id}o)"/><defs><linearGradient id="${id}o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a5d99"/><stop offset="1" stop-color="#071a33"/></linearGradient></defs>${[[30,150,6],[42,120,4],[170,130,7],[160,95,4],[25,80,3]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#bdf3ff" stroke-width="1.5" opacity=".6"/>`).join('')}<path d="M0 185 Q50 175 100 186 T200 182 L200 200 L0 200Z" fill="#c9a96b" opacity=".5"/>`;
    case 'volcano':return `<rect width="200" height="200" fill="#2a0c1a"/>${stars}<path d="M10 190 L70 70 L90 78 L110 70 L190 190Z" fill="#4a1a1a"/><path d="M78 74 Q90 40 100 72Z" fill="#ff6b3d" opacity=".8"/><rect y="186" width="200" height="14" fill="#5a1d10"/>`;
    case 'moon':return `<rect width="200" height="200" fill="#0b0f26"/>${stars}<circle cx="165" cy="35" r="16" fill="#6fb8ff" opacity=".7"/><ellipse cx="100" cy="205" rx="140" ry="34" fill="#8a8fa8"/><ellipse cx="40" cy="190" rx="12" ry="4" fill="#6c7088"/><ellipse cx="160" cy="194" rx="16" ry="5" fill="#6c7088"/>`;
    default:return `<rect width="200" height="200" fill="url(#${id}n)"/><defs><linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1640"/><stop offset="1" stop-color="#26307a"/></linearGradient></defs>${stars}`;
  }
}
function topFeature(t,T,col,dk){
  switch(t){
    case 'ears':return `<g fill="${col}" stroke="${dk}" stroke-width="4"><ellipse cx="68" cy="${T+8}" rx="15" ry="26" transform="rotate(-25 68 ${T+8})"/><ellipse cx="132" cy="${T+8}" rx="15" ry="26" transform="rotate(25 132 ${T+8})"/></g><g fill="#ff9bb5" opacity=".7"><ellipse cx="68" cy="${T+6}" rx="7" ry="15" transform="rotate(-25 68 ${T+6})"/><ellipse cx="132" cy="${T+6}" rx="7" ry="15" transform="rotate(25 132 ${T+6})"/></g>`;
    case 'antennae':return `<g stroke="${dk}" stroke-width="4" fill="none" stroke-linecap="round"><path d="M86 ${T+8} Q78 ${T-16} 70 ${T-28}"/><path d="M114 ${T+8} Q122 ${T-16} 130 ${T-28}"/></g><g fill="#ffd66e" stroke="${dk}" stroke-width="3"><circle cx="70" cy="${T-31}" r="7"/><circle cx="130" cy="${T-31}" r="7"/></g>`;
    case 'horns':return `<g fill="#f3ead2" stroke="${dk}" stroke-width="3" stroke-linejoin="round"><path d="M72 ${T+16} L64 ${T-24} L90 ${T+8}Z"/><path d="M128 ${T+16} L136 ${T-24} L110 ${T+8}Z"/></g>`;
    case 'sprout':return `<path d="M100 ${T+6} L100 ${T-20}" stroke="#2f8a52" stroke-width="4" stroke-linecap="round"/><g fill="#5ee6a0" stroke="#2f8a52" stroke-width="2"><ellipse cx="89" cy="${T-22}" rx="13" ry="6" transform="rotate(-25 89 ${T-22})"/><ellipse cx="111" cy="${T-22}" rx="13" ry="6" transform="rotate(25 111 ${T-22})"/></g>`;
    case 'flame':return `<path class="flick" d="M100 ${T-40} C116 ${T-18} 122 ${T-4} 112 ${T+10} C108 ${T} 104 ${T+2} 100 ${T+10} C96 ${T+2} 92 ${T} 88 ${T+10} C78 ${T-4} 84 ${T-18} 100 ${T-40}Z" fill="#ff8a3d" stroke="#d9480f" stroke-width="3"/><path d="M100 ${T-18} C106 ${T-8} 106 ${T} 100 ${T+6} C94 ${T} 94 ${T-8} 100 ${T-18}Z" fill="#ffd66e"/>`;
  }return '';
}
function pattern(p,T,dk,lt){
  switch(p){
    case 'belly':return `<ellipse cx="100" cy="166" rx="40" ry="34" fill="${lt}" opacity=".85"/>`;
    case 'spots':return `<g fill="${dk}" opacity=".3">${[[60,T+30,9],[140,T+44,7],[70,T+92,8],[132,T+98,10],[100,T+112,6],[150,T+76,5]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
    case 'stripes':return `<g fill="${dk}" opacity=".25">${[T+8,T+84,T+104].map(y=>`<rect x="0" y="${y}" width="200" height="9"/>`).join('')}</g>`;
    case 'sparkles':return `<g fill="#fff" opacity=".85">${[[62,T+28],[140,T+34],[70,T+96],[132,T+92],[104,T+116]].map(([x,y])=>`<path d="M${x} ${y-6} L${x+2} ${y-2} L${x+6} ${y} L${x+2} ${y+2} L${x} ${y+6} L${x-2} ${y+2} L${x-6} ${y} L${x-2} ${y-2}Z"/>`).join('')}</g>`;
  }return '';
}
function eyes(e,T,dk){
  const E=T+40;
  const big=(x,r)=>`<circle cx="${x}" cy="${E}" r="${r}" fill="#fff" stroke="${dk}" stroke-width="3"/><circle cx="${x+2}" cy="${E+2}" r="${r*.55}" fill="#1b1530"/><circle cx="${x+4}" cy="${E-2}" r="${r*.2}" fill="#fff"/>`;
  switch(e){
    case 'happy':return `<g stroke="#1b1530" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M72 ${E+3} Q82 ${E-9} 92 ${E+3}"/><path d="M108 ${E+3} Q118 ${E-9} 128 ${E+3}"/></g>`;
    case 'sleepy':return `<g stroke="#1b1530" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M72 ${E} Q82 ${E+8} 92 ${E}"/><path d="M108 ${E} Q118 ${E+8} 128 ${E}"/></g><text x="140" y="${T+14}" font-size="16" fill="#fff" opacity=".7" font-family="Fredoka">z</text>`;
    case 'cyclops':return big(100,19);
    case 'star':{const st=x=>{let p='';for(let i=0;i<10;i++){const r=i%2?5:13,a=-Math.PI/2+i*Math.PI/5;p+=`${(x+r*Math.cos(a)).toFixed(1)},${(E+r*Math.sin(a)).toFixed(1)} `}return `<polygon points="${p}" fill="#ffd66e" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>`};return st(82)+st(118)}
  }return big(82,13)+big(118,13);
}
function accessory(a,T,dk){
  switch(a){
    case 'bowtie':{const Y=T+88;return `<g fill="#ff5d73" stroke="${dk}" stroke-width="3" stroke-linejoin="round"><path d="M100 ${Y} L80 ${Y-11} L80 ${Y+11}Z"/><path d="M100 ${Y} L120 ${Y-11} L120 ${Y+11}Z"/><circle cx="100" cy="${Y}" r="5"/></g>`}
    case 'scarf':return `<g fill="#ff5d73" stroke="${dk}" stroke-width="3" stroke-linejoin="round"><path d="M50 ${T+76} Q100 ${T+94} 150 ${T+76} L150 ${T+92} Q100 ${T+110} 50 ${T+92}Z"/><path d="M118 ${T+96} L128 ${T+128} L142 ${T+124} L134 ${T+92}Z"/></g>`;
    case 'cap':return `<g stroke="${dk}" stroke-width="3" stroke-linejoin="round"><path d="M60 ${T+18} Q100 ${T-34} 140 ${T+18}Z" fill="#4b7bec"/><path d="M118 ${T+12} Q150 ${T+6} 164 ${T+18} Q140 ${T+24} 116 ${T+18}Z" fill="#3a5fc0"/></g><circle cx="100" cy="${T-7}" r="4" fill="#ffd66e"/>`;
    case 'headphones':return `<path d="M54 ${T+42} Q100 ${T-44} 146 ${T+42}" stroke="#2b3152" stroke-width="8" fill="none"/><g fill="#ff5d73" stroke="${dk}" stroke-width="3"><rect x="40" y="${T+28}" width="20" height="32" rx="9"/><rect x="140" y="${T+28}" width="20" height="32" rx="9"/></g>`;
    case 'goggles':return `<rect x="58" y="${T+12}" width="84" height="7" fill="#2b3152"/><g fill="#9be7ff" stroke="#2b3152" stroke-width="5"><circle cx="84" cy="${T+15}" r="12"/><circle cx="116" cy="${T+15}" r="12"/></g><g fill="#fff" opacity=".8"><circle cx="80" cy="${T+11}" r="3"/><circle cx="112" cy="${T+11}" r="3"/></g>`;
    case 'wizard':return `<g stroke="${dk}" stroke-width="3" stroke-linejoin="round"><path d="M66 ${T+14} L102 ${T-50} L134 ${T+14}Z" fill="#6a4bd6"/><ellipse cx="100" cy="${T+14}" rx="46" ry="8" fill="#5a3cc0"/></g><path d="M100 ${T-22} l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1Z" fill="#ffd66e"/>`;
    case 'crown':return `<path d="M70 ${T+12} L70 ${T-20} L85 ${T-5} L100 ${T-28} L115 ${T-5} L130 ${T-20} L130 ${T+12}Z" fill="#f5c542" stroke="#9c7a1a" stroke-width="3" stroke-linejoin="round"/><g><circle cx="85" cy="${T+3}" r="4" fill="#ff5d73"/><circle cx="100" cy="${T+3}" r="4" fill="#6fb8ff"/><circle cx="115" cy="${T+3}" r="4" fill="#5ee6a0"/></g>`;
  }return '';
}

/* draw a creature. c = creature record, stage = growth stage, opts.bg = include habitat */
function svg(c,stage,opts){
  opts=opts||{};const id='cr'+(uid++);
  const col=COLORS[c.color]||COLORS.sky,dk=shade(col,-.45),lt=shade(col,.5);
  const bg=opts.bg?background(c.bg,id):'';
  if(stage===0){
    return `<svg viewBox="0 0 200 200" class="crt ${opts.cls||''}">${bg}<g class="wobble"><ellipse cx="100" cy="122" rx="50" ry="63" fill="#f3ead2" stroke="#b9a77a" stroke-width="4"/>
      <g fill="${col}"><circle cx="82" cy="100" r="9"/><circle cx="118" cy="128" r="12"/><circle cx="92" cy="155" r="7"/><circle cx="122" cy="90" r="6"/></g>
      <g fill="none" stroke="#6b5a2e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${['','<path d="M70 92 L80 100 L74 108 L84 116"/>','<path d="M70 92 L80 100 L74 108 L84 116"/><path d="M128 104 L118 112 L126 120 L116 128 L122 136"/>','<path d="M54 122 L66 116 L76 126 L88 114 L100 124 L112 112 L124 124 L134 116 L146 122"/><path d="M70 92 L80 100 L74 108"/><path d="M128 104 L118 112 L126 120"/>'][opts.crack||0]}</g></g></svg>`;
  }
  const B=bodyShape(c.body),T=B.T,s=[1,.72,.84,.94,1,1][stage];
  let back='',front='';
  if(stage>=4)back+=`<defs><radialGradient id="${id}a"><stop offset=".55" stop-color="${col}" stop-opacity=".45"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs><circle cx="100" cy="122" r="96" fill="url(#${id}a)" class="pulse"/>`;
  if(stage>=3){const w=`<path d="M64 ${T+52} C22 ${T+12} 2 ${T+68} 28 ${T+98} C38 ${T+82} 50 ${T+88} 62 ${T+88}Z"/>`;
    back+=`<g fill="${lt}" stroke="${dk}" stroke-width="3" opacity=".92" class="flap">${w}<g transform="translate(200 0) scale(-1 1)">${w}</g></g>`;}
  if(stage>=4)back+=`<path d="M150 172 C188 174 194 138 176 128 C186 150 172 162 148 158Z" fill="${col}" stroke="${dk}" stroke-width="3"/>`;
  back+=topFeature(c.top,T,col,dk);
  if(stage>=2)back+=`<g fill="${col}" stroke="${dk}" stroke-width="4"><ellipse cx="${c.body==='tall'?50:42}" cy="${T+78}" rx="11" ry="18" transform="rotate(20 ${c.body==='tall'?50:42} ${T+78})"/><ellipse cx="${c.body==='tall'?150:158}" cy="${T+78}" rx="11" ry="18" transform="rotate(-20 ${c.body==='tall'?150:158} ${T+78})"/></g>`;
  const body=`<defs><clipPath id="${id}c">${B.d}</clipPath></defs><g fill="${col}" stroke="${dk}" stroke-width="4">${B.d}</g><g clip-path="url(#${id}c)">${pattern(c.pattern,T,dk,lt)}</g>`;
  if(stage>=2)front+=`<g fill="${col}" stroke="${dk}" stroke-width="4"><ellipse cx="78" cy="184" rx="17" ry="9"/><ellipse cx="122" cy="184" rx="17" ry="9"/></g>`;
  front+=`<g class="eyes" style="animation-delay:-${(Math.random()*5).toFixed(2)}s">${eyes(c.eyes,T,dk)}</g>`;
  front+=`<path d="M88 ${T+62} Q100 ${T+74} 112 ${T+62}" stroke="#1b1530" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="#ff8fa8" opacity=".5"><circle cx="66" cy="${T+58}" r="7"/><circle cx="134" cy="${T+58}" r="7"/></g>`;
  front+=accessory(c.acc,T,dk);
  let orbit='';
  if(stage>=5)orbit=`<g class="orbit">${[0,120,240].map(a=>`<circle cx="${100+92*Math.cos(a*Math.PI/180)}" cy="${118+92*Math.sin(a*Math.PI/180)}" r="5" fill="#fff4c4"/>`).join('')}</g>`;
  return `<svg viewBox="0 0 200 200" class="crt ${opts.cls||''}">${bg}${orbit}<g transform="translate(100 190) scale(${s}) translate(-100 -190)"><g class="bob">${back}${body}${front}</g></g></svg>`;
}

/* ---------- studio: customize and shop ---------- */
let tab='color',tryOn=null;
function owned(slot,id){return SM.st.creature.owned.includes(slot+':'+id)}
function openStudio(){tryOn=Object.assign({},SM.st.creature);tab='color';SM.show('studio');renderStudio()}
function renderStudio(){
  const c=SM.st.creature,stage=Math.max(1,SM.stage());
  $('#stPrev').innerHTML=svg(tryOn,stage,{bg:true});
  $('#stDust').innerHTML=`<i class="ic">${SM.fx.I.dust}</i><b>${SM.st.dust}</b>`;
  $('#stName').value=c.name||'';
  $('#stTabs').innerHTML=TABS.map(([k,l])=>`<button data-t="${k}" class="${k===tab?'on':''}">${l}</button>`).join('');
  $('#stItems').innerHTML=CAT[tab].map(([id,name,cost,minStage])=>{
    const have=owned(tab,id),locked=(minStage||0)>SM.stage(),wearing=c[tab]===id,trying=tryOn[tab]===id;
    const look=Object.assign({},c,{[tab]:id});
    const pic=tab==='color'?`<span class="sw" style="background:${COLORS[id]}"></span>`:svg(look,stage,{bg:tab==='bg',cls:'mini'});
    const label=locked?`<i class="ic">${SM.fx.I.lock}</i>${SM.STAGES[minStage].name}`:wearing?'✓ Wearing':have?'Owned':`<i class="ic">${SM.fx.I.dust}</i>${cost}`;
    return `<button class="item${trying?' sel':''}${locked?' locked':''}" data-id="${id}">${pic}<span class="nm">${name}</span><span class="pr">${label}</span></button>`;
  }).join('');
  const sel=CAT[tab].find(i=>i[0]===tryOn[tab]);
  if(sel&&!owned(tab,sel[0])){
    const need=sel[2]-SM.st.dust;
    $('#stBuy').innerHTML=need>0?`<p class="sub" style="text-align:center;margin:8px 0">Trying on <b>${sel[1]}</b>. You need <b>${need}</b> more stardust. Earn it in the games!</p>`
      :`<button class="btn" id="buyBtn">Buy ${sel[1]} · <i class="ic">${SM.fx.I.dust}</i>${sel[2]}</button>`;
    const b=$('#buyBtn');if(b)b.onclick=()=>{SM.st.dust-=sel[2];c.owned.push(tab+':'+sel[0]);c[tab]=sel[0];SM.save();SM.audio.play('purchase');
      const pc=SM.fx.center($('#stPrev'));SM.fx.burst(pc.x,pc.y,{n:36,colors:SM.fx.RAINBOW,speed:9});renderStudio();SM.fx.pop($('#stPrev'),1.12)};
  }else $('#stBuy').innerHTML='';
}
document.addEventListener('click',e=>{
  const t=e.target.closest('#stTabs button');if(t){SM.audio.play('tap');tab=t.dataset.t;tryOn=Object.assign({},SM.st.creature);renderStudio();return}
  const it=e.target.closest('#stItems .item');if(!it||it.classList.contains('locked'))return;
  const id=it.dataset.id;tryOn=Object.assign({},SM.st.creature,{[tab]:id});
  if(owned(tab,id)){SM.st.creature[tab]=id;SM.save();SM.audio.play('pop')}else SM.audio.play('tap');
  renderStudio();SM.fx.pop($('#stPrev'),1.06);
});
document.addEventListener('change',e=>{if(e.target.id==='stName'){SM.st.creature.name=e.target.value.trim().slice(0,14);SM.save()}});

SM.creature={svg,openStudio,CAT,name:()=>SM.st.creature.name||'your creature'};
})();
