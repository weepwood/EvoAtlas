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
    assert.ok(await page.locator('#nodeLayer .collapsed-summary .clade-wedge').count()>0,
      'overview should show explicit collapsed clade glyphs');
    const initialTips=await page.locator('#nodeLayer .node.terminal:not(.selected)').evaluateAll(nodes=>
      nodes.filter(n=>!n.querySelector('.collapsed-summary'))
        .map(n=>Number(n.getAttribute('transform').match(/translate\(([-\d.]+) /)?.[1])));
    assert.ok(new Set(initialTips.map(x=>x.toFixed(3))).size<=1,
      'structural cladogram should align the real terminal tips');
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
    const beforeExpansion=await page.locator('#nodeLayer .node').count();
    await cat.locator('.node-more').dispatchEvent('click');
    assert.equal(await page.locator('#nodeLayer .node[data-id="catalog-panthera-tigris"]').count(),1,
      'local expansion must show true taxon children without changing root');
    assert.ok(await page.locator('#nodeLayer .node').count()>beforeExpansion);
    assert.equal(await page.locator('#headerBreadcrumb [aria-current="location"]').innerText(),
      await page.evaluate(()=>window.EVO_TAXA.find(t=>t.id==='mammalia').zh));
    await page.locator('#nodeLayer .node[data-id="felidae"] .node-more').dispatchEvent('click');
    assert.equal(await page.locator('#nodeLayer .node[data-id="catalog-panthera-tigris"]').count(),0,
      'collapsing must hide only the family descendants');
    const selectedBefore=await page.locator('#viewport').getAttribute('transform');
    await page.locator('#graphMinimap').click({position:{x:175,y:55}});
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
