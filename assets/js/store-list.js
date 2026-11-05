import { categories } from './store-repository.js';
export function renderStoreList(container,stores,onSelect) {
  container.replaceChildren();
  const buttons=new Map();
  stores.forEach((store,index)=>{
    const button=document.createElement('button'); button.type='button'; button.className='km-store'; button.setAttribute('aria-pressed','false');
    const icon=document.createElement('span'); icon.className='km-store-icon'; icon.textContent=String(index+1).padStart(2,'0'); icon.style.color=categories[store.category].color; icon.setAttribute('aria-hidden','true');
    const content=document.createElement('span'); const category=document.createElement('small'); category.textContent=store.businessType||categories[store.category].label;
    const title=document.createElement('strong'); title.textContent=store.name;
    const text=document.createElement('span'); text.textContent=store.description;
    content.append(category,title,text); button.append(icon,content); button.addEventListener('click',()=>onSelect(store.id)); container.append(button); buttons.set(store.id,button);
  });
  return {select(id) { for (const [key,button] of buttons) button.setAttribute('aria-pressed',String(key===id)); }};
}
