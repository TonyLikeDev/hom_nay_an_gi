/* Same theme engine, icons and choice styles as the public header. */
(() => {
  const trigger = document.getElementById('admin-theme-trigger');
  const picker = document.getElementById('admin-theme-options');
  const wrapper = trigger.parentElement;
  const svg = path => '<svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  const entries = [
    ['light','Sáng','<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>'],
    ['dark','Tối','<path d="M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11Z"/>'],
    ['system','Theo hệ thống','<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>']
  ];
  const close = (focus = false) => { picker.hidden = true; trigger.setAttribute('aria-expanded','false'); if (focus) trigger.focus(); };
  const choices = entries.map(([mode,label,path]) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'theme-choice'; button.dataset.themeMode = mode;
    button.setAttribute('aria-pressed','false'); button.innerHTML = svg(path);
    const text = document.createElement('span'); text.textContent = label; button.append(text);
    button.addEventListener('click', () => { SiteTheme.setMode(mode); close(true); });
    picker.append(button); return button;
  });
  function update() {
    const mode = SiteTheme.getMode(); const selected = entries.find(entry => entry[0] === mode);
    trigger.innerHTML = svg(selected[2]); trigger.title = 'Giao diện: ' + selected[1];
    trigger.setAttribute('aria-label', trigger.title + '. Chọn chế độ giao diện');
    choices.forEach(choice => choice.setAttribute('aria-pressed',String(choice.dataset.themeMode === mode)));
  }
  function open(focus = false) {
    picker.hidden = false; trigger.setAttribute('aria-expanded','true');
    if (focus) (choices.find(choice => choice.dataset.themeMode === SiteTheme.getMode()) || choices[0]).focus();
  }
  trigger.addEventListener('click', () => picker.hidden ? open() : close());
  trigger.addEventListener('keydown', event => { if (['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); open(true); } });
  picker.addEventListener('keydown', event => {
    const index = choices.indexOf(document.activeElement); let next;
    if(event.key==='ArrowDown') next=(index+1)%choices.length;
    if(event.key==='ArrowUp') next=(index-1+choices.length)%choices.length;
    if(event.key==='Home') next=0;
    if(event.key==='End') next=choices.length-1;
    if(next != null){event.preventDefault();choices[next].focus();}
  });
  wrapper.addEventListener('keydown', event => { if (event.key==='Escape' && !picker.hidden) {event.preventDefault();event.stopPropagation();close(true);} });
  wrapper.addEventListener('focusout', event => { if(!wrapper.contains(event.relatedTarget))close(); });
  document.addEventListener('pointerdown', event => { if(!wrapper.contains(event.target))close(); });
  document.addEventListener('themechange', update);
  window.addEventListener('hashchange', () => close());
  update();
})();
