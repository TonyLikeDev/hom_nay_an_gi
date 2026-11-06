const SpinOptionsUI = (() => {
  function mount({button,label,onChange = () => {}}) {
    const $=id=>document.getElementById(id);
    const options=SpinFilters.parse(new URLSearchParams(location.search));
    let locked=false;
    const leaf='<svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 4c-6-1-13 1-14 7-1 4 2 7 6 6 6-1 8-7 8-13Z"/><path d="M4 21 15 10"/></svg>';
    const entries=[{key:'all',label:'Không giới hạn',icon:Nutrition.entries[0].icon},{key:'vegetarian',label:'Món chay',icon:leaf},...Nutrition.entries.slice(1).map(entry=>({...entry,label:entry.key==='low-carb'?'Ít tinh bột · chưa có món xác minh':entry.label}))];
    const pool=()=>SpinFilters.apply(FOOD.DISHES,options);
    const diet=CatalogFilters.createDropdown($('spin-diet'),$('spin-diet-options'),entries,'nutrition','Chế độ ăn',value=>{options.diet=value;update();});
    function update(notify=true) {
      diet.setValue(options.diet);
      $('spin-recipe').setAttribute('aria-pressed',String(options.recipe));$('spin-linked').setAttribute('aria-pressed',String(options.linked));
      const active=SpinFilters.count(options),total=pool().length;
      $('spin-options-label').textContent=active?'Tùy chọn · '+active:'Tùy chọn';$('spin-reset').hidden=!active;
      $('spin-count').textContent=total?total+' món phù hợp':'Chưa có món phù hợp. Thử bỏ bớt điều kiện nhé.';$('spin-count').dataset.empty=String(!total);
      button.disabled=locked||!total;button.textContent=total?label:'Chưa có món phù hợp';
      $('spin-help').textContent=options.diet==='vegetarian'?'Nhãn chay gồm phiên bản công thức đã rà soát và thông tin từ danh mục quán; hãy kiểm tra nguyên liệu khi gọi món.':options.diet!=='all'?'Nhãn ăn kiêng chỉ áp dụng cho phiên bản tham khảo được mô tả, không xác nhận phần ăn tại quán. Ưu tiên bữa hiện tại trong các món phù hợp.':'Ưu tiên bữa hiện tại trong các món phù hợp. Món chay và ăn kiêng có tiêu chí khác nhau.';
      const query=SpinFilters.params(options).toString();history.replaceState(null,'',location.pathname+(query?'?'+query:'')+location.hash);
      if(notify)onChange();
    }
    function expand(open){$('spin-options-panel').hidden=!open;$('spin-options-trigger').setAttribute('aria-expanded',String(open));if(!open)diet.close();}
    $('spin-options-trigger').addEventListener('click',()=>expand($('spin-options-panel').hidden));
    $('spin-recipe').addEventListener('click',()=>{options.recipe=!options.recipe;update();});
    $('spin-linked').addEventListener('click',()=>{options.linked=!options.linked;update();});
    $('spin-reset').addEventListener('click',()=>{options.diet='all';options.recipe=false;options.linked=false;update();});
    function setLocked(value){locked=value;diet.close();for(const id of ['spin-options-trigger','spin-diet','spin-recipe','spin-linked','spin-reset'])$(id).disabled=value;button.disabled=value||!pool().length;}
    update(false);expand(Boolean(SpinFilters.count(options)));
    return {options,pool,setLocked};
  }
  return {mount};
})();
