# 窓枠の制作記録

2026年9月5日。

## 採用した素材と方法

- `public/window/frame.png`：提供された `image (1).png`（720 × 720）のコピー。画素の編集なし。
- `public/window/frame-mask.svg`：窓の内側を透明にする表示用のSVGマスク。
- `src/photographic.css`：CSSの `mask` で実写の窓枠を重ねる。背後で駅周辺の写真を動かす。
- 窓枠の暗部、上の光、下の金属の反射は提供写真のまま。駅周辺の風景には、出典を記録した実写写真を使用している。

提供された窓枠写真の撮影者・ライセンスは未記載。駅周辺のWikimedia Commons写真とは別の素材として扱う。[写真の出典一覧](SOURCES.md)を参照。

## 画像編集ツールの試行

imagegenの画像編集モードで、提供画像を参照して窓の内側だけを透明にする処理を試した。出力はRGB画像で開口部にチェック模様が残り、必要な透過にならなかったため不採用。生成画像はアプリやリポジトリに含めていない。

使用したプロンプト：

```text
Use case: background-extraction / precise-object-edit.
Asset type: transparent foreground overlay for an interactive train-window web application.
Input image: edit target, the supplied 720 by 720 photograph of a dark rounded train window with yellow blurred scenery.
Primary request: Preserve the entire real photographic black window frame, interior wall, rubber surround, subtle metallic sill, yellow reflections, grain, exposure and exactly the existing framing. Remove ONLY the scenery INSIDE the window opening, replacing the whole inner glass/scenery area with genuine alpha transparency. The transparent aperture should follow the actual rounded opening in the original, approximately x=97..627 and y=99..630 on the 720x720 input. The black frame and outer wall must remain opaque. Preserve the gold reflections on the lower metal rim outside the opening. Do not invent or redesign the frame. Match original square aspect ratio, original straight-on view and physical proportions. NO checkerboard pattern baked into the image, no gray or colored fill in the aperture: real transparency so moving photos can show through underneath. No added text, no new objects. Output one square PNG foreground overlay.
```
