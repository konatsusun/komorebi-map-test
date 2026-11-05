import {categories} from './spot-types.js';
export function toGeoJSON(stores){
  return {type:'FeatureCollection',features:stores.flatMap((store,index)=>store.location?[{type:'Feature',id:store.id,geometry:{type:'Point',coordinates:[store.location.lng,store.location.lat]},properties:{id:store.id,number:index+1,color:categories[store.category].color,type:store.type||'store'}}]:[])};
}
export function preferJapanese(style,fields){
  const result=structuredClone(style);
  for(const layer of result.layers||[]){
    const field=layer.layout?.['text-field'];
    // 路線番号・標高など、名称以外の表示はそのまま残す。
    if(field && /name/.test(JSON.stringify(field)))layer.layout['text-field']=['case',...fields.flatMap(key=>[['all',['has',key],['!=',['get',key],''],['!=',['get',key],null]],['to-string',['get',key]]]),''];
  }
  return result;
}
