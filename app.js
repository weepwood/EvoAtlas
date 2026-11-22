(() => {
  'use strict';
  const taxa = Array.isArray(window.EVO_TAXA) ? window.EVO_TAXA : [];
  const research = window.EVO_RESEARCH || {sources:[],topics:[]};
  const byId = new Map(taxa.map(n => [n.id,n]));
  const children = new Map(taxa.map(n => [n.id,[]]));
  taxa.forEach(n => { if(n.parent && children.has(n.parent)) children.get(n.parent).push(n.id); });
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const sourceByCode = new Map(research.sources.map(s => [s.code,s]));
  const FOCUS = {luca:'全部生命',bacteria:'细菌',archaea:'古菌',eukaryota:'真核生物',archaeplastida:'植物谱系',fungi:'真菌',metazoa:'动物',vertebrata:'脊椎动物',mammalia:'哺乳动物',primates:'灵长类',hominina:'人类谱系'};
  const events = [
    {ma:443.8,name:'奥陶纪末'},
    {ma:372,name:'晚泥盆纪'},
    {ma:251.9,name:'二叠纪末'},
    {ma:201.4,name:'三叠纪末'},
    {ma:66,name:'白垩纪末'}
  ];
  const featured = new Set(['sapiens','pan','neanderthal','australopithecus','gallus','tyrannosaurus','archaeopteryx','tiktaalik','arabidopsis','saccharomyces','canis','felis','balaenoptera','mus','pongo','gorilla','danaus','danio','ornithorhynchus','drosophila']);
  const state = {view:'tree',root:'luca',scale:'log',detail:'overview',extinct:true,events:true,selected:null,
    visible:[],parents:new Map(),pos:new Map(),width:1500,height:700,maxMa:4000,tx:0,ty:0,zoom:1,drag:null,
    searchHits:[],searchIndex:0,theme:'system'};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const esc = x => String(x ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const make = (tag,attributes={}) => {
    const el = document.createElementNS(NS,tag);
    Object.entries(attributes).forEach(([key,value]) => el.setAttribute(key,String(value)));
    return el;
  };
  function path(id) {
    const result=[],seen=new Set();let n=byId.get(id);
    while(n && !seen.has(n.id)){result.push(n);seen.add(n.id);n=byId.get(n.parent);}
    return result;
  }
  const inside = (id,root) => path(id).some(n => n.id===root);
  function descendants(root){
    const out=[],stack=[root];
    while(stack.length){const id=stack.pop(),n=byId.get(id);if(!n)continue;out.push(n);[...(children.get(id)||[])].reverse().forEach(x=>stack.push(x));}
    return out;
  }
  const timeOf = n => n.status==='extinct' && Number.isFinite(n.lastMa) ? n.lastMa : (Number(n.ageMa)||0);
  function formatMa(value) {
    if (!Number.isFinite(value)) return '未提供';
    if (value===0) return '现生';
    if (value>=1000) return '约 '+(value/1000).toFixed(1)+' 十亿年前';
    if (value<1) return '约 '+Math.round(value*1000)+' 千年前';
    return '约 '+Number(value.toFixed(1))+' 百万年前';
  }
  function nodeAge(n){
    if(n.status==='extinct' && Number.isFinite(n.firstMa) && Number.isFinite(n.lastMa)){
      return n.firstMa===n.lastMa ? n.firstMa+' Ma（代表性记录）' : n.firstMa+'–'+n.lastMa+' Ma（化石出现区间）';
    }
    return timeOf(n)===0?'现生（0 Ma）':Number(timeOf(n).toFixed(1))+' Ma（教学近似）';
  }
  function build() {
    const candidates=descendants(state.root).filter(n=>state.extinct || n.status!=='extinct');
    const include = new Set([state.root]);
    candidates.forEach(n=>{
      if(state.detail==='full'){include.add(n.id);return;}
      const relativeDepth=path(n.id).findIndex(x=>x.id===state.root);
      // A world overview should remain readable, not cram every named tip
      // into a single viewport. Featured tips appear after focusing a clade.
      if(relativeDepth>=0 && (relativeDepth<=3 || (state.root!=='luca' && relativeDepth<=5 && featured.has(n.id)) || n.id===state.selected)) include.add(n.id);
    });
    // Preserve every ancestor of a displayed featured taxon. Otherwise the
    // overview would imply false direct parent-child evolutionary links.
    [...include].forEach(id=>{
      path(id).forEach(n=>{if(inside(n.id,state.root))include.add(n.id);});
    });
    if(state.selected && inside(state.selected,state.root)){
      path(state.selected).forEach(n=>{if(inside(n.id,state.root))include.add(n.id);});
    }
    state.visible=[];state.parents=new Map();
    candidates.forEach(n=>{
      if(!include.has(n.id))return;
      let p=n.parent;
      while(p && !include.has(p))p=byId.get(p)?.parent;
      state.parents.set(n.id,n.id===state.root?null:p||null);
      state.visible.push(n);
    });
  }
  function xFor(ma){
    const usable=state.width-230;
    const ratio=state.scale==='linear' ? 1-ma/Math.max(1,state.maxMa) : 1-Math.log10(ma+1)/Math.log10(state.maxMa+1);
    return 62+usable*Math.max(0,Math.min(1,ratio));
  }
  function layout() {
    const branches=new Map(state.visible.map(n=>[n.id,[]]));
    state.visible.forEach(n=>{const p=state.parents.get(n.id);if(p && branches.has(p))branches.get(p).push(n.id);});
    let leaves=0;const yy=new Map(),top=75,gap=state.detail==='full'?40:49;
    const setY=id=>{
      const kids=branches.get(id)||[];
      if(!kids.length){const value=top+leaves++*gap;yy.set(id,value);return value;}
      const values=kids.map(setY),value=(values[0]+values[values.length-1])/2;
      yy.set(id,value);return value;
    };
    if(branches.has(state.root))setY(state.root);
    state.height=Math.max(490,top+Math.max(1,leaves-1)*gap+90);
    // Adapt the virtual canvas to the real reading area before fitting;
    // a fixed 1400px overview produced illegibly small text on laptops.
    const stageWidth=$('graphStage').clientWidth||900;
    state.width=state.detail==='full'?Math.max(1150,stageWidth*1.25):Math.max(940,stageWidth*1.1);
    state.maxMa=Math.max(...state.visible.map(timeOf),timeOf(byId.get(state.root))||1,1);
    state.pos=new Map(state.visible.map(n=>[n.id,{x:xFor(timeOf(n)),y:yy.get(n.id)||top}]));
  }
  const renderLabel=(text,x,y,cl='axis-label')=>{const el=make('text',{x,y,class:cl});el.textContent=text;return el;};
  function drawGrid() {
    const layer=$('gridLayer');layer.replaceChildren();
    const ticks=[0,1,10,66,145,252,541,1000,2000,3000,4000,state.maxMa]
      .filter((v,i,a)=>v<=state.maxMa && a.indexOf(v)===i).sort((a,b)=>b-a);
    ticks.forEach(ma=>{
      const x=xFor(ma);
      layer.append(make('line',{x1:x,y1:43,x2:x,y2:state.height-25,class:'grid-line'}));
      layer.append(renderLabel(ma===0?'现在':(ma>=1000?(ma/1000)+' Ga':ma+' Ma'),x+3,30));
    });
    layer.append(make('line',{x1:50,y1:43,x2:state.width-155,y2:43,class:'axis-line'}));
  }
  function drawEvents() {
    const layer=$('eventLayer');layer.replaceChildren();
    if(!state.events)return;
    events.filter(e=>e.ma<=state.maxMa).forEach((e,i)=>{
      const x=xFor(e.ma);
      layer.append(make('rect',{x:x-7,y:43,width:14,height:state.height-65,class:'event-band'}));
      layer.append(make('line',{x1:x,y1:43,x2:x,y2:state.height-25,class:'event-line'}));
      layer.append(renderLabel(e.name,x+7,59+(i%2)*14,'event-label'));
    });
  }
  function drawTree(){
    const edges=$('edgeLayer'),nodes=$('nodeLayer');
    edges.replaceChildren();nodes.replaceChildren();
    const activePath=new Set(state.selected?path(state.selected).map(n=>n.id):[]);
    state.visible.forEach(n=>{
      const parent=state.parents.get(n.id);if(!parent)return;
      const a=state.pos.get(parent),b=state.pos.get(n.id);if(!a||!b)return;
      const middle=a.x+Math.max(12,(b.x-a.x)*.38);
      const d='M '+a.x+' '+a.y+' H '+middle+' V '+b.y+' H '+b.x;
      edges.append(make('path',{d,class:'edge'+(activePath.has(n.id)&&activePath.has(parent)?' active-path':'')}));
    });
    state.visible.forEach(n=>{
      const p=state.pos.get(n.id);if(!p)return;
      const node=make('g',{class:'node '+n.status+(n.id===state.selected?' selected':''),transform:'translate('+p.x+' '+p.y+')','data-id':n.id,tabindex:0,role:'button','aria-label':n.zh+'，'+n.rank+'，'+nodeAge(n)});
      node.append(make('circle',{class:'node-halo',r:12}),make('circle',{class:'node-core',r:n.id===state.root?6:4.8}));
      const label=make('text',{class:'node-label',x:12,y:4});
      label.textContent=n.zh;
      node.append(label);
      node.addEventListener('click',e=>{e.stopPropagation();selectNode(n.id);});
      node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectNode(n.id);}});
      node.addEventListener('mouseenter',e=>showTip(e,n));
      node.addEventListener('mousemove',moveTip);
      node.addEventListener('mouseleave',hideTip);
      node.addEventListener('focus',()=>node.classList.add('keyboard-focus'));
      node.addEventListener('blur',()=>node.classList.remove('keyboard-focus'));
      nodes.append(node);
    });
  }
  function applyTransform(){$('viewport').setAttribute('transform','translate('+state.tx+' '+state.ty+') scale('+state.zoom+')');}
  function fit(){
    if(state.view!=='tree')return;
    const box=$('graphStage').getBoundingClientRect();
    if(box.width<10||box.height<10)return;
    const zoom=Math.max(.12,Math.min(1.5,Math.min((box.width-44)/state.width,(box.height-40)/state.height)));
    state.zoom=zoom;
    state.tx=(box.width-state.width*zoom)/2;
    state.ty=(box.height-state.height*zoom)/2;
    applyTransform();
  }
  function centerNode(id,minimumZoom=.85){
    const point=state.pos.get(id),box=$('graphStage').getBoundingClientRect();
    if(!point||box.width<10)return;
    state.zoom=Math.max(state.zoom,minimumZoom);
    state.tx=Math.min(box.width*.37,box.width*.42-point.x*state.zoom);
    state.ty=box.height*.5-point.y*state.zoom;
    applyTransform();
  }
  function zoomAt(factor,cx,cy){
    const box=$('graphStage').getBoundingClientRect();
    const px=(cx??box.left+box.width/2)-box.left,py=(cy??box.top+box.height/2)-box.top;
    const old=state.zoom,next=Math.max(.12,Math.min(4,old*factor));
    state.tx=px-(px-state.tx)*next/old;
    state.ty=py-(py-state.ty)*next/old;
    state.zoom=next;applyTransform();
  }
  function updateClades(){
    document.querySelectorAll('[data-root]').forEach(el=>{
      const active=el.dataset.root===state.root;el.classList.toggle('active',active);
      if(active)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');
    });
  }
  function updateCrumbs(){
    const box=$('crumbs');box.replaceChildren();
    const ancestors=path(state.root).reverse();
    ancestors.forEach((n,i)=>{
      if(i){const s=document.createElement('span');s.textContent=' / ';box.append(s);}
      const b=document.createElement('button');b.textContent=n.zh;b.dataset.focus=n.id;
      b.addEventListener('click',()=>focusRoot(n.id));box.append(b);
    });
  }
  function render(fitNow=false) {
    build();layout();drawGrid();drawEvents();drawTree();
    const title=FOCUS[state.root]||byId.get(state.root)?.zh||'生命之树';
    $('graphTitle').textContent=title;
    $('graphSubtitle').textContent='教学示意 · '+state.visible.length+' 个可见节点 · 时间跨度 '+formatMa(state.maxMa).replace('约 ','');
    $('visibleCount').textContent=state.visible.length+' 个节点';
    $('graphEmpty').hidden=state.visible.length>0;
    updateClades();updateCrumbs();
    if(fitNow)requestAnimationFrame(fit);else applyTransform();
  }
  function closeInspector(){$('detailPanel').classList.remove('open');}
  function openInspector(){if(window.matchMedia('(max-width: 1080px)').matches)$('detailPanel').classList.add('open');}
  function hideTip(){$('tooltip').hidden=true;}
  function moveTip(e){
    const tip=$('tooltip'),offset=14;
    tip.style.left=Math.min(window.innerWidth-250,e.clientX+offset)+'px';
    tip.style.top=Math.max(8,Math.min(window.innerHeight-85,e.clientY+offset))+'px';
  }
  function showTip(e,n){
    const tip=$('tooltip');
    tip.innerHTML='<strong>'+esc(n.zh)+'</strong><em>'+esc(n.latin)+'</em><small>'+esc(n.rank)+' · '+esc(nodeAge(n))+'</small>';
    tip.hidden=false;moveTip(e);
  }
  function syncUrl(){
    const part=state.view==='tree'?'tree'+(state.root!=='luca'||state.selected?'?'+new URLSearchParams({
      ...(state.root!=='luca'?{root:state.root}:{}),
      ...(state.selected?{node:state.selected}:{})
    }).toString():''):state.view;
    try{history.replaceState(null,'','#'+part);}catch{}
  }
  function selectNode(id,{center=true,open=true}={}){
    const n=byId.get(id);if(!n)return;
    if(!inside(id,state.root))state.root='luca';
    if(!state.extinct && n.status==='extinct'){$('extinctToggle').checked=true;state.extinct=true;}
    state.selected=id;
    if(state.view!=='tree')switchView('tree',false);
    render(false);
    if(center)centerNode(id);
    showDetail(n);
    if(open)openInspector();
    hideTip();syncUrl();
  }
  function focusRoot(id){
    if(!byId.has(id))return;
    if(state.view!=='tree')switchView('tree',false);
    state.root=id;
    if(state.selected&&!inside(state.selected,id))state.selected=null;
    render(true);
    if(state.selected)showDetail(byId.get(state.selected));
    syncUrl();closeSidebar();
  }
  function showDetail(n){
    $('emptyDetail').hidden=true;$('taxonDetail').hidden=false;
    const kind=n.status==='extinct'?'化石 / 灭绝类群':n.status==='extant'?'现生物种':'支系或示意分叉';
    $('detailRank').textContent=n.rank+'  ·  '+kind;
    $('detailName').textContent=n.zh;
    $('detailLatin').textContent=n.latin;
    $('detailSummary').textContent=n.summary;
    $('detailAge').textContent=nodeAge(n);
    $('detailStatus').textContent=n.status==='extinct'?'灭绝':n.status==='extant'?'现生':'内部支系';
    $('traitList').replaceChildren(...(n.traits||[]).map(s=>{const el=document.createElement('span');el.textContent=s;return el;}));
    const lineage=$('lineage');lineage.replaceChildren();
    path(n.id).reverse().forEach((member,i)=>{
      if(i){const sep=document.createElement('i');sep.textContent='›';lineage.append(sep);}
      const button=document.createElement('button');button.textContent=member.zh;
      button.addEventListener('click',()=>selectNode(member.id));lineage.append(button);
    });
    const src=$('detailSources');src.replaceChildren();
    (n.sources||[]).forEach(code=>{
      const record=sourceByCode.get(code);
      if(!record)return;
      const anchor=document.createElement('a');anchor.href=record.url;anchor.textContent=record.name;
      anchor.target='_blank';anchor.rel='noopener noreferrer';src.append(anchor);
    });
    $('focusNode').hidden=!(children.get(n.id)||[]).length;
    $('focusNode').onclick=()=>{focusRoot(n.id);closeInspector();};
    $('addToCompare').hidden=n.rank!=='种';
    $('addToCompare').onclick=()=>{
      $('speciesA').value=n.id;
      if($('speciesB').value===n.id){const other=taxa.find(x=>x.rank==='种'&&x.id!==n.id);if(other)$('speciesB').value=other.id;}
      switchView('compare');compare();
    };
  }
  function clearSelection(){
    state.selected=null;$('emptyDetail').hidden=false;$('taxonDetail').hidden=true;closeInspector();
  }
  function reset(){
    Object.assign(state,{root:'luca',scale:'log',detail:'overview',extinct:true,events:true,selected:null});
    $('scaleSelect').value='log';$('detailSelect').value='overview';
    $('extinctToggle').checked=true;$('eventToggle').checked=true;
    $('taxonSearch').value='';$('searchResults').hidden=true;
    clearSelection();switchView('tree',false);render(true);syncUrl();
  }
  function matchTaxa(query){
    const lower=query.trim().toLocaleLowerCase();
    if(!lower)return [];
    return taxa.map(n=>{
      const zh=n.zh.toLocaleLowerCase(),latin=n.latin.toLocaleLowerCase();
      let rank=0;
      if(zh===lower||latin===lower)rank=5;
      else if(zh.startsWith(lower)||latin.startsWith(lower))rank=4;
      else if(zh.includes(lower)||latin.includes(lower))rank=3;
      else if((n.rank||'').includes(lower))rank=1;
      return {n,rank};
    }).filter(x=>x.rank).sort((a,b)=>b.rank-a.rank||a.n.zh.localeCompare(b.n.zh,'zh-CN')).slice(0,10).map(x=>x.n);
  }
  function drawSearch(){
    const box=$('searchResults');box.replaceChildren();
    const query=$('taxonSearch').value;
    state.searchHits=matchTaxa(query);
    state.searchIndex=0;
    if(!query.trim()){box.hidden=true;return;}
    if(!state.searchHits.length){const empty=document.createElement('div');empty.className='search-empty';empty.textContent='没有找到匹配类群';box.append(empty);}
    state.searchHits.forEach((n,i)=>{
      const button=document.createElement('button');button.className='search-result';button.setAttribute('role','option');
      button.setAttribute('aria-selected',String(i===state.searchIndex));button.dataset.index=i;
      const name=document.createElement('strong');name.textContent=n.zh;
      const latin=document.createElement('small');latin.textContent=n.latin+' · '+n.rank;
      button.append(name,latin);
      button.addEventListener('click',()=>openSearchResult(i));
      box.append(button);
    });box.hidden=false;
  }
  function openSearchResult(index){
    const n=state.searchHits[index];if(!n)return;
    $('taxonSearch').value=n.zh;$('searchResults').hidden=true;
    closeSidebar();selectNode(n.id);
  }
  function searchKeydown(e){
    if(e.key==='Escape'){$('searchResults').hidden=true;return;}
    if(!state.searchHits.length)return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();state.searchIndex=(state.searchIndex+(e.key==='ArrowDown'?1:-1)+state.searchHits.length)%state.searchHits.length;
      $('searchResults').querySelectorAll('[role="option"]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===state.searchIndex)));
    }else if(e.key==='Enter'){e.preventDefault();openSearchResult(state.searchIndex);}
  }
  function lca(a,b){
    const seen=new Set(path(a).map(n=>n.id));
    return path(b).find(n=>seen.has(n.id))||byId.get('luca');
  }
  function compare(){
    const a=byId.get($('speciesA').value),b=byId.get($('speciesB').value);
    if(!a||!b)return;
    const common=lca(a.id,b.id);
    const branch=id=>path(id).reverse().slice(path(common.id).length);
    const column=(n,sequence)=>{
      const items=sequence.length?sequence:[n];
      return '<div class="path-column"><div class="species-card"><h3>'+esc(n.zh)+'</h3><em>'+esc(n.latin)+'</em></div><div class="path-list">'+
        items.map(t=>'<div class="path-item"><strong>'+esc(t.zh)+'</strong><small>'+esc(t.rank)+' · '+esc(nodeAge(t))+'</small></div>').join('')+'</div></div>';
    };
    $('compareResult').innerHTML='<div class="lca-banner"><small>当前示意树中的最近共同祖先</small><h2>'+esc(common.zh)+'</h2><em>'+esc(common.latin)+'</em><div class="compare-meta"><span>'+esc(common.rank)+'</span><span>'+esc(nodeAge(common))+'</span><span>'+esc(a.id===b.id?'同一物种':'分化后形成的两条分支')+'</span></div></div><div class="path-columns">'+column(a,branch(a.id))+column(b,branch(b.id))+'</div>';
  }
  function switchView(view,update=true){
    if(!['tree','compare','sources'].includes(view))return;
    state.view=view;
    document.querySelectorAll('.view-panel').forEach(el=>el.classList.toggle('active',el.dataset.panel===view));
    document.querySelectorAll('.nav-item').forEach(el=>{const active=el.dataset.view===view;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'page':'false');});
    $('headerContext').textContent={tree:'生命之树',compare:'共同祖先比较',sources:'资料与方法'}[view];
    $('mainArea').scrollTop=0;hideTip();closeSidebar();closeInspector();
    if(view==='tree')requestAnimationFrame(fit);
    if(view==='compare')compare();
    if(update)syncUrl();
  }
  function populateSources(){
    const container=$('sourceGrid');
    container.replaceChildren(...research.sources.map(s=>{
      const card=document.createElement('article');card.className='source-card';
      const header=document.createElement('header'),title=document.createElement('h3'),tag=document.createElement('span');
      title.textContent=s.name;tag.className='category';tag.textContent=s.category;header.append(title,tag);
      const description=document.createElement('p');description.textContent=s.description;
      const link=document.createElement('a');link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='打开数据源 ↗';
      card.append(header,description,link);return card;
    }));
    $('researchGrid').replaceChildren(...research.topics.map(t=>{
      const card=document.createElement('article');card.className='research-card';
      const type=document.createElement('div');type.className='research-type';type.textContent=t.category;
      const title=document.createElement('h3');title.textContent=t.title;
      const description=document.createElement('p');description.textContent=t.summary;
      const link=document.createElement('a');link.href=t.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='阅读资料 ↗';
      card.append(type,title,description,link);return card;
    }));
  }
  function loadTheme(){
    let saved='system';try{saved=localStorage.getItem('evoatlas-theme')||'system';}catch{}
    state.theme=['light','dark','system'].includes(saved)?saved:'system';
    applyTheme();
  }
  function applyTheme(){
    const dark=state.theme==='dark'||(state.theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme=dark?'dark':'light';
    const themeLabel={system:'跟随系统',light:'浅色模式',dark:'深色模式'}[state.theme];
    $('themeToggle').title='当前：'+themeLabel+'；点击切换';
    $('themeToggle').setAttribute('aria-label','当前：'+themeLabel+'；点击切换');
    $('themeToggle').querySelector('use').setAttribute('href',dark?'#i-sun':'#i-moon');
  }
  function closeSidebar(){$('sidebar').classList.remove('open');$('mobileScrim').hidden=true;}
  function bind(){
    document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.view)));
    document.querySelectorAll('[data-root]').forEach(button=>button.addEventListener('click',()=>focusRoot(button.dataset.root)));
    $('resetTree').addEventListener('click',reset);
    $('taxonSearch').addEventListener('input',drawSearch);
    $('taxonSearch').addEventListener('keydown',searchKeydown);
    document.addEventListener('keydown',e=>{
      const tag=document.activeElement?.tagName;
      if(e.key==='/'&&tag!=='INPUT'&&tag!=='TEXTAREA'&&tag!=='SELECT'){
        e.preventDefault();$('taxonSearch').focus();
        if(window.matchMedia('(max-width: 780px)').matches){$('sidebar').classList.add('open');$('mobileScrim').hidden=false;}
      }
      if(e.key==='Escape'){hideTip();$('searchResults').hidden=true;closeSidebar();closeInspector();}
    });
    document.addEventListener('click',e=>{if(!e.target.closest('.side-section'))$('searchResults').hidden=true;});
    $('openSidebar').addEventListener('click',()=>{$('sidebar').classList.add('open');$('mobileScrim').hidden=false;});
    $('mobileScrim').addEventListener('click',closeSidebar);
    $('closeInspector').addEventListener('click',closeInspector);
    $('suggestNode').addEventListener('click',()=>selectNode('sapiens'));
    $('exploreHuman').addEventListener('click',()=>{focusRoot('hominina');selectNode('sapiens');});
    $('randomSpecies').addEventListener('click',()=>{
      const species=taxa.filter(n=>n.rank==='种');
      const random=species[Math.floor(Math.random()*species.length)];
      if(random)selectNode(random.id);
    });
    $('scaleSelect').addEventListener('change',e=>{state.scale=e.target.value;render(true);});
    $('detailSelect').addEventListener('change',e=>{state.detail=e.target.value;render(true);});
    $('extinctToggle').addEventListener('change',e=>{
      state.extinct=e.target.checked;
      if(!state.extinct&&byId.get(state.selected)?.status==='extinct'){clearSelection();}
      render(true);
    });
    $('eventToggle').addEventListener('change',e=>{state.events=e.target.checked;render();});
    $('zoomIn').addEventListener('click',()=>zoomAt(1.2));
    $('zoomOut').addEventListener('click',()=>zoomAt(1/1.2));
    $('fitTree').addEventListener('click',fit);
    const stage=$('graphStage');
    stage.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.deltaY<0?1.12:1/1.12,e.clientX,e.clientY);},{passive:false});
    stage.addEventListener('pointerdown',e=>{
      if(e.button!==0||e.target.closest('.node'))return;
      state.drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,tx:state.tx,ty:state.ty};
      stage.classList.add('dragging');stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove',e=>{
      if(!state.drag||state.drag.pointer!==e.pointerId)return;
      state.tx=state.drag.tx+e.clientX-state.drag.x;state.ty=state.drag.ty+e.clientY-state.drag.y;applyTransform();
    });
    const endDrag=e=>{if(!state.drag||state.drag.pointer!==e.pointerId)return;state.drag=null;stage.classList.remove('dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);};
    stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
    $('speciesA').addEventListener('change',compare);
    $('speciesB').addEventListener('change',compare);
    $('runCompare').addEventListener('click',compare);
    $('swapSpecies').addEventListener('click',()=>{
      const a=$('speciesA').value;
      $('speciesA').value=$('speciesB').value;$('speciesB').value=a;compare();
    });
    $('themeToggle').addEventListener('click',()=>{
      state.theme=state.theme==='system'?'light':state.theme==='light'?'dark':'system';
      try{localStorage.setItem('evoatlas-theme',state.theme);}catch{}
      applyTheme();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(state.theme==='system')applyTheme();});
    if('ResizeObserver' in window)new ResizeObserver(()=>{if(state.view==='tree')fit();}).observe(stage);
    else window.addEventListener('resize',fit);
    window.addEventListener('hashchange',readHash);
  }
  function readHash(){
    const hash=location.hash.slice(1),[view,query='']=hash.split('?');
    if(['compare','sources'].includes(view)){switchView(view,false);return;}
    const params=new URLSearchParams(query);
    const root=params.get('root');
    const selected=params.get('node');
    if(root&&byId.has(root))state.root=root;
    if(selected&&byId.has(selected)){
      state.selected=selected;
      if(!inside(selected,state.root))state.root='luca';
    }
    switchView('tree',false);render(true);
    if(state.selected)showDetail(byId.get(state.selected));
  }
  function init(){
    if(!taxa.length){$('graphEmpty').hidden=false;$('graphEmpty').textContent='尚未加载图谱数据';return;}
    loadTheme();populateSources();
    const species=taxa.filter(n=>n.rank==='种').sort((a,b)=>a.zh.localeCompare(b.zh,'zh-CN'));
    for(const id of ['speciesA','speciesB']){
      const select=$(id);select.replaceChildren(...species.map(n=>{const option=document.createElement('option');option.value=n.id;option.textContent=n.zh+' — '+n.latin;return option;}));
    }
    if(byId.has('sapiens'))$('speciesA').value='sapiens';
    if(byId.has('pan'))$('speciesB').value='pan';
    bind();readHash();compare();
  }
  init();
})();