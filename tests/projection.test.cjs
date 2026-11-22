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
