import {loadStores,categories} from './store-repository.js';
import {renderStoreList} from './store-list.js';
import {renderStoreDetail} from './store-detail.js';
const $=id=>document.getElementById(id);
let stores=[],list,map,selectedId=null,loading=false,observer;
const legend=$('km-legend');
function status(message,error=false){$('km-map-status').textContent=message;$('km-map-retry').hidden=!error;}
function select(id,{move=true}={}){
  const store=stores.find(s=>s.id===id);if(!store)return;
  selectedId=id;list.select(id);map?.select(id,{move});
  renderStoreDetail($('km-detail'),store,categories[store.category]);
  $('km-status').textContent=`${store.name}を選択しました。${store.location?'':'座標未登録のため、地図には表示しません。'}`;
}
async function startMap(){
  if(loading)return;observer?.disconnect();loading=true;
  map?.destroy();map=null;$('km-map').dataset.state='loading';$('km-map').replaceChildren();
  $('km-home').disabled=true;status('道路地図を読み込んでいます…');
  try{
    const {createRoadMap}=await import('./map-view.js');
    map=await createRoadMap($('km-map'),stores,select,status);
    $('km-map').dataset.state='ready';$('km-home').disabled=false;
    status('道路地図を表示しました。「デモ」の付いた店舗は仮の位置です。');
    if(selectedId)map.select(selectedId,{move:false});
  }catch(error){$('km-map').dataset.state='error';status(`${error.message} 店舗一覧は引き続き使用できます。`,true);}
  finally{loading=false;}
}
async function start(){
  $('km-retry').hidden=true;
  try {
    stores=await loadStores();
    const demos=stores.filter(store=>store.isDemo).length;
    $('km-data-notice').textContent=`実店舗${stores.length-demos}件・デモ${demos}件を掲載しています。「デモ」の付いた店舗名・位置は架空です。`;
    $('km-count').textContent=`${stores.length} SPOTS`;
    list=renderStoreList($('km-store-list'),stores,select);
    legend.replaceChildren();
    for(const key of new Set(stores.map(s=>s.category))){const category=categories[key];const label=document.createElement('span');const dot=document.createElement('i');dot.style.background=category.color;label.append(dot,document.createTextNode(category.label));legend.append(label);}
    if(stores.length)select(stores[0].id,{move:false});else {$('km-detail').textContent='店舗はまだ登録されていません。';$('km-status').textContent='店舗データは0件です。';}
    observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))startMap();},{rootMargin:'200px'});observer.observe($('km-map'));
  }catch(error){$('km-count').textContent='読み込み失敗';$('km-status').textContent=`${error.message} 時間をおいて再読み込みしてください。`;$('km-retry').hidden=false;}
}
$('km-retry').addEventListener('click',start);
$('km-map-retry').addEventListener('click',startMap);
$('km-home').addEventListener('click',()=>map?.reset());
start();
