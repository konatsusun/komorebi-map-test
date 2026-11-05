// 配信元変更時はURL、名前フィールド、著作権表示をまとめて確認する。
export const mapConfig = Object.freeze({
  provider:'OpenFreeMap',styleUrl:'https://tiles.openfreemap.org/styles/liberty',
  center:[127.9840,26.58945],zoom:16,selectionZoom:18,maxZoom:19,clusterMaxZoom:16,timeoutMs:25000,
  languageFields:['name:ja','name_ja','name','name:nonlatin','name:latin','name_en'],
  // OpenFreeMapのTileJSONが必要な出典リンクを供給する。表示を消さない。
  // 他社へ変更して追加表記が必要な場合のみ、検証済みのHTMLをここに設定する。
  attribution:'',
});
