// WordPress連携時は、この読み込み関数をREST API用に差し替えます。
import {categories,spotTypes} from './spot-types.js';
export {categories} from './spot-types.js';
export function validateStores(data) {
  if (!Array.isArray(data)) throw new Error('店舗データは配列で指定してください。');
  const ids = new Set();
  return data.map((store,index) => {
    if (!store || typeof store !== 'object' || typeof store.id !== 'string' || !/^[a-z0-9-]+$/.test(store.id) || ids.has(store.id)) throw new Error(`${index+1}件目の店舗IDが不正または重複しています。`);
    ids.add(store.id);
    for (const key of ['name','description','address','hours']) if (typeof store[key] !== 'string' || !store[key].trim()) throw new Error(`${store.id}: ${key}を入力してください。`);
    if (!Object.hasOwn(categories,store.category)) throw new Error(`${store.id}: カテゴリーが不正です。`);
    for(const key of ['businessType','closedDays','imageAlt'])if(store[key]!=null && typeof store[key]!=='string')throw new Error(`${store.id}: ${key}は文字列です。`);
    // 写真はローカル画像のみ。外部追跡URLやスクリプトURLを許可しない。
    if(store.image!=null && (typeof store.image!=='string'||!/^assets\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(store.image)))throw new Error(`${store.id}: 写真はassets/images内のjpg・png・webp画像を指定してください。`);
    if(store.demoPosition) for (const key of ['x','y']) if (!Number.isFinite(store.demoPosition[key]) || store.demoPosition[key]<8 || store.demoPosition[key]>92) throw new Error(`${store.id}: 模式図の位置は8〜92で指定してください。`);
    if(store.type && !Object.hasOwn(spotTypes,store.type))throw new Error(`${store.id}: スポット種類が不正です。`);
    if(store.isDemo!==undefined && typeof store.isDemo!=='boolean')throw new Error(`${store.id}: isDemoは真偽値です。`);
    if(store.modeTags!==undefined && (!Array.isArray(store.modeTags)||store.modeTags.some(tag=>typeof tag!=='string')))throw new Error(`${store.id}: modeTagsは文字列の配列です。`);
    if(store.event!=null){
      const {startsAt,endsAt}=store.event;
      const valid=value=>typeof value==='string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
      if(!valid(startsAt)||!valid(endsAt)||Date.parse(startsAt)>=Date.parse(endsAt))throw new Error(`${store.id}: イベントはタイムゾーン付きの開始・終了日時を指定してください。`);
    }
    if(!Array.isArray(store.socialLinks)||store.socialLinks.some(link=>!link||typeof link.url!=='string'))throw new Error(`${store.id}: socialLinksが不正です。`);
    if (store.location !== null && (!store.location || !Number.isFinite(store.location.lat) || Math.abs(store.location.lat)>90 || !Number.isFinite(store.location.lng) || Math.abs(store.location.lng)>180)) throw new Error(`${store.id}: 緯度・経度が不正です。`);
    for (const link of [store.website,...(Array.isArray(store.socialLinks) ? store.socialLinks.map(s=>s.url) : [])]) {
      if (link && (typeof link !== 'string' || !/^https?:$/.test(new URL(link).protocol))) throw new Error(`${store.id}: リンクはhttpまたはhttpsで指定してください。`);
    }
    return {...store};
  });
}
export async function loadStores() {
  const response = await fetch(new URL('../../data/stores.json',import.meta.url));
  if (!response.ok) throw new Error(`店舗データを取得できませんでした（HTTP ${response.status}）。`);
  return validateStores(await response.json());
}
