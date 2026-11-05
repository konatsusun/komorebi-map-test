// 表示だけを切り替える。店舗ソース・建物の座標・配信データは変更しない。
export function addBuildingViewControl(map,container){
  const extrusions=map.getStyle().layers.filter(layer=>layer.type==='fill-extrusion' && layer['source-layer']==='building');
  const records=extrusions.map((layer,index)=>{
    const flatId=`km-building-flat-${index}`;
    const flat={id:flatId,type:'fill',source:layer.source,'source-layer':layer['source-layer'],layout:{visibility:'none'},paint:{'fill-color':'#dfded4','fill-outline-color':'#65735f','fill-opacity':1}};
    for(const key of ['minzoom','maxzoom','filter'])if(layer[key]!==undefined)flat[key]=layer[key];
    map.addLayer(flat,layer.id);
    return {id:layer.id,flatId,visibility:layer.layout?.visibility||'visible'};
  });
  let mode='3d',savedCamera;
  const maxPitch=map.getMaxPitch();
  const panel=document.createElement('div');panel.className='maplibregl-ctrl maplibregl-ctrl-group km-building-switch';panel.setAttribute('role','group');panel.setAttribute('aria-label','建物の表示方法');
  const buttons={};
  function update(){for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===mode));container.dataset.buildingView=mode;}
  function setMode(next){
    if(next===mode)return;
    if(next==='2d'){
      savedCamera={pitch:map.getPitch(),bearing:map.getBearing(),drag:map.dragRotate.isEnabled()};
      map.stop();map.setMaxPitch(0);map.jumpTo({pitch:0,bearing:0});
      map.dragRotate.disable();map.touchZoomRotate.disableRotation();map.keyboard.disableRotation();
    }else{
      map.setMaxPitch(maxPitch);map.jumpTo({pitch:savedCamera.pitch,bearing:savedCamera.bearing});
      if(savedCamera.drag)map.dragRotate.enable();map.touchZoomRotate.enableRotation();map.keyboard.enableRotation();
    }
    for(const record of records){map.setLayoutProperty(record.id,'visibility',next==='2d'?'none':record.visibility);map.setLayoutProperty(record.flatId,'visibility',next==='2d'?record.visibility:'none');}
    mode=next;update();
  }
  for(const [key,text] of [['2d','2D（平面）'],['3d','3D（立体）']]){
    const button=document.createElement('button');button.type='button';button.textContent=text;button.title=key==='2d'?'真上から建物の輪郭を確認':'元の立体表示に戻す';button.addEventListener('click',event=>{event.stopPropagation();setMode(key);});buttons[key]=button;panel.append(button);
  }
  panel.addEventListener('dblclick',event=>event.stopPropagation());
  update();
  map.addControl({onAdd(){return panel;},onRemove(){panel.remove();}},'top-right');
  return {getMode:()=>mode,setMode,setEnabled(enabled){for(const button of Object.values(buttons))button.disabled=!enabled;panel.title=enabled?'':'国土地理院は平面の画像地図です。OpenFreeMapに戻すと切り替えできます。';}};
}
