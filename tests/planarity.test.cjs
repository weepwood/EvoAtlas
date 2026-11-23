'use strict';

/**
 * Planarity contracts for the *actual drawn SVG segments*.
 * Intersections between unrelated edges are layout bugs, even when the
 * endpoints belong to different depths of the tree.
 *
 * Run: node --test tests/planarity.test.cjs
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {layoutTree}=require('../layout/engine.js');
const {project}=require('../layout/projection.js');

global.window={};
for(const source of ['data.js','curation.js','species.js'])
  require(path.resolve(__dirname,'../data',source));
const taxa=window.EVO_TAXA;
const EPS=1e-6;
const min=(a,b)=>Math.min(a,b),max=(a,b)=>Math.max(a,b);
const between=(x,a,b)=>x>min(a,b)+EPS&&x<max(a,b)-EPS;

function intersections(segments){
  const problems=[];
  for(let i=0;i<segments.length;i++){
    const a=segments[i];
    for(let j=i+1;j<segments.length;j++){
      const b=segments[j];
      const av=Math.abs(a.x1-a.x2)<EPS,bv=Math.abs(b.x1-b.x2)<EPS;
      const ah=Math.abs(a.y1-a.y2)<EPS,bh=Math.abs(b.y1-b.y2)<EPS;
      let vertical,horizontal;
      if(av&&bh){vertical=a;horizontal=b;}
      else if(bv&&ah){vertical=b;horizontal=a;}
      else if(av&&bv&&Math.abs(a.x1-b.x1)<EPS){
        // Two vertical buses cannot occupy the same segment, even if their
        // owners happen to be at identical projected times.
        const overlap=min(max(a.y1,a.y2),max(b.y1,b.y2))-
          max(min(a.y1,a.y2),min(b.y1,b.y2));
        if(overlap>EPS)problems.push({type:'vertical-overlap',a,b});
        continue;
      }else if(ah&&bh&&Math.abs(a.y1-b.y1)<EPS){
        const overlap=min(max(a.x1,a.x2),max(b.x1,b.x2))-
          max(min(a.x1,a.x2),min(b.x1,b.x2));
        if(overlap>EPS)problems.push({type:'horizontal-overlap',a,b});
        continue;
      }else continue;
      if(between(vertical.x1,horizontal.x1,horizontal.x2)&&
         between(horizontal.y1,vertical.y1,vertical.y2))
        problems.push({type:'perpendicular-crossing',a,b});
    }
  }
  return problems;
}

function assertPlanar(tree,label){
  const problems=intersections(tree.segments);
  assert.equal(problems.length,0,label+': unexpected overlaps or crossings: '+
    JSON.stringify(problems.slice(0,2)));
  for(const seg of tree.segments){
    assert.ok([seg.x1,seg.x2,seg.y1,seg.y2].every(Number.isFinite),
      label+': nonfinite segment coordinate');
  }
}

test('complete 608-node tree stays uncrossed in structural and time views',()=>{
  for(const mode of ['structure','time']){
    for(const timeScale of mode==='time'?['linear','log']:['linear']){
      const tree=layoutTree(taxa,{rootId:'luca',mode,timeScale,
        alignTips:mode==='structure'});
      assert.equal(tree.nodes.length,608);
      assertPlanar(tree,mode+'/'+timeScale+'/full');
    }
  }
});

test('real-world focused, overview, collapsed, and full subtrees remain planar',()=>{
  const roots=['luca','eukaryota','mammalia','actinopterygii',
    'ascomycota','rodentia','passeriformes'];
  for(const rootId of roots){
    for(const detail of ['focus','overview','full']){
      const view=project(taxa,{rootId,detail,budget:36,focusLimit:12,
        collapsedIds:[],expandedIds:[],foldedIds:[]});
      for(const mode of ['structure','time']){
        const tree=layoutTree(view.records,{rootId,mode,
          timeScale:'log',collapsedIds:view.collapsedIds,
          alignTips:mode==='structure'});
        assertPlanar(tree,rootId+'/'+detail+'/'+mode);
      }
    }
  }
});

test('reordering children and opening a collapsed branch do not create crossings',()=>{
  const view=project(taxa,{rootId:'mammalia',detail:'overview',budget:36});
  for(const sort of ['input','leaf-count']){
    const overview=layoutTree(view.records,{rootId:'mammalia',
      mode:'structure',collapsedIds:view.collapsedIds,sort,alignTips:true});
    assertPlanar(overview,sort+'/overview');
    const unfolded=project(taxa,{rootId:'mammalia',detail:'overview',
      budget:36,expandedIds:['felidae']});
    assertPlanar(layoutTree(unfolded.records,{rootId:'mammalia',
      mode:'structure',collapsedIds:unfolded.collapsedIds,sort,alignTips:true}),
    sort+'/opened felidae');
  }
});

test('strict nonoverlap survives responsive vertical rescaling',()=>{
  const base=layoutTree(taxa,{rootId:'mammalia',mode:'time',timeScale:'linear'});
  for(const factor of [0.65,1,1.5,4]){
    const resized=base.segments.map(seg=>({...seg,
      y1:64+(seg.y1-55)*factor+120,
      y2:64+(seg.y2-55)*factor+120}));
    assert.deepEqual(intersections(resized),[],
      'vertical viewport scaling must preserve orthogonal planarity');
  }
});

test('different-depth sibling envelopes never invade one another',()=>{
  const tree=layoutTree(taxa,{rootId:'luca',mode:'structure',sort:'input'});
  const byId=new Map(tree.nodes.map(n=>[n.id,n]));
  const groups=new Map();
  // Every ancestor's direct children must occupy disjoint overall intervals,
  // not just disjoint nodes at coincident depths.
  function range(id){
    const n=byId.get(id);
    let minY=n.y,maxY=n.y;
    for(const child of n.childIds){
      const r=range(child);
      minY=Math.min(minY,r.minY);maxY=Math.max(maxY,r.maxY);
    }
    groups.set(id,{minY,maxY});
    return {minY,maxY};
  }
  range('luca');
  for(const n of tree.nodes){
    for(let i=1;i<n.childIds.length;i++){
      const prev=groups.get(n.childIds[i-1]),next=groups.get(n.childIds[i]);
      assert.ok(prev.maxY<next.minY,
        'cross-depth clade separation failed at '+n.id);
    }
  }
});
