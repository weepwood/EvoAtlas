/**
 * EvoAtlas layout view adapter.
 *
 * Transforms the real taxon tree into a *visible projection* (not a new
 * phylogenetic tree). A collapsed ID always names a real taxon and every
 * visible parent/child edge stays canonical. No fake summary parent exists.
 *
 * Pure module: suitable for Node tests or a browser without a bundler.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.EvoTreeProjection=api;
})(typeof globalThis==='undefined'?null:globalThis,function(){
  'use strict';
  function project(records,options={}){
    const {rootId,detail='overview',budget=58,
      selectedId=null,expandedIds=[],foldedIds=[]}=options;
    if(!['overview','full'].includes(detail))throw new Error('Invalid detail mode: '+detail);
    const index=new Map(records.map(node=>[node.id,node]));
    if(!index.has(rootId))throw new Error('Unknown root: '+rootId);
    const childIndex=new Map(records.map(n=>[n.id,[]]));
    for(const n of records){
      if(n.parent && childIndex.has(n.parent))childIndex.get(n.parent).push(n.id);
    }
    const includeExtinct=options.extinct!==false;
    const candidates=[],stack=[rootId];
    while(stack.length){
      const id=stack.pop(),node=index.get(id);
      if(!node)continue;
      // Skip a filtered extinct subtree, not just its parent, so no edges
      // are silently reattached to an unrelated living taxon.
      if(id!==rootId && !includeExtinct && node.status==='extinct')continue;
      candidates.push(node);
      for(const child of [...(childIndex.get(id)||[])].reverse())stack.push(child);
    }
    const ids=new Set(candidates.map(n=>n.id));
    const kids=new Map(candidates.map(n=>[n.id,(childIndex.get(n.id)||[]).filter(id=>ids.has(id))]));
    const manuallyFolded=new Set(foldedIds);
    const expanded=new Set(expandedIds);
    const forced=new Set([rootId]);
    if(selectedId && ids.has(selectedId)){
      const visited=new Set();let current=selectedId;
      while(current && ids.has(current) && !visited.has(current)){
        visited.add(current);forced.add(current);
        current=index.get(current)?.parent;
      }
    }
    const visible=new Set([rootId]),collapsed=new Set();
    if(detail==='overview'){
      const limit=Math.max(3,Number.isFinite(budget)?Math.floor(budget):36);
      const rootChildren=kids.get(rootId)||[];
      const topGroups=rootChildren.length?rootChildren:[rootId];
      const queues=new Map(topGroups.map(id=>[id,[id]]));
      const offsets=new Map(topGroups.map(id=>[id,0]));
      const suppressed=id=>manuallyFolded.has(id)&&!forced.has(id);
      // Root children must remain discoverable; the budget is a soft cap
      // for a very broad root, never an excuse to invent a taxonomic group.
      if(!suppressed(rootId)){
        for(const id of rootChildren)visible.add(id);
      }else{
        collapsed.add(rootId);
      }
      // Round-robin between the root's distinct lineages. No input-order
      // starvation: bacteria, archaea, and eukaryotes get comparable space.
      let remaining=true;
      while(remaining){
        remaining=false;
        for(const group of topGroups){
          const queue=queues.get(group);
          const cursor=offsets.get(group);
          if(cursor>=queue.length)continue;
          remaining=true;
          const id=queue[cursor];
          offsets.set(group,cursor+1);
          if(!visible.has(id))continue;
          const childIds=kids.get(id)||[];
          if(!childIds.length)continue;
          if(suppressed(id)){collapsed.add(id);continue;}
          const mandatory=forced.has(id)||expanded.has(id);
          if(mandatory||visible.size+childIds.length<=limit){
            for(const childId of childIds){
              visible.add(childId);
              queue.push(childId);
            }
          }else collapsed.add(id);
        }
      }
    }else{
      for(const node of candidates){
        const id=node.id;
        if(manuallyFolded.has(id) && (kids.get(id)||[]).length)collapsed.add(id);
      }
    }
    // In full mode the engine handles explicit collapses. In overview mode
    // the engine hides precisely the unexpanded branches identified above.
    return {
      // The visible subtree has its own root. Keep the canonical record
      // untouched, and clear only the presentation copy's external parent.
      records:candidates.map(n=>n.id===rootId?{...n,parent:null}:n),
      collapsedIds:[...collapsed],
      totalAvailable:candidates.length,
      projectedVisibleCount:detail==='overview'?visible.size:null,
      rootId
    };
  }
  return {project};
});
