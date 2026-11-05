import {mapConfig} from './map-config.js';
import {toGeoJSON,preferJapanese} from './map-data.js';
import {addBuildingViewControl} from './building-view.js';
import {addBackgroundControl} from './background-view.js';

export async function createRoadMap(container,initialStores,onSelect,onStatus){
  const {Map,NavigationControl,AttributionControl,ScaleControl,Popup,setWorkerUrl}=await import('../../vendor/maplibre/maplibre-gl.mjs');
  setWorkerUrl(new URL('../../vendor/maplibre/maplibre-gl-worker.mjs',import.meta.url).href);
  const response=await fetch(mapConfig.styleUrl,{signal:AbortSignal.timeout(mapConfig.timeoutMs)});
  if(!response.ok)throw new Error(`地図スタイルを取得できません（HTTP ${response.status}）。`);
  const style=preferJapanese(await response.json(),mapConfig.languageFields);
  let stores=initialStores,selectedId=null;
  const map=new Map({container,style,center:mapConfig.center,zoom:mapConfig.zoom,maxZoom:mapConfig.maxZoom,attributionControl:false,renderWorldCopies:false,cooperativeGestures:true,locale:{'NavigationControl.ZoomIn':'拡大','NavigationControl.ZoomOut':'縮小','NavigationControl.ResetBearing':'北を上にする','AttributionControl.ToggleAttribution':'地図の出典','CooperativeGesturesHandler.WindowsHelpText':'Ctrlキーを押しながらスクロールすると地図を拡大・縮小できます','CooperativeGesturesHandler.MobileHelpText':'2本の指で地図を動かせます'}});
  map.addControl(new NavigationControl({showCompass:false}),'top-right');
  map.addControl(new AttributionControl({compact:false,customAttribution:mapConfig.attribution}),'bottom-right');
  map.addControl(new ScaleControl({unit:'metric'}),'bottom-left');
  const popup=new Popup({closeButton:false,closeOnClick:false,offset:22});
  const empty={type:'FeatureCollection',features:[]};
  try{
    await new Promise((resolve,reject)=>{
      const cleanup=()=>{clearTimeout(timer);map.off('load',loaded);map.off('error',failed);};
      const loaded=()=>{cleanup();resolve();};
      const failed=()=>{cleanup();reject(new Error('地図データを読み込めませんでした。通信環境を確認してください。'));};
      const timer=setTimeout(()=>{cleanup();reject(new Error('地図の読み込みが時間内に完了しませんでした。'));},mapConfig.timeoutMs);
      map.once('load',loaded);map.on('error',failed);
    });
    const buildings=addBuildingViewControl(map,container);
    addBackgroundControl(map,container,buildings,onStatus);
    map.addSource('km-spots',{type:'geojson',data:toGeoJSON(stores),cluster:true,clusterRadius:35,clusterMaxZoom:mapConfig.clusterMaxZoom});
    map.addLayer({id:'km-clusters',type:'circle',source:'km-spots',filter:['has','point_count'],paint:{'circle-color':'#42634d','circle-radius':23,'circle-stroke-width':3,'circle-stroke-color':'#fffef9'}});
    map.addLayer({id:'km-cluster-count',type:'symbol',source:'km-spots',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Regular'],'text-size':14,'text-allow-overlap':true},paint:{'text-color':'#ffffff'}});
    map.addLayer({id:'km-points',type:'circle',source:'km-spots',filter:['!', ['has','point_count']],paint:{'circle-color':['get','color'],'circle-radius':19,'circle-stroke-width':3,'circle-stroke-color':'#fffef9'}});
    map.addLayer({id:'km-numbers',type:'symbol',source:'km-spots',filter:['!', ['has','point_count']],layout:{'text-field':['to-string',['get','number']],'text-font':['Noto Sans Regular'],'text-size':15,'text-allow-overlap':true},paint:{'text-color':'#ffffff'}});
    map.addSource('km-selection',{type:'geojson',data:empty});
    map.addLayer({id:'km-selection-ring',type:'circle',source:'km-selection',paint:{'circle-radius':24,'circle-color':'#ffffff','circle-opacity':0,'circle-stroke-color':'#304e38','circle-stroke-width':3}});
    map.on('click','km-points',event=>{onSelect(event.features[0].properties.id);});
    map.on('click','km-clusters',async event=>{
      try{const feature=event.features[0];const zoom=await map.getSource('km-spots').getClusterExpansionZoom(feature.properties.cluster_id);map.easeTo({center:feature.geometry.coordinates,zoom:Math.min(zoom,mapConfig.maxZoom)});}catch{onStatus('地図の操作を完了できませんでした。もう一度お試しください。',true);}
    });
    for(const layer of ['km-points','km-clusters']){map.on('mouseenter',layer,()=>{map.getCanvas().style.cursor='pointer';});map.on('mouseleave',layer,()=>{map.getCanvas().style.cursor='';});}
    map.on('error',()=>onStatus('地図の一部を読み込めませんでした。一覧は使用できます。通信を確認して再試行してください。',true));
    const resize=new ResizeObserver(()=>map.resize());resize.observe(container);
    function select(id,{move=true}={}){
      selectedId=id;const store=stores.find(s=>s.id===id);popup.remove();
      const feature=toGeoJSON(stores).features.find(f=>f.id===id);
      map.getSource('km-selection').setData({type:'FeatureCollection',features:feature?[feature]:[]});
      container.dataset.selectedId=id||'';
      if(!feature)return;
      if(move)map.easeTo({center:feature.geometry.coordinates,zoom:Math.max(map.getZoom(),mapConfig.selectionZoom),duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:450});
      const label=document.createElement('span');label.textContent=store.name+(store.isDemo?' · 仮の位置':'');
      popup.setLngLat(feature.geometry.coordinates).setDOMContent(label).addTo(map);
    }
    return {select,reset(){popup.remove();map.getSource('km-selection').setData(empty);map.easeTo({center:mapConfig.center,zoom:mapConfig.zoom});},setStores(next){stores=next;map.getSource('km-spots').setData(toGeoJSON(stores));if(selectedId)select(selectedId,{move:false});},destroy(){resize.disconnect();popup.remove();map.remove();}};
  }catch(error){map.remove();throw error;}
}
