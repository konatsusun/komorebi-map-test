// 背景のみを切り替え、店舗ソース・選択・位置調整の状態を維持する。
export const gsiBackground=Object.freeze({
  tiles:['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
  minzoom:5,maxzoom:18,tileSize:256,
  attribution:'<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">出典：国土地理院（地理院タイル）</a>',
});
export function addBackgroundControl(map,container,buildings,onStatus){
  const baseIds=map.getStyle().layers.map(layer=>layer.id);
  map.addSource('km-gsi',{type:'raster',...gsiBackground});
  map.addLayer({id:'km-gsi-background',type:'raster',source:'km-gsi',layout:{visibility:'none'},paint:{'raster-fade-duration':0}});
  let current='ofm',savedMode,savedVisibility,savedMinZoom;
  const panel=document.createElement('div');panel.className='maplibregl-ctrl km-background-switch';panel.setAttribute('role','group');panel.setAttribute('aria-label','背景地図の切り替え');
  const buttons={};
  function update(){container.dataset.background=current;for(const [id,button]of Object.entries(buttons))button.setAttribute('aria-pressed',String(id===current));}
  function select(next){
    if(next===current)return;
    map.stop();
    if(next==='gsi'){
      savedMode=buildings.getMode();buildings.setMode('2d');buildings.setEnabled(false);
      savedVisibility=baseIds.map(id=>[id,map.getLayoutProperty(id,'visibility')||'visible']);
      for(const id of baseIds)map.setLayoutProperty(id,'visibility','none');
      savedMinZoom=map.getMinZoom();map.setMinZoom(gsiBackground.minzoom);
      map.setLayoutProperty('km-gsi-background','visibility','visible');
      onStatus('国土地理院の標準地図（平面）です。店舗ピンは独自情報です。ズーム18より拡大すると画像を拡大表示します。');
    }else{
      map.setLayoutProperty('km-gsi-background','visibility','none');
      for(const [id,visibility]of savedVisibility)map.setLayoutProperty(id,'visibility',visibility);
      map.setMinZoom(savedMinZoom);buildings.setEnabled(true);buildings.setMode(savedMode);
      onStatus('OpenFreeMapに戻しました。2D・3D表示を切り替えできます。');
    }
    current=next;update();
  }
  for(const [id,label]of [['ofm','OpenFreeMap'],['gsi','国土地理院']]){
    const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',e=>{e.stopPropagation();select(id);});buttons[id]=button;panel.append(button);
  }
  panel.addEventListener('dblclick',e=>e.stopPropagation());update();
  map.addControl({onAdd:()=>panel,onRemove:()=>panel.remove()},'top-left');
}
