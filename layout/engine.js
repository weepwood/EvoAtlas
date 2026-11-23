/**
 * EvoAtlas layout engine v2 - isolated, dependency-free research prototype.
 *
 * IMPORTANT: This module does not modify the canonical taxonomy or generate
 * synthetic evolutionary nodes. Its returned coordinates are presentation.
 *
 * Used by the SVG renderer. See docs/layout-engine-v2.md.
 */
(function (root, factory) {
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.EvoLayoutEngine=api;
})(typeof globalThis==='undefined'?null:globalThis,function(){
  'use strict';

  const DEFAULTS=Object.freeze({
    mode:'structure',timeScale:'linear',sort:'input',
    leafGap:12,subtreeGap:22,labelHeight:18,
    depthStep:145,plotWidth:1400,marginX:58,marginY:45,rightInset:185,
    collapsedIds:[],alignTips:false
  });

  function normalizedOptions(options={}){
    const cfg={...DEFAULTS,...options};
    if(!['structure','time'].includes(cfg.mode))
      throw new Error('Unsupported layout mode: '+cfg.mode);
    if(!['linear','log'].includes(cfg.timeScale))
      throw new Error('Unsupported time scale: '+cfg.timeScale);
    if(!['input','leaf-count'].includes(cfg.sort))
      throw new Error('Unsupported sibling order: '+cfg.sort);
    for(const key of ['leafGap','subtreeGap','labelHeight','depthStep','plotWidth','marginX','marginY','rightInset']){
      if(!Number.isFinite(cfg[key]) || cfg[key]<0)throw new Error('Invalid option: '+key);
    }
    if(cfg.plotWidth<=cfg.marginX+cfg.rightInset+50)
      throw new Error('plotWidth does not leave space for time projection');
    cfg.collapsedIds=new Set(cfg.collapsedIds);
    cfg.alignTips=cfg.alignTips===true;
    return cfg;
  }

  function makeHierarchy(records,rootId){
    if(!Array.isArray(records)||!records.length)throw new Error('Empty taxonomy');
    const index=new Map();
    for(const record of records){
      if(!record || typeof record.id!=='string' || !record.id)
        throw new Error('Taxon must have a nonempty id');
      if(index.has(record.id))throw new Error('Duplicate taxon id: '+record.id);
      index.set(record.id,{id:record.id,parentId:record.parent||null,
        raw:record,children:[],order:index.size});
    }
    for(const n of index.values()){
      if(!n.parentId)continue;
      const parent=index.get(n.parentId);
      if(!parent)throw new Error('Unknown parent: '+n.id+' -> '+n.parentId);
      parent.children.push(n);
    }
    const visited=new Set(),inProgress=new Set();
    function validate(node){
      if(inProgress.has(node.id))throw new Error('Cycle at '+node.id);
      if(visited.has(node.id))return;
      inProgress.add(node.id);
      for(const child of node.children)validate(child);
      inProgress.delete(node.id);
      visited.add(node.id);
    }
    for(const node of index.values())validate(node);
    const root=index.get(rootId);
    if(!root)throw new Error('Root not found: '+rootId);
    return {root,index};
  }

  function projectHierarchy(root,config){
    // The input tree remains immutable, including while collapsed.
    function compute(n){
      const children=n.children.map(compute);
      const descendants=children.reduce((sum,child)=>sum+1+child.totalDescendants,0);
      const leafCount=children.length?children.reduce((sum,child)=>sum+child.totalLeaves,0):1;
      return {n,children,totalDescendants:descendants,totalLeaves:leafCount};
    }
    const full=compute(root);
    function visible(node){
      const collapsed=config.collapsedIds.has(node.n.id) && node.children.length>0;
      let children=collapsed?[]:node.children;
      if(config.sort==='leaf-count'){
        children=[...children].sort((a,b)=>b.totalLeaves-a.totalLeaves||a.n.order-b.n.order);
      }
      return {id:node.n.id,data:node.n.raw,sourceOrder:node.n.order,
        parentId:node.n.parentId,collapsed,
        hiddenDescendants:collapsed?node.totalDescendants:0,
        totalDescendants:node.totalDescendants,totalLeaves:node.totalLeaves,
        children:children.map(visible)};
    }
    return visible(full);
  }

  /**
   * Planar tidy arrangement. The complete vertical envelopes of different
   * sibling subtrees never overlap, including at *different* depths.
   * No degree-2 (fake) parent is inserted.
   *
   * This conservative rule may make a full taxonomy taller, but prevents
   * real line crossings in both structural and chronology-based views.
   * It favors auditability over the tightest packing of a tree.
   */
  function verticalLayout(root,config){
    const half=config.labelHeight/2;
    function arrange(node){
      const positions=new Map([[node.id,{y:0,depth:0}]]);
      if(!node.children.length){
        return {positions,upper:new Map([[0,-half]]),
          lower:new Map([[0,half]]),rootY:0};
      }
      const accumulatedUpper=new Map(),accumulatedLower=new Map();
      const placedChildren=[],childRootYs=[];
      let previousChild=null;
      for(const child of node.children){
        const layout=arrange(child);
        let offset=0;
        if(previousChild){
          const gap=previousChild.children.length===0 && child.children.length===0
            ?config.leafGap:config.subtreeGap;
          // Planarity is a *global subtree* constraint, not just a contour
          // comparison at matching depths. A shallow sibling's long vertical
          // stem can otherwise cut across a deep sibling's horizontal arms.
          // Keep the entire Y envelope of each sibling clade disjoint.
          const bottom=Math.max(...accumulatedLower.values());
          const top=Math.min(...layout.upper.values());
          offset=Math.max(0,bottom+gap-top);
        }
        const shifted=new Map();
        for(const [id,p] of layout.positions){
          shifted.set(id,{y:p.y+offset,depth:p.depth+1});
        }
        placedChildren.push(shifted);
        childRootYs.push(offset);
        for(const [d,value] of layout.upper){
          accumulatedUpper.set(d,Math.min(accumulatedUpper.get(d)??Infinity,value+offset));
        }
        for(const [d,value] of layout.lower){
          accumulatedLower.set(d,Math.max(accumulatedLower.get(d)??-Infinity,value+offset));
        }
        previousChild=child;
      }
      // Keep the parent's attachment point centered on its first/last child,
      // not on an invented binary split.
      const center=(childRootYs[0]+childRootYs[childRootYs.length-1])/2;
      const upper=new Map([[0,-half]]),lower=new Map([[0,half]]);
      for(const part of placedChildren){
        for(const [id,p] of part)positions.set(id,{y:p.y-center,depth:p.depth});
      }
      for(const [d,val] of accumulatedUpper)upper.set(d+1,val-center);
      for(const [d,val] of accumulatedLower)lower.set(d+1,val-center);
      return {positions,upper,lower,rootY:0};
    }
    return arrange(root).positions;
  }

  function ageOf(record){
    if(record.status==='extinct' && Number.isFinite(record.lastMa))
      return record.lastMa;
    if(!Number.isFinite(record.ageMa) || record.ageMa<0)
      throw new Error('Missing or invalid time coordinate: '+record.id);
    return record.ageMa;
  }

  function placeHorizontal(nodes,recordsById,config){
    if(config.mode==='structure'){
      // A cladogram has no branch-length semantics. For dense species
      // directories, align *actual tips*, never folded clade summaries.
      const finalDepth=Math.max(0,...nodes.map(n=>n.depth));
      for(const n of nodes){
        const isTip=n.childIds.length===0 && !n.collapsed;
        const depth=config.alignTips && isTip?finalDepth:n.depth;
        n.x=config.marginX+depth*config.depthStep;
      }
      return {maxAge:null,axisKind:null};
    }
    const maxAge=Math.max(1,...nodes.map(n=>ageOf(recordsById.get(n.id))));
    const usable=config.plotWidth-config.marginX-config.rightInset;
    for(const n of nodes){
      const ma=ageOf(recordsById.get(n.id));
      const fraction=config.timeScale==='linear'
        ?1-ma/maxAge:1-Math.log10(ma+1)/Math.log10(maxAge+1);
      n.x=config.marginX+usable*fraction;
    }
    return {maxAge,axisKind:'teaching-time'};
  }

  function buildSegments(nodes){
    const byId=new Map(nodes.map(n=>[n.id,n]));
    const segments=[];
    for(const node of nodes){
      const children=node.childIds.map(id=>byId.get(id));
      if(children.length>1){
        const ys=children.map(child=>child.y);
        // One vertical bus for the entire polytomy. One horizontal segment
        // per child. No binary forks or false time coordinates are introduced.
        segments.push({kind:'stem',ownerId:node.id,
          x1:node.x,y1:Math.min(...ys),x2:node.x,y2:Math.max(...ys)});
      }
      for(const child of children){
        if(children.length===1 && node.y!==child.y){
          segments.push({kind:'stem',ownerId:node.id,
            x1:node.x,y1:Math.min(node.y,child.y),
            x2:node.x,y2:Math.max(node.y,child.y)});
        }
        segments.push({kind:'arm',ownerId:node.id,childId:child.id,
          x1:node.x,y1:child.y,x2:child.x,y2:child.y});
      }
    }
    return segments;
  }

  function layoutTree(records,opts={}){
    if(!Array.isArray(records) || !records.length)throw new Error('Empty taxonomy');
    const config=normalizedOptions(opts);
    const rootId=opts.rootId || records.find(n=>!n.parent)?.id;
    const {root}=makeHierarchy(records,rootId);
    const projected=projectHierarchy(root,config);
    const yPositions=verticalLayout(projected,config);
    const nodes=[];
    function flatten(p,parentId=null){
      const coordinate=yPositions.get(p.id);
      nodes.push({
        id:p.id,parentId,depth:coordinate.depth,
        y:coordinate.y,x:0,
        childIds:p.children.map(c=>c.id),
        label:String(p.data.zh||p.data.latin||p.id),
        rank:p.data.rank||'',status:p.data.status||'',
        collapsed:p.collapsed,hiddenDescendants:p.hiddenDescendants,
        totalDescendants:p.totalDescendants,
        multiChild:p.children.length>2
      });
      p.children.forEach(c=>flatten(c,p.id));
    }
    flatten(projected);
    const minY=Math.min(...nodes.map(n=>n.y));
    for(const n of nodes)n.y+=config.marginY-minY;
    const rawIndex=new Map(records.map(record=>[record.id,record]));
    const time=placeHorizontal(nodes,rawIndex,config);
    const segments=buildSegments(nodes);
    if(config.mode==='time'){
      for(const part of segments){
        if(part.kind==='arm' && part.x2+1e-6<part.x1)
          throw new Error('Time order conflicts with taxonomy: '+part.ownerId+' -> '+part.childId);
      }
    }
    const maxX=Math.max(...nodes.map(n=>n.x)),maxY=Math.max(...nodes.map(n=>n.y));
    return {
      nodes,segments,
      bounds:{x:0,y:0,width:Math.max(config.plotWidth,maxX+config.rightInset),
        height:maxY+config.marginY},
      axis:{kind:time.axisKind,maxMa:time.maxAge,scale:config.mode==='time'?config.timeScale:null},
      stats:{visibleNodes:nodes.length,stems:segments.filter(s=>s.kind==='stem').length,
        arms:segments.filter(s=>s.kind==='arm').length,
        highFanout:nodes.filter(n=>n.childIds.length>=8).length,
        collapsedNodes:nodes.filter(n=>n.collapsed).length},
      config:{mode:config.mode,timeScale:config.timeScale,sort:config.sort,alignTips:config.alignTips}
    };
  }
  return {layoutTree,makeHierarchy,ageOf};
});
