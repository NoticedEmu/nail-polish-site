/* Astra: standalone Auric Archive constellation; uses existing data.json, styles.css and app.js */
(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('astraCanvas'),ctx=canvas.getContext('2d');
const palette={RED:'#e78589',ORANGE:'#e9aa67',YELLOW:'#e3c575',GREEN:'#89c6a3',TEAL:'#79cac9',BLUE:'#83a8e0',PURPLE:'#bd9add',PINK:'#e7abc8',NEUTRAL:'#d3c5bd',METALLIC:'#e6d6a2',CLEAR:'#e0e4f0',OTHER:'#b7afc9'};
const groups=Object.keys(palette),vibeOrder=['Radiant','Confident','Playful','Mischievous','Daring','Brooding','Pensive','Wistful','Serene','Romantic'];
const INITIAL_SCALE=1.25;
let minimumScale=INITIAL_SCALE;
let polish=[],visible=[],focus=null,hover=-1,stars=[],links=[],view={x:0,y:0,scale:INITIAL_SCALE},target=null,drag=null,width=700,height=620,anim=0;
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0},rand=(seed,n=0)=>{let t=Math.sin(seed*12.9898+n*78.233)*43758.5453;return t-Math.floor(t)};
function family(color=''){let c=String(color).toLowerCase();if(/clear|transparent/.test(c))return 'CLEAR';if(/silver|gold|bronze|copper|metal|chrome/.test(c))return 'METALLIC';if(/black|white|gray|grey|beige|brown|taupe|nude|cream/.test(c))return 'NEUTRAL';if(/teal|aqua|turquoise|cyan/.test(c))return 'TEAL';if(/pink|rose|mauve|fuchsia|magenta/.test(c))return 'PINK';if(/purple|violet|lavender|lilac|plum/.test(c))return 'PURPLE';if(/navy|blue|azure|indigo|sapphire/.test(c))return 'BLUE';if(/green|sage|olive|mint|emerald/.test(c))return 'GREEN';if(/yellow|lemon|mustard/.test(c))return 'YELLOW';if(/orange|coral|peach|apricot/.test(c))return 'ORANGE';if(/red|burgundy|maroon|crimson/.test(c))return 'RED';return 'OTHER'}
function key(p){return (p.Brand||'')+' • '+(p.Nailpolish||'')+' • '+(p.Filename||'')}
function similarity(a,b){return (a.family===b.family?4:0)+(a.Vibe&&a.Vibe===b.Vibe?3:0)+(a.Type&&a.Type===b.Type?2:0)+(a['Sub Type']&&a['Sub Type']===b['Sub Type']?1:0)+(a.Brand===b.Brand?.65:0)}
function locate(p,i){let g=groups.indexOf(p.family),seed=hash(key(p)),n=groups.length,theta=(g/n)*Math.PI*2-Math.PI/2;let vr=Math.max(0,vibeOrder.indexOf(p.Vibe));let wobble=(vr/10-.5)*.34+(rand(seed,1)-.5)*.40;let radius=130+rand(seed,2)*165;return {p,i,x:Math.cos(theta+wobble)*radius+(rand(seed,3)-.5)*80,y:Math.sin(theta+wobble)*radius*.81+(rand(seed,4)-.5)*70,size:1.2+rand(seed,5)*1.85,phase:rand(seed,6)*6.28,visible:true}}
function fitViewport(){
 const stage=document.querySelector('.astra-space');
 if(!stage)return;
 // Use the actual position of the constellation after the heading, filters and legend.
 // Leave a small space for the footer and browser edge.
 if(window.innerWidth>850){
  const available=window.innerHeight-stage.getBoundingClientRect().top-36;
  const stageHeight=Math.max(270,Math.min(760,Math.floor(available)));
  document.documentElement.style.setProperty('--astra-stage-height',stageHeight+'px');
 }else{
  document.documentElement.style.setProperty('--astra-stage-height','420px');
 }
}
function resize(){
 fitViewport();
 let rect=canvas.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2);
 width=rect.width;height=rect.height;
 canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);
 ctx.setTransform(d,0,0,d,0,0);
 // Uniform scale on both axes; adapt to short viewport without deforming star positions.
 minimumScale=Math.min(INITIAL_SCALE, Math.max(.7,Math.min(width/980,height/550)*INITIAL_SCALE));
 view.scale=Math.max(view.scale,minimumScale);
 if(focus===null&&!drag&&!target){view.scale=minimumScale;view.x=0;view.y=0}
}
const project=s=>({x:width/2+(s.x-view.x)*view.scale,y:height/2+(s.y-view.y)*view.scale});
function render(t){if(!ctx)return;ctx.clearRect(0,0,width,height);ctx.save();let scale=Math.min(1.7,Math.max(.55,view.scale));for(let i=0;i<80;i++){let x=rand(i,21)*width,y=rand(i,22)*height;ctx.fillStyle=`rgba(234,216,245,${.09+rand(i,24)*.23})`;ctx.beginPath();ctx.arc(x,y,rand(i,23)*.8+.25,0,7);ctx.fill()}
let shown=stars.filter(s=>s.visible);for(const s of shown){if(focus===null||similarity(s.p,polish[focus])<5)continue;let neighbors=shown.filter(b=>b!==s&&similarity(s.p,b.p)>=6).sort((a,b)=>((s.x-a.x)**2+(s.y-a.y)**2)-((s.x-b.x)**2+(s.y-b.y)**2)).slice(0,2);for(const b of neighbors){if(b.i<s.i)continue;let a=project(s),z=project(b);ctx.strokeStyle='rgba(198,164,215,.10)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+z.x)/2+12,(a.y+z.y)/2-15,z.x,z.y);ctx.stroke()}}
if(focus!==null){let f=stars[focus],a=project(f);let relatives=shown.filter(s=>s!==f).sort((p,q)=>similarity(q.p,f.p)-similarity(p.p,f.p)).slice(0,9);for(const s of relatives){let b=project(s);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2+14,(a.y+b.y)/2-10,b.x,b.y);ctx.strokeStyle='rgba(222,187,124,.28)';ctx.lineWidth=1.1;ctx.stroke()}}
for(const s of shown){const a=project(s);if(a.x< -25||a.x>width+25||a.y< -25||a.y>height+25)continue;let active=s.i===focus,hovered=s.i===hover,rad=(s.size+(active?2.7:hovered?1.4:0))*(.85+Math.min(view.scale,2)*.23),twinkle=.72+.22*Math.sin(t/900+s.phase);ctx.shadowBlur=active?25:8;ctx.shadowColor=active?'#f6dba5':palette[s.p.family];ctx.fillStyle=active?'#ffe5b5':palette[s.p.family];ctx.globalAlpha=active?1:twinkle;ctx.beginPath();ctx.arc(a.x,a.y,rad,0,7);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;if(active){ctx.save();ctx.font=`${Math.max(18,rad*4.2)}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=18;ctx.shadowColor='rgba(246,219,165,.85)';ctx.fillStyle='#f5d48d';ctx.fillText('✦',a.x,a.y+1);ctx.restore()}if(hovered||active){ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#f8edf9';ctx.fillText(s.p.Nailpolish||'',a.x,Math.max(20,a.y-16))}}
ctx.restore();if(target){view.x+=(target.x-view.x)*.08;view.y+=(target.y-view.y)*.08;view.scale+=(target.scale-view.scale)*.08;view.scale=Math.max(minimumScale,view.scale);if(Math.abs(target.x-view.x)+Math.abs(target.y-view.y)+Math.abs(target.scale-view.scale)<.01)target=null}anim=requestAnimationFrame(render)}
function screenStar(x,y){let best=-1,dist=18;for(const s of stars){if(!s.visible)continue;const a=project(s),d=Math.hypot(a.x-x,a.y-y);if(d<dist){best=s.i;dist=d}}return best}
function focusStar(index){if(index<0||!stars[index])return;focus=index;const s=stars[index];target={x:s.x,y:s.y,scale:Math.max(view.scale,Math.min(2.1,minimumScale*1.16))};const p=polish[index];let related=stars.filter(b=>b.i!==index).sort((a,b)=>similarity(b.p,p)-similarity(a.p,p)).slice(0,5);const panel=$('astraFocus');panel.replaceChildren();let title=document.createElement('h2');title.className='astra-polish-name';title.textContent=p.Nailpolish;panel.append(title);let meta=document.createElement('div');meta.className='astra-meta';meta.textContent=[p.Brand,p.Color,p.Type,p.Vibe].filter(Boolean).join(' · ');panel.append(meta);const src=p['image one']||p.thumb;if(src){const img=document.createElement('img');img.className='astra-polish-image';img.src=src;img.alt=p.Brand+' '+p.Nailpolish;img.loading='lazy';img.onerror=()=>img.remove();
 img.tabIndex=0;img.role='button';img.title='View full-size polish image';
 img.setAttribute('aria-label','Enlarge photo of '+p.Brand+' '+p.Nailpolish);
 img.addEventListener('click',()=>openImage(src,img.alt));
 img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openImage(src,img.alt)}});
 panel.append(img)}if(p.Description){let desc=document.createElement('p');desc.className='astra-description';desc.textContent=p.Description;panel.append(desc)}let label=document.createElement('p');label.className='astra-kicker';label.textContent='NEIGHBORING STARS';panel.append(label);let rel=document.createElement('div');rel.className='astra-rel';for(const r of related){const btn=document.createElement('button');btn.textContent=r.p.Nailpolish;btn.title=r.p.Brand;btn.addEventListener('click',()=>focusStar(r.i));rel.append(btn)}panel.append(rel)}
let imageOverlay=null,previousFocus=null;
function closeImage(){
 if(!imageOverlay)return;
 imageOverlay.remove();imageOverlay=null;
 document.removeEventListener('keydown',imageOverlayKey);
 if(previousFocus?.isConnected)previousFocus.focus();
}
function imageOverlayKey(e){if(e.key==='Escape')closeImage()}
function openImage(src,alt){
 closeImage();previousFocus=document.activeElement;
 const overlay=document.createElement('div');overlay.className='astra-image-overlay';overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Full-size polish image');
 const pic=document.createElement('img');pic.src=src;pic.alt=alt;pic.className='astra-image-full';
 const close=document.createElement('button');close.type='button';close.className='astra-image-close';
 close.setAttribute('aria-label','Close enlarged image');close.textContent='×';close.onclick=closeImage;
 overlay.append(pic,close);overlay.addEventListener('click',e=>{if(e.target===overlay)closeImage()});
 document.body.append(overlay);imageOverlay=overlay;close.focus();
 document.addEventListener('keydown',imageOverlayKey);
}
function applyFilters(){let q=$('astraSearch').value.trim().toLowerCase(),v=$('astraVibe').value,finish=$('astraFinish').value,exclusive=$('astraExclusives').classList.contains('is-active');let total=0;for(const s of stars){let p=s.p;s.visible=(!q||(p.Brand+' '+p.Nailpolish).toLowerCase().includes(q))&&(!v||p.Vibe===v)&&(!finish||p.Type===finish)&&(!exclusive||!!p.Collab);if(s.visible)total++}$('astraCount').textContent=`${total} / ${polish.length} stars`;if(focus!==null&&!stars[focus].visible){focus=null;target={x:0,y:0,scale:minimumScale};$('astraFocus').innerHTML='<div class="astra-placeholder"><div class="astra-emblem">✧</div><h2>Select a star</h2><p>Choose a point in the constellation.</p></div>'}}
function makeOptions(id,vals){const select=$(id);for(const v of vals){let o=document.createElement('option');o.value=v;o.textContent=v;select.append(o)}}
async function init(){resize();try{const response=await fetch('data.json',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);const all=await response.json();polish=all.filter(p=>p&&p.Nailpolish).map(p=>({...p,family:family(p.Color)}));stars=polish.map(locate);makeOptions('astraVibe',vibeOrder.filter(v=>polish.some(p=>p.Vibe===v)));makeOptions('astraFinish',[...new Set(polish.map(p=>p.Type).filter(Boolean))].sort());let legend=$('astraLegend');for(const g of groups){let b=document.createElement('button');let dot=document.createElement('i');dot.style.background=palette[g];b.append(dot,document.createTextNode(g));b.addEventListener('click',()=>{let relevant=stars.filter(s=>s.p.family===g);if(relevant.length)focusStar(relevant[Math.floor(Math.random()*relevant.length)].i)});legend.append(b)}for(const id of ['astraSearch','astraVibe','astraFinish'])$(id).addEventListener(id==='astraSearch'?'input':'change',applyFilters);
$('astraExclusives').addEventListener('click',()=>{const btn=$('astraExclusives');const active=!btn.classList.contains('is-active');btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',active?'true':'false');applyFilters()});
$('astraClear').onclick=()=>{$('astraSearch').value='';$('astraVibe').value='';$('astraFinish').value='';const btn=$('astraExclusives');btn.classList.remove('is-active');btn.setAttribute('aria-pressed','false');applyFilters();view={x:0,y:0,scale:minimumScale};target=null};$('astraRandom').onclick=()=>{let list=stars.filter(s=>s.visible);if(list.length)focusStar(list[Math.floor(Math.random()*list.length)].i)};applyFilters();cancelAnimationFrame(anim);anim=requestAnimationFrame(render)}catch(e){$('astraCount').textContent='Unable to load data.json';$('astraFocus').textContent='Astra needs to be installed alongside the existing Auric Archive files on a web server. '+e.message}}
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,ox:view.x,oy:view.y,moved:false};canvas.setPointerCapture(e.pointerId);target=null});canvas.addEventListener('pointermove',e=>{let rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;hover=screenStar(x,y);if(drag){let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;view.x=drag.ox-dx/view.scale;view.y=drag.oy-dy/view.scale}});canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){let rect=canvas.getBoundingClientRect(),i=screenStar(e.clientX-rect.left,e.clientY-rect.top);if(i>=0)focusStar(i)}drag=null});canvas.addEventListener('pointerleave',()=>{hover=-1});canvas.addEventListener('wheel',e=>{e.preventDefault();target=null;view.scale=Math.max(minimumScale,Math.min(5,view.scale*(e.deltaY>0?.87:1.13)))},{passive:false});$('astraPlus').onclick=()=>{target=null;view.scale=Math.min(5,view.scale*1.25)};$('astraMinus').onclick=()=>{target=null;view.scale=Math.max(minimumScale,view.scale/1.25)};$('astraReset').onclick=()=>{target={x:0,y:0,scale:minimumScale};focus=null};window.addEventListener('resize',resize);if(window.ResizeObserver){new ResizeObserver(()=>{let r=canvas.getBoundingClientRect();if(Math.abs(r.width-width)>.5||Math.abs(r.height-height)>.5)resize()}).observe(canvas)}init();
})();
