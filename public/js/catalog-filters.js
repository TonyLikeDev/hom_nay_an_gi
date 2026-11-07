/* Shared accessible icon dropdowns for dish and restaurant catalogs. */
const CatalogFilters = (() => {
  const dropdowns = [];
  const normalize = value => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  function createDropdown(trigger, list, entries, kind, title, onChange) {
    const options = [];
    let selected = entries[0].key;
    let typing = '';
    let typingTimer;
    function close(focus = false) {
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      clearTimeout(typingTimer);
      typing = '';
      if (focus) trigger.focus();
    }
    function open() {
      dropdowns.forEach(dropdown => dropdown.close());
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const active = options.find(option => option.dataset.value === selected) || options[0];
      active.focus();
      active.scrollIntoView({ block: 'nearest' });
    }
    function setValue(value) {
      selected = value;
      trigger.value = value;
      const entry = entries.find(item => item.key === value) || entries[0];
      document.getElementById(trigger.id + '-label').textContent = entry.label;
      trigger.parentElement.dataset[kind] = value;
      trigger.parentElement.dataset.active = String(value !== entries[0].key);
      trigger.querySelector('.catalog-select__icon').innerHTML = entry.icon;
      trigger.setAttribute('aria-label', title + ': ' + entry.label);
      options.forEach(option => option.setAttribute('aria-selected', String(option.dataset.value === value)));
    }
    entries.forEach(entry => {
      const option = document.createElement('div');
      option.className = 'catalog-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      option.tabIndex = -1;
      option.dataset.value = entry.key;
      option.dataset[kind] = entry.key;
      const icon = document.createElement('span');
      icon.className = 'catalog-option__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = entry.icon;
      const label = document.createElement('span');
      label.textContent = entry.label;
      const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      check.setAttribute('viewBox', '0 0 24 24');
      check.setAttribute('class', 'catalog-option__check');
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = '<path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      option.append(icon, label, check);
      option.addEventListener('click', () => { setValue(entry.key); onChange(entry.key); close(true); });
      list.append(option);
      options.push(option);
    });
    trigger.addEventListener('click', () => list.hidden ? open() : close());
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
    });
    list.addEventListener('keydown', event => {
      const index = options.indexOf(document.activeElement);
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % options.length;
      else if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = options.length - 1;
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); options[index]?.click(); return; }
      else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typing += normalize(event.key);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => { typing = ''; }, 650);
        const found = entries.findIndex(entry => normalize(entry.label).startsWith(typing));
        if (found >= 0) next = found;
      }
      if (next != null) { event.preventDefault(); options[next].focus(); options[next].scrollIntoView({ block: 'nearest' }); }
    });
    trigger.parentElement.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(true); }
    });
    trigger.parentElement.addEventListener('focusout', event => {
      if (!trigger.parentElement.contains(event.relatedTarget)) close();
    });
    document.addEventListener('pointerdown', event => { if (!trigger.parentElement.contains(event.target)) close(); });
    const api = { close, setValue };
    setValue(entries[0].key);
    dropdowns.push(api);
    return api;
  }
  return { createDropdown };
})();
