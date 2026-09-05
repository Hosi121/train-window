# 写真とデータの出典

取得・確認日：2026年9月5日。各写真を縮小・WebP変換し、色抽出と横方向への伸長、細線の重畳に使用しています。写真と派生する色帯には、各写真の元のライセンスが適用されます。画像の作者はアプリの推奨・協賛者ではありません。

| 駅 | 写真・原典 | 撮影者 | ライセンス | 撮影時期（原典表記） |
| --- | --- | --- | --- | --- |
| 多摩川 | [Tamagawadai Park 2024 May 30 various.jpeg](https://commons.wikimedia.org/wiki/File:Tamagawadai_Park_2024_May_30_various.jpeg) | Nesnad | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 2024-05-30 15:25:14 |
| 新丸子 | [Maruko-bashi in context - 2022 Feb 6.jpeg](https://commons.wikimedia.org/wiki/File:Maruko-bashi_in_context_-_2022_Feb_6.jpeg) | Nesnad | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 2022-02-06 14:29:02 |
| 武蔵小杉 | [Bus pool at Musashi-Kosugi Station - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Bus_pool_at_Musashi-Kosugi_Station_-_panoramio.jpg) | Kaz Ish | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | Taken on 21 April 2007 |
| 元住吉 | [Bremen-dori -01.jpg](https://commons.wikimedia.org/wiki/File:Bremen-dori_-01.jpg) | Aimaimyi | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 2011-01-02 |
| 日吉 | [Ginkgo Avenue, Hiyoshi Campus, Keio University, Yokohama - Apr 15, 2012.jpg](https://commons.wikimedia.org/wiki/File:Ginkgo_Avenue,_Hiyoshi_Campus,_Keio_University,_Yokohama_-_Apr_15,_2012.jpg) | Manabu Itoh | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | 2012-04-15 14:03:51 |
| 綱島 | [綱島公園 - panoramio.jpg](https://commons.wikimedia.org/wiki/File:%E7%B6%B1%E5%B3%B6%E5%85%AC%E5%9C%92_-_panoramio.jpg) | 珈琲牛乳 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | Taken on 19 October 2012 |
| 大倉山 | [Okurayamakoen -01.jpg](https://commons.wikimedia.org/wiki/File:Okurayamakoen_-01.jpg) | Aimaimyi | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 2006-03-12 |
| 菊名 | [Kikuna Shrine in Yokohama City.jpg](https://commons.wikimedia.org/wiki/File:Kikuna_Shrine_in_Yokohama_City.jpg) | ブルーノ・プラス | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | 2025-01 |

## 路線・駅の位置

- [東急電鉄・公式路線図](https://www.tokyu.co.jp/railway/map/)：多摩川 TY09、新丸子 TY10、武蔵小杉 TY11、元住吉 TY12、日吉 TY13、綱島 TY14、大倉山 TY15、菊名 TY16。
- 駅の座標は英語版Wikipedia各駅ページの公開座標を参照。各URLと値は `src/data/stations.js` に記録。原典ページはアプリの出典画面からも開けます。
- 路線の駅順から独自のSVG路線図を作成。地理表示は駅間を直線で結んだ概略図です。
- 実際の周辺地図：[OpenStreetMap](https://www.openstreetmap.org/copyright)。利用者が地図を開いた場合にのみ公式埋め込みを読み込みます。

## 地名の由来と周辺スポット

各駅の `originSource` / `spotSource` に資料のURLを保存しています。地名の由来に諸説あるものは、断定せずその旨を記述しています。説明は資料を基に独自に要約しています。

- [東急100年史・駅名や路線名の変更](https://www.tokyu.co.jp/history/chapter07_2_3/)
- [川崎市・中原区の地名資料](https://www.city.kawasaki.jp/250/cmsfiles/contents/0000005/5013/nakaharaku.pdf)
- [川崎市・市政だより中原区版 2024年1月](https://www.city.kawasaki.jp/nakahara/cmsfiles/contents/0000031/31928/240101_nakahara_web.pdf)
- [川崎市・名所旧跡 中原区](https://www.city.kawasaki.jp/250/page/0000003519.html)
- [川崎市・日吉地区とは](https://www.city.kawasaki.jp/saiwai/page/0000024562.html)
- [横浜市・広報よこはま港北区版 2019年8月](https://www.city.yokohama.lg.jp/kohoku/kusei/koho/kuban/kohokohoku2019.files/0198_20190725.pdf)
- [大倉精神文化研究所・第42回「大倉山」事始め](https://www.okuraken.or.jp/study/area_studies/kouhoku/42.html)
- [大田区・多摩川台公園](https://www.city.ota.tokyo.jp/shisetsu/park/tamagawadai.html)
- [モトスミ・ブレーメン通り商店街](https://bremen-st.com/about-bremen/)
- [慶應義塾大学・銀杏並木](https://www.keio.ac.jp/ja/about/campus/hiyoshi/encyclopedia/09.html)
- [横浜市・綱島公園](https://www.city.yokohama.lg.jp/kohoku/kurashi/machizukuri_kankyo/jimusho/koen_ryokudo/map-seach/b-3/tunasima.html)
- [横浜市・大倉山公園](https://www.city.yokohama.lg.jp/kurashi/machizukuri-kankyo/midori-koen/koen/koen/daihyoteki/okurayama-park.html)
- [横浜市・菊名桜山公園](https://www.city.yokohama.lg.jp/kurashi/machizukuri-kankyo/midori-koen/koen/koen/daihyoteki/kikunasakura.html)

## フォントと音

- Noto Sans JP / Noto Serif JP：Google Fontsから取得。アプリ内の文字にサブセット化。ライセンス全文は `public/fonts/*-OFL.txt` に同梱。
- 車内音：Web Audio APIで生成したノイズ。実車の録音素材は使用していません。

スケッチの画像はデザイン検討用としてローカルの `reference/` に保管し、リポジトリや配信成果物には含めていません。
