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
function focusStar(index){if(index<0||!stars[index])return;focus=index;const s=stars[index];target={x:s.x,y:s.y,scale:5};const p=polish[index];let related=stars.filter(b=>b.i!==index).sort((a,b)=>similarity(b.p,p)-similarity(a.p,p)).slice(0,5);const panel=$('astraFocus');panel.replaceChildren();let title=document.createElement('h2');title.className='astra-polish-name';title.textContent=p.Nailpolish;panel.append(title);let meta=document.createElement('div');meta.className='astra-meta';meta.textContent=[p.Brand,p.Color,p.Type,p.Vibe].filter(Boolean).join(' · ');panel.append(meta);const src=p['image one']||p.imageOne||p.thumb;if(src){const img=document.createElement('img');img.className='astra-polish-image';img.src=src;img.alt=p.Brand+' '+p.Nailpolish;img.loading='lazy';img.onerror=()=>img.remove();
 img.tabIndex=0;img.role='button';img.title='Open full polish details';
 img.setAttribute('aria-label','Open full details for '+p.Brand+' '+p.Nailpolish);
 img.addEventListener('click',()=>openPolishDetails(p));
 img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPolishDetails(p)}});
 const frame=document.createElement('div');frame.className='astra-preview-frame';frame.append(img);panel.append(frame)}let label=document.createElement('p');label.className='astra-kicker';label.textContent='NEIGHBORING STARS';panel.append(label);let rel=document.createElement('div');rel.className='astra-rel';for(const r of related){const btn=document.createElement('button');btn.textContent=r.p.Nailpolish;btn.title=r.p.Brand;btn.addEventListener('click',()=>focusStar(r.i));rel.append(btn)}panel.append(rel)}

