const SYN_VIBES=['Radiant','Confident','Playful','Mischievous','Daring','Brooding','Pensive','Wistful','Serene','Romantic'];
const SYN_COLOR_FAMILIES={red:['red','maroon','burgundy','wine','berry'],pink:['pink','rose','mauve','magenta','peach'],orange:['orange','copper'],yellow:['yellow','gold','champagne'],green:['green','olive','sage'],teal:['teal','turquoise','aqua'],blue:['blue','navy','indigo','cobalt'],purple:['purple','violet','plum','lilac','lavender'],neutral:['black','white','gray','grey','silver','brown','taupe','beige','clear'],rainbow:['rainbow']};
let synPolishes=[],synCurrent=null,synNeighbors=[],synLastResult=null,synAnimating=false,synEntryAngle=null,synNavPoints=[];
const syn$=s=>document.querySelector(s),synCanvas=syn$('#brainCanvas'),synCtx=synCanvas.getContext('2d');
function synColorFamily(c=''){const s=String(c).toLowerCase();for(const [f,terms] of Object.entries(SYN_COLOR_FAMILIES))if(terms.some(t=>s.includes(t)))return f;return 'other'}
function synVibeDistance(a,b){let i=SYN_VIBES.indexOf(a),j=SYN_VIBES.indexOf(b);if(i<0||j<0)return 5;let d=Math.abs(i-j);return Math.min(d,10-d)}
function synRelationship(a,b){let score=0,reasons=[];const vd=synVibeDistance(a.Vibe,b.Vibe);if(vd===0){score+=5;reasons.push('Same Vibe')}else if(vd===1){score+=3;reasons.push('Neighboring Vibe')}else if(vd===2){score+=1;reasons.push('Nearby Vibe')}const ca=synColorFamily(a.Color),cb=synColorFamily(b.Color);if(ca===cb){score+=4;reasons.push('Color family')}if(a.Color&&b.Color&&a.Color===b.Color){score+=2;reasons.push('Same color')}if(a.Type&&b.Type&&a.Type===b.Type){score+=1;reasons.push('Same finish')}return{score,reasons}}
function synImageCandidates(p={}){return [...new Set([p.thumb,p.Thumb,p.imageOne,p['image one'],p.image,p.imageTwo,p['image two']].filter(Boolean).map(v=>String(v).replaceAll('\\','/').replace(/^\.\//,'')))]}
function synThumb(p){return synImageCandidates(p)[0]||''}
function synSetImage(img,p,alt=''){const list=synImageCandidates(p);img.dataset.synImages=JSON.stringify(list);img.dataset.synTried='';img.src=list[0]||'';img.alt=alt;synWireImageFallbacks(img.parentElement||document)}
function synWireImageFallbacks(root=document){root.querySelectorAll('img[data-syn-images]').forEach(img=>{img.onerror=()=>{let list=[];try{list=JSON.parse(img.dataset.synImages||'[]')}catch{};const current=img.getAttribute('src')||'';const next=list.find(src=>src&&src!==current&&!img.dataset.synTried?.split('|').includes(src));if(next){img.dataset.synTried=(img.dataset.synTried?img.dataset.synTried+'|':'')+current;img.src=next}else{img.onerror=null;img.classList.add('syn-image-missing')}}})}
function synEscape(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function synPopulate(){const sorted=synPolishes.map((p,i)=>({p,i})).sort((a,b)=>(a.p.Brand+a.p.Nailpolish).localeCompare(b.p.Brand+b.p.Nailpolish));sorted.forEach(({p,i})=>syn$('#polishSelect').add(new Option(`${p.Brand} — ${p.Nailpolish}`,i)));SYN_VIBES.forEach(v=>syn$('#flyVibe').add(new Option(v,v)));[...new Set(synPolishes.map(p=>p.Color).filter(Boolean))].sort().forEach(c=>syn$('#flyColor').add(new Option(c,c)));synRenderWheel()}
function synBestNeighbors(p){return synPolishes.map((q,i)=>({p:q,i,...synRelationship(p,q)})).filter(x=>x.p!==p&&x.score>0).sort((a,b)=>b.score-a.score||Math.random()-.5).slice(0,4)}
let synMorphLayout=null;
function buildSynapseMorphLayout(){
  if(!mcnsLoaded||!mcnsSkeletons[0])return null;
  const sk=mcnsSkeletons[0], degree=new Map();
  sk.pts.forEach(p=>{degree.set(p.id,(degree.get(p.id)||0)+(p.parent>0?1:0));if(p.parent>0)degree.set(p.parent,(degree.get(p.parent)||0)+1)});
  const base=boundsOf([sk]);
  const junctions=sk.pts.filter(p=>(degree.get(p.id)||0)>=3);
  const junction=(junctions.length?junctions:sk.pts).reduce((best,p)=>{const d=(p.x-base.cx)**2+(p.y-base.cy)**2+(p.z-base.cz)**2;return !best||d<best.d?{p,d}:best},null).p;
  const view={cx:junction.x,cy:junction.y,cz:junction.z,span:base.span*.72};
  const r=synCanvas.getBoundingClientRect();
  const candidates=sk.pts.filter(p=>{const d=degree.get(p.id)||0;return d===1||d>=3}).map(p=>{const q=projectPoint(p,view,r.width,r.height,mcnsAngle*.18,1.28);const dx=q.x-r.width/2,dy=q.y-r.height/2;return{p,x:q.x,y:q.y,dist:Math.hypot(dx,dy),angle:Math.atan2(dy,dx)}}).filter(q=>q.x>80&&q.x<r.width-80&&q.y>75&&q.y<r.height-75&&q.dist>Math.min(r.width,r.height)*.18).sort((a,b)=>b.dist-a.dist);
  const chosen=[];
  for(const c of candidates){if(chosen.every(x=>{let d=Math.abs(c.angle-x.angle);d=Math.min(d,Math.PI*2-d);return d>.72})){chosen.push(c);if(chosen.length===4)break}}
  if(chosen.length<4){for(const c of candidates){if(!chosen.includes(c)){chosen.push(c);if(chosen.length===4)break}}}
  return{view,junction,anchors:chosen};
}
function synRenderNodes(){
  const layer=syn$('#nodeLayer');
  synNeighbors=synBestNeighbors(synCurrent);
  synMorphLayout=buildSynapseMorphLayout();
  const r=synCanvas.getBoundingClientRect(),centerIndex=synPolishes.indexOf(synCurrent);
  const center={x:r.width*.50,y:r.height*.50};
  let anchors=(synMorphLayout?.anchors||[]).slice(0,4).map(a=>({x:a.x,y:a.y}));
  const fallbackAngles=synEntryAngle==null?[-2.55,-.78,.34,2.22]:[synEntryAngle+Math.PI, synEntryAngle-.92, synEntryAngle+.22, synEntryAngle+1.18];
  while(anchors.length<4){const k=anchors.length,a=fallbackAngles[k],rad=Math.min(r.width,r.height)*(k===0?.34:.38);anchors.push({x:center.x+Math.cos(a)*rad,y:center.y+Math.sin(a)*rad})}
  // Keep one branch roughly continuing the direction of travel, while retaining real-morphology anchors.
  if(synEntryAngle!=null&&anchors.length){anchors.sort((a,b)=>Math.abs(Math.atan2(Math.sin(Math.atan2(a.y-center.y,a.x-center.x)-synEntryAngle),Math.cos(Math.atan2(a.y-center.y,a.x-center.x)-synEntryAngle)))-Math.abs(Math.atan2(Math.sin(Math.atan2(b.y-center.y,b.x-center.x)-synEntryAngle),Math.cos(Math.atan2(b.y-center.y,b.x-center.x)-synEntryAngle))))}
  synNavPoints=[center,...anchors];
  const imgAttrs=p=>{const list=JSON.stringify(synImageCandidates(p));return `src="${synEscape(synThumb(p))}" data-syn-images="${synEscape(list)}"`};
  let html=`<button class="synapse-node is-center" style="left:50%;top:50%" data-index="${centerIndex}" type="button"><span class="node-orb"><img ${imgAttrs(synCurrent)} alt=""></span><span class="node-label">${synEscape(synCurrent.Nailpolish)}</span></button>`;
  synNeighbors.forEach((n,k)=>{const a=anchors[k],left=a.x/r.width,top=a.y/r.height;html+=`<button class="synapse-node branch-anchor branch-${k+1}" style="left:${left*100}%;top:${top*100}%" data-index="${n.i}" type="button" title="${synEscape(n.reasons.join(' • '))}"><span class="node-orb"><img ${imgAttrs(n.p)} alt=""></span><span class="node-label">${synEscape(n.p.Nailpolish)}</span></button>`});
  layer.innerHTML=html; synWireImageFallbacks(layer);
  layer.querySelectorAll('.synapse-node:not(.is-center)').forEach(btn=>btn.onclick=()=>synTravel(+btn.dataset.index,btn));
  syn$('#stageHint').hidden=true;syn$('#randomStart').hidden=true;synUpdateFocus();synResizeCanvas();synRenderNeuralField();synDraw();
}

function synNeuralPath(a,b,seed=1,bendScale=1){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const wobble=((seed*37)%19-9)/9, bend=Math.min(92,len*.24)*wobble*bendScale;
  const c1={x:a.x+dx*.27+nx*bend,y:a.y+dy*.27+ny*bend};
  const c2={x:a.x+dx*.70-nx*bend*.42,y:a.y+dy*.70-ny*bend*.42};
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}
function synSomaPath(x,y,scale=1,seed=1){
  const pts=[];for(let i=0;i<10;i++){const a=i*Math.PI*2/10,r=(20+((seed+i*13)%9))*scale;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r*.76])}
  let d=`M ${(pts[0][0]+pts[9][0])/2} ${(pts[0][1]+pts[9][1])/2}`;
  for(let i=0;i<10;i++){const p=pts[i],q=pts[(i+1)%10];d+=` Q ${p[0]} ${p[1]} ${(p[0]+q[0])/2} ${(p[1]+q[1])/2}`};return d+' Z';
}
function synRenderNeuralField(){
  const svg=syn$('#neuralField'); if(!svg||!synCurrent)return;
  const r=synCanvas.getBoundingClientRect(),w=r.width,h=r.height,center=synNavPoints[0]||{x:w/2,y:h/2},anchors=synNavPoints.slice(1);
  svg.setAttribute('viewBox',`${-w*.05} ${-h*.05} ${w*1.1} ${h*1.1}`);
  let defs=`<defs><linearGradient id="nfFiber" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7f5b89"/><stop offset=".48" stop-color="#b998c1"/><stop offset="1" stop-color="#8d6798"/></linearGradient><radialGradient id="nfSoma"><stop offset="0" stop-color="#eadcf1" stop-opacity=".78"/><stop offset=".5" stop-color="#b996c2" stop-opacity=".58"/><stop offset="1" stop-color="#8b6696" stop-opacity=".32"/></radialGradient><filter id="nfGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter><filter id="nfBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>`;
  let distant='<g class="nf-distant">';
  const distantSomas=[[-.02,.22,.72],[.18,.86,.58],[.83,.12,.62],[1.03,.66,.78],[.63,.94,.5]];
  distantSomas.forEach((v,i)=>{const x=v[0]*w,y=v[1]*h,sc=v[2];distant+=`<path class="nf-soma" d="${synSomaPath(x,y,sc,80+i)}"/>`;for(let k=0;k<4;k++){const a=(i*.91+k*1.57)+.3,end={x:x+Math.cos(a)*w*(.18+.03*k),y:y+Math.sin(a)*h*(.18+.025*k)};distant+=`<path class="nf-twig-soft" d="${synNeuralPath({x,y},end,90+i*9+k,1.4)}"/>`}});distant+='</g>';
  let middle='<g class="nf-middle">';
  // Off-screen and partial neurons create depth without becoming a wallpaper pattern.
  [[.08,.36],[.91,.39],[.36,.05],[.72,.78]].forEach((v,i)=>{const x=v[0]*w,y=v[1]*h;middle+=`<path class="nf-soma-glow" d="${synSomaPath(x,y,.78,140+i)}"/><path class="nf-soma" d="${synSomaPath(x,y,.62,140+i)}"/>`;for(let k=0;k<5;k++){const a=i*1.3+k*1.19,end={x:x+Math.cos(a)*w*(.13+.025*k),y:y+Math.sin(a)*h*(.14+.02*k)};middle+=`<path class="nf-twig" d="${synNeuralPath({x,y},end,160+i*11+k,1.25)}"/>`}});middle+='</g>';
  let main='<g class="nf-main">';
  // A biological-looking soma sits beneath the focus polish.
  main+=`<path class="nf-soma-glow" d="${synSomaPath(center.x,center.y,1.65,21)}"/><path class="nf-soma" d="${synSomaPath(center.x,center.y,1.18,21)}"/><ellipse class="nf-soma-shine" cx="${center.x-8}" cy="${center.y-9}" rx="13" ry="8"/>`;
  anchors.forEach((b,i)=>{const d=synNeuralPath(center,b,31+i*47,1.15);main+=`<path class="nf-glow" d="${d}"/><path class="nf-body" d="${d}"/><path class="nf-highlight" d="${d}"/>`;
    // Branches split from several points near the polish route and taper away.
    const dx=b.x-center.x,dy=b.y-center.y,base=Math.atan2(dy,dx);[.34,.57,.76].forEach((t,j)=>{const p={x:center.x+dx*t,y:center.y+dy*t},side=((i+j)%2?1:-1),ang=base+side*(.62+j*.16),len=Math.min(w,h)*(.075+j*.025),e={x:p.x+Math.cos(ang)*len,y:p.y+Math.sin(ang)*len};main+=`<path class="nf-twig" d="${synNeuralPath(p,e,240+i*17+j,1.35)}"/>`;if(j>0){const e2={x:e.x+Math.cos(ang+side*.55)*len*.48,y:e.y+Math.sin(ang+side*.55)*len*.48};main+=`<path class="nf-twig-soft" d="${synNeuralPath(e,e2,290+i*19+j,1.1)}"/>`}});
    // A smaller swelling at each polish node makes it feel embedded in the tissue.
    main+=`<path class="nf-soma-glow" d="${synSomaPath(b.x,b.y,.72,310+i)}"/><path class="nf-soma" d="${synSomaPath(b.x,b.y,.46,310+i)}"/>`;
  });
  // Extra unoccupied dendrites: not every branch is a UI choice.
  for(let i=0;i<7;i++){const a=-2.8+i*.86,end={x:center.x+Math.cos(a)*Math.min(w,h)*(.23+(i%3)*.045),y:center.y+Math.sin(a)*Math.min(w,h)*(.23+(i%2)*.055)};main+=`<path class="nf-twig" d="${synNeuralPath(center,end,400+i*29,1.4)}"/>`}
  main+='</g>';svg.innerHTML=defs+distant+middle+main;
}

function synUpdateFocus(reasons=[]){const p=synCurrent;syn$('#focusCard').hidden=false;synSetImage(syn$('#focusImage'),p,`${p.Brand} ${p.Nailpolish}`);syn$('#focusName').textContent=`${p.Brand} — ${p.Nailpolish}`;syn$('#focusMeta').textContent=[p.Color,p.Vibe,p.Type].filter(Boolean).join(' • ');syn$('#focusDescription').textContent=p.Description||'';syn$('#focusReasons').innerHTML=reasons.map(r=>`<span>${synEscape(r)}</span>`).join('')}
function synTravel(index,button){
  if(synAnimating)return;const next=synPolishes[index];if(!next)return;
  const old=synCurrent,stage=syn$('#synapseStage'),world=syn$('#synapseWorld'),rect=stage.getBoundingClientRect(),br=button.getBoundingClientRect();
  const dx=(br.left+br.width/2)-(rect.left+rect.width/2),dy=(br.top+br.height/2)-(rect.top+rect.height/2);
  synEntryAngle=Math.atan2(dy,dx);synAnimating=true;stage.classList.add('is-traveling');
  const anim=world.animate([{transform:'translate3d(0,0,0) scale(1)'},{transform:`translate3d(${-dx}px,${-dy}px,0) scale(1.035)`}],{duration:760,easing:'cubic-bezier(.18,.78,.22,1)',fill:'forwards'});
  anim.onfinish=()=>{synCurrent=next;const rel=synRelationship(old,next);anim.cancel();world.style.transform='';try{synRenderNodes();synUpdateFocus(rel.reasons)}finally{stage.classList.remove('is-traveling');synAnimating=false}};
  anim.oncancel=()=>{stage.classList.remove('is-traveling');synAnimating=false};
}
function synSelect(index){synCurrent=synPolishes[index];if(!synCurrent)return;synRenderNodes();}
const MCNS_SOURCE='https://storage.googleapis.com/flyem-male-cns/v1.0/segmentation/skeletons-malecns/skeletons-swc/';
const MCNS_NEURONS=[{id:'12781',name:'DNge104_R'},{id:'556329',name:'DNge104_L'}];
let mcnsSkeletons=[],mcnsAngle=0,mcnsLoaded=false,mcnsGraph=null,mcnsActivePath=[],mcnsSkeletonCache=new Map();
function parseSWC(text,meta){const pts=[],byId=new Map();for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const a=line.split(/\s+/);if(a.length<7)continue;const p={id:+a[0],x:+a[2],y:+a[3],z:+a[4],parent:+a[6]};pts.push(p);byId.set(p.id,p)}return{...meta,pts,byId}}
async function fetchMCNSSkeleton(id,name=''){const key=String(id);if(mcnsSkeletonCache.has(key))return mcnsSkeletonCache.get(key);const r=await fetch(MCNS_SOURCE+key+'.swc');if(!r.ok)throw Error('MaleCNS skeleton '+key+' unavailable');const sk=parseSWC(await r.text(),{id:key,name:name||key});mcnsSkeletonCache.set(key,sk);return sk}
async function loadMCNS(){const status=syn$('#mcnsStatus');try{const [graph,right,left]=await Promise.all([fetch('mcns_connectome.json').then(r=>{if(!r.ok)throw Error('mcns_connectome.json unavailable');return r.json()}),fetchMCNSSkeleton('12781','DNge104_R'),fetchMCNSSkeleton('556329','DNge104_L')]);mcnsGraph=graph;mcnsSkeletons=[right,left];mcnsLoaded=true;status.textContent=`Real MaleCNS v1.0 • ${graph.edges.length} source-derived weighted connections • CC BY`;if(synCurrent){synResizeCanvas();synMorphLayout=buildSynapseMorphLayout();synRenderNodes()}requestAnimationFrame(drawFlyNeuron)}catch(e){console.error(e);status.textContent='MaleCNS morphology/connectivity could not be loaded.';status.classList.add('mcns-error')}}
function boundsOf(skels){let xs=[],ys=[],zs=[];skels.forEach(s=>s.pts.forEach(p=>{xs.push(p.x);ys.push(p.y);zs.push(p.z)}));return{cx:(Math.min(...xs)+Math.max(...xs))/2,cy:(Math.min(...ys)+Math.max(...ys))/2,cz:(Math.min(...zs)+Math.max(...zs))/2,span:Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),Math.max(...zs)-Math.min(...zs))}}
function projectPoint(p,b,w,h,angle=0,zoom=.82){let x=p.x-b.cx,y=p.y-b.cy,z=p.z-b.cz;const ca=Math.cos(angle),sa=Math.sin(angle),rx=x*ca+z*sa,rz=-x*sa+z*ca;const tilt=.30,ct=Math.cos(tilt),st=Math.sin(tilt),ry=y*ct-rz*st,rz2=y*st+rz*ct;const scale=Math.min(w,h)/b.span*zoom,depth=1+rz2/b.span*.22;return{x:w/2+rx*scale*depth,y:h/2+ry*scale*depth,z:rz2}}
function drawSkeleton(ctx,canvas,skels,angle=0,alpha=.48,zoom=.82){if(!skels.length)return;const r=canvas.getBoundingClientRect(),b=boundsOf(skels);ctx.clearRect(0,0,r.width,r.height);ctx.lineCap='round';for(const sk of skels){for(const p of sk.pts){if(p.parent<0)continue;const q=sk.byId.get(p.parent);if(!q)continue;const a=projectPoint(q,b,r.width,r.height,angle,zoom),c=projectPoint(p,b,r.width,r.height,angle,zoom),depth=(a.z+c.z)/(2*b.span);ctx.strokeStyle=`rgba(116,76,128,${Math.max(.10,alpha+depth*.34)})`;ctx.lineWidth=Math.max(.55,1.05+depth*.8);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke()}}}
function synResizeCanvas(){const r=synCanvas.getBoundingClientRect(),d=window.devicePixelRatio||1;synCanvas.width=r.width*d;synCanvas.height=r.height*d;synCtx.setTransform(d,0,0,d,0,0)}
function synCurvePoints(a,b,seed){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const sign=(seed%2)?1:-1, bend=sign*Math.min(62,len*.18)*(.62+((seed*19)%31)/70);
  return {c1:{x:a.x+dx*.27+nx*bend,y:a.y+dy*.27+ny*bend},c2:{x:a.x+dx*.69-nx*bend*.48,y:a.y+dy*.69-ny*bend*.48},nx,ny,len,bend};
}
function synOrganicBranch(ctx,a,b,seed,depth=0,width=3.4,alpha=.58){
  if(depth>2)return;
  const g=synCurvePoints(a,b,seed);
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=`rgba(126,78,139,${alpha})`;ctx.lineWidth=width;ctx.shadowColor='rgba(170,131,175,.30)';ctx.shadowBlur=width>2?9:4;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(g.c1.x,g.c1.y,g.c2.x,g.c2.y,b.x,b.y);ctx.stroke();ctx.restore();
  // Bounded dendritic twigs: organic detail without recursive runaway.
  if(depth<2){const twigCount=depth===0?4:2;for(let i=0;i<twigCount;i++){const t=.18+i*(.62/Math.max(1,twigCount-1));const mt=1-t;const px=mt*mt*mt*a.x+3*mt*mt*t*g.c1.x+3*mt*t*t*g.c2.x+t*t*t*b.x,py=mt*mt*mt*a.y+3*mt*mt*t*g.c1.y+3*mt*t*t*g.c2.y+t*t*t*b.y;const side=((seed+i*7)%2?1:-1),baseAng=Math.atan2(b.y-a.y,b.x-a.x),ang=baseAng+side*(.68+.16*((seed+i)%4));const sl=Math.min(62,g.len*(depth===0?.13:.08))*(.72+i*.10);const e={x:px+Math.cos(ang)*sl,y:py+Math.sin(ang)*sl};synOrganicBranch(ctx,{x:px,y:py},e,seed+i*23+5,depth+1,Math.max(.7,width*.43),alpha*.52)}}
}
function synBackgroundArbor(ctx,w,h,center,anchors){
  // A quiet surrounding neural field. It is generated from the same anchor geometry so
  // the visible tissue appears to grow into/out of the polish nodes rather than sit behind them.
  const all=[center,...anchors];
  all.forEach((origin,j)=>{const base=Math.atan2(origin.y-center.y,origin.x-center.x)+(j===0?0:.12);const count=j===0?5:3;for(let i=0;i<count;i++){const ang=base+(i-(count-1)/2)*(.48+j*.035)+((j*17+i*11)%7-3)*.025;const len=(j===0?Math.min(w,h)*.30:Math.min(w,h)*.18)*(0.72+((j*29+i*13)%31)/70);const end={x:origin.x+Math.cos(ang)*len,y:origin.y+Math.sin(ang)*len};synOrganicBranch(ctx,origin,end,101+j*47+i*19,1,j===0?1.35:1.0,j===0?.20:.14)}});
  // A few faint crossing processes suggest a larger network beyond the viewport.
  for(let i=0;i<5;i++){const y=h*(.12+i*.19),a={x:-35,y:y+((i*31)%45)-22},b={x:w+35,y:y+((i*53)%85)-42};synOrganicBranch(ctx,a,b,401+i*37,1,.85,.09)}
}
function synDraw(){
  const r=synCanvas.getBoundingClientRect();synCtx.clearRect(0,0,r.width,r.height);if(!synCurrent)return;
  // Real MaleCNS morphology remains as the quiet anatomical bed.
  if(mcnsLoaded){const sk=mcnsSkeletons[0],b=synMorphLayout?.view||boundsOf([sk]);synCtx.save();synCtx.lineCap='round';for(const p of sk.pts){if(p.parent<0)continue;const q=sk.byId.get(p.parent);if(!q)continue;const a=projectPoint(q,b,r.width,r.height,mcnsAngle*.18,1.28),c=projectPoint(p,b,r.width,r.height,mcnsAngle*.18,1.28),depth=(a.z+c.z)/(2*b.span);synCtx.strokeStyle=`rgba(116,76,128,${Math.max(.035,.105+depth*.09)})`;synCtx.lineWidth=Math.max(.45,.72+depth*.35);synCtx.beginPath();synCtx.moveTo(a.x,a.y);synCtx.lineTo(c.x,c.y);synCtx.stroke()}synCtx.restore()}
  // The foreground navigation arbor is tied exactly to every polish-node position.
  if(synNavPoints.length>1){const center=synNavPoints[0],anchors=synNavPoints.slice(1);synBackgroundArbor(synCtx,r.width,r.height,center,anchors);anchors.forEach((p,i)=>synOrganicBranch(synCtx,center,p,37+i*53,0,3.6,.62));
    // Secondary bridges between neighboring branches make the field read as neural tissue, not spokes.
    for(let i=0;i<anchors.length-1;i++){const a=anchors[i],b=anchors[i+1];if(Math.hypot(a.x-b.x,a.y-b.y)<Math.min(r.width,r.height)*.72)synOrganicBranch(synCtx,a,b,701+i*41,1,1.0,.13)}
    synCtx.save();synCtx.fillStyle='rgba(170,131,175,.18)';synCtx.shadowColor='rgba(170,131,175,.38)';synCtx.shadowBlur=22;synCtx.beginPath();synCtx.arc(center.x,center.y,32,0,Math.PI*2);synCtx.fill();synCtx.restore();}
}
function resizeFlyCanvas(){const c=syn$('#flyNeuronCanvas');if(!c)return;const r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;c.width=r.width*d;c.height=r.height*d;const ctx=c.getContext('2d');ctx.setTransform(d,0,0,d,0,0)}
function drawFlyNeuron(){const c=syn$('#flyNeuronCanvas');if(!c)return;if(c.width===0)resizeFlyCanvas();if(mcnsLoaded){drawSkeleton(c.getContext('2d'),c,mcnsSkeletons,mcnsAngle,.34,.92);mcnsAngle+=.0018}requestAnimationFrame(drawFlyNeuron)}
function synRenderWheel(){const wheel=syn$('#vibeWheel');SYN_VIBES.forEach((v,i)=>{const a=-Math.PI/2+i*Math.PI*2/10,el=document.createElement('span');el.className='vibe-chip';el.textContent=v;el.style.left=(50+40*Math.cos(a))+'%';el.style.top=(50+40*Math.sin(a))+'%';wheel.appendChild(el)})}
function synSetMode(mode){document.querySelectorAll('.synapse-mode-button').forEach(b=>b.classList.toggle('is-active',b.dataset.mode===mode));document.querySelectorAll('.synapse-view').forEach(v=>{const on=v.dataset.view===mode;v.hidden=!on;v.classList.toggle('is-active',on)});if(mode==='explore'&&synCurrent){setTimeout(()=>{synResizeCanvas();synDraw()},0)}if(mode==='fly')setTimeout(resizeFlyCanvas,0)}
function synHash(str=''){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function weightedEdgeChoice(edges,seed,chaos){if(!edges.length)return null;const ordered=[...edges].sort((a,b)=>b.weight-a.weight);if(chaos<=.05)return ordered[0];const power=2.2-(chaos*1.7),weights=ordered.map(e=>Math.pow(Math.max(1,e.weight),power));let total=weights.reduce((a,b)=>a+b,0);let r=((synHash(seed)%1000000)/1000000)*total;for(let i=0;i<ordered.length;i++){r-=weights[i];if(r<=0)return ordered[i]}return ordered.at(-1)}
function nodeLabel(id){if(!mcnsGraph)return String(id);const e=mcnsGraph.edges.find(x=>x.source===id||x.target===id);if(!e)return String(id);return e.source===id?(e.source_name||String(id)):(e.target_name||String(id))}
async function showActiveMCNSPath(path){mcnsActivePath=path;const unique=[...new Set(path.map(x=>x.id))];try{const loaded=await Promise.all(unique.map(id=>fetchMCNSSkeleton(id,nodeLabel(id))));const base=mcnsSkeletonCache.get('556329');mcnsSkeletons=[...loaded,...(base&&!unique.includes(556329)?[base]:[])];syn$('#flyNeuronCanvas').classList.remove('is-signaling');void syn$('#flyNeuronCanvas').offsetWidth;syn$('#flyNeuronCanvas').classList.add('is-signaling')}catch(e){console.warn('Could not load every active MaleCNS skeleton',e)}}
function renderConnectomePath(inputEdge,outputEdge){const el=syn$('#connectomePath');el.hidden=false;el.innerHTML=`<p class="focus-kicker">REAL CONNECTOME PATH</p><div class="path-chain"><span>${synEscape(inputEdge.source_name||inputEdge.source)}</span><b>→ <em>${inputEdge.weight}</em> →</b><span>DNge104_R</span><b>→ <em>${outputEdge.weight}</em> →</b><span>${synEscape(outputEdge.target_name||outputEdge.target)}</span></div><small>Numbers are MaleCNS synaptic connection weights. Polish attributes choose the stimulus pool; the source-derived fly wiring helps choose the endpoint.</small>`}
async function synConsult(){if(!mcnsGraph){syn$('#mcnsStatus').textContent='Waiting for MaleCNS connectivity…';return}const v=syn$('#flyVibe').value,c=syn$('#flyColor').value,chaos=+syn$('#chaosRange').value/100;let pool=synPolishes.filter(p=>(!v||synVibeDistance(v,p.Vibe)<=Math.max(0,Math.ceil(chaos*4)))&&(!c||synColorFamily(c)===synColorFamily(p.Color)));if(!pool.length)pool=synPolishes;const incoming=mcnsGraph.edges.filter(e=>e.target===mcnsGraph.center&&e.source!==mcnsGraph.center);const outgoing=mcnsGraph.edges.filter(e=>e.source===mcnsGraph.center&&e.target!==mcnsGraph.center);const seed=[v,c,Math.round(chaos*100),pool.length].join('|');const inputEdge=weightedEdgeChoice(incoming,seed+'|in',chaos);const outputEdge=weightedEdgeChoice(outgoing,seed+'|out|'+inputEdge.source,chaos);if(!inputEdge||!outputEdge)return;const semanticRank=[...pool].sort((a,b)=>{const sa=(v?6-synVibeDistance(v,a.Vibe):0)+(c&&synColorFamily(c)===synColorFamily(a.Color)?4:0),sb=(v?6-synVibeDistance(v,b.Vibe):0)+(c&&synColorFamily(c)===synColorFamily(b.Color)?4:0);return sb-sa||String(a.Filename||a.Nailpolish).localeCompare(String(b.Filename||b.Nailpolish))});const endpointSeed=synHash(`${outputEdge.target}|${outputEdge.weight}|${seed}`);const windowSize=Math.max(1,Math.min(semanticRank.length,Math.round(1+chaos*Math.min(30,semanticRank.length-1))));synLastResult=semanticRank[endpointSeed%windowSize];renderConnectomePath(inputEdge,outputEdge);await showActiveMCNSPath([{id:inputEdge.source,weight:inputEdge.weight},{id:mcnsGraph.center},{id:outputEdge.target,weight:outputEdge.weight}]);syn$('#flyResult').hidden=false;synSetImage(syn$('#flyImage'),synLastResult,`${synLastResult.Brand} ${synLastResult.Nailpolish}`);syn$('#flyName').textContent=`${synLastResult.Brand} — ${synLastResult.Nailpolish}`;syn$('#flyMeta').textContent=[synLastResult.Color,synLastResult.Vibe,synLastResult.Type].filter(Boolean).join(' • ')}
document.querySelectorAll('.synapse-mode-button').forEach(b=>b.onclick=()=>synSetMode(b.dataset.mode));syn$('#polishSelect').onchange=e=>{if(e.target.value!=='')synSelect(+e.target.value)};syn$('#randomStart').onclick=()=>synSelect(Math.floor(Math.random()*synPolishes.length));syn$('#chaosRange').oninput=e=>syn$('#chaosValue').textContent=e.target.value+'%';syn$('#consultBtn').onclick=synConsult;syn$('#followResult').onclick=()=>{if(!synLastResult)return;synSetMode('explore');synSelect(synPolishes.indexOf(synLastResult));syn$('#polishSelect').value=synPolishes.indexOf(synLastResult)};window.addEventListener('resize',()=>{if(synCurrent){synResizeCanvas();synMorphLayout=buildSynapseMorphLayout();synRenderNodes();synRenderNeuralField()}resizeFlyCanvas()});
(async()=>{try{synPolishes=typeof fetchPolishData==='function'?await fetchPolishData():await fetch('data.json').then(r=>r.json());synPolishes=synPolishes.filter(p=>p&&(p.Brand||p.brand)&&(p.Nailpolish||p.name));synPopulate();loadMCNS()}catch(err){console.error(err);syn$('#stageHint').textContent='There was a problem loading data.json.';syn$('#randomStart').hidden=true}})();
