(() => {
  'use strict';
  const taxa = window.EVO_TAXA || [];
  const byId = new Map(taxa.map(x => [x.id, x]));
  const kids = new Map(taxa.map(x => [x.id, []]));
  taxa.forEach(x => x.parent && kids.get(x.parent)?.push(x.id));
  const $ = id => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  const S = {
    root:'luca', scale:'log', detail:'full', extinct:true, events:true, selected:null,
    visible:[], parent:new Map(), pos:new Map(), width:1900, height:900, tx:0, ty:0, zoom:1, drag:null
  };
  const sourceNames = {col:'Catalogue of Life',gbif:'GBIF',opentree:'Open Tree of Life',timetree:'TimeTree',ncbi:'NCBI Taxonomy',pbdb:'Paleobiology Database',eol:'Encyclopedia of Life'};
  const focusNames = {luca:'全部生命',bacteria:'细菌域',archaea:'古菌域',eukaryota:'真核生物',archaeplastida:'植物谱系',fungi:'真菌',metazoa:'动物',vertebrata:'脊椎动物',mammalia:'哺乳动物',primates:'灵长类',hominina:'人类谱系'};
  const overviewRanks = new Set(['域','界','门','总群','总支','纲','目','科','属','种','共同祖先']);
  const important = new Set(['arabidopsis','saccharomyces','danaus','danio','tiktaalik','tyrannosaurus','archaeopteryx','gallus','canis','felis','balaenoptera','mus','hylobates','pongo','gorilla','pan','australopithecus','neanderthal','sapiens']);
  const descendants = root => { const out=[], stack=[root]; while(stack.length){const id=stack.pop(), n=byId.get(id); if(!n)continue; out.push(n); [...(kids.get(id)||[])].reverse().forEach(k=>stack.push(k));} return out; };
  const isDesc = (id,root) => { let n=byId.get(id); while(n){if(n.id===root)return true;n=n.parent?byId.get(n.parent):null;} return false; };
  const path = id => { const a=[]; let n=byId.get(id); while(n){a.push(n); n=n.parent?byId.get(n.parent):null;} return a; };
  const age = n => n.status==='extinct' && Number.isFinite(n.lastMa) ? n.lastMa : (n.ageMa||0);
  const fmtAge = v => v===0?'现生':v>=1000?`约 ${(v/1000).toFixed(v>=10000?0:1)} 十亿年前`:v<1?`约 ${Math.round(v*1000)} 千年前`:`约 ${Number.isInteger(v)?v:v.toFixed(1)} 百万年前`;
  const fmtNodeAge = n => n.status==='extinct'&&Number.isFinite(n.firstMa)?`${n.firstMa}${n.firstMa===n.lastMa?'':`–${n.lastMa}`} Ma`:fmtAge(n.ageMa);
  const esc = s => String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const make = (tag,attrs={}) => { const e=document.createElementNS(svgNS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); return e; };
  function build(){
    const candidates=descendants(S.root).filter(n=>S.extinct||n.status!=='extinct');
    const include=new Set();
    candidates.forEach(n=>{if(S.detail==='full'||overviewRanks.has(n.rank)||important.has(n.id)||n.id===S.root)include.add(n.id)});
    S.visible=[]; S.parent=new Map();
    candidates.forEach(n=>{if(!include.has(n.id))return; let p=n.parent; while(p&&!include.has(p))p=byId.get(p)?.parent; S.parent.set(n.id,n.id===S.root?null:p||null); S.visible.push(n)});
  }
  function xFor(v,max){const left=70,right=190,u=S.width-left-right;let t=S.scale==='linear'?1-v/Math.max(max,1):1-Math.log10(v+1)/Math.log10(max+1);return left+Math.max(0,Math.min(1,t))*u;}
  function layout(){
    const vk=new Map(S.visible.map(n=>[n.id,[]])); S.visible.forEach(n=>{const p=S.parent.get(n.id); if(p)vk.get(p)?.push(n.id)});
    let leaf=0; const y=new Map(), gap=S.detail==='full'?32:43, top=48;
    const setY=id=>{const c=vk.get(id)||[]; if(!c.length){const v=top+leaf++*gap;y.set(id,v);return v;}const vals=c.map(setY),v=vals.reduce((a,b)=>a+b,0)/vals.length;y.set(id,v);return v;}; setY(S.root);
    S.height=Math.max(760,top*2+Math.max(1,leaf-1)*gap); S.width=S.scale==='linear'?1800:1900;
    const max=Math.max(...S.visible.map(age),age(byId.get(S.root))); S.pos=new Map(S.visible.map(n=>[n.id,{x:xFor(age(n),max),y:y.get(n.id)||top}])); return max;
  }
  function apply(){ $('viewport').setAttribute('transform',`translate(${S.tx} ${S.ty}) scale(${S.zoom})`); }
  function fit(){const r=$('graphStage').getBoundingClientRect(),k=Math.max(.12,Math.min(1.15,Math.min((r.width-55)/S.width,(r.height-55)/S.height)));S.zoom=k;S.tx=(r.width-S.width*k)/2;S.ty=(r.height-S.height*k)/2;apply();}
  function render(fitNow=false){
    build(); const max=layout(); const edge=$('edgeLayer'),nodes=$('nodeLayer'),events=$('eventLayer'); edge.replaceChildren();nodes.replaceChildren();events.replaceChildren();
    if(S.events)[[444,'奥陶纪末'],[372,'晚泥盆纪'],[252,'二叠纪末'],[201,'三叠纪末'],[66,'白垩纪末']].filter(x=>x[0]<=max).forEach(([v,name])=>{const x=xFor(v,max);events.append(make('rect',{x:x-4,y:0,width:8,height:S.height,class:'event-band',fill:'var(--danger)'}),make('line',{x1:x,x2:x,y1:0,y2:S.height,class:'event-line'}));const t=make('text',{x:x+6,y:18,class:'event-label'});t.textContent=`${name} · ${v} Ma`;events.append(t);});
    S.visible.forEach(n=>{const p=S.parent.get(n.id);if(!p)return;const a=S.pos.get(p),b=S.pos.get(n.id),m=a.x+Math.max(13,(b.x-a.x)*.44),d=`M ${a.x} ${a.y} H ${m} V ${b.y} H ${b.x}`;edge.append(make('path',{d,class:`edge ${n.confidence==='low'?'low':''} ${S.selected&&path(S.selected).some(x=>x.id===n.id)?'highlight':''}`}));});
    S.visible.forEach(n=>{const p=S.pos.get(n.id),g=make('g',{class:`node ${n.status} ${S.selected===n.id?'selected':''}`,transform:`translate(${p.x} ${p.y})`,tabindex:'0','data-id':n.id});g.append(make('circle',{r:n.id===S.root?7:n.rank==='种'?4.8:5.4}));const t=make('text',{x:10,y:3.3});t.textContent=(n.rank==='种'&&n.emoji?`${n.emoji} `:'')+n.zh;g.append(t);g.addEventListener('click',e=>{e.stopPropagation();select(n.id)});g.addEventListener('mouseenter',e=>tip(e,n));g.addEventListener('mousemove',moveTip);g.addEventListener('mouseleave',()=>{$('tooltip').hidden=true});nodes.append(g);});
    $('graphTitle').textContent=focusNames[S.root]||byId.get(S.root)?.zh||'生命之树';$('graphSubtitle').textContent=`${S.visible.length} 个可见节点 · ${fmtAge(max).replace('约 ','')}`;timeline(max);if(fitNow)requestAnimationFrame(fit);else apply();
  }
  function timeline(max){const box=$('timelineScale');box.replaceChildren();[0,1,10,66,252,541,1000,2000,3000,4000,max].filter((v,i,a)=>v<=max&&a.indexOf(v)===i).sort((a,b)=>b-a).forEach(v=>{const s=document.createElement('span');s.className='timeline-tick';s.style.left=`${xFor(v,max)/S.width*100}%`;s.textContent=v?fmtAge(v).replace('约 ',''):'现在';box.append(s)});}
  function select(id,center=true){if(!isDesc(id,S.root)){S.root='luca';$('cladeSelect').value='luca'}S.selected=id;render();detail(byId.get(id));if(center){const p=S.pos.get(id),r=$('graphStage').getBoundingClientRect();if(p){S.zoom=Math.max(S.zoom,1);S.tx=r.width/2-p.x*S.zoom;S.ty=r.height/2-p.y*S.zoom;apply();}}}
  function detail(n){$('emptyDetail').hidden=true;$('taxonDetail').hidden=false;$('detailEmoji').textContent=n.emoji||'◆';$('detailRank').textContent=`${n.rank} · ${n.status==='extinct'?'灭绝类群':n.status==='ancestral'?'祖先/干群节点':'现生类群'}`;$('detailName').textContent=n.zh;$('detailLatin').textContent=n.latin;$('detailSummary').textContent=n.summary;$('detailAge').textContent=fmtNodeAge(n);$('detailStatus').textContent=n.status==='extinct'?'已灭绝':n.status==='ancestral'?'概念节点':'现生';$('confidenceBadge').textContent={high:'较高置信度',medium:'中等置信度',low:'不确定性较高'}[n.confidence]||'待评估';
    $('traitList').replaceChildren(...(n.traits||[]).map(x=>Object.assign(document.createElement('span'),{textContent:x})));
    const line=$('lineage');line.replaceChildren();path(n.id).reverse().forEach((x,i,a)=>{const b=document.createElement('button');b.textContent=x.zh;b.onclick=()=>select(x.id);line.append(b);if(i<a.length-1){const q=document.createElement('i');q.textContent='›';line.append(q)}});
    $('detailSources').replaceChildren(...(n.sources||[]).map(x=>Object.assign(document.createElement('span'),{textContent:sourceNames[x]||x})));
    $('addToCompare').hidden=n.rank!=='种';$('addToCompare').onclick=()=>{$('speciesA').value=n.id;switchView('compare');compare()};
  }
  function tip(e,n){const t=$('tooltip');t.hidden=false;t.innerHTML=`<b>${esc(n.zh)}</b><em>${esc(n.latin)}</em><small>${esc(n.rank)} · ${esc(fmtNodeAge(n))}</small>`;moveTip(e)}
  function moveTip(e){const t=$('tooltip');t.style.left=`${e.clientX+13}px`;t.style.top=`${e.clientY+13}px`;}
  function search(q){const box=$('searchResults'),s=q.trim().toLowerCase();if(!s){box.hidden=true;return;}const hits=taxa.filter(n=>`${n.zh} ${n.latin} ${n.rank}`.toLowerCase().includes(s)).slice(0,9);box.replaceChildren(...hits.map(n=>{const b=document.createElement('button');b.className='search-result';b.innerHTML=`<i>${n.emoji||'◆'}</i><span>${esc(n.zh)}<small>${esc(n.latin)} · ${esc(n.rank)}</small></span>`;b.onclick=()=>{box.hidden=true;$('taxonSearch').value=n.zh;select(n.id)};return b}));box.hidden=!hits.length;}
  function lca(a,b){const ids=new Set(path(a).map(x=>x.id));return path(b).find(x=>ids.has(x.id))||byId.get('luca');}
  function compare(){const a=byId.get($('speciesA').value),b=byId.get($('speciesB').value);if(!a||!b)return;const c=lca(a.id,b.id),branch=id=>path(id).reverse().slice(path(c.id).length);const col=(x,arr)=>`<div class="path-column"><div class="species-card"><span>${x.emoji||'◆'}</span><div><h4>${esc(x.zh)}</h4><em>${esc(x.latin)}</em></div></div><div class="path-list">${(arr.length?arr:[x]).map(y=>`<div class="path-item"><b>${esc(y.zh)}</b><small>${esc(y.rank)} · ${esc(fmtNodeAge(y))}</small></div>`).join('')}</div></div>`;$('compareResult').innerHTML=`<div class="lca-banner"><small>最近共同祖先节点</small><h3>${esc(c.zh)}</h3><em>${esc(c.latin)}</em><div class="compare-meta"><span>${esc(c.rank)}</span><span>${esc(fmtNodeAge(c))}</span><span>${a.id===b.id?'相同物种':'两条近缘或远缘分支'}</span></div></div><div class="path-columns">${col(a,branch(a.id))}${col(b,branch(b.id))}</div>`;}
  function switchView(v){document.querySelectorAll('.view-panel').forEach(x=>x.classList.toggle('active',x.dataset.panel===v));document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===v));if(v==='tree')requestAnimationFrame(fit);if(v==='compare')compare();document.querySelector(`[data-panel="${v}"]`)?.scrollIntoView({behavior:'smooth',block:'start'});}
  function sources(){const list=[['Catalogue of Life','分类名称与版本','全球物种接受名、异名和分类清单。'],['GBIF','分类与分布','名称匹配、分类主干与物种出现记录。'],['Open Tree of Life','系统发育拓扑','综合已发表系统发育树并保留未解析关系。'],['TimeTree','分化时间','分子钟研究的时间估计与范围。'],['NCBI Taxonomy','基因组关联','连接分类节点、基因组与序列数据库。'],['Paleobiology Database','化石记录','化石出现、地层年代和地理位置。'],['Encyclopedia of Life','性状与生态','形态、生态关系和描述信息。'],['Wikimedia Commons','开放媒体','图片、作者与许可证元数据。']];$('sourceGrid').replaceChildren(...list.map(([n,t,d],i)=>{const a=document.createElement('article');a.className='source-card';a.innerHTML=`<header><i>${n[0]}</i><h3>${n}</h3></header><p>${d}</p><footer><span>${t}</span><span>数据层 ${i+1}</span></footer>`;return a}));}
  function bind(){
    document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>switchView(b.dataset.view));document.querySelector('.source-link').onclick=e=>{e.preventDefault();switchView('sources')};
    $('cladeSelect').onchange=e=>{S.root=e.target.value;S.selected=null;render(true)};$('scaleSelect').onchange=e=>{S.scale=e.target.value;render(true)};$('detailSelect').onchange=e=>{S.detail=e.target.value;render(true)};$('extinctToggle').onchange=e=>{S.extinct=e.target.checked;render(true)};$('eventToggle').onchange=e=>{S.events=e.target.checked;render()};
    $('resetTree').onclick=()=>{Object.assign(S,{root:'luca',scale:'log',detail:'full',extinct:true,events:true,selected:null});$('cladeSelect').value='luca';$('scaleSelect').value='log';$('detailSelect').value='full';$('extinctToggle').checked=true;$('eventToggle').checked=true;$('emptyDetail').hidden=false;$('taxonDetail').hidden=true;render(true)};
    $('taxonSearch').oninput=e=>search(e.target.value);document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement?.tagName!=='INPUT'){e.preventDefault();$('taxonSearch').focus()}});document.addEventListener('click',e=>{if(!e.target.closest('.search-box,.search-results'))$('searchResults').hidden=true});
    $('zoomIn').onclick=()=>zoom(1.25);$('zoomOut').onclick=()=>zoom(.8);$('fitTree').onclick=fit;$('graphStage').addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.12:.89,e.clientX,e.clientY)},{passive:false});
    $('graphStage').onpointerdown=e=>{if(e.target.closest('.node'))return;S.drag={x:e.clientX,y:e.clientY,tx:S.tx,ty:S.ty};$('graphStage').classList.add('dragging');$('graphStage').setPointerCapture(e.pointerId)};$('graphStage').onpointermove=e=>{if(!S.drag)return;S.tx=S.drag.tx+e.clientX-S.drag.x;S.ty=S.drag.ty+e.clientY-S.drag.y;apply()};const stop=()=>{S.drag=null;$('graphStage').classList.remove('dragging')};$('graphStage').onpointerup=stop;$('graphStage').onpointercancel=stop;
    $('exploreHuman').onclick=()=>{switchView('tree');S.root='hominina';$('cladeSelect').value='hominina';render(true);setTimeout(()=>select('sapiens'),250)};$('randomSpecies').onclick=()=>{const s=taxa.filter(x=>x.rank==='种');switchView('tree');select(s[Math.floor(Math.random()*s.length)].id)};
    $('runCompare').onclick=compare;$('speciesA').onchange=compare;$('speciesB').onchange=compare;$('swapSpecies').onclick=()=>{const a=$('speciesA').value;$('speciesA').value=$('speciesB').value;$('speciesB').value=a;compare()};$('themeToggle').onclick=()=>{document.body.classList.toggle('light');localStorage.setItem('evoatlas-theme',document.body.classList.contains('light')?'light':'dark')};window.addEventListener('resize',()=>document.querySelector('[data-panel="tree"]').classList.contains('active')&&fit());
  }
  function zoom(f,cx,cy){const r=$('graphStage').getBoundingClientRect(),px=(cx??r.left+r.width/2)-r.left,py=(cy??r.top+r.height/2)-r.top,old=S.zoom,nw=Math.max(.12,Math.min(4,old*f)),gx=(px-S.tx)/old,gy=(py-S.ty)/old;S.zoom=nw;S.tx=px-gx*nw;S.ty=py-gy*nw;apply();}
  function init(){if(!taxa.length)return; if(localStorage.getItem('evoatlas-theme')==='light')document.body.classList.add('light');$('statNodes').textContent=taxa.length.toLocaleString('zh-CN');$('statSpecies').textContent=taxa.filter(x=>x.rank==='种').length;$('statFossils').textContent=taxa.filter(x=>x.status==='extinct').length;const species=taxa.filter(x=>x.rank==='种').sort((a,b)=>a.zh.localeCompare(b.zh,'zh-CN'));for(const id of ['speciesA','speciesB'])$(id).replaceChildren(...species.map(x=>Object.assign(document.createElement('option'),{value:x.id,textContent:`${x.emoji||''} ${x.zh} — ${x.latin}`})));$('speciesA').value='sapiens';$('speciesB').value='pan';sources();bind();render(true);compare();}
  init();
})();