// Directory modal markup and presentation imported from the supplied index.html.
// It is instantiated inside Astra; the Directory page and shared scripts remain untouched.
const directoryModalMarkup = `<div class="surprise-modal" hidden="" id="surpriseModal">
<div class="surprise-modal-overlay"></div>
<div aria-labelledby="surpriseModalTitle" aria-modal="true" class="surprise-modal-content" role="dialog">
<div aria-hidden="true" class="modal-card-sparkles">
<span class="sparkle six-point s1 white tiny top-glow"></span>
<span class="sparkle eight-point s2 white tiny top-glow"></span>
<span class="sparkle six-point s3 violet tiny top-glow"></span>
<span class="sparkle eight-point s4 white small top-glow"></span>
<span class="sparkle six-point s5 white tiny top-glow"></span>
<span class="sparkle eight-point s6 violet tiny top-glow"></span>
<span class="sparkle six-point s7 peach tiny top-glow"></span>
<span class="sparkle eight-point s8 white tiny top-glow"></span>
<span class="sparkle six-point s9 white small top-glow"></span>
<span class="sparkle eight-point s10 violet tiny top-glow"></span>
<span class="sparkle six-point s11 gold tiny top-glow"></span>
<span class="sparkle eight-point s12 white tiny top-glow"></span>
<span class="sparkle six-point s13 white tiny"></span>
<span class="sparkle eight-point s14 violet small"></span>
<span class="sparkle six-point s15 coral tiny"></span>
<span class="sparkle eight-point s16 violet tiny"></span>
<span class="sparkle six-point s17 white small"></span>
<span class="sparkle eight-point s18 peach tiny"></span>
<span class="sparkle six-point s19 violet tiny"></span>
<span class="sparkle eight-point s20 white tiny"></span>
<span class="sparkle six-point s21 white tiny"></span>
<span class="sparkle eight-point s22 white small"></span>
<span class="sparkle six-point s23 violet tiny"></span>
<span class="sparkle eight-point s24 white tiny"></span>
<span class="sparkle six-point s25 gold tiny"></span>
<span class="sparkle eight-point s26 white tiny"></span>
<span class="sparkle six-point s27 violet small"></span>
<span class="sparkle eight-point s28 coral tiny"></span>
<span class="sparkle six-point s29 white tiny"></span>
<span class="sparkle eight-point s30 violet tiny"></span>
<span class="sparkle six-point s31 peach small"></span>
<span class="sparkle eight-point s32 white tiny"></span>
<span class="sparkle six-point s33 violet tiny"></span>
<span class="sparkle eight-point s34 gold tiny"></span>
<span class="sparkle six-point s35 white small"></span>
<span class="sparkle eight-point s36 white tiny"></span>
<span class="sparkle six-point s37 coral tiny"></span>
<span class="sparkle eight-point s38 white small"></span>
<span class="sparkle six-point s39 violet tiny"></span>
<span class="sparkle eight-point s40 peach tiny"></span>
<span class="sparkle six-point s41 white small"></span>
<span class="sparkle eight-point s42 gold tiny"></span>
<span class="sparkle six-point s43 violet tiny"></span>
<span class="sparkle eight-point s44 white tiny"></span>
<span class="sparkle six-point s45 coral small"></span>
<span class="sparkle eight-point s46 white tiny"></span>
</div>
<button aria-label="Close" class="surprise-close-button" id="surpriseCloseButton" type="button">
          ×
        </button>
<div class="surprise-modal-body">
<div class="surprise-image-wrap polish-image-panel">
<div class="polish-main-image-shell">
<div class="image-card">
<button aria-label="Open swatch image" class="polish-main-image-button" id="surpriseImageButton" type="button">
<img alt="" class="surprise-result-image polish-gallery-image" decoding="async" id="surpriseResultImage" src=""/>
</button>
</div>
<div class="surprise-image-fallback" hidden="" id="surpriseImageFallback">
                No swatch available
              </div>
<div class="polish-gallery-nav" hidden="" id="surpriseGalleryNav">
<button aria-label="Previous swatch" class="polish-gallery-arrow prev" id="surprisePrevImage" type="button">
                  ‹
                </button>
<button aria-label="Next swatch" class="polish-gallery-arrow next" id="surpriseNextImage" type="button">
                  ›
                </button>
</div>
</div>
<div class="polish-image-hint" id="surpriseImageHint">
              Click the swatch to zoom in
            </div>
</div>
<div class="surprise-result-details">
<div class="surprise-result-brand" id="surpriseResultBrand"></div>
<h2 class="surprise-result-name" id="surpriseModalTitle"></h2>
<div class="exclusive-badge-slot" hidden="" id="surpriseExclusiveBadge"></div>
<div class="surprise-detail-row">
<span class="surprise-detail-label">Color</span>
<span id="surpriseResultColor"></span>
</div>
<div class="surprise-detail-row">
<span class="surprise-detail-label">Type</span>
<span id="surpriseResultType"></span>
</div>
<div class="surprise-detail-row" hidden="" id="surpriseSubtypeRow">
<span class="surprise-detail-label">Sub Type</span>
<span id="surpriseResultSubtype"></span>
</div>
<div class="surprise-detail-row">
<span class="surprise-detail-label">Number</span>
<span id="surpriseResultNumber"></span>
</div>
<div class="polish-description-block" hidden="" id="surpriseDescriptionBlock">
<span class="polish-description-label">Description</span>
<p class="polish-description-text" id="surpriseResultDescription"></p>
</div>
<div class="surprise-modal-actions" hidden="" id="surpriseModalActions">
<button class="surprise-secondary-button" id="surpriseAgainButton" type="button">
                Surprise Me Again
              </button>
<a class="dupe-entry-button" hidden="" href="#" id="surpriseDupesButton">
                View Dupes
              </a>
</div>
</div>
</div>
</div>
<div class="polish-entry-nav" hidden="" id="surpriseEntryNav">
<button aria-label="Previous polish" class="polish-entry-arrow prev" id="surprisePrevPolish" type="button">
<span aria-hidden="true">‹</span> Previous Polish
        </button>
<button aria-label="Next polish" class="polish-entry-arrow next" id="surpriseNextPolish" type="button">
          Next Polish <span aria-hidden="true">›</span>
</button>
</div>
</div>
<div class="image-viewer" hidden="" id="imageViewer">
<div class="image-viewer-overlay"></div>
<div aria-label="Expanded swatch image" aria-modal="true" class="image-viewer-content" role="dialog">
<div class="image-viewer-frame">
<img alt="" class="image-viewer-image" decoding="async" id="imageViewerImg" src=""/>
<button aria-label="Close enlarged image" class="image-viewer-close" id="imageViewerClose" type="button">
            ×
          </button>
<button aria-label="Previous swatch" class="image-viewer-arrow prev" hidden="" id="imageViewerPrev" type="button">
            ‹
          </button>
<button aria-label="Next swatch" class="image-viewer-arrow next" hidden="" id="imageViewerNext" type="button">
            ›
          </button>
</div>
</div>
</div>`;
let directoryModal=null,directoryImageViewer=null,directoryImageList=[],directoryImageIndex=0;
let directorySequence=[],directorySequenceIndex=0, directoryBeforeFocus=null, directoryPreviousOverflow='';
const d=id=>document.getElementById(id);
function initializeDirectoryModal(){
 if(directoryModal)return;
 const holder=document.createElement('div');holder.innerHTML=directoryModalMarkup;
 while(holder.firstElementChild)document.body.append(holder.firstElementChild);
 directoryModal=d('surpriseModal');directoryImageViewer=d('imageViewer');
 d('surpriseCloseButton').addEventListener('click',closePolishDetails);
 directoryModal.querySelector('.surprise-modal-overlay').addEventListener('click',closePolishDetails);
 d('surprisePrevImage').addEventListener('click',()=>advanceDetailImage(-1));
 d('surpriseNextImage').addEventListener('click',()=>advanceDetailImage(1));
 d('surpriseImageButton').addEventListener('click',openDirectoryImageViewer);
 d('imageViewerClose').addEventListener('click',closeDirectoryImageViewer);
 directoryImageViewer.querySelector('.image-viewer-overlay').addEventListener('click',closeDirectoryImageViewer);
 d('imageViewerPrev').addEventListener('click',()=>advanceDetailImage(-1));
 d('imageViewerNext').addEventListener('click',()=>advanceDetailImage(1));
 d('surprisePrevPolish').addEventListener('click',()=>navigateDirectoryPolish(-1));
 d('surpriseNextPolish').addEventListener('click',()=>navigateDirectoryPolish(1));
 document.addEventListener('keydown',e=>{
  if(directoryModal.hidden)return;
  if(e.key==='Escape'){if(!directoryImageViewer.hidden)closeDirectoryImageViewer();else closePolishDetails()}
 });
}
function getDirectoryGallery(p){
 const normalized=typeof normalizePolishEntry==='function'?normalizePolishEntry(p):p;
 return typeof getPolishGallery==='function'?getPolishGallery(normalized):[p['image one'],p['image two'],p['image three']].filter(Boolean).map(src=>({src}));
}
function showDirectoryImage(){
 const entry=directoryImageList[directoryImageIndex];const img=d('surpriseResultImage');
 const fallback=d('surpriseImageFallback');const button=d('surpriseImageButton');
 const nav=d('surpriseGalleryNav');
 if(!entry){img.hidden=true;button.hidden=true;fallback.hidden=false;nav.hidden=true;img.removeAttribute('src');return}
 img.src=entry.src;img.alt=entry.alt||d('surpriseModalTitle').textContent;
 img.hidden=false;button.hidden=false;fallback.hidden=true;nav.hidden=directoryImageList.length<2;
 img.onerror=()=>{img.hidden=true;button.hidden=true;fallback.hidden=false;nav.hidden=true};
 if(!directoryImageViewer.hidden){d('imageViewerImg').src=entry.src;d('imageViewerImg').alt=img.alt}
}
function advanceDetailImage(dir){
 if(directoryImageList.length<2)return;
 directoryImageIndex=(directoryImageIndex+dir+directoryImageList.length)%directoryImageList.length;
 showDirectoryImage();
}
function openDirectoryImageViewer(){
 if(!directoryImageList.length)return;
 const entry=directoryImageList[directoryImageIndex];d('imageViewerImg').src=entry.src;
 d('imageViewerImg').alt=entry.alt||d('surpriseModalTitle').textContent;
 d('imageViewerPrev').hidden=d('imageViewerNext').hidden=directoryImageList.length<2;
 directoryImageViewer.hidden=false;d('imageViewerClose').focus();
}
function closeDirectoryImageViewer(){
 directoryImageViewer.hidden=true;d('imageViewerImg').removeAttribute('src');d('surpriseImageButton').focus();
}
function renderDirectoryPolish(p){
 const n=typeof normalizePolishEntry==='function'?normalizePolishEntry(p):p;
 d('surpriseResultBrand').textContent=n.brand||p.Brand||'';
 d('surpriseModalTitle').textContent=n.name||p.Nailpolish||'';
 if(typeof updateExclusiveBadge==='function')updateExclusiveBadge(d('surpriseExclusiveBadge'),n);
 d('surpriseResultColor').textContent=n.color||p.Color||'—';
 d('surpriseResultType').textContent=n.type||p.Type||'—';
 d('surpriseResultNumber').innerHTML=typeof createNumberBadge==='function'?createNumberBadge(n.type,n.number):String(n.number||'—');
 const subtype=typeof getPolishSubtype==='function'?getPolishSubtype(n):n.subtype||'';
 d('surpriseSubtypeRow').hidden=!subtype;d('surpriseResultSubtype').textContent=subtype;
 const desc=typeof getPolishDescription==='function'?getPolishDescription(n):n.description||p.Description||'';
 d('surpriseDescriptionBlock').hidden=!desc;d('surpriseResultDescription').textContent=desc;
 const dupeGroup=String(n.dupeGroup||p['Dupe Group']||'').trim();
 const hasDupes=dupeGroup||String(n.hasDupes||p['Has Dupes']||'').toLowerCase()==='yes';
 const dupeButton=d('surpriseDupesButton');dupeButton.hidden=!(hasDupes&&dupeGroup);
 if(!dupeButton.hidden){const params=new URLSearchParams({brand:n.brand||'',name:n.name||''});dupeButton.href='dupes.html?'+params.toString()}
 d('surpriseAgainButton').hidden=true;
 d('surpriseModalActions').hidden=dupeButton.hidden;
 directoryImageList=getDirectoryGallery(p);directoryImageIndex=0;showDirectoryImage();
 d('surpriseEntryNav').hidden=directorySequence.length<2;
 directoryModal.classList.toggle('is-directory-detail',directorySequence.length>1);
}
function navigateDirectoryPolish(dir){
 if(!directorySequence.length)return;
 directorySequenceIndex=(directorySequenceIndex+dir+directorySequence.length)%directorySequence.length;
 renderDirectoryPolish(directorySequence[directorySequenceIndex]);
}
function openPolishDetails(p){
 initializeDirectoryModal();
 directoryBeforeFocus=document.activeElement;
 directoryPreviousOverflow=document.body.style.overflow;
 // The Directory page uses its current visible rows for next/previous navigation.
 // Astra uses the currently filtered stars in the same way.
 directorySequence=stars.filter(s=>s.visible).map(s=>s.p);
 directorySequenceIndex=directorySequence.indexOf(p);
 if(directorySequenceIndex<0){directorySequence=[p];directorySequenceIndex=0}
 directoryModal.hidden=false;document.body.style.overflow='hidden';
 renderDirectoryPolish(p);d('surpriseCloseButton').focus();
}
function closePolishDetails(){
 if(!directoryModal)return;
 if(!directoryImageViewer.hidden)closeDirectoryImageViewer();
 directoryModal.hidden=true;directoryModal.classList.remove('is-directory-detail');
 document.body.style.overflow=directoryPreviousOverflow;
 if(directoryBeforeFocus?.isConnected)directoryBeforeFocus.focus();
}
function applyFilters(){let q=$('astraSearch').value.trim().toLowerCase(),v=$('astraVibe').value,finish=$('astraFinish').value,exclusive=$('astraExclusives').classList.contains('is-active');let total=0;for(const s of stars){let p=s.p;s.visible=(!q||(p.Brand+' '+p.Nailpolish).toLowerCase().includes(q))&&(!v||p.Vibe===v)&&(!finish||p.Type===finish)&&(!exclusive||!!p.Collab);if(s.visible)total++}$('astraCount').textContent=`${total} / ${polish.length} stars`;if(focus!==null&&!stars[focus].visible){focus=null;target={x:0,y:0,scale:minimumScale};$('astraFocus').innerHTML='<div class="astra-placeholder"><div class="astra-emblem">✧</div><h2>Select a star</h2><p>Choose a point in the constellation.</p></div>'}}
function makeOptions(id,vals){const select=$(id);for(const v of vals){let o=document.createElement('option');o.value=v;o.textContent=v;select.append(o)}}
async function init(){resize();try{const response=await fetch('data.json',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);const all=await response.json();polish=all.filter(p=>p&&p.Nailpolish).map(p=>({...p,family:family(p.Color)}));stars=polish.map(locate);makeOptions('astraVibe',vibeOrder.filter(v=>polish.some(p=>p.Vibe===v)));makeOptions('astraFinish',[...new Set(polish.map(p=>p.Type).filter(Boolean))].sort());let legend=$('astraLegend');for(const g of groups){let b=document.createElement('button');let dot=document.createElement('i');dot.style.background=palette[g];b.append(dot,document.createTextNode(g));b.addEventListener('click',()=>{let relevant=stars.filter(s=>s.p.family===g);if(relevant.length)focusStar(relevant[Math.floor(Math.random()*relevant.length)].i)});legend.append(b)}for(const id of ['astraSearch','astraVibe','astraFinish'])$(id).addEventListener(id==='astraSearch'?'input':'change',applyFilters);
$('astraExclusives').addEventListener('click',()=>{const btn=$('astraExclusives');const active=!btn.classList.contains('is-active');btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',active?'true':'false');applyFilters()});
$('astraClear').onclick=()=>{$('astraSearch').value='';$('astraVibe').value='';$('astraFinish').value='';const btn=$('astraExclusives');btn.classList.remove('is-active');btn.setAttribute('aria-pressed','false');applyFilters();view={x:0,y:0,scale:minimumScale};target=null};$('astraRandom').onclick=()=>{let list=stars.filter(s=>s.visible);if(list.length)focusStar(list[Math.floor(Math.random()*list.length)].i)};applyFilters();cancelAnimationFrame(anim);anim=requestAnimationFrame(render)}catch(e){$('astraCount').textContent='Unable to load data.json';$('astraFocus').textContent='Astra needs to be installed alongside the existing Auric Archive files on a web server. '+e.message}}
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,ox:view.x,oy:view.y,moved:false};canvas.setPointerCapture(e.pointerId);target=null});canvas.addEventListener('pointermove',e=>{let rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;hover=screenStar(x,y);if(drag){let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;view.x=drag.ox-dx/view.scale;view.y=drag.oy-dy/view.scale}});canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){let rect=canvas.getBoundingClientRect(),i=screenStar(e.clientX-rect.left,e.clientY-rect.top);if(i>=0)focusStar(i)}drag=null});canvas.addEventListener('pointerleave',()=>{hover=-1});canvas.addEventListener('wheel',e=>{e.preventDefault();target=null;view.scale=Math.max(minimumScale,Math.min(5,view.scale*(e.deltaY>0?.87:1.13)))},{passive:false});$('astraPlus').onclick=()=>{target=null;view.scale=Math.min(5,view.scale*1.25)};$('astraMinus').onclick=()=>{target=null;view.scale=Math.max(minimumScale,view.scale/1.25)};$('astraReset').onclick=()=>{target={x:0,y:0,scale:minimumScale};focus=null};window.addEventListener('resize',resize);if(window.ResizeObserver){new ResizeObserver(()=>{let r=canvas.getBoundingClientRect();if(Math.abs(r.width-width)>.5||Math.abs(r.height-height)>.5)resize()}).observe(canvas)}init();
})();
