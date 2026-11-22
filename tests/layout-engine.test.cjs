'use strict';

/**
 * Contract tests for layout/engine.js.
 * Run: node --test tests/layout-engine.test.cjs
 * Pure geometry only: no browser, DOM, scientific assertion or CSS.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {layoutTree,makeHierarchy}=require('../layout/engine.js');

global.window={};
for(const script of ['data.js','curation.js','species.js']){
  require(path.resolve(__dirname,'../data',script));
}
const taxa=window.EVO_TAXA;

const byId=result=>new Map(result.nodes.map(node=>[node.id,node]));
const childArms=(result,id)=>result.segments.filter(segment=>
  segment.kind==='arm'&&segment.ownerId===id);
const stems=(result,id)=>result.segments.filter(segment=>
  segment.kind==='stem'&&segment.ownerId===id);

test('all 608 curated taxa can be laid out without inventing nodes',()=>{
  const original=JSON.stringify(taxa);
  const start=performance.now();
  const output=layoutTree(taxa,{rootId:'luca',mode:'structure'});
  const elapsed=performance.now()-start;
  assert.equal(output.nodes.length,taxa.length);
  assert.equal(output.segments.filter(e=>e.kind==='arm').length,taxa.length-1);
  assert.deepEqual(new Set(output.nodes.map(n=>n.id)),new Set(taxa.map(n=>n.id)));
  assert.equal(JSON.stringify(taxa),original,'layout must never mutate canonical taxonomy');
  assert.ok(output.bounds.height>4000,'large uncollapsed tree must be scrollable, not crushed into viewport');
  assert.ok(output.bounds.width>=1400);
  console.log('EvoAtlas layout prototype: '+taxa.length+' nodes in '+elapsed.toFixed(1)+' ms');
});

test('dense fanouts render exactly one shared vertical stem',()=>{
  for(const [id,count] of [['actinopterygii',23],['ascomycota',15],
    ['rodentia',15],['cetacea',14],['passeriformes',14]]){
    const result=layoutTree(taxa,{rootId:id,mode:'structure'});
    assert.equal(childArms(result,id).length,count,id+' child arms');
    assert.equal(stems(result,id).length,1,id+' shared stem');
    const root=byId(result).get(id);
    assert.equal(root.childIds.length,count);
    assert.equal(root.multiChild,true);
    const positions=root.childIds.map(child=>byId(result).get(child).y);
    for(let i=1;i<positions.length;i++)
      assert.ok(positions[i]-positions[i-1]>=29.9,id+' sibling label clearance');
    const main=stems(result,id)[0];
    assert.equal(main.x1,main.x2,'shared stem must be vertical');
    assert.equal(main.y1,Math.min(...positions));
    assert.equal(main.y2,Math.max(...positions));
  }
});

test('preserve data, root relationships, determinism, and stable input order',()=>{
  const first=layoutTree(taxa,{rootId:'mammalia',mode:'structure'});
  const second=layoutTree(taxa,{rootId:'mammalia',mode:'structure'});
  assert.deepEqual(second,first);
  const root=byId(first).get('mammalia');
  const actual=taxa.filter(n=>n.parent==='mammalia').map(n=>n.id);
  assert.deepEqual(root.childIds,actual);
  assert.deepEqual(layoutTree(taxa,{rootId:'mammalia',sort:'leaf-count'})
    .nodes.map(n=>n.id).sort(),first.nodes.map(n=>n.id).sort());
});

test('time view changes x projection only, not cladistic grouping or y coordinates',()=>{
  const structure=layoutTree(taxa,{rootId:'mammalia',mode:'structure'});
  for(const scale of ['linear','log']){
    const time=layoutTree(taxa,{rootId:'mammalia',mode:'time',timeScale:scale});
    const a=byId(structure),b=byId(time);
    assert.equal(time.axis.kind,'teaching-time');
    for(const [id,node] of a){
      assert.deepEqual(b.get(id).childIds,node.childIds);
      assert.equal(b.get(id).y,node.y);
    }
    for(const e of time.segments.filter(e=>e.kind==='arm'))
      assert.ok(e.x2+1e-6>=e.x1,'descendants must not flow backward in teaching time');
    const tips=time.nodes.filter(n=>n.status==='extant');
    assert.ok(tips.length>50);
    assert.equal(new Set(tips.map(n=>n.x.toFixed(6))).size,1,
      'extant species should share the present time coordinate');
  }
});

test('collapse is an explicit visualization choice, never a synthetic phylogenetic node',()=>{
  const original=JSON.stringify(taxa);
  const full=layoutTree(taxa,{rootId:'mammalia',mode:'structure'});
  const collapsed=layoutTree(taxa,{rootId:'mammalia',mode:'structure',
    collapsedIds:['carnivora','primates']});
  assert.ok(collapsed.nodes.length<full.nodes.length);
  const nodes=byId(collapsed);
  for(const id of ['carnivora','primates']){
    assert.ok(nodes.get(id).collapsed);
    assert.ok(nodes.get(id).hiddenDescendants>0);
    assert.equal(nodes.get(id).childIds.length,0);
  }
  const canonicalIds=new Set(taxa.map(n=>n.id));
  assert.ok(collapsed.nodes.every(n=>canonicalIds.has(n.id)),
    'collapsed view must never add synthetic taxon nodes');
  assert.equal(JSON.stringify(taxa),original);
});

test('sibling subtree contours do not overlap at their shared depths',()=>{
  const fixture=[
    {id:'r',parent:null,ageMa:100},{id:'a',parent:'r',ageMa:80},
    {id:'a1',parent:'a',ageMa:20},{id:'a2',parent:'a',ageMa:10},
    {id:'b',parent:'r',ageMa:80},{id:'b1',parent:'b',ageMa:20},
    {id:'b2',parent:'b',ageMa:10},{id:'b3',parent:'b',ageMa:0},
  ];
  const layout=layoutTree(fixture,{rootId:'r',mode:'structure'});
  const positions=byId(layout);
  const ys=ids=>ids.map(id=>positions.get(id).y);
  assert.ok(Math.max(...ys(['a','a1','a2']))<
    Math.min(...ys(['b','b1','b2','b3'])),'separate subtree envelopes');
});

test('invalid input fails early rather than silently distorting relationships',()=>{
  assert.throws(()=>makeHierarchy([{id:'a',parent:null},{id:'a',parent:null}],'a'),/Duplicate/);
  assert.throws(()=>makeHierarchy([{id:'a',parent:'missing'}],'a'),/Unknown parent/);
  assert.throws(()=>makeHierarchy([{id:'a',parent:'b'},{id:'b',parent:'a'}],'a'),/Cycle/);
  assert.throws(()=>layoutTree([{id:'r',parent:null}],{mode:'radial'}),/Unsupported layout mode/);
});
