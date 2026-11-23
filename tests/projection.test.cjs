'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {layoutTree}=require('../layout/engine.js');
const {project}=require('../layout/projection.js');

global.window={};
for(const name of ['data.js','curation.js','species.js'])
  require(path.resolve(__dirname,'../data',name));
const taxonomy=window.EVO_TAXA;
const origin=JSON.stringify(taxonomy);

function view(rootId,overrides={}){
  const input=project(taxonomy,{
    rootId,detail:'overview',budget:58,...overrides
  });
  const graph=layoutTree(input.records,{
    rootId,mode:'structure',collapsedIds:input.collapsedIds
  });
  return {input,graph,byId:new Map(graph.nodes.map(n=>[n.id,n]))};
}

test('overview hides whole subtrees without inventing direct parent relationships',()=>{
  for(const rootId of ['luca','eukaryota','mammalia']){
    const {graph,input}=view(rootId);
    assert.ok(graph.nodes.length>=15 && graph.nodes.length<=58);
    assert.equal(graph.nodes.length,input.projectedVisibleCount);
    for(const n of graph.nodes){
      const original=taxonomy.find(t=>t.id===n.id);
      assert.ok(original);
      if(n.id===rootId)assert.equal(n.parentId,null);
      else assert.equal(n.parentId,original.parent,'projected parent must be canonical');
    }
  }
  assert.equal(JSON.stringify(taxonomy),origin);
});

test('expanding and collapsing a large family only changes the viewport projection',()=>{
  const start=view('mammalia');
  assert.equal(start.byId.get('felidae').collapsed,true);
  assert.equal(start.byId.get('felidae').hiddenDescendants,11);
  const opened=view('mammalia',{expandedIds:['felidae']});
  assert.equal(opened.byId.get('felidae').collapsed,false);
  assert.equal(opened.byId.get('felidae').childIds.length,11);
  assert.ok(opened.graph.nodes.length>start.graph.nodes.length);
  const folded=view('mammalia',{expandedIds:['felidae'],foldedIds:['felidae']});
  assert.equal(folded.byId.get('felidae').collapsed,true);
  assert.equal(folded.byId.get('felidae').childIds.length,0);
  assert.equal(JSON.stringify(taxonomy),origin);
});

test('searched species pins its unmodified true ancestor path',()=>{
  const {byId}=view('mammalia',{selectedId:'catalog-panthera-tigris'});
  let n=byId.get('catalog-panthera-tigris');
  assert.ok(n,'pinned taxon must remain visible');
  const seen=new Set();
  while(n && n.id!=='mammalia'){
    assert.ok(!seen.has(n.id));seen.add(n.id);
    const original=taxonomy.find(item=>item.id===n.id);
    assert.equal(n.parentId,original.parent);
    n=byId.get(n.parentId);
  }
  assert.equal(n.id,'mammalia');
});

test('filtered extinct taxa do not cause unrelated re-parenting',()=>{
  const {graph}=view('luca',{extinct:false});
  assert.equal(graph.nodes.filter(n=>n.status==='extinct').length,0);
  const originalIds=new Set(taxonomy.map(n=>n.id));
  assert.ok(graph.nodes.every(n=>originalIds.has(n.id)));
});

test('full mode includes entire focused subtree except manually folded descendants',()=>{
  const full=view('mammalia',{detail:'full'});
  assert.equal(full.graph.nodes.length,158);
  const reduced=view('mammalia',{detail:'full',foldedIds:['carnivora']});
  assert.ok(reduced.graph.nodes.length<full.graph.nodes.length);
  assert.equal(reduced.byId.get('carnivora').collapsed,true);
});


test('root overview distributes attention across the major lineages',()=>{
  const result=view('luca',{budget:36});
  const parentIndex=new Map(taxonomy.map(n=>[n.id,n.parent]));
  const counts={bacteria:0,archaea:0,eukaryota:0};
  for(const node of result.graph.nodes){
    let id=node.id;
    while(parentIndex.get(id)&&parentIndex.get(id)!=='luca'){
      id=parentIndex.get(id);
    }
    if(Object.hasOwn(counts,id))counts[id]++;
  }
  assert.ok(counts.bacteria<=24,'bacteria must not take nearly the whole overview');
  assert.ok(counts.archaea>=3,'archaea must remain discoverable');
  assert.ok(counts.eukaryota>=9,'eukaryotes must receive visible space');
  assert.ok(result.graph.nodes.length<=36);
});


test('focus explorer shows a sparse, canonical two-generation window',()=>{
  for(const rootId of ['luca','eukaryota','mammalia']){
    const input=project(taxonomy,{rootId,detail:'focus',focusLimit:12});
    const ids=new Set(input.records.map(n=>n.id));
    assert.ok(input.records.length>=4 && input.records.length<=12,rootId);
    for(const record of input.records){
      const real=taxonomy.find(n=>n.id===record.id);
      assert.ok(real);
      assert.equal(record.parent,record.id===rootId?null:real.parent);
      if(record.parent)assert.ok(ids.has(record.parent),
        'focus must not hide intermediate ancestors');
    }
    assert.ok(input.hiddenDescendants[rootId]>0);
  }
});

test('large direct fanout is paged without artificial taxonomy nodes',()=>{
  const rootId='actinopterygii';
  const limited=project(taxonomy,{rootId,detail:'focus',focusLimit:12});
  assert.equal(limited.directCount,23);
  assert.equal(limited.directShown,7);
  assert.equal(limited.remainingDirect,16);
  assert.equal(limited.records.length,8);
  const expanded=project(taxonomy,{rootId,detail:'focus',
    focusLimit:12,expandedIds:[rootId]});
  assert.equal(expanded.records.length,24);
  assert.equal(expanded.remainingDirect,0);
  for(const n of expanded.records.slice(1))assert.equal(n.parent,rootId);
  assert.equal(JSON.stringify(taxonomy),origin);
});

test('mobile focus is shallower but still navigable and pins deep searches',()=>{
  const rootId='mammalia';
  const mobile=project(taxonomy,{rootId,detail:'focus',mobile:true,focusLimit:7});
  assert.equal(mobile.records.length,4);
  assert.equal(mobile.records[0].id,rootId);
  const pinned=project(taxonomy,{rootId,detail:'focus',mobile:true,
    focusLimit:7,selectedId:'catalog-panthera-tigris'});
  const map=new Map(pinned.records.map(n=>[n.id,n]));
  let node=map.get('catalog-panthera-tigris');
  assert.ok(node);
  while(node?.parent)node=map.get(node.parent);
  assert.equal(node.id,rootId);
});
