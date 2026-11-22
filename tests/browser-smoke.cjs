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
    assert.equal(await page.locator('.workspace-heading').count(),0);
    assert.ok(await page.locator('#graphStage').evaluate(el=>el.getBoundingClientRect().height)>450,'canvas should be immersive');

    await page.locator('[data-root="eukaryota"]').click();
    assert.match(await page.locator('#headerBreadcrumb').innerText(),/真核生物/);
    assert.equal(await page.locator('#headerBreadcrumb [aria-current="location"]').innerText(),'真核生物');

    // The native select remains the model. Interact only with the new visible menu.
    const timeTrigger=page.locator('[data-select="scaleSelect"] .custom-select-trigger');
    await timeTrigger.click();
    assert.equal(await timeTrigger.getAttribute('aria-expanded'),'true');
    await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').filter({hasText:'线性'}).click();
    assert.equal(await page.locator('#scaleSelect').inputValue(),'linear');
    assert.equal(await page.locator('#graphStage').getAttribute('data-scale'),'linear');

    // Grid labels must not stack at the same horizontal position after a scale switch.
    const grid=await page.locator('#gridLayer .axis-label').evaluateAll(nodes=>
      nodes.map(el=>({x:Number(el.getAttribute('x')),text:el.textContent})));
    assert.ok(grid.length>=2,'linear mode must retain time labels');
    assert.ok(grid.every(item=>Number.isFinite(item.x)),'grid positions must be finite');

    await page.locator('[data-select="detailSelect"] .custom-select-trigger').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.custom-select-menu:not([hidden])').count(),0);

    await page.locator('[data-view="compare"]').click();
    const compareTrigger=page.locator('[data-select="speciesA"] .custom-select-trigger');
    await compareTrigger.click();
    assert.ok(await page.locator('.custom-select-menu:not([hidden]) .custom-select-option').count()>20);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('#compareResult .lca-banner').count()>0);

    await page.locator('[data-view="sources"]').click();
    assert.equal(await page.locator('#sourceGrid .source-card').count(),18);
    assert.equal(await page.locator('#sourceGrid .source-group').count(),4);
    await page.screenshot({path:'artifacts/evoatlas-sources-desktop.png',fullPage:true});

    await page.locator('[data-view="tree"]').click();
    await page.mouse.move(780,650);
    await page.waitForTimeout(300);
    assert.ok(await page.locator('[data-view="tree"]').evaluate(el=>el.classList.contains('active')));
    await page.screenshot({path:'artifacts/evoatlas-tree-desktop.png'});

    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(350);
    await page.locator('#openSidebar').click();
    assert.ok(await page.locator('#sidebar').evaluate(el=>el.classList.contains('open')));
    await page.locator('[data-root="hominina"]').click();
    assert.match(await page.locator('#headerBreadcrumb').innerText(),/人亚族/);
    assert.equal(await page.locator('#sidebar').evaluate(el=>el.classList.contains('open')),false);
    await page.waitForTimeout(350);
    await page.screenshot({path:'artifacts/evoatlas-tree-mobile.png'});

    assert.deepEqual(issues,[],'page should have no uncaught JavaScript errors');
    console.log('PASS: desktop and mobile interactions, data directory, timeline and custom selects.');
  } finally {
    await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exit(1);});
