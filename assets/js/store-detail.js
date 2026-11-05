// DOMでテキストを組み立てる。店舗データをHTMLとして解釈しない。
export function renderStoreDetail(container,store,category){
  const label=document.createElement('small');label.textContent='SELECTED SPOT / 選択中';
  const title=document.createElement('h3');title.textContent=store.name;
  const description=document.createElement('p');description.textContent=store.description;
  const note=document.createElement('p');note.className='km-detail-note';note.textContent=`${store.businessType||category.label}${store.isDemo?' · デモ店舗・仮の位置です':''}${!store.location?' · 位置は未登録です':''}`;
  container.replaceChildren(label,title,note);
  const media=document.createElement('div');media.className='km-detail-media';
  function placeholder(failed=false){const box=document.createElement('div');box.className='km-photo-placeholder';const mark=document.createElement('span');mark.className='km-photo-mark';mark.textContent='葉';mark.setAttribute('aria-hidden','true');const text=document.createElement('span');text.textContent=store.isDemo?'デモ店舗のため写真はありません':failed?'写真を読み込めませんでした':'店舗写真は準備中です';box.append(mark,text);media.replaceChildren(box);}
  placeholder();
  if(store.image){const image=document.createElement('img');image.className='km-store-photo';image.alt=store.imageAlt||`${store.name}の店舗写真`;image.loading='lazy';image.addEventListener('error',()=>placeholder(true),{once:true});image.src=store.image;media.replaceChildren(image);}
  container.append(media);
  container.append(description);
  if(!store.isDemo){
    const details=document.createElement('dl');details.className='km-store-facts';
    for(const [term,value] of [['所在地',store.address],['営業時間',store.hours],['定休日',store.closedDays]]){if(!value)continue;const dt=document.createElement('dt');dt.textContent=term;const dd=document.createElement('dd');dd.textContent=value;details.append(dt,dd);}
    container.append(details);
    const actions=document.createElement('div');actions.className='km-detail-actions';
    function linkButton(url,text,className){const link=document.createElement('a');link.className=className;link.href=url;link.textContent=text;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
    if(store.location){const url=new URL('https://www.google.com/maps/dir/');url.searchParams.set('api','1');url.searchParams.set('destination',`${store.location.lat},${store.location.lng}`);linkButton(url.href,'ここへ行く ↗','km-directions');}
    if(store.website)linkButton(store.website,'公式ホームページ ↗','km-website');
    container.append(actions);
    if(store.location){const hint=document.createElement('p');hint.className='km-detail-note';hint.textContent='「ここへ行く」はGoogleマップを別タブで開きます。';container.append(hint);}
  }
}
