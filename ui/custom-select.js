/**
 * EvoAtlas CustomSelect
 *
 * Progressive enhancement of real <select> elements. The hidden select is
 * the single authoritative value and still emits standard change events.
 * Portaled menus avoid clipping in the graph or comparison panels.
 */
(() => {
  'use strict';

  const instances = new Map();
  const NS='http://www.w3.org/2000/svg';
  let opened=null;
  let serial=0;
  const svgIcon=(pathD,cssClass='')=>{
    const svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','16');
    svg.setAttribute('height','16');
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.8');
    svg.setAttribute('stroke-linecap','round');
    svg.setAttribute('stroke-linejoin','round');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    if(cssClass)svg.setAttribute('class',cssClass);
    const path=document.createElementNS(NS,'path');
    path.setAttribute('d',pathD);
    svg.append(path);
    return svg;
  };

  function enhance(select){
    if(instances.has(select))return instances.get(select);
    const id=++serial;
    const label=select.closest('label');
    const name=select.getAttribute('aria-label')||
      [...(label?.childNodes||[])].find(n=>n.nodeType===Node.TEXT_NODE)?.textContent.trim()||
      '选择选项';
    const root=document.createElement('span');
    root.className='custom-select';
    root.dataset.select=select.id;

    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='custom-select-trigger';
    trigger.setAttribute('role','combobox');
    trigger.setAttribute('aria-label',name);
    trigger.setAttribute('aria-haspopup','listbox');
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-autocomplete','none');

    const display=document.createElement('span');
    display.className='custom-select-value';
    const chevron=svgIcon('m6 9 6 6 6-6','custom-select-chevron');
    trigger.append(display,chevron);
    root.append(trigger);
    select.insertAdjacentElement('afterend',root);

    const menu=document.createElement('div');
    menu.className='custom-select-menu';
    menu.hidden=true;

    const searchField=document.createElement('div');
    searchField.className='custom-select-search-field';
    searchField.hidden=true;
    const searchIcon=svgIcon('m21 21-4.35-4.35 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0','custom-select-search-icon');
    const search=document.createElement('input');
    search.type='search';
    search.className='custom-select-search';
    search.placeholder='搜索中文或学名…';
    search.autocomplete='off';
    search.setAttribute('aria-label','筛选'+name);
    searchField.append(searchIcon,search);

    const list=document.createElement('div');
    const listId='custom-select-options-'+id;
    list.id=listId;
    list.className='custom-select-list';
    list.setAttribute('role','listbox');
    list.setAttribute('aria-label',name);
    trigger.setAttribute('aria-controls',listId);
    menu.append(searchField,list);
    document.body.append(menu);

    // Original select remains accessible to code but not in the keyboard order.
    select.classList.add('native-select-enhanced');
    select.tabIndex=-1;
    select.setAttribute('aria-hidden','true');

    let allOptions=[],options=[],active=0;
    let searchable=false;

    function sync(){
      const chosen=select.selectedOptions[0];
      const text=chosen?.textContent||'请选择';
      display.textContent=text.split(' — ')[0];
      trigger.title=text;
      trigger.disabled=select.disabled;
      if(!menu.hidden){
        [...list.querySelectorAll('.custom-select-option')].forEach((button,index)=>{
          const selected=options[index]?.value===select.value;
          button.classList.toggle('is-selected',selected);
          button.setAttribute('aria-selected',String(selected));
        });
      }
    }

    function close(focus=false){
      if(menu.hidden)return;
      menu.hidden=true;
      trigger.setAttribute('aria-expanded','false');
      trigger.removeAttribute('aria-activedescendant');
      root.classList.remove('is-open');
      if(opened===instance)opened=null;
      if(focus)trigger.focus({preventScroll:true});
    }

    function position(){
      if(menu.hidden)return;
      const rect=trigger.getBoundingClientRect(),margin=8;
      const width=Math.min(window.innerWidth-margin*2,
        Math.max(rect.width,searchable?295:158));
      menu.style.width=width+'px';
      const height=Math.min(menu.scrollHeight,336,window.innerHeight-2*margin);
      const below=window.innerHeight-rect.bottom-margin;
      const above=rect.top-margin;
      const flip=below<Math.min(height,170)&&above>below;
      const available=flip?above:below;
      menu.style.maxHeight=Math.max(90,Math.min(336,available-6))+'px';
      menu.style.left=Math.max(margin,Math.min(window.innerWidth-width-margin,rect.left))+'px';
      menu.style.top=(flip?Math.max(margin,rect.top-Math.min(height,available-6)-6):rect.bottom+6)+'px';
      menu.classList.toggle('open-above',flip);
    }

    function choose(index){
      const option=options[index];
      if(!option||option.disabled)return;
      const changed=select.value!==option.value;
      select.value=option.value;
      sync();close(true);
      if(changed)select.dispatchEvent(new Event('change',{bubbles:true}));
    }

    function optionElement(option,index){
      const button=document.createElement('button');
      button.type='button';
      button.id=listId+'-option-'+index;
      button.className='custom-select-option';
      button.setAttribute('role','option');
      button.setAttribute('aria-selected',String(option.value===select.value));
      button.tabIndex=-1;button.disabled=option.disabled;
      if(option.value===select.value)button.classList.add('is-selected');
      const content=document.createElement('span');
      content.className='custom-select-option-text';
      const [short,...details]=(option.textContent||'').split(' — ');
      const primary=document.createElement('span');
      primary.className='custom-select-option-primary';
      primary.textContent=short;
      content.append(primary);
      if(details.length){
        const secondary=document.createElement('small');
        secondary.className='custom-select-option-secondary';
        secondary.textContent=details.join(' — ');
        content.append(secondary);
      }
      const check=svgIcon('M20 6 9 17l-5-5','custom-select-option-check');
      button.append(content,check);
      button.addEventListener('pointermove',()=>setActive(index,false));
      button.addEventListener('click',()=>choose(index));
      return button;
    }

    function setActive(index,scroll=true){
      if(!options.length){
        active=-1;
        trigger.removeAttribute('aria-activedescendant');
        return;
      }
      active=(index+options.length)%options.length;
      const buttons=[...list.querySelectorAll('.custom-select-option')];
      buttons.forEach((el,i)=>el.classList.toggle('is-active',i===active));
      const target=buttons[active];
      trigger.setAttribute('aria-activedescendant',target.id);
      if(scroll)target.scrollIntoView({block:'nearest'});
    }

    function renderOptions(query=''){
      const normalized=query.trim().toLocaleLowerCase();
      const matching=allOptions.filter(option=>!normalized ||
        option.textContent.toLocaleLowerCase().includes(normalized));
      // Do not mount ~500 buttons for every open. Searching exposes all names.
      options=matching.slice(0,80);
      list.replaceChildren(...options.map(optionElement));
      if(!options.length){
        const empty=document.createElement('p');
        empty.className='custom-select-empty';
        empty.textContent='没有匹配的物种';
        list.append(empty);
      }
      setActive(Math.max(0,options.findIndex(option=>option.value===select.value)),false);
      position();
    }

    function open(){
      if(select.disabled)return;
      if(opened && opened!==instance)opened.close();
      allOptions=[...select.options];
      searchable=allOptions.length>40;
      searchField.hidden=!searchable;
      search.value='';
      menu.hidden=false;
      opened=instance;
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded','true');
      renderOptions();
      sync();position();
      if(searchable)search.focus({preventScroll:true});
    }

    function onKeys(event){
      const key=event.key;
      if(key==='Escape'){
        if(!menu.hidden){event.preventDefault();event.stopPropagation();close(true);}
        return;
      }
      if(key==='Tab'){close();return;}
      if(key==='ArrowDown'||key==='ArrowUp'||key==='Home'||key==='End'){
        event.preventDefault();
        if(menu.hidden){open();return;}
        if(key==='Home')setActive(0);
        else if(key==='End')setActive(options.length-1);
        else setActive(active+(key==='ArrowDown'?1:-1));
      }else if(key==='Enter'||key===' '&&event.target===trigger){
        event.preventDefault();
        if(menu.hidden)open();
        else choose(active);
      }else if(menu.hidden && key===' '){
        event.preventDefault();open();
      }else if(!searchable && !menu.hidden && key.length===1 && !event.ctrlKey && !event.metaKey){
        const found=options.findIndex((o,i)=>i>active&&o.textContent.toLocaleLowerCase().startsWith(key.toLocaleLowerCase()));
        const first=options.findIndex(o=>o.textContent.toLocaleLowerCase().startsWith(key.toLocaleLowerCase()));
        if(found>=0||first>=0)setActive(found>=0?found:first);
      }
    }
    trigger.addEventListener('click',()=>menu.hidden?open():close());
    trigger.addEventListener('keydown',onKeys);
    search.addEventListener('keydown',onKeys);
    search.addEventListener('input',()=>renderOptions(search.value));
    select.addEventListener('change',sync);

    const instance={select,root,trigger,menu,sync,close,position};
    instances.set(select,instance);
    sync();
    return instance;
  }

  document.addEventListener('pointerdown',event=>{
    if(opened&&!opened.root.contains(event.target)&&!opened.menu.contains(event.target))opened.close();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&opened)opened.close(true);
  });
  document.addEventListener('scroll',event=>{
    if(opened&&!opened.menu.contains(event.target))opened.position();
  },true);
  window.addEventListener('resize',()=>opened?.position());

  window.EvoSelect={
    enhanceAll(root=document){root.querySelectorAll('select').forEach(enhance);},
    sync(select){instances.get(select)?.sync();},
    syncAll(){instances.forEach(instance=>instance.sync());},
    close(){opened?.close();}
  };
})();