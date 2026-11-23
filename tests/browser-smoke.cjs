/**
 * Browser-level smoke checks of core EvoAtlas interactions.
 * Run: npm install --no-save playwright@1.56.1 && node tests/browser-smoke.cjs
 * Requires local server on http://127.0.0.1:8000.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

// Inspect the exact orthogonal segments drawn into SVG, not only the
// detached layout engine output.
async function renderedCrossings(page){
  return page.locator('#edgeLayer path').evaluateAll(paths=>{
    const seg=paths.map(el=>{
      const m=(el.getAttribute('d')||'').match(
        /^M\s*([-\d.eE]+)\s+([-\d.eE]+)\s+L\s*([-\d.eE]+)\s+([-\d.eE]+)$/);
      return m?{x1:+m[1],y1:+m[2],x2:+m[3],y2:+m[4]}:null;
    }).filter(Boolean);
    const eps=1e-5;
    let intersections=0;
    for(let i=0;i<seg.length;i++)for(let j=i+1;j<seg.length;j++){
      const a=seg[i],b=seg[j];
      const av=Math.abs(a.x1-a.x2)<eps,bv=Math.abs(b.x1-b.x2)<eps;
      const ah=Math.abs(a.y1-a.y2)<eps,bh=Math.abs(b.y1-b.y2)<eps;
      let v,h;
      if(av&&bh){v=a;h=b;}
      else if(bv&&ah){v=b;h=a;}
      else if(av&&bv&&Math.abs(a.x1-b.x1)<eps){
        if(Math.min(Math.max(a.y1,a.y2),Math.max(b.y1,b.y2))-
           Math.max(Math.min(a.y1,a.y2),Math.min(b.y1,b.y2))>eps)intersections++;
        continue;
      }else if(ah&&bh&&Math.abs(a.y1-b.y1)<eps){
        if(Math.min(Math.max(a.x1,a.x2),Math.max(b.x1,b.x2))-
           Math.max(Math.min(a.x1,a.x2),Math.min(b.x1,b.x2))>eps)intersections++;
        continue;
      }else continue;
      const between=(value,p,q)=>
        value>Math.min(p,q)+eps&&value<Math.max(p,q)-eps;
      if(between(v.x1,h.x1,h.x2)&&between(h.y1,v.y1,v.y2))
        intersections++;
    }
    return intersections;
  });
}

async function main(){
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const issues=[];
  fs.mkdirSync(path.resolve(__dirname,'../artifacts'),{recursive:true});
  try{
    const page=await browser.newPage({viewport:{width:1365,height:768},deviceScaleFactor:1});
    page.on('pageerror',error=>issues.push(error.message));
    await page.goto('http://127.0.0.1:8000/',{waitUntil:'load'});
    await page.waitForSelector('#nodeLayer .node');
    assert.equal(await page.evaluate(()=>window.EVO_TAXA.length),608);
    assert.equal(await page.locator('#graphStage').getAttribute('data-engine'),'v2');
    assert.equal(await page.locator('#graphStage').getAttribute('data-layout'),'structure');
    assert.equal(await page.locator('#layoutModeSelect').inputValue(),'structure');
    assert.equal(await page.locator('#scaleSelect').isDisabled(),true);
    assert.equal(await page.locator('#eventLayer').locator('*').count(),0);
    assert.equal(await page.locator('#graphStage').getAttribute('data-detail'),'focus');
    const focusedCount=await page.locator('#nodeLayer .node').count();
    assert.ok(focusedCount>=4 && focusedCount<=12,
      'default explorer should show only the root and a few major subclades');
    assert.equal(await page.locator('#nodeLayer .collapsed-summary').count(),0,
      'focused mode does not show wedge glyphs');
    assert.equal(await page.locator('#graphMinimap').isVisible(),false,
      'overview minimap must not cover the reading view');
    assert.equal(await page.locator('#axisOverlay').isVisible(),false,
      'cladogram focus is not a time axis');
    const focusRootLabelY=Number(await page.locator('#nodeLayer .node[data-id="luca"] .node-label')
      .getAttribute('y'));
    assert.ok(focusRootLabelY<=-20,
      'focus root label must sit above its branch line, never on top of it');
    await page.screenshot({path:'artifacts/evoatlas-atlas-structure-default.png'});
    assert.equal(await page.locator('#speciesA option').count(),496);
    assert.equal(await page.locator('.workspace-heading').count(),0);
    const chevron=page.locator('[data-select="scaleSelect"] .custom-select-chevron');
    assert.equal(await chevron.evaluate(el=>el.namespaceURI),'http://www.w3.org/2000/svg');
    assert.equal(await chevron.locator('path').getAttribute('d'),'m6 9 6 6 6-6');
    assert.ok(await page.locator('#graphStage').evaluate(el=>el.getBoundingClientRect().height)>450,'canvas should be immersive');

    await page.locator('[data-root="eukaryota"]').click();
    assert.match(await page.locator('#headerBreadcrumb').innerText(),/真核生物/);
    assert.equal(await page.locator('#headerBreadcrumb [aria-current="location"]').innerText(),'真核生物');

    // Switch to the time interpretation before testing its time-only scale.
    await page.locator('[data-select="layoutModeSelect"] .custom-select-trigger').click();
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option')
      .filter({hasText:'时间树'}).click();
    assert.equal(await page.locator('#graphStage').getAttribute('data-layout'),'time');

    // The native select remains the model. Interact only with the new visible menu.
    const timeTrigger=page.locator('[data-select="scaleSelect"] .custom-select-trigger');
    await timeTrigger.click();
    assert.equal(await timeTrigger.getAttribute('aria-expanded'),'true');
    await page.screenshot({path:'artifacts/evoatlas-select-icons.png'});
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').filter({hasText:'线性'}).click();
    assert.equal(await page.locator('#scaleSelect').inputValue(),'linear');
    assert.equal(await page.locator('#graphStage').getAttribute('data-scale'),'linear');

    // Grid labels must not stack at the same horizontal position after a scale switch.
    await page.waitForSelector('#axisOverlay .axis-fixed-label');
    const grid=await page.locator('#axisOverlay .axis-fixed-label').evaluateAll(nodes=>
      nodes.map(el=>({x:Number(el.getAttribute('x')),text:el.textContent})));
    assert.ok(grid.length>=2,'linear mode must retain readable fixed time labels');
    assert.ok(grid.every(item=>Number.isFinite(item.x)),'grid positions must be finite');
    const fixedAxisTop=await page.locator('#axisOverlay').evaluate(el=>el.getBoundingClientRect().top);
    await page.locator('#graphMinimap').click({position:{x:45,y:72}});
    assert.ok(Math.abs((await page.locator('#axisOverlay').evaluate(el=>el.getBoundingClientRect().top))-fixedAxisTop)<1,
      'ruler must not move vertically with the world tree');

    await page.locator('[data-select="detailSelect"] .custom-select-trigger').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.custom-select-menu:not([hidden])').count(),0);

    await page.locator('[data-view="compare"]').click();
    const compareTrigger=page.locator('[data-select="speciesA"] .custom-select-trigger');
    await compareTrigger.click();
    assert.ok(await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').count()>20);
    assert.ok(await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').count()<=80);
    const filter=page.locator('.custom-select-menu:not([hidden]) .custom-select-search');
    await filter.fill('Homo sapiens');
    assert.equal(await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').count(),1);
    await page.screenshot({path:'artifacts/evoatlas-species-search.png'});
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').click();
    assert.equal(await page.locator('#speciesA').inputValue(),'sapiens');
    assert.ok(await page.locator('#compareResult .lca-banner').count()>0);

    await page.locator('[data-view="sources"]').click();
    assert.equal(await page.locator('#sourceGrid .source-card').count(),18);
    assert.equal(await page.locator('#sourceGrid .source-group').count(),4);
    await page.screenshot({path:'artifacts/evoatlas-sources-desktop.png',fullPage:true});

    await page.locator('[data-view="tree"]').click();
    await page.locator('#taxonSearch').fill('Panthera tigris');
    await page.locator('#searchResults .search-result').first().click();
    assert.match(await page.locator('#detailLatin').innerText(),/Panthera tigris/);
    assert.match(await page.locator('#detailRank').innerText(),/待核验/);
    await page.locator('[data-root="mammalia"]').click();
    await page.locator('#nodeLayer .node[data-id="mammalia"]').dispatchEvent('click');
    const overviewCount=await page.locator('#nodeLayer .node').count();
    assert.ok(overviewCount>15 && overviewCount<=70,'overview needs capped LOD');
    assert.equal(await renderedCrossings(page),0,
      'real SVG edges must not cross in dense time-mode overview');
    assert.ok(await page.locator('#graphMinimap').isVisible(),'overview must have a navigation minimap');
    assert.ok(await page.locator('#minimapEdges path').count()>10,'minimap should reflect branch topology');
    const viewportRect=page.locator('#minimapViewport');
    const vw=Number(await viewportRect.getAttribute('width'));
    assert.ok(vw>1 && vw<=204,'minimap viewport must be bounded');
    const branchBadges=page.locator('#nodeLayer .node-more');
    assert.ok(await branchBadges.count()>0,'collapsed overview should disclose hidden descendants');
    const cat=page.locator('#nodeLayer .node[data-id="felidae"]');
    assert.ok(await cat.count()>0,'cat family visible in overview');
    assert.equal(await cat.locator('.node-more').count(),1,'folded real branch has visible expand action');
    assert.equal(await cat.locator('.clade-wedge').count(),1,
      'folded branch must render the new triangular summary');
    const wedgeSize=await cat.locator('.clade-wedge').evaluate(el=>{
      const rect=el.getBBox();return {width:rect.width,height:rect.height};
    });
    assert.ok(wedgeSize.width<=14 && wedgeSize.height<=14,
      'folded marker should be compact rather than a large 45px triangle');
    const row=cat.locator('.collapsed-summary');
    assert.equal(await row.getAttribute('aria-expanded'),'false');
    assert.equal(await row.locator('.clade-summary-name').textContent(),'猫科');
    assert.match(await row.locator('.clade-summary-count').textContent(),/个后代/);
    const hitHeight=await row.locator('.clade-hit-area').getAttribute('height');
    assert.ok(Number(hitHeight)>=40,'entire disclosure row should have a large hit area');
    await page.screenshot({path:'artifacts/evoatlas-clade-compact.png'});
    // Single click is information-only; disclosure opens the child branch.
    await cat.locator('.node-core').dispatchEvent('click');
    assert.equal(await cat.locator('.collapsed-summary').count(),1,
      'selecting a clade must not silently expand its descendants');
    const beforeExpansion=await page.locator('#nodeLayer .node').count();
    await cat.locator('.clade-hit-area').click();
    assert.equal(await page.locator('#nodeLayer .node[data-id="catalog-panthera-tigris"]').count(),1,
      'local expansion must show true taxon children without changing root');
    assert.ok(await page.locator('#nodeLayer .node').count()>beforeExpansion);
    assert.equal(await page.locator('#headerBreadcrumb [aria-current="location"]').innerText(),
      await page.evaluate(()=>window.EVO_TAXA.find(t=>t.id==='mammalia').zh));
    assert.equal(await page.locator('#nodeLayer .clade-collapse-toggle').count(),0,
      'expanded branches must no longer render controls over tree lines or labels');
    assert.equal(await page.locator('#branchAction').isVisible(),true);
    assert.equal(await page.locator('#branchActionName').innerText(),'猫科');
    assert.match(await page.locator('#collapseBranch').getAttribute('aria-label'),/猫科/);
    const relativeRegions=await page.evaluate(()=>{
      const stage=document.getElementById('graphStage').getBoundingClientRect();
      const bar=document.getElementById('branchAction').getBoundingClientRect();
      return {stageBottom:stage.bottom,barTop:bar.top};
    });
    assert.ok(relativeRegions.barTop>=relativeRegions.stageBottom,
      'the collapse toolbar must stay outside the SVG drawing surface');
    await page.waitForTimeout(240);
    await page.screenshot({path:'artifacts/evoatlas-clade-expanded.png'});
    await page.screenshot({path:'artifacts/evoatlas-clade-collapse-toolbar.png'});
    const collapseControl=page.locator('#collapseBranch');
    await collapseControl.click();
    assert.equal(await page.locator('#nodeLayer .node[data-id="catalog-panthera-tigris"]').count(),0,
      'toolbar button must collapse only family descendants');
    assert.equal(await page.locator('#branchAction').isVisible(),false,
      'the toolbar should disappear after collapsing its target');

    await page.locator('#nodeLayer .node[data-id="felidae"] .clade-hit-area').click();
    await page.waitForTimeout(240);
    await page.locator('#collapseBranch').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#nodeLayer .node[data-id="catalog-panthera-tigris"]').count(),0,
      'keyboard Enter must collapse only family descendants');
    assert.equal(await page.locator('#nodeLayer .node[data-id="felidae"] .collapsed-summary').getAttribute('aria-expanded'),'false');
    await page.waitForFunction(()=>{
      const control=document.querySelector('#nodeLayer .node[data-id="felidae"] .collapsed-summary');
      return control===document.activeElement;
    },null,{timeout:1200});
    assert.equal(await page.locator('#nodeLayer .node[data-id="felidae"] .collapsed-summary').evaluate(el=>el===document.activeElement),true,
      'keyboard focus must move back to the collapsed clade after toolbar closes');
    await page.waitForTimeout(260);
    assert.equal(await page.locator('.branch-motion-ghost').count(),0,
      'temporary collapse ghosts must be removed');

    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('#nodeLayer .node[data-id="felidae"] .clade-hit-area').dispatchEvent('click');
    assert.equal(await page.locator('.branch-motion-ghost').count(),0,
      'reduced motion should not create transient animation ghosts');
    await page.locator('#collapseBranch').click();
    await page.emulateMedia({reducedMotion:'no-preference'});

    await page.locator('#nodeLayer .node[data-id="felidae"] .clade-hit-area').dispatchEvent('click');
    await page.waitForTimeout(55);
    await page.locator('#collapseBranch').click();
    await page.waitForTimeout(260);
    assert.equal(await page.locator('.branch-motion-ghost').count(),0,
      'rapid open-close must cancel prior animation without leaving ghosts');
    assert.equal(await page.locator('#nodeLayer .node[data-id="catalog-panthera-tigris"]').count(),0);
    const selectedBefore=await page.locator('#viewport').getAttribute('transform');
    await page.locator('#graphMinimap').click({position:{x:124,y:55}});
    const selectedAfter=await page.locator('#viewport').getAttribute('transform');
    assert.notEqual(selectedAfter,selectedBefore,'clicking minimap should relocate the viewport');
    const mobileHint=await page.locator('.graph-overlay-hint').innerText();
    assert.match(mobileHint,/点击三角|局部展开/);
    await page.locator('#fitTree').click();
    assert.ok(Number(await viewportRect.getAttribute('width'))>1);
    // A focused SVG node supports keyboard lineage traversal.
    const rootNode=page.locator('#nodeLayer .node[data-id="mammalia"]');
    await rootNode.focus();
    await page.keyboard.press('ArrowRight');
    assert.ok(await page.locator('#taxonDetail').isVisible(),'arrow-key node traversal should show details');
    await page.locator('[data-root="mammalia"]').click();
    const repeatedClick=page.locator('#nodeLayer .node[data-id="carnivora"]');
    await repeatedClick.dispatchEvent('click');
    await repeatedClick.dispatchEvent('click');
    assert.match(await page.locator('#headerBreadcrumb').innerText(),/食肉目/);
    await page.locator('[data-root="mammalia"]').click();
    const desktopTransform=await page.locator('#viewport').getAttribute('transform');
    const desktopScale=Number(desktopTransform.match(/scale\(([-\d.]+)\)/)?.[1]||0);
    assert.ok(desktopScale>=0.74,'dense desktop overview should not render text as a thumbnail');
    await page.locator('[data-select="detailSelect"] .custom-select-trigger').click();
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').filter({hasText:'全部节点'}).click();
    assert.ok(await page.locator('#nodeLayer .node').count()>120,'full mammal branch should contain many taxa');
    assert.equal(await renderedCrossings(page),0,
      'full mammal SVG must have no crossing branches');
    await page.locator('[data-select="detailSelect"] .custom-select-trigger').click();
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').filter({hasText:'概览'}).click();
    await page.mouse.move(780,650);
    await page.waitForTimeout(300);
    assert.ok(await page.locator('[data-view="tree"]').evaluate(el=>el.classList.contains('active')));
    await page.screenshot({path:'artifacts/evoatlas-tree-desktop.png'});
    await page.locator('#fitTree').click();
    await page.screenshot({path:'artifacts/evoatlas-overview-fit.png'});

    // Structure depth is not an absolute geological clock.
    await page.locator('[data-select="layoutModeSelect"] .custom-select-trigger').click();
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').filter({hasText:'结构树'}).click();
    assert.equal(await page.locator('#graphStage').getAttribute('data-layout'),'structure');
    assert.equal(await renderedCrossings(page),0,
      'structural SVG segments must not cross each other');
    assert.equal(await page.locator('#scaleSelect').isDisabled(),true);
    assert.equal(await page.locator('#eventLayer').locator('*').count(),0);
    await page.waitForTimeout(120);
    assert.ok((await page.locator('#axisOverlay').textContent()).includes('层级'));
    await page.screenshot({path:'artifacts/evoatlas-structure-tree.png'});

    await page.locator('[data-select="layoutModeSelect"] .custom-select-trigger').click();
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').filter({hasText:'时间树'}).click();
    assert.equal(await page.locator('#graphStage').getAttribute('data-layout'),'time');
    assert.equal(await page.locator('#scaleSelect').isDisabled(),false);

    // A real 23-way fanout must draw exactly one shared stem, not 23 overlapping L paths.
    await page.locator('#taxonSearch').fill('Actinopterygii');
    await page.locator('#searchResults .search-result').first().click();
    await page.locator('#focusNode').click();
    assert.equal(await page.locator('#edgeLayer .edge-stem[data-owner="actinopterygii"]').count(),1);
    assert.equal(await page.locator('#edgeLayer .edge-arm[data-owner="actinopterygii"]').count(),23);
    await page.screenshot({path:'artifacts/evoatlas-actinopterygii-v2.png'});

    // The real 23-way branch must keep a shared stem and align its terminal
    // labels when presented as a structural cladogram.
    await page.locator('[data-select="layoutModeSelect"] .custom-select-trigger').click();
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option')
      .filter({hasText:'结构树'}).click();
    assert.equal(await page.locator('#edgeLayer .edge-stem[data-owner="actinopterygii"]').count(),1);
    const fishTipColumns=await page.locator('#nodeLayer .node.terminal').evaluateAll(nodes=>
      nodes.map(n=>Number(n.getAttribute('transform').match(/translate\(([-\d.]+) /)?.[1])));
    assert.equal(new Set(fishTipColumns.map(x=>x.toFixed(3))).size,1,
      '23 fish terminals should align at one visual reading column');
    const fishRootX=await page.locator('#nodeLayer .node[data-id="actinopterygii"]')
      .getAttribute('transform').then(text=>Number(text.match(/translate\(([-\d.]+) /)?.[1]));
    assert.ok(fishTipColumns[0]-fishRootX>=380,
      'a shallow 23-way branch should use the canvas width, not crowd next to its trunk');
    await page.screenshot({path:'artifacts/evoatlas-fanout-structure.png'});

    // A dense real polytomy starts as a readable subset, with a truthful
    // "show the remaining siblings" action. No fake ancestor appears.
    await page.locator('[data-select="detailSelect"] .custom-select-trigger').click();
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option')
      .filter({hasText:'逐级浏览'}).click();
    assert.equal(await page.locator('#graphStage').getAttribute('data-detail'),'focus');
    assert.equal(await page.locator('#nodeLayer .node').count(),8);
    assert.match(await page.locator('#focusStatus').innerText(),/7 \/ 23/);
    assert.match(await page.locator('#showMoreChildren').innerText(),/16/);
    await page.screenshot({path:'artifacts/evoatlas-fanout-focused.png'});
    assert.equal(await page.locator('#headerBreadcrumb .breadcrumb-overflow').count(),1,
      'deep focused lineage should not overflow the header');
    await page.locator('#headerBreadcrumb .breadcrumb-overflow').click();
    assert.equal(await page.locator('#breadcrumbMenu').isVisible(),true);
    assert.ok(await page.locator('#breadcrumbMenu [role="menuitem"]').count()>=3);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#breadcrumbMenu').isVisible(),false);
    await page.locator('#showMoreChildren').click();
    assert.equal(await page.locator('#nodeLayer .node').count(),24);
    await page.locator('#showMoreChildren').click();
    assert.equal(await page.locator('#nodeLayer .node').count(),8);

    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(350);
    await page.locator('#openSidebar').click();
    assert.ok(await page.locator('#sidebar').evaluate(el=>el.classList.contains('open')));
    await page.locator('[data-root="hominina"]').click();
    assert.match(await page.locator('#headerBreadcrumb').innerText(),/人亚族/);
    assert.equal(await page.locator('#sidebar').evaluate(el=>el.classList.contains('open')),false);
    await page.waitForTimeout(350);
    const transform=await page.locator('#viewport').getAttribute('transform');
    const zoomMatch=transform.match(/scale\(([-\d.]+)\)/);
    assert.ok(zoomMatch&&Number(zoomMatch[1])>=0.75,'mobile default zoom must preserve label readability');
    const mobileY=await page.locator('#nodeLayer .node:not([data-id="hominina"])').evaluateAll(nodes=>
      nodes.map(n=>Number(n.getAttribute('transform').match(/translate\([\d.-]+ ([-\d.]+)\)/)?.[1])));
    assert.ok(Math.max(...mobileY)-Math.min(...mobileY)>=180,
      'a small focused mobile subtree should spread vertically instead of compressing into a short strip');
    const onScreenTips=await page.locator('#nodeLayer .node:not([data-id="hominina"]) .node-core').evaluateAll(nodes=>{
      const view=document.getElementById('graphStage').getBoundingClientRect();
      return nodes.filter(node=>{
        const r=node.getBoundingClientRect();
        return r.width>0&&r.left>=view.left&&r.right<=view.right-5
          &&r.top>=view.top&&r.bottom<=view.bottom;
      }).length;
    });
    assert.ok(onScreenTips>=2,'mobile focus must keep at least two direct branches in view');
    await page.screenshot({path:'artifacts/evoatlas-tree-mobile.png'});

    // A URL query flag must offer a usable rollback path to the old renderer.
    const legacy=await browser.newPage({viewport:{width:1180,height:760}});
    const legacyErrors=[];
    legacy.on('pageerror',err=>legacyErrors.push(err.message));
    await legacy.goto('http://127.0.0.1:8000/?layout=legacy',{waitUntil:'load'});
    await legacy.waitForSelector('#nodeLayer .node');
    assert.equal(await legacy.locator('#graphStage').getAttribute('data-engine'),'legacy');
    assert.equal(await legacy.locator('#layoutModeSelect').isDisabled(),true);
    assert.equal(await legacy.locator('#graphStage').getAttribute('data-layout'),'time');
    await legacy.locator('[data-root="mammalia"]').click();
    assert.ok(await legacy.locator('#edgeLayer path').count()>10);
    assert.deepEqual(legacyErrors,[]);
    await legacy.close();

    assert.deepEqual(issues,[],'page should have no uncaught JavaScript errors');
    console.log('PASS: desktop and mobile interactions, data directory, timeline and custom selects.');
  } finally {
    await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exit(1);});
