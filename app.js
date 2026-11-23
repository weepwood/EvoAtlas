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
  const state = {view:'tree',root:'luca',scale:'log',detail:new URLSearchParams(location.search).get('layout')==='legacy'?'overview':'focus',extinct:true,events:true,selected:null,
    visible:[],parents:new Map(),pos:new Map(),width:1500,height:700,maxMa:4000,tx:0,ty:0,zoom:1,drag:null,
    searchHits:[],searchIndex:0,theme:'system',
    engine:(new URLSearchParams(location.search).get('layout')==='legacy'||!window.EvoLayoutEngine||!window.EvoTreeProjection)?'legacy':'v2',
    layoutMode:'structure',foldedIds:new Set(),expandedIds:new Set(),
    layoutSegments:[],layoutMeta:new Map(),layoutDepthStep:145,
    layoutMarginX:58,layoutRightInset:185,layoutPlotWidth:1400};
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
  function buildLegacy() {
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
    const total=new Map(),shown=new Map();
    for(const n of candidates){
      for(const ancestor of path(n.id)){
        if(!candidateIds.has(ancestor.id))continue;
        total.set(ancestor.id,(total.get(ancestor.id)||0)+1);
        if(ancestor.id===state.root)break;
      }
    }
    for(const n of state.visible){
      for(const ancestor of path(n.id)){
        if(!candidateIds.has(ancestor.id))continue;
        shown.set(ancestor.id,(shown.get(ancestor.id)||0)+1);
        if(ancestor.id===state.root)break;
      }
    }
    state.hiddenById=new Map(state.visible.map(n=>[n.id,Math.max(0,(total.get(n.id)||1)-(shown.get(n.id)||1))]));
  }

  function buildV2(){
    const view=window.EvoTreeProjection.project(taxa,{
      rootId:state.root,detail:state.detail,selectedId:state.selected,
      extinct:state.extinct,budget:window.innerWidth<700?20:36,
      mobile:window.innerWidth<700,focusLimit:window.innerWidth<700?7:12,
      foldedIds:state.foldedIds,expandedIds:state.expandedIds
    });
    state.layoutSource=view;
    state.totalAvailable=view.totalAvailable;
  }
  function build(){
    return state.engine==='v2'?buildV2():buildLegacy();
  }
  function layoutV2(){
    const stage=$('graphStage'),stageWidth=stage.clientWidth||900;
    const focused=state.detail==='focus';
    state.layoutMarginX=focused?50:68;
    state.layoutRightInset=focused?(stageWidth<700?185:230):310;
    // A focused star-like clade often has only one or two levels. Its tips
    // should use the canvas width instead of clustering next to the trunk.
    const allowed=new Set(state.layoutSource.records.map(n=>n.id));
    const folded=new Set(state.layoutSource.collapsedIds);
    let visibleDepth=0;
    const stack=[[state.root,0]];
    while(stack.length){
      const [id,depth]=stack.pop();
      visibleDepth=Math.max(visibleDepth,depth);
      if(folded.has(id))continue;
      for(const child of children.get(id)||[]){
        if(allowed.has(child))stack.push([child,depth+1]);
      }
    }
    state.layoutDepthStep=focused
      ?(stageWidth<700?146:220)
      :state.layoutMode==='structure'
        ?stageWidth<700?112:visibleDepth<=1?420:visibleDepth===2?240:165
        :165;
    state.layoutPlotWidth=focused?Math.max(stageWidth<700?620:670,stageWidth-8)
      :state.layoutMode==='structure'
        ?Math.max(1040,stageWidth*1.2)
        :state.scale==='linear'?Math.max(960,stageWidth*1.18)
        :Math.max(940,stageWidth*1.12);
    const result=window.EvoLayoutEngine.layoutTree(state.layoutSource.records,{
      rootId:state.root,mode:state.layoutMode,timeScale:state.scale,
      collapsedIds:state.layoutSource.collapsedIds,sort:'input',
      alignTips:state.layoutMode==='structure'&&!focused,
      plotWidth:state.layoutPlotWidth,
      marginX:state.layoutMarginX,rightInset:state.layoutRightInset,
      marginY:64,labelHeight:focused?27:22,leafGap:focused?27:16,
      subtreeGap:focused?38:27,depthStep:state.layoutDepthStep
    });
    state.layoutMeta=new Map(result.nodes.map(n=>[n.id,n]));
    state.visible=result.nodes.map(n=>byId.get(n.id));
    state.parents=new Map(result.nodes.map(n=>[n.id,n.parentId]));
    state.hiddenById=focused
      ?new Map(Object.entries(state.layoutSource.hiddenDescendants||{}))
      :new Map(result.nodes.map(n=>[n.id,n.hiddenDescendants]));
    const stageHeight=stage.clientHeight||600;
    // A small focused tree should not occupy only a 50px strip in a tall
    // mobile canvas. Stretch Y alone; X still means depth or teaching age.
    const yValues=result.nodes.map(n=>n.y);
    const minY=Math.min(...yValues),maxY=Math.max(...yValues);
    const span=maxY-minY;
    const tips=result.nodes.filter(n=>n.childIds.length===0).length;
    const yFactor=tips>=2&&tips<=8&&span>0
      ?Math.max(1,Math.min(4,(stageHeight*.52)/span)):1;
    const laidOutHeight=128+span*yFactor;
    const minHeight=focused?Math.max(440,stageHeight*1.02)
      :Math.max(440,(stageHeight-46)/Math.max(.62,Math.min(1,(stageWidth-44)/result.bounds.width)));
    const extraY=Math.max(0,minHeight-laidOutHeight)/2;
    const mapY=y=>64+(y-minY)*yFactor+extraY;
    state.pos=new Map(result.nodes.map(n=>[n.id,{x:n.x,y:mapY(n.y)}]));
    state.layoutSegments=result.segments.map(seg=>({...seg,
      y1:mapY(seg.y1),y2:mapY(seg.y2)}));
    state.width=result.bounds.width;
    state.height=Math.max(laidOutHeight,minHeight);
    state.maxMa=result.axis.maxMa||0;
    state.layoutStats=result.stats;
    if(result.stats.visibleNodes!==state.visible.length)throw Error('Layout node count mismatch');
  }
  function layout(){
    return state.engine==='v2'?layoutV2():layoutLegacy();
  }
  // Short, interruptible geometry transitions help the user follow which
  // descendants belong to the disclosure they just opened or closed.
  let treeMotion=null;
  const motionDuration=195;
  function finishTreeMotion(){
    if(!treeMotion)return;
    const motion=treeMotion;treeMotion=null;
    cancelAnimationFrame(motion.frame);
    motion.nodes.forEach(({el,to})=>{
      el.setAttribute('transform','translate('+to.x+' '+to.y+')');
      el.style.opacity='';
    });
    motion.paths.forEach(({el,to})=>{
      el.setAttribute('d','M '+to.x1+' '+to.y1+' L '+to.x2+' '+to.y2);
      el.style.opacity='';
    });
    motion.ghosts.forEach(item=>item.el.remove());
  }
  function animateTreeDisclosure(previousPositions,previousSegments,previousElements,id){
    if(state.engine!=='v2'||state.detail==='focus'||
       state.visible.length>180||
       window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const anchor=previousPositions.get(id)||state.pos.get(id);
    if(!anchor)return;
    const layer=$('nodeLayer'),nodes=[],paths=[],ghosts=[];
    const present=new Set(state.visible.map(n=>n.id));
    for(const el of layer.querySelectorAll(':scope > .node')){
      const to=state.pos.get(el.dataset.id);
      if(!to)continue;
      const from=previousPositions.get(el.dataset.id)||anchor;
      const entering=!previousPositions.has(el.dataset.id);
      if(entering || Math.abs(from.x-to.x)+Math.abs(from.y-to.y)>.3){
        nodes.push({el,from,to,entering});
        el.setAttribute('transform','translate('+from.x+' '+from.y+')');
        if(entering)el.style.opacity='0';
      }
    }
    const segKey=seg=>seg.kind+':'+seg.ownerId+':'+(seg.childId||'');
    const previous=new Map(previousSegments.map(seg=>[segKey(seg),seg]));
    const edges=[...$('edgeLayer').querySelectorAll(':scope > path')];
    state.layoutSegments.forEach((to,index)=>{
      const el=edges[index];
      if(!el)return;
      const from=previous.get(segKey(to))||
        {x1:anchor.x,y1:anchor.y,x2:anchor.x,y2:anchor.y};
      const entering=!previous.has(segKey(to));
      paths.push({el,from,to,entering});
      el.setAttribute('d','M '+from.x1+' '+from.y1+' L '+from.x2+' '+from.y2);
      if(entering)el.style.opacity='0';
    });
    // Keep removed tips briefly visible while they converge on their true
    // parent. Ghosts never intercept input or appear as active SVG nodes.
    if(previousElements.size<140){
      for(const [oldId,oldEl] of previousElements){
        if(present.has(oldId))continue;
        const from=previousPositions.get(oldId);
        if(!from)continue;
        const ghost=oldEl.cloneNode(true);
        ghost.classList.remove('node');ghost.classList.add('branch-motion-ghost');
        ghost.removeAttribute('data-id');ghost.removeAttribute('tabindex');
        ghost.removeAttribute('role');ghost.setAttribute('aria-hidden','true');
        ghost.style.pointerEvents='none';
        ghost.querySelectorAll('[role],[tabindex],[data-expand]').forEach(child=>{
          child.removeAttribute('role');child.removeAttribute('tabindex');
          child.removeAttribute('data-expand');
        });
        layer.append(ghost);
        ghosts.push({el:ghost,from,to:state.pos.get(id)||anchor});
      }
    }
    if(!nodes.length&&!ghosts.length)return;
    const motion={frame:0,nodes,paths,ghosts};
    treeMotion=motion;
    let origin=null;
    const mix=(a,b,t)=>a+(b-a)*t;
    const frame=timestamp=>{
      if(treeMotion!==motion)return;
      if(origin===null)origin=timestamp;
      const t=Math.min(1,(timestamp-origin)/motionDuration);
      const eased=1-Math.pow(1-t,3);
      for(const item of nodes){
        item.el.setAttribute('transform','translate('+
          mix(item.from.x,item.to.x,eased)+' '+
          mix(item.from.y,item.to.y,eased)+')');
        if(item.entering)item.el.style.opacity=String(eased);
      }
      for(const item of paths){
        const v=key=>mix(item.from[key],item.to[key],eased);
        item.el.setAttribute('d','M '+v('x1')+' '+v('y1')+
          ' L '+v('x2')+' '+v('y2'));
        if(item.entering)item.el.style.opacity=String(eased);
      }
      for(const ghost of ghosts){
        // Fade and converge removed descendants back onto their actual clade.
        ghost.el.setAttribute('transform','translate('+
          mix(ghost.from.x,ghost.to.x,eased)+' '+
          mix(ghost.from.y,ghost.to.y,eased)+')');
        ghost.el.style.opacity=String(1-eased);
      }
      if(t<1)motion.frame=requestAnimationFrame(frame);
      else finishTreeMotion();
    };
    motion.frame=requestAnimationFrame(frame);
  }
  function toggleBranch(id,{restoreFocus=false}={}){
    if(state.engine!=='v2'||!byId.has(id))return;
    finishTreeMotion();
    const node=state.layoutMeta.get(id);
    if(!node)return;
    const old=state.pos.get(id),screenX=old?state.tx+old.x*state.zoom:null,
      screenY=old?state.ty+old.y*state.zoom:null;
    const previousPositions=new Map([...state.pos].map(([key,p])=>[key,{...p}]));
    const previousSegments=state.layoutSegments.map(seg=>({...seg}));
    const previousElements=new Map([...$('nodeLayer').querySelectorAll(':scope > .node')]
      .map(el=>[el.dataset.id,el]));
    if(node.collapsed){
      state.foldedIds.delete(id);
      state.expandedIds.add(id);
    }else if(node.childIds.length){
      state.foldedIds.add(id);
      state.expandedIds.delete(id);
      if(state.selected&&state.selected!==id&&inside(state.selected,id)){
        state.selected=id;showDetail(byId.get(id));
      }
    }else return;
    render(false);
    const updated=state.pos.get(id);
    if(updated&&screenX!==null){
      state.tx=screenX-updated.x*state.zoom;
      state.ty=screenY-updated.y*state.zoom;
    }
    applyTransform();
    animateTreeDisclosure(previousPositions,previousSegments,previousElements,id);
    if(restoreFocus){
      const focus=$('nodeLayer').querySelector('[data-expand="'+id+'"]')||
        $('nodeLayer').querySelector('[data-id="'+id+'"]');
      focus?.focus({preventScroll:true});
    }
    syncUrl();
  }

  function xFor(ma){
    const left=state.engine==='v2'?state.layoutMarginX:65;
    const right=state.engine==='v2'?state.layoutRightInset:215;
    const available=(state.engine==='v2'?state.layoutPlotWidth:state.width)-left-right;
    const fraction=state.scale==='linear'
      ?1-ma/Math.max(1,state.maxMa)
      :1-Math.log10(ma+1)/Math.log10(Math.max(1,state.maxMa)+1);
    return left+Math.max(0,Math.min(1,fraction))*available;
  }
  function depthX(depth){
    return state.layoutMarginX+depth*state.layoutDepthStep;
  }
  function layoutLegacy(){
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
    if(state.engine==='v2'&&state.detail==='focus')return;
    if(state.engine==='v2'&&state.layoutMode==='structure'){
      const depths=new Set([...state.layoutMeta.values()].map(n=>n.depth));
      [...depths].sort((a,b)=>a-b).forEach(depth=>{
        const x=depthX(depth);
        layer.append(make('line',{x1:x,y1:43,x2:x,y2:state.height-25,class:'grid-line'}));
      });
      return;
    }
    axisTicks().forEach(ma=>{
      const x=xFor(ma);
      layer.append(make('line',{x1:x,y1:43,x2:x,y2:state.height-25,class:'grid-line'}));
    });
  }
  function axisText(ma){
    if(ma===0)return '现在';
    if(ma>=1000)return Number((ma/1000).toFixed(2))+' Ga';
    return Number(ma.toFixed(1))+' Ma';
  }
  function drawAxisOverlay(){
    const overlay=$('axisOverlay');
    if(state.engine==='v2'&&state.detail==='focus'){overlay.replaceChildren();return;}
    const width=$('graphStage').clientWidth;
    if(width<10)return;
    overlay.setAttribute('viewBox','0 0 '+width+' 38');
    overlay.replaceChildren();
    const caption=make('text',{x:10,y:23,class:'axis-fixed-caption'});
    const structural=state.engine==='v2'&&state.layoutMode==='structure';
    caption.textContent=structural?'层级':'时间';overlay.append(caption);
    const placed=[{left:0,right:57}];
    const ticks=structural
      ? [...new Set([...state.layoutMeta.values()].map(n=>n.depth))]
        .map(depth=>({depth,x:state.tx+depthX(depth)*state.zoom}))
      : axisTicks().map(ma=>({ma,x:state.tx+xFor(ma)*state.zoom}));
    ticks.sort((a,b)=>a.x-b.x);
    const visibleTicks=ticks.filter(t=>t.x>=8&&t.x<width-8);
    for(const tick of visibleTicks){
      const text=structural?(tick.depth===0?'根节点':'层级 '+tick.depth):axisText(tick.ma);
      const w=approximateLabelWidth(text)+10;
      const x=Math.max(w/2+7,Math.min(width-w/2-7,tick.x));
      const rect={left:x-w/2,right:x+w/2};
      if(placed.some(old=>rect.left<old.right+9 && rect.right>old.left-9))continue;
      overlay.append(make('line',{x1:tick.x,y1:29,x2:tick.x,y2:37,class:'axis-fixed-tick'}));
      const label=make('text',{x,y:21,'text-anchor':'middle',class:'axis-fixed-label'});
      label.textContent=text;overlay.append(label);placed.push(rect);
    }
  }
  let axisFrame=0;
  function scheduleAxisOverlay(){
    if(axisFrame)return;
    axisFrame=requestAnimationFrame(()=>{axisFrame=0;drawAxisOverlay();});
  }
    function drawEvents(){
    const layer=$('eventLayer');layer.replaceChildren();
    if(!state.events||(state.engine==='v2'&&state.layoutMode==='structure'))return;
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
  function drawTreeLegacy(){
    const edges=$('edgeLayer'),nodes=$('nodeLayer');
    edges.replaceChildren();nodes.replaceChildren();
    const activePath=new Set(state.selected?path(state.selected).map(n=>n.id):[]);
    state.visible.forEach(n=>{
      const parent=state.parents.get(n.id);if(!parent)return;
      const a=state.pos.get(parent),b=state.pos.get(n.id);if(!a||!b)return;
      const middle=a.x+Math.max(12,(b.x-a.x)*.38);
      const d='M '+a.x+' '+a.y+' H '+middle+' V '+b.y+' H '+b.x;
      edges.append(make('path',{d,'data-child':n.id,class:'edge'+(activePath.has(n.id)&&activePath.has(parent)?' active-path':'')}));
    });
    drawNodes();
  }

  // Consistent, measured labels: no candidate position jitter. Secondary
  // labels are muted if their measured boxes overlap a higher-priority label.
  // Tree geometry never changes to make room for text.
  const measureCanvas=document.createElement('canvas');
  const measureContext=measureCanvas.getContext('2d');
  function measuredTextWidth(text,font='500 12px system-ui, sans-serif'){
    if(!measureContext)return approximateLabelWidth(text);
    measureContext.font=font;
    return measureContext.measureText(text).width+7;
  }
  function chooseFocusLabels(){
    return new Map(state.visible.map(n=>{
      const childCount=state.layoutMeta.get(n.id)?.childIds.length||0;
      const hidden=state.hiddenById?.get(n.id)||0;
      const internal=childCount>0||hidden>0;
      // Parent labels sit above their branching line. Never put the focus
      // root's title directly on its horizontal sibling connector.
      const labelY=n.id===state.root?-24:internal?-12:0;
      return [n.id,{dx:14,dy:labelY,
        side:'right',leaf:!internal,collapsed:false,hidden:false}];
    }));
  }
  function chooseLabelsAtlas(){
    if(state.detail==='focus')return chooseFocusLabels();
    const labels=new Map(),occupied=[];
    const nodes=[...state.visible].sort((a,b)=>{
      const value=n=>{
        const m=state.layoutMeta.get(n.id);
        return (state.selected===n.id?10000:0)
          +(n.id===state.root?8000:0)
          +(m?.collapsed?3000:0)
          +(!m?.childIds.length?1600:500);
      };
      return value(b)-value(a) || state.pos.get(a.id).y-state.pos.get(b.id).y;
    });
    const overlaps=(r,o)=>r.left<o.right+7&&r.right+7>o.left&&
      r.top<o.bottom+5&&r.bottom+5>o.top;
    for(const n of nodes){
      const p=state.pos.get(n.id),m=state.layoutMeta.get(n.id);
      if(!p||!m)continue;
      const collapsed=Boolean(m.collapsed);
      const terminal=m.childIds.length===0&&!collapsed;
      const text=collapsed?n.zh+'  '+m.hiddenDescendants+' 个后代':n.zh;
      const dx=collapsed?38:14;
      const dy=collapsed||terminal?0:-17;
      const font=n.id===state.root?'650 16px system-ui, sans-serif':
        collapsed?'600 14px system-ui, sans-serif':'500 15px system-ui, sans-serif';
      const width=measuredTextWidth(text,font);
      const rect={left:p.x+dx,right:p.x+dx+width,
        top:p.y+dy-9,bottom:p.y+dy+10};
      const collides=occupied.some(other=>overlaps(rect,other));
      const hidden=!collapsed&&collides&&n.id!==state.selected&&n.id!==state.root;
      if(!hidden)occupied.push(rect);
      labels.set(n.id,{dx,dy,side:'right',leaf:terminal,
        collapsed,hidden,rect});
    }
    return labels;
  }

  function drawNodes(){
    const nodes=$('nodeLayer');nodes.replaceChildren();
    const labels=state.engine==='v2'?chooseLabelsAtlas():chooseLabels();
    state.visible.forEach(n=>{
      const point=state.pos.get(n.id),meta=labels.get(n.id);
      if(!point||!meta)return;
      const node=make('g',{class:'node '+n.status+(meta.leaf?' terminal':' internal')+(n.id===state.selected?' selected':''),
        transform:'translate('+point.x+' '+point.y+')','data-id':n.id,tabindex:0,role:'button',
        'aria-label':n.zh+'，'+n.rank+'，'+nodeAge(n)});
      node.append(make('circle',{class:'node-halo',r:12}),make('circle',{class:'node-core',r:n.id===state.root?6:4.8}));
      if(!meta.collapsed){
        const label=make('text',{class:'node-label'+(meta.hidden?' label-deemphasized':''),
          x:meta.dx,y:meta.dy,
          'text-anchor':meta.side==='right'?'start':'end',
          'dominant-baseline':'middle'});
        label.textContent=n.zh;
        if(state.engine==='legacy'&&Math.abs(meta.dy)>=16){
          node.append(make('path',{d:'M 0 0 L '+(meta.dx>0?7:-7)+' '+meta.dy,
            class:'node-label-guide'}));
        }
        node.append(label);
        if(state.engine==='v2'&&state.detail==='focus'&&n.id!==state.root){
          const behind=state.hiddenById?.get(n.id)||0;
          if(behind){
            const small=make('text',{class:'focus-node-meta',x:14,y:meta.dy+19});
            small.textContent=behind+' 个未展开节点';
            node.append(small);
          }
        }
      }
      const hidden=state.hiddenById?.get(n.id)||0;
      const hasChildren=(children.get(n.id)||[]).length>0;
      const layoutNode=state.engine==='v2'?state.layoutMeta.get(n.id):null;
      const canToggle=state.engine==='v2'
        ? state.detail!=='focus'&&Boolean(layoutNode&&(layoutNode.collapsed||layoutNode.childIds.length))
        : state.detail==='overview'&&hidden>=3&&hasChildren;
      if(n.id!==state.root && canToggle){
        const expanded=state.engine==='v2' && !layoutNode.collapsed;
        const more=make('g',{class:'node-more'+(expanded?' expanded':'')+
          (layoutNode?.collapsed?' collapsed-summary':''),
          'data-expand':n.id,role:'button',tabindex:0,
          'aria-label':expanded?'收起'+n.zh+'支系':'展开'+n.zh+'，查看 '+hidden+' 个后代'});
        if(state.engine==='v2'&&layoutNode.collapsed){
          // A small disclosure marker is an *interface affordance*, not a
          // phylogenetic split. The entire row remains keyboard/touch usable.
          const nameX=37,countText=hidden+' 个后代';
          const nameWidth=measuredTextWidth(n.zh,'600 13px system-ui, sans-serif');
          const countX=nameX+nameWidth+11;
          const hitWidth=Math.max(130,countX+measuredTextWidth(countText,'450 11px system-ui, sans-serif')+7);
          more.setAttribute('aria-expanded','false');
          more.setAttribute('aria-description','点击展开当前支系，双击节点名称进入类群');
          more.append(make('rect',{class:'clade-row-bg',x:6,y:-20,
            width:hitWidth-6,height:40,rx:6}));
          // 12 × 12 is intentionally much smaller than the former ~45 × 22.
          more.append(make('path',{class:'clade-wedge',
            d:'M 14 -6 L 26 0 L 14 6 Z'}));
          const name=make('text',{x:nameX,y:0,'dominant-baseline':'middle',
            class:'clade-summary-name'});
          name.textContent=n.zh;more.append(name);
          const count=make('text',{x:countX,y:0,'dominant-baseline':'middle',
            class:'clade-summary-count'});
          count.textContent=countText;more.append(count);
          more.append(make('rect',{class:'clade-hit-area',x:6,y:-20,
            width:hitWidth-6,height:40,rx:6}));
        }else if(state.engine==='v2'&&expanded){
          // Once expanded, the same branch gets a subtle reverse disclosure
          // beside its junction, not another chip below the label.
          more.classList.add('clade-collapse-toggle');
          more.append(make('rect',{class:'clade-collapse-hit',
            x:-30,y:-17,width:28,height:34,rx:6}));
          more.append(make('path',{class:'clade-collapse-chevron',
            d:'M -23 -2 L -16 5 L -9 -2'}));
        }else{
          const glyph=expanded?'−':hidden>99?'99+':'+'+hidden;
          const width=14+glyph.length*7.2;
          more.append(make('rect',{x:9,y:18,width,height:18,rx:6}));
          const count=make('text',{x:9+width/2,y:30,'text-anchor':'middle'});
          count.textContent=glyph;more.append(count);
        }
        if(state.engine==='v2')more.setAttribute('aria-expanded',String(expanded));
        const action=(keyboard=false)=>state.engine==='v2'
          ?toggleBranch(n.id,{restoreFocus:keyboard}):focusRoot(n.id);
        more.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();action(false);
        });
        more.addEventListener('keydown',event=>{
          if(event.key==='Enter'||event.key===' '){
            event.preventDefault();event.stopPropagation();action(true);
          }
        });
        node.append(more);
      }
      node.addEventListener('click',e=>{
        e.stopPropagation();
        const now=performance.now();
        if(now<(state.suppressClickUntil||0))return;
        const twice=state.lastNodeClick?.id===n.id && now-state.lastNodeClick.time<360;
        if(twice && hasChildren){
          state.lastNodeClick=null;
          focusRoot(n.id);
        }else{
          state.lastNodeClick={id:n.id,time:now};
          // A mouse click already points at a visible node: avoid recentering
          // and replacing it under the cursor before the second click.
          selectNode(n.id,{center:false});
        }
      });
      node.addEventListener('keydown',e=>navigateNodeKeyboard(e,n.id));
      node.addEventListener('mouseenter',e=>{
        highlightLineage(n.id);
        if(!e.target.closest('.collapsed-summary'))showTip(e,n);
      });
      node.addEventListener('mousemove',e=>{
        if(e.target.closest('.collapsed-summary'))hideTip();
        else moveTip(e);
      });
      node.addEventListener('mouseleave',()=>{highlightLineage(null);hideTip();});
      node.addEventListener('focus',()=>{node.classList.add('keyboard-focus');highlightLineage(n.id);});
      node.addEventListener('blur',()=>{node.classList.remove('keyboard-focus');highlightLineage(null);});
      nodes.append(node);
    });
  }

  function drawTreeV2(){
    const edges=$('edgeLayer');
    edges.replaceChildren();
    const lineage=new Set(state.selected?path(state.selected).map(n=>n.id):[]);
    for(const segment of state.layoutSegments){
      const onPath=segment.kind==='stem'
        ?lineage.has(segment.ownerId)
        :lineage.has(segment.ownerId)&&lineage.has(segment.childId);
      const d='M '+segment.x1+' '+segment.y1+' L '+segment.x2+' '+segment.y2;
      edges.append(make('path',{d,
        class:'edge '+(segment.kind==='stem'?'edge-stem':'edge-arm')+(onPath?' active-path':''),
        'data-owner':segment.ownerId,'data-child':segment.childId||''}));
    }
    drawNodes();
  }
  function drawTree(){
    return state.engine==='v2'?drawTreeV2():drawTreeLegacy();
  }

  function navigateNodeKeyboard(e,id){
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();e.stopPropagation();
      if(e.shiftKey && (children.get(id)||[]).length)focusRoot(id);
      else selectNode(id);
      return;
    }
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();e.stopPropagation();
    const ids=new Set(state.visible.map(n=>n.id));
    const siblings=state.visible.filter(n=>state.parents.get(n.id)===state.parents.get(id))
      .sort((a,b)=>state.pos.get(a.id).y-state.pos.get(b.id).y);
    let next=null;
    if(e.key==='ArrowLeft')next=state.parents.get(id);
    else if(e.key==='ArrowRight'){
      next=(children.get(id)||[]).find(child=>ids.has(child));
      if(!next && (children.get(id)||[]).length){focusRoot(id);next=id;}
    }else{
      const i=siblings.findIndex(n=>n.id===id);
      if(i>=0)next=siblings[i+(e.key==='ArrowDown'?1:-1)]?.id;
    }
    if(next && byId.has(next)){
      selectNode(next,{center:true,open:false});
      $('nodeLayer').querySelector('[data-id="'+next+'"]')?.focus({preventScroll:true});
    }
  }
  function highlightLineage(id){
    const tree=$('treeSvg');
    const ancestry=new Set(id?path(id).map(n=>n.id):[]);
    tree.classList.toggle('has-hover',Boolean(id));
    $('edgeLayer').querySelectorAll('[data-child], [data-owner]').forEach(el=>{
      const isStem=el.classList.contains('edge-stem');
      el.classList.toggle('hover-path',isStem
        ?ancestry.has(el.dataset.owner)
        :ancestry.has(el.dataset.child));
    });
    $('nodeLayer').querySelectorAll('.node').forEach(el=>{
      el.classList.toggle('hover-lineage',ancestry.has(el.dataset.id));
    });
  }
  const MINI_W=204,MINI_H=118,MINI_PAD=8;
  function miniPoint(point){
    return {x:MINI_PAD+point.x*(MINI_W-MINI_PAD*2)/Math.max(1,state.width),
      y:MINI_PAD+point.y*(MINI_H-MINI_PAD*2)/Math.max(1,state.height)};
  }
  function drawMinimap(){
    const edges=$('minimapEdges'),nodes=$('minimapNodes');
    edges.replaceChildren();nodes.replaceChildren();
    if(!state.pos.size)return;
    if(state.engine==='v2'){
      for(const segment of state.layoutSegments){
        const start=miniPoint({x:segment.x1,y:segment.y1});
        const end=miniPoint({x:segment.x2,y:segment.y2});
        edges.append(make('path',{d:'M '+start.x+' '+start.y+' L '+end.x+' '+end.y}));
      }
    }else{
      for(const n of state.visible){
        const point=miniPoint(state.pos.get(n.id));
        const parent=state.parents.get(n.id);
        if(parent && state.pos.has(parent)){
          const from=miniPoint(state.pos.get(parent));
          const middle=from.x+(point.x-from.x)*.35;
          edges.append(make('path',{d:'M '+from.x+' '+from.y+' H '+middle+' V '+point.y+' H '+point.x}));
        }
      }
    }
    for(const n of state.visible){
      const point=miniPoint(state.pos.get(n.id));
      if(n.id===state.root || n.id===state.selected || (children.get(n.id)||[]).length>=5)
        nodes.append(make('circle',{cx:point.x,cy:point.y,r:n.id===state.selected?2.8:1.6,
          class:n.id===state.selected?'mini-selected':'mini-node'}));
    }
    updateMinimapViewport();
  }
  function updateMinimapViewport(){
    if(!state.pos.size)return;
    const box=$('graphStage').getBoundingClientRect();
    if(box.width<10||box.height<10)return;
    const scaleX=(MINI_W-MINI_PAD*2)/Math.max(1,state.width);
    const scaleY=(MINI_H-MINI_PAD*2)/Math.max(1,state.height);
    const worldLeft=-state.tx/state.zoom,worldTop=-state.ty/state.zoom;
    const x=Math.max(MINI_PAD,Math.min(MINI_W-MINI_PAD,MINI_PAD+worldLeft*scaleX));
    const y=Math.max(MINI_PAD,Math.min(MINI_H-MINI_PAD,MINI_PAD+worldTop*scaleY));
    const right=Math.max(MINI_PAD,Math.min(MINI_W-MINI_PAD,
      MINI_PAD+(worldLeft+box.width/state.zoom)*scaleX));
    const bottom=Math.max(MINI_PAD,Math.min(MINI_H-MINI_PAD,
      MINI_PAD+(worldTop+box.height/state.zoom)*scaleY));
    const view=$('minimapViewport');
    view.setAttribute('x',x);view.setAttribute('y',y);
    view.setAttribute('width',Math.max(2,right-x));
    view.setAttribute('height',Math.max(2,bottom-y));
  }
  function constrainTransform(){
    const box=$('graphStage').getBoundingClientRect();
    if(box.width<10||box.height<10)return;
    const limit=(translation,worldLength,screenLength)=>{
      const scaled=worldLength*state.zoom;
      if(scaled<=screenLength)return (screenLength-scaled)/2;
      const visibleStrip=Math.min(88,screenLength*.23);
      return Math.max(visibleStrip-scaled,Math.min(screenLength-visibleStrip,translation));
    };
    state.tx=limit(state.tx,state.width,box.width);
    state.ty=limit(state.ty,state.height,box.height);
  }
  function applyTransform(){
    constrainTransform();
    $('viewport').setAttribute('transform','translate('+state.tx+' '+state.ty+') scale('+state.zoom+')');
    $('graphStage').dataset.density=state.zoom<.32?'far':state.zoom<.58?'medium':'near';
    updateMinimapViewport();
    scheduleAxisOverlay();
  }
  function fit(showEntireTree=false){
    if(state.view!=='tree')return;
    const box=$('graphStage').getBoundingClientRect();
    if(box.width<10||box.height<10)return;
    const fitFactor=Math.min((box.width-44)/state.width,(box.height-40)/state.height);
    const natural=state.engine==='v2'&&state.detail==='focus'
      ?Math.max(.12,Math.min(1.05,fitFactor))
      :Math.max(.12,Math.min(1.5,fitFactor));
    const minLegible=box.width<600?.8:.75;
    if(!showEntireTree && natural<minLegible){
      // Dense branches are unreadable when every label is scaled into a
      // thumbnail. Open at a usable local zoom, and keep the Fit button as
      // the explicit way to view the entire (possibly very large) subtree.
      state.zoom=minLegible;
      const point=state.pos.get(state.selected||state.root);
      const anchorX=box.width*(box.width<600?.20:.24);
      state.tx=anchorX-(point?.x||65)*state.zoom;
      state.ty=box.height*.47-(point?.y||state.height/2)*state.zoom;
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
    const old=state.zoom,next=Math.max(.12,Math.min(5,old*factor));
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
    const menu=$('breadcrumbMenu');
    menu.hidden=true;
    const makeSlash=()=>{
      const slash=document.createElement('span');
      slash.className='breadcrumb-separator';
      slash.setAttribute('aria-hidden','true');
      slash.textContent='/';
      return slash;
    };
    const makeCrumb=(taxon,current)=>{
      const button=document.createElement('button');
      button.type='button';button.textContent=taxon.zh;
      button.dataset.focus=taxon.id;
      if(current)button.setAttribute('aria-current','location');
      button.addEventListener('click',()=>focusRoot(taxon.id));
      return button;
    };
    const abbreviated=state.engine==='v2'&&state.detail==='focus'&&ancestors.length>4;
    if(!abbreviated){
      ancestors.forEach((taxon,i)=>{
        if(i)box.append(makeSlash());
        box.append(makeCrumb(taxon,i===ancestors.length-1));
      });
    }else{
      box.append(makeCrumb(ancestors[0],false),makeSlash());
      const middle=document.createElement('button');
      middle.type='button';middle.textContent='…';
      middle.className='breadcrumb-overflow';
      middle.setAttribute('aria-label','查看完整祖先路径');
      middle.setAttribute('aria-haspopup','menu');
      middle.setAttribute('aria-expanded','false');
      middle.addEventListener('click',e=>{
        e.stopPropagation();
        const shouldOpen=menu.hidden;
        menu.replaceChildren();
        if(shouldOpen){
          for(const taxon of ancestors.slice(1,-2)){
            const option=document.createElement('button');
            option.type='button';option.role='menuitem';
            option.textContent=taxon.zh;
            option.addEventListener('click',()=>{menu.hidden=true;focusRoot(taxon.id);});
            menu.append(option);
          }
          const rect=middle.getBoundingClientRect();
          menu.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-240))+'px';
          menu.style.top=(rect.bottom+9)+'px';
        }
        menu.hidden=!shouldOpen;
        middle.setAttribute('aria-expanded',String(shouldOpen));
      });
      box.append(middle);
      for(const [i,taxon] of ancestors.slice(-2).entries()){
        box.append(makeSlash());
        box.append(makeCrumb(taxon,i===1));
      }
    }
    box.scrollLeft=box.scrollWidth;
  }
  function render(fitNow=false){
    finishTreeMotion();
    $('treeSvg').classList.remove('has-hover');
    hideTip();
    build();layout();drawGrid();drawEvents();drawTree();drawMinimap();
    $('graphStage').dataset.layout=state.layoutMode;
    $('graphStage').dataset.detail=state.detail;
    $('treeView').dataset.layout=state.layoutMode;
    $('treeView').dataset.detail=state.detail;
    $('graphStage').dataset.engine=state.engine;
    const structure=state.engine==='v2' && state.layoutMode==='structure';
    $('scaleSelect').disabled=structure;
    $('eventToggle').disabled=structure;
    window.EvoSelect?.sync($('scaleSelect'));
    $('graphStage').dataset.scale=state.scale;
    $('graphEmpty').hidden=state.visible.length>0;
    const hint=$('graphStage').querySelector('.graph-overlay-hint');
    if(hint)hint.textContent=state.engine==='v2'
      ? state.detail==='focus'?'双击节点深入类群':'点击三角展开支系 · 双击聚焦 · 滚轮缩放'
      : state.detail==='overview'&&state.visible.length<state.totalAvailable
        ? '显示 '+state.visible.length+'/'+state.totalAvailable+' · 双击或点 +N 深入支系'
        : '滚轮缩放 · 拖拽移动 · 点击类群查看';
    const focusMode=state.engine==='v2'&&state.detail==='focus';
    const controls=$('focusCommands'),toggle=$('showMoreChildren'),status=$('focusStatus');
    controls.hidden=!focusMode;
    $('graphMinimap').hidden=focusMode;
    if(focusMode){
      const count=state.layoutSource.directCount||0;
      const shown=state.layoutSource.directShown||0;
      const more=state.layoutSource.remainingDirect||0;
      status.textContent=count
        ?'本级已显示 '+shown+' / '+count+' 个直属类群'
        :'当前类群暂无下级条目';
      const expanded=state.expandedIds.has(state.root);
      toggle.hidden=!more&&!expanded;
      toggle.textContent=expanded?'恢复精简':'显示其余 '+more+' 项';
    }
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
    tip.innerHTML='<strong>'+esc(n.zh)+'</strong><em>'+esc(n.latin)+'</em><small>'+esc(n.rank)+' · '+esc(nodeAge(n))+'</small>'+
      ((children.get(n.id)||[]).length?'<small>双击可聚焦此支系</small>':'');
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
    if(state.engine==='v2'&&state.detail==='focus'&&!state.layoutMeta.has(id) && n.parent){
      // Deep search hits open their actual parent in the focus explorer.
      state.root=n.parent;
    }
    if(!state.extinct && n.status==='extinct'){$('extinctToggle').checked=true;state.extinct=true;}
    state.selected=id;
    if(state.engine==='v2'){
      // Reveal the selected true lineage, even when ancestors were auto-folded.
      for(const ancestor of path(id)){
        // Reveal a searched descendant's parents, but simply selecting a
        // collapsed clade must not silently expand its own descendants.
        if(ancestor.id!==id)state.foldedIds.delete(ancestor.id);
        if(ancestor.id===state.root)break;
      }
    }
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
    $('detailRank').textContent=n.rank+'  ·  '+kind+(n.evidenceState==='pending-review'?' · 名称待核验':'');
    $('detailName').textContent=n.zh;
    $('detailLatin').textContent=n.latin;
    $('detailSummary').textContent=n.summary;
    $('detailAge').textContent=nodeAge(n);
    $('detailStatus').textContent=n.status==='extinct'?'灭绝':n.status==='extant'?'现生':'内部支系';
    const recordedTraits=n.traits||[];
    $('traitList').replaceChildren(...recordedTraits.map(trait=>{const el=document.createElement('span');el.textContent=trait;return el;}));
    if(!recordedTraits.length){
      const note=document.createElement('span');
      note.className='unverified-trait-note';
      note.textContent='尚无逐种核验的性状记录';
      $('traitList').append(note);
    }
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
    Object.assign(state,{root:'luca',scale:'log',layoutMode:state.engine==='legacy'?'time':'structure',detail:state.engine==='legacy'?'overview':'focus',extinct:true,events:true,selected:null});
    state.foldedIds.clear();state.expandedIds.clear();
    $('scaleSelect').value='log';$('layoutModeSelect').value=state.layoutMode;$('detailSelect').value=state.detail;
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
    document.addEventListener('pointerdown',event=>{
      const menu=$('breadcrumbMenu');
      if(!menu.hidden&&!menu.contains(event.target)&&
        !event.target.closest('.breadcrumb-overflow'))menu.hidden=true;
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')$('breadcrumbMenu').hidden=true;
    });
    $('suggestNode').addEventListener('click',()=>selectNode('sapiens'));
    $('randomSpecies').addEventListener('click',()=>{
      const species=taxa.filter(n=>n.rank==='种');
      const random=species[Math.floor(Math.random()*species.length)];
      if(random)selectNode(random.id);
    });
    $('scaleSelect').addEventListener('change',e=>{state.scale=e.target.value;render(true);});
    $('showMoreChildren').addEventListener('click',()=>{
      if(state.expandedIds.has(state.root))state.expandedIds.delete(state.root);
      else state.expandedIds.add(state.root);
      render(true);
    });
    $('layoutModeSelect').addEventListener('change',e=>{
      state.layoutMode=e.target.value;
      if(state.engine==='v2'&&state.detail==='focus'&&state.layoutMode==='time'){
        state.detail='overview';
        $('detailSelect').value='overview';
        window.EvoSelect?.sync($('detailSelect'));
      }
      if(state.engine==='legacy' && state.layoutMode==='structure'){
        state.layoutMode='time';e.target.value='time';
        window.EvoSelect?.sync(e.target);
      }
      render(true);
    });
    $('detailSelect').addEventListener('change',e=>{
      state.detail=e.target.value;
      if(state.engine==='v2'&&state.detail==='focus'){
        state.layoutMode='structure';
        $('layoutModeSelect').value='structure';
        window.EvoSelect?.sync($('layoutModeSelect'));
      }
      render(true);
    });
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
    stage.addEventListener('wheel',e=>{
      if(state.view!=='tree')return;
      e.preventDefault();
      // Smooth trackpads should have proportional zoom, not the same jump as a
      // traditional wheel notch. Clamp to avoid abrupt jumps on high delta.
      const factor=Math.max(.84,Math.min(1.2,Math.exp(-e.deltaY*.00145)));
      zoomAt(factor,e.clientX,e.clientY);
    },{passive:false});

    const pointers=new Map();
    let pinch=null;
    const pinchBegin=()=>{
      const points=[...pointers.values()];
      if(points.length<2)return;
      const box=stage.getBoundingClientRect();
      const cx=(points[0].x+points[1].x)/2-box.left;
      const cy=(points[0].y+points[1].y)/2-box.top;
      pinch={distance:Math.max(5,Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)),
        zoom:state.zoom,wx:(cx-state.tx)/state.zoom,wy:(cy-state.ty)/state.zoom};
      state.drag=null;
    };
    stage.addEventListener('pointerdown',e=>{
      if(e.button!==0 && e.pointerType!=='touch')return;
      if(e.pointerType!=='touch'&&e.target.closest('.node'))return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
      if(pointers.size===1){
        state.drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,tx:state.tx,ty:state.ty};
        // Capturing the first tap on a node would steal its click. For touch
        // nodes capture only after a real move begins.
        if(!e.target.closest('.node'))stage.setPointerCapture(e.pointerId);
      }else if(pointers.size===2){
        pinchBegin();
        stage.classList.add('dragging');
        stage.setPointerCapture(e.pointerId);
      }
    });
    stage.addEventListener('pointermove',e=>{
      const pointer=pointers.get(e.pointerId);
      if(!pointer)return;
      pointer.x=e.clientX;pointer.y=e.clientY;
      if(pointers.size>=2){
        if(!pinch)pinchBegin();
        const points=[...pointers.values()];
        const box=stage.getBoundingClientRect();
        const cx=(points[0].x+points[1].x)/2-box.left;
        const cy=(points[0].y+points[1].y)/2-box.top;
        const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
        state.zoom=Math.max(.12,Math.min(5,pinch.zoom*distance/pinch.distance));
        state.tx=cx-pinch.wx*state.zoom;
        state.ty=cy-pinch.wy*state.zoom;
        state.suppressClickUntil=performance.now()+280;
        applyTransform();e.preventDefault();return;
      }
      if(!state.drag||state.drag.pointer!==e.pointerId)return;
      const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
      if(Math.hypot(dx,dy)>=4){
        stage.classList.add('dragging');
        state.suppressClickUntil=performance.now()+280;
        if(!stage.hasPointerCapture(e.pointerId))stage.setPointerCapture(e.pointerId);
      }
      if(stage.classList.contains('dragging')){
        state.tx=state.drag.tx+dx;state.ty=state.drag.ty+dy;
        applyTransform();e.preventDefault();
      }
    });
    const endDrag=e=>{
      if(!pointers.has(e.pointerId))return;
      pointers.delete(e.pointerId);
      if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
      if(pointers.size===1){
        const [id,p]=[...pointers.entries()][0];
        state.drag={pointer:id,x:p.x,y:p.y,tx:state.tx,ty:state.ty};
        pinch=null;
      }else if(!pointers.size){
        state.drag=null;pinch=null;stage.classList.remove('dragging');
      }
    };
    stage.addEventListener('pointerup',endDrag);
    stage.addEventListener('pointercancel',endDrag);
    stage.addEventListener('lostpointercapture',e=>{
      // Ending a gesture outside the viewer must never strand dragging state.
      if(pointers.has(e.pointerId))endDrag(e);
    });

    const minimap=$('graphMinimap'),minimapSvg=$('graphMinimapSvg');
    const gotoMiniPoint=(clientX,clientY)=>{
      const bounds=minimapSvg.getBoundingClientRect();
      const x=(clientX-bounds.left)/bounds.width*MINI_W;
      const y=(clientY-bounds.top)/bounds.height*MINI_H;
      const wx=(x-MINI_PAD)/(MINI_W-2*MINI_PAD)*state.width;
      const wy=(y-MINI_PAD)/(MINI_H-2*MINI_PAD)*state.height;
      const box=stage.getBoundingClientRect();
      state.tx=box.width/2-wx*state.zoom;
      state.ty=box.height/2-wy*state.zoom;
      applyTransform();
    };
    let miniPointer=null;
    minimap.addEventListener('pointerdown',e=>{
      if(e.button!==0&&e.pointerType!=='touch')return;
      e.preventDefault();e.stopPropagation();
      miniPointer=e.pointerId;minimap.setPointerCapture(e.pointerId);
      gotoMiniPoint(e.clientX,e.clientY);
    });
    minimap.addEventListener('pointermove',e=>{
      if(miniPointer!==e.pointerId)return;
      e.preventDefault();e.stopPropagation();
      gotoMiniPoint(e.clientX,e.clientY);
    });
    const miniEnd=e=>{
      if(miniPointer!==e.pointerId)return;
      miniPointer=null;e.stopPropagation();
      if(minimap.hasPointerCapture(e.pointerId))minimap.releasePointerCapture(e.pointerId);
    };
    minimap.addEventListener('pointerup',miniEnd);
    minimap.addEventListener('pointercancel',miniEnd);
    minimap.addEventListener('keydown',e=>{
      const dx=e.key==='ArrowRight'?-75:e.key==='ArrowLeft'?75:0;
      const dy=e.key==='ArrowDown'?-75:e.key==='ArrowUp'?75:0;
      if(dx||dy){e.preventDefault();e.stopPropagation();state.tx+=dx;state.ty+=dy;applyTransform();}
      else if(e.key==='Home'){e.preventDefault();fit(true);}
    });

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
    if(state.engine==='legacy'){
      state.detail='overview';
      $('detailSelect').value='overview';
      document.querySelector('#detailSelect option[value="focus"]').disabled=true;
      state.layoutMode='time';
      $('layoutModeSelect').value='time';
      $('layoutModeSelect').disabled=true;
      $('layoutModeSelect').title='旧版回退模式仅支持时间坐标';
    }
    window.EvoSelect?.enhanceAll();
    bind();readHash();compare();
  }
  init();
})();