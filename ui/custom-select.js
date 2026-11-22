/**
 * EvoAtlas CustomSelect
 * Progressive enhancement for native <select> controls. The original form
 * element remains the source of truth for existing app state and change events.
 * Visible menus are portaled to <body> to avoid viewer overflow clipping.
 */
(() => {
  'use strict';

  const instances = new Map();
  let opened = null;
  let serial = 0;

  function enhance(select) {
    if (instances.has(select)) return instances.get(select);
    const id = ++serial;
    const parentLabel = select.closest('label');
    const name = select.getAttribute('aria-label') ||
      ([...((parentLabel && parentLabel.childNodes) || [])]
        .find(node => node.nodeType === Node.TEXT_NODE)?.textContent.trim()) ||
      '选择选项';

    const root = document.createElement('span');
    root.className = 'custom-select';
    root.dataset.select = select.id;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-label', name);
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const menuId = 'custom-select-options-' + id;
    trigger.setAttribute('aria-controls', menuId);

    const value = document.createElement('span');
    value.className = 'custom-select-value';
    const arrow = document.createElement('span');
    arrow.className = 'custom-select-chevron';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '⌄';
    trigger.append(value, arrow);
    root.append(trigger);
    select.insertAdjacentElement('afterend', root);

    const menu = document.createElement('div');
    menu.id = menuId;
    menu.className = 'custom-select-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', name);
    menu.hidden = true;
    document.body.append(menu);

    select.classList.add('native-select-enhanced');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    let options = [];
    let active = -1;

    function sync() {
      const chosen = select.selectedOptions[0];
      const labelText = chosen?.textContent || '请选择';
      value.textContent = labelText.split(' — ')[0];
      trigger.title = labelText;
      trigger.disabled = select.disabled;
      if (!menu.hidden) {
        [...menu.children].forEach((el, index) => {
          el.setAttribute('aria-selected', String(options[index]?.value === select.value));
          el.classList.toggle('is-selected', options[index]?.value === select.value);
        });
      }
    }

    function close(returnFocus = false) {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      root.classList.remove('is-open');
      if (opened === instance) opened = null;
      if (returnFocus) trigger.focus({preventScroll:true});
    }

    function position() {
      if (menu.hidden) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 8;
      const width = Math.min(window.innerWidth - margin * 2,
        Math.max(rect.width, select.id.startsWith('species') ? 275 : 158));
      const height = Math.min(menu.scrollHeight, 300, window.innerHeight - margin * 2);
      const below = window.innerHeight - rect.bottom - margin;
      const above = rect.top - margin;
      const flip = below < Math.min(height, 170) && above > below;
      menu.style.width = width + 'px';
      menu.style.maxHeight = Math.max(90, Math.min(300, flip ? above - margin : below - margin)) + 'px';
      menu.style.left = Math.max(margin, Math.min(window.innerWidth - width - margin, rect.left)) + 'px';
      menu.style.top = (flip ? Math.max(margin, rect.top - Math.min(height, above - margin) - 6) : rect.bottom + 6) + 'px';
      menu.classList.toggle('open-above', flip);
    }

    function makeOption(option, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = menuId + '-option-' + index;
      button.className = 'custom-select-option';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(option.value === select.value));
      button.tabIndex = -1;
      button.disabled = option.disabled;
      if (option.value === select.value) button.classList.add('is-selected');

      const primary = document.createElement('span');
      primary.className = 'custom-select-option-primary';
      const label = option.textContent || '';
      const [short, ...detail] = label.split(' — ');
      primary.textContent = short;
      button.append(primary);
      if (detail.length) {
        const secondary = document.createElement('small');
        secondary.className = 'custom-select-option-secondary';
        secondary.textContent = detail.join(' — ');
        button.append(secondary);
      }
      button.addEventListener('pointermove', () => setActive(index, false));
      button.addEventListener('click', () => choose(index));
      return button;
    }

    function setActive(index, scroll = true) {
      if (!options.length) return;
      active = (index + options.length) % options.length;
      [...menu.children].forEach((el, i) => el.classList.toggle('is-active', active === i));
      const target = menu.children[active];
      trigger.setAttribute('aria-activedescendant', target.id);
      if (scroll) target.scrollIntoView({block:'nearest'});
    }

    function open() {
      if (select.disabled) return;
      if (opened && opened !== instance) opened.close();
      options = [...select.options];
      menu.replaceChildren(...options.map(makeOption));
      menu.hidden = false;
      opened = instance;
      trigger.setAttribute('aria-expanded', 'true');
      root.classList.add('is-open');
      sync();
      position();
      setActive(Math.max(0, options.findIndex(option => option.value === select.value)));
    }

    function choose(index) {
      const option = options[index];
      if (!option || option.disabled) return;
      const changed = select.value !== option.value;
      select.value = option.value;
      sync();
      close(true);
      if (changed) select.dispatchEvent(new Event('change', {bubbles: true}));
    }

    trigger.addEventListener('click', () => menu.hidden ? open() : close());
    trigger.addEventListener('keydown', event => {
      const key = event.key;
      if (key === 'Escape' && !menu.hidden) {
        event.preventDefault();event.stopPropagation();close(true);return;
      }
      if (key === 'Tab') {close();return;}
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
        event.preventDefault();
        if (menu.hidden) {open();return;}
        if (key === 'Home') setActive(0);
        else if (key === 'End') setActive(options.length - 1);
        else setActive(active + (key === 'ArrowDown' ? 1 : -1));
      } else if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (menu.hidden) open();
        else choose(active);
      } else if (!menu.hidden && key.length === 1 && !event.ctrlKey && !event.metaKey) {
        const q = key.toLocaleLowerCase();
        const first = options.findIndex((option, index) =>
          index > active && option.textContent.toLocaleLowerCase().startsWith(q));
        const fallback = options.findIndex(option => option.textContent.toLocaleLowerCase().startsWith(q));
        if (first >= 0 || fallback >= 0) setActive(first >= 0 ? first : fallback);
      }
    });
    select.addEventListener('change', sync);
    const instance = {select, root, trigger, menu, sync, close, position};
    instances.set(select, instance);
    sync();
    return instance;
  }

  document.addEventListener('pointerdown', event => {
    if (opened && !opened.root.contains(event.target) && !opened.menu.contains(event.target)) opened.close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && opened) opened.close(true);
  });
  window.addEventListener('resize', () => opened?.position());
  // Capture scrolling ancestors; the floating menu itself is not a reason to close.
  document.addEventListener('scroll', event => {
    if (opened && !opened.menu.contains(event.target)) opened.position();
  }, true);

  window.EvoSelect = {
    enhanceAll(root = document) {
      root.querySelectorAll('select').forEach(enhance);
    },
    sync(select) {
      instances.get(select)?.sync();
    },
    syncAll() {
      instances.forEach(instance => instance.sync());
    },
    close() {
      opened?.close();
    }
  };
})();