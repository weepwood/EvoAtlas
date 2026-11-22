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
    const candidateIds=new Set(candidates.map(n=>n.id));
    const include=new Set([state.root]);
    if(state.detail==='full'){
      candidates.forEach(n=>include.add(n.id));
    }else{
      // Level-of-detail: 600+ taxa must not flatten into unreadable hairlines.
      // Traverse evenly across sibling branches, showing broad diversity
      // instead of exhausting one large family before the others.
      const budget=window.innerWidth<700?34:58;
      let layer=[state.root];
      while(layer.length && include.size<budget){
        const groups=layer.map(id=>(children.get(id)||[])
          .filter(childId=>candidateIds.has(childId)));
        const next=[];
        const longest=Math.max(0,...groups.map(group=>group.length));
        for(let column=0;column<longest && include.size<budget;column++){
          for(const group of groups){
            const id=group[column];
            if(!id || include.size>=budget)continue;
            include.add(id);next.push(id);
          }
        }
        layer=next;
      }
      // Preserve the exact ancestor chain of a searched/selected taxon.
      if(state.selected && candidateIds.has(state.selected)){
        for(const ancestor of path(state.selected)){
          if(candidateIds.has(ancestor.id))include.add(ancestor.id);
          if(ancestor.id===state.root)break;
        }
      }
    }
    state.totalAvailable=candidates.length;
    state.visible=[];state.parents=new Map();
    candidates.forEach(n=>{
      if(!include.has(n.id))return;
      let parent=n.parent;
      while(parent && !include.has(parent))parent=byId.get(parent)?.parent;
      state.parents.set(n.id,n.id===state.root?null:parent||null);
      state.visible.push(n);
    });
  }
  function xFor(ma){
    const left=65, right=215;
    const usable=state.width-left-right;
    const fraction=state.scale==='linear'
      ? 1-ma/Math.max(1,state.maxMa)
      : 1-Math.log10(ma+1)/Math.log10(state.maxMa+1);
    return left+usable*Math.max(0,Math.min(1,fraction));
  }
  function layout(){
    const branches=new Map(state.visible.map(n=>[n.id,[]]));
    state.visible.forEach(n=>{
      const parent=state.parents.get(n.id);
      if(parent && branches.has(parent))branches.get(parent).push(n.id);
    });
    let leaves=0;
    const yy=new Map(),top=86,gap=state.detail==='full'?42:54;
    const setY=id=>{
      const descendants=branches.get(id)||[];
      if(!descendants.length){
        const y=top+leaves++*gap;yy.set(id,y);return y;
      }
      const positions=descendants.map(setY);
      const midpoint=(positions[0]+positions[positions.length-1])/2;
      yy.set(id,midpoint);return midpoint;
    };
    if(branches.has(state.root))setY(state.root);

    const stage=$('graphStage');
    const stageWidth=stage.clientWidth||900;
    const stageHeight=stage.clientHeight||600;
    // Linear scale still uses exact linear x projection. Avoid forcing a
    // 1500px virtual width into an 800px viewport, which shrinks all labels.
    state.width=state.scale==='linear'
      ? Math.max(950,stageWidth*1.16)
      : state.detail==='full'
        ? Math.max(1100,stageWidth*1.24)
        : Math.max(920,stageWidth*1.10);

    const baseHeight=top+Math.max(1,leaves-1)*gap+95;
    const tentativeWidthZoom=(stageWidth-44)/state.width;
    const readableWidthZoom=stageWidth<600?.82:tentativeWidthZoom;
    const targetWorldHeight=Math.max(470,(stageHeight-46)/Math.max(.55,Math.min(1,readableWidthZoom)));
    state.height=Math.max(baseHeight,targetWorldHeight);

    // Vertical branch spacing has no evolutionary time meaning. Expand short
    // focused subtrees to use the available height without distorting x age.
    if(leaves>1 && state.height>baseHeight){
      const available=state.height-top-95;
      const original=(leaves-1)*gap;
      const factor=Math.max(1,available/original);
      yy.forEach((y,id)=>yy.set(id,top+(y-top)*factor));
    }

    state.maxMa=Math.max(...state.visible.map(timeOf),timeOf(byId.get(state.root))||1,1);
    state.pos=new Map(state.visible.map(n=>[n.id,{x:xFor(timeOf(n)),y:yy.get(n.id)||top}]));
  }
  const renderLabel=(text,x,y,cl='axis-label')=>{const el=make('text',{x,y,class:cl});el.textContent=text;return el;};
  function axisTicks(){
    if(state.scale==='log'){
      const values=[0,1,10,66,145,252,541,1000,2000,3000,4000,state.maxMa];
      return [...new Set(values.filter(v=>v<=state.maxMa))].sort((a,b)=>b-a);
    }
    // Nice linear intervals. Do not repeat the logarithmic ticks on a linear axis.
    const target=Math.max(3,Math.floor((state.width-280)/150));
    const rough=state.maxMa/target;
    const base=10**Math.floor(Math.log10(rough));
    const step=[1,2,2.5,5,10].map(v=>v*base).find(v=>v>=rough)||10*base;
    const values=[0,state.maxMa];
    for(let ma=step;ma<state.maxMa;ma+=step)values.push(Math.round(ma*1000)/1000);
    return values.sort((a,b)=>b-a);
  }
  function drawGrid(){
    const layer=$('gridLayer');layer.replaceChildren();
    const ticks=axisTicks(),placed=[];
    for(const ma of ticks){
      const x=xFor(ma);
      layer.append(make('line',{x1:x,y1:49,x2:x,y2:state.height-25,class:'grid-line'}));
      const label=ma===0?'现在':ma>=1000?Number((ma/1000).toFixed(2))+' Ga':Number(ma.toFixed(1))+' Ma';
      const estimated=label.length*7+12;
      const left=x+3,right=left+estimated;
      if(placed.some(p=>left<p.right+15&&right>p.left-15))continue;
      placed.push({left,right});
      layer.append(renderLabel(label,x+3,30));
    }
    layer.append(make('line',{x1:52,y1:49,x2:state.width-140,y2:49,class:'axis-line'}));
  }
  function drawEvents(){
    const layer=$('eventLayer');layer.replaceChildren();
    if(!state.events)return;
    let previousLabelX=-Infinity;
    events.filter(event=>event.ma<=state.maxMa).sort((a,b)=>b.ma-a.ma).forEach(event=>{
      const x=xFor(event.ma);
      const band=make('rect',{x:x-6,y:49,width:12,height:state.height-75,class:'event-band'});
      const line=make('line',{x1:x,y1:49,x2:x,y2:state.height-25,class:'event-line'});
      const title=make('title');title.textContent=event.name+' · '+event.ma+' Ma';line.append(title);
      layer.append(band,line);
      // Suppress only event captions that overlap; never suppress the event marker.
      if(x-previousLabelX>=95){
        layer.append(renderLabel(event.name,x+6,66,'event-label'));
        previousLabelX=x;
      }
    });
  }
  function approximateLabelWidth(text){
    return [...text].reduce((width,char)=>width+(/[\u2e80-\u9fff]/.test(char)?12.5:7.2),0)+4;
  }
  function chooseLabels(){
    const placements=new Map(),placed=[];
    const childCount=new Map(state.visible.map(n=>[n.id,0]));
    state.visible.forEach(n=>{
      const parent=state.parents.get(n.id);
      if(parent)childCount.set(parent,(childCount.get(parent)||0)+1);
    });
    const sorted=[...state.visible].sort((a,b)=>{
      const priority=n=>(n.id===state.selected?100:0)+(n.id===state.root?70:0)+(childCount.get(n.id)===0?35:0)+(n.status==='extant'?18:0);
      return priority(b)-priority(a) || state.pos.get(a.id).y-state.pos.get(b.id).y;
    });
    const overlaps=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
      Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    for(const node of sorted){
      const point=state.pos.get(node.id);
      if(!point)continue;
      const leaf=!(childCount.get(node.id)>0);
      const width=approximateLabelWidth(node.zh),height=17;
      const preferred=leaf?'right':'left';
      const sides=[preferred,preferred==='right'?'left':'right'];
      const offsets=leaf?[0,-19,19,-36,36]:[-16,16,-33,33,0,-49,49];
      let chosen=null,best=Infinity;
      for(const side of sides){
        for(const dy of offsets){
          const dx=side==='right'?14:-14;
          const textX=point.x+dx;
          const rect={left:side==='right'?textX:textX-width,
                      right:side==='right'?textX+width:textX,
                      top:point.y+dy-height/2,bottom:point.y+dy+height/2};
          const overflow=Math.max(0,10-rect.left)+Math.max(0,rect.right-(state.width-8))+
            Math.max(0,40-rect.top)+Math.max(0,rect.bottom-(state.height-10));
          const collision=placed.reduce((score,old)=>score+overlaps(rect,old),0);
          // Labels never alter the phylogenetic node positions or time projection.
          const score=collision*30+overflow*200+Math.abs(dy)*.15+
            (side===preferred?0:4)+(leaf&&dy!==0?1:0);
          if(score<best){best=score;chosen={dx,dy,side,rect};}
        }
      }
      placements.set(node.id,{...chosen,leaf});
      placed.push(chosen.rect);
    }
    return placements;
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
    const labels=chooseLabels();
    state.visible.forEach(n=>{
      const point=state.pos.get(n.id),meta=labels.get(n.id);
      if(!point||!meta)return;
      const node=make('g',{class:'node '+n.status+(meta.leaf?' terminal':' internal')+(n.id===state.selected?' selected':''),
        transform:'translate('+point.x+' '+point.y+')','data-id':n.id,tabindex:0,role:'button',
        'aria-label':n.zh+'，'+n.rank+'，'+nodeAge(n)});
      node.append(make('circle',{class:'node-halo',r:12}),make('circle',{class:'node-core',r:n.id===state.root?6:4.8}));
      const label=make('text',{class:'node-label',x:meta.dx,y:meta.dy,'text-anchor':meta.side==='right'?'start':'end',
        'dominant-baseline':'middle'});
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
  function fit(showEntireTree=false){
    if(state.view!=='tree')return;
    const box=$('graphStage').getBoundingClientRect();
    if(box.width<10||box.height<10)return;
    const natural=Math.max(.12,Math.min(1.5,Math.min((box.width-44)/state.width,(box.height-40)/state.height)));
    const isNarrow=box.width<600;
    if(isNarrow && !showEntireTree){
      // Tiny all-at-once mobile renders are unreadable. Begin with an
      // anchored, legible portion and let the user pan or press Fit for all.
      state.zoom=Math.max(.8,Math.min(1.3,(box.height-34)/state.height));
      const focus=state.pos.get(state.selected||state.root);
      state.tx=(state.selected?box.width*.52:34)-(focus?.x||65)*state.zoom;
      state.ty=(box.height-state.height*state.zoom)/2;
    }else{
      state.zoom=natural;
      state.tx=(box.width-state.width*natural)/2;
      state.ty=(box.height-state.height*natural)/2;
    }
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
  function updateHeaderBreadcrumb(){
    const box=$('headerBreadcrumb');box.replaceChildren();
    const viewLabels={compare:'共同祖先比较',sources:'资料与方法'};
    if(state.view!=='tree'){
      const label=document.createElement('span');label.className='breadcrumb-current';
      label.textContent=viewLabels[state.view]||'生命之树';box.append(label);return;
    }
    const ancestors=path(state.root).reverse();
    ancestors.forEach((taxon,i)=>{
      if(i){
        const slash=document.createElement('span');slash.className='breadcrumb-separator';
        slash.setAttribute('aria-hidden','true');slash.textContent='/';box.append(slash);
      }
      const button=document.createElement('button');button.type='button';
      button.textContent=taxon.zh;button.dataset.focus=taxon.id;
      if(i===ancestors.length-1)button.setAttribute('aria-current','location');
      button.addEventListener('click',()=>focusRoot(taxon.id));box.append(button);
    });
    box.scrollLeft=box.scrollWidth;
  }
  function render(fitNow=false){
    build();layout();drawGrid();drawEvents();drawTree();
    $('graphStage').dataset.scale=state.scale;
    $('graphEmpty').hidden=state.visible.length>0;
    const hint=$('graphStage').querySelector('.graph-overlay-hint');
    if(hint)hint.textContent=state.detail==='overview'&&state.visible.length<state.totalAvailable
      ? '概览 '+state.visible.length+'/'+state.totalAvailable+' · 聚焦支系或搜索更多物种'
      : '滚轮缩放 · 拖拽移动 · 点击类群查看';
    updateClades();updateHeaderBreadcrumb();
    if(fitNow)requestAnimationFrame(()=>fit());else applyTransform();
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
      window.EvoSelect?.syncAll();
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
    window.EvoSelect?.syncAll();
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
    updateHeaderBreadcrumb();window.EvoSelect?.close();
    $('mainArea').scrollTop=0;hideTip();closeSidebar();closeInspector();
    if(view==='tree')requestAnimationFrame(()=>fit());
    if(view==='compare')compare();
    if(update)syncUrl();
  }
  function populateSources(){
    const container=$('sourceGrid');
    container.replaceChildren();
    const notice=document.createElement('p');
    notice.className='source-directory-note';
    notice.textContent='收录 '+research.sources.length+' 个资料入口，按研究用途分类。当前均为推荐核验资源，尚未连接实时 API，也不代表已核验当前树上的每条记录。';
    container.append(notice);
    (research.groups||[]).forEach(group=>{
      const items=research.sources.filter(source=>source.group===group.id);
      if(!items.length)return;
      const section=document.createElement('section');section.className='source-group';
      const heading=document.createElement('div');heading.className='source-group-heading';
      const title=document.createElement('h3');title.textContent=group.name;
      const count=document.createElement('span');count.textContent=items.length+' 个资源';
      heading.append(title,count);
      const description=document.createElement('p');description.className='source-directory-note';description.textContent=group.description;
      const grid=document.createElement('div');grid.className='source-group-cards';
      items.forEach(source=>{
        const card=document.createElement('article');card.className='source-card';
        const header=document.createElement('header');
        const name=document.createElement('h3');name.textContent=source.name;
        const category=document.createElement('span');category.className='category';category.textContent=source.category;
        header.append(name,category);
        const summary=document.createElement('p');summary.textContent=source.description;
        const usage=document.createElement('span');usage.className='source-usage';usage.textContent='主要用途：'+source.usage;
        const limitation=document.createElement('div');limitation.className='source-limitation';
        const emphasis=document.createElement('b');emphasis.textContent='注意：';
        limitation.append(emphasis,document.createTextNode(source.limitation));
        const links=document.createElement('div');links.className='source-links';
        const website=document.createElement('a');website.href=source.url;website.target='_blank';website.rel='noopener noreferrer';website.textContent='官方网站 ↗';
        links.append(website);
        if(source.resourceUrl && source.resourceUrl!==source.url){
          const documentation=document.createElement('a');documentation.href=source.resourceUrl;
          documentation.target='_blank';documentation.rel='noopener noreferrer';documentation.textContent='数据或文档 ↗';
          links.append(documentation);
        }
        card.append(header,summary,usage,limitation,links);
        grid.append(card);
      });
      section.append(heading,description,grid);
      container.append(section);
    });
    $('researchGrid').replaceChildren(...research.topics.map(topic=>{
      const card=document.createElement('article');card.className='research-card';
      const type=document.createElement('div');type.className='research-type';type.textContent=topic.category;
      const title=document.createElement('h3');title.textContent=topic.title;
      const description=document.createElement('p');description.textContent=topic.summary;
      const link=document.createElement('a');link.href=topic.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='阅读资料 ↗';
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
    $('fitTree').addEventListener('click',()=>fit(true));
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
      $('speciesA').value=$('speciesB').value;$('speciesB').value=a;
      window.EvoSelect?.syncAll();compare();
    });
    $('themeToggle').addEventListener('click',()=>{
      state.theme=state.theme==='system'?'light':state.theme==='light'?'dark':'system';
      try{localStorage.setItem('evoatlas-theme',state.theme);}catch{}
      applyTheme();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(state.theme==='system')applyTheme();});
    // Resize is a layout change, not just a transform change: recompute
    // available horizontal width and vertical leaf spacing before fitting.
    let resizeScheduled=false;
    const onStageResize=()=>{
      if(state.view!=='tree'||resizeScheduled)return;
      resizeScheduled=true;
      requestAnimationFrame(()=>{resizeScheduled=false;render(true);});
    };
    if('ResizeObserver' in window)new ResizeObserver(onStageResize).observe(stage);
    else window.addEventListener('resize',onStageResize);
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
    window.EvoSelect?.enhanceAll();
    bind();readHash();compare();
  }
  init();
})();