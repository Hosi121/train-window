import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Bookmark, Check, ChevronLeft, ChevronRight, Eye, Footprints, Info, Map, MapPin, Moon, Pause, Play, RotateCcw, Sun, Sunrise, TrainFront, Volume2, VolumeX, X } from 'lucide-react';
import { Barcode, STRIP_WIDTH } from './Barcode.jsx';
import { stations, routeSource } from './data/stations.js';
import { cn, mapUrl, readSaved } from './lib.js';
import { useTrainSound } from './useTrainSound.js';

const modes = [{ id: 'day', label: '朝', Icon: Sun }, { id: 'night', label: '夜', Icon: Moon }, { id: 'dawn', label: '夜明け', Icon: Sunrise }];
const carriageColors = ['#20563f', '#24534c', '#344948', '#583c32', '#414c33', '#254c39', '#573d42', '#4a4037'];
const visibilitySubscribe = (cb) => { document.addEventListener('visibilitychange', cb); return () => document.removeEventListener('visibilitychange', cb); };
const getVisibility = () => !document.hidden;

function StationCode({ station, className }) {
  return <span className={cn('station-code', className)} aria-label={`駅番号 ${station.code}`}><span>TY</span><b>{station.code.slice(2)}</b></span>;
}
function External({ href, children, className }) {
  return <a className={cn('external-link', className)} href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /><span className="sr-only">（新しいタブ）</span></a>;
}
function Credit({ station }) {
  return <p className="photo-credit"><External href={station.photo.source}>{station.photo.author}</External><span> / </span><External href={station.photo.licenseUrl}>{station.photo.license}</External></p>;
}

function Journey({ station, previousStation, nextStation, active, speed, mode, onNext, onExplore, onVisible, resetKey, peek, onPeek, onPrevious, onForward }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.15 });
  const x = useMotionValue(0);
  const nearX = useMotionValue(0);
  const progress = useMotionValue(0);
  const elapsed = useRef(0);
  const changed = useRef(false);
  useEffect(() => { elapsed.current = 0; changed.current = false; progress.set(0); }, [station.id, resetKey, progress]);
  useEffect(() => onVisible(inView), [inView, onVisible]);
  useAnimationFrame((_, delta) => {
    if (!active || !inView) return;
    const dt = Math.min(delta, 64) * speed;
    x.set((x.get() - dt * 0.12) % STRIP_WIDTH);
    nearX.set((nearX.get() - dt * 0.38) % STRIP_WIDTH);
    elapsed.current += dt;
    progress.set(Math.min(elapsed.current / 24000, 1));
    if (elapsed.current >= 24000 && !changed.current) { changed.current = true; onNext(); }
  });
  return <section ref={ref} className="carriage" aria-label="流れる車窓">
    <div className="window-scene"><div className="window-row">
      {[0, 1, 2].map((i) => <div className={cn('window-unit', i === 1 && 'window-unit-center')} key={i}>
        <button className="train-window" onClick={onPeek} aria-pressed={peek} aria-label={`${station.name}の車窓${i === 1 ? '' : i === 0 ? '（左）' : '（右）'}：${peek ? '色に戻す' : '写真を見る'}`}>
          <Barcode photo={station.photo} x={x} nearX={nearX} mode={mode} offset={i * 440} />
          {i === 1 && <motion.img className="window-original" src={station.photo.src} alt={peek ? station.photoCaption : ''} aria-hidden={!peek} initial={false} animate={{ opacity: peek ? 1 : 0 }} transition={{ duration: .18 }} width={station.photo.width} height={station.photo.height} />}
        </button>
      </div>)}
    </div></div>
    <div className="station-captions">
      <div>{previousStation && <button className="neighbor-station" onClick={onPrevious} aria-label={`前の駅、${previousStation.name}へ`}><StationCode station={previousStation} /><span>{previousStation.name}</span></button>}</div>
      <div><button className="current-station" onClick={onExplore} aria-label={`${station.name}の駅と街について`}><StationCode station={station} /><span>{station.name}</span></button>{peek && <button className="peek-info" onClick={onExplore} aria-label={`${station.name}の写真と駅の情報を見る`}><Info className="size-4" /></button>}</div>
      <div>{nextStation && <button className="neighbor-station" onClick={onForward} aria-label={`次の駅、${nextStation.name}へ`}><StationCode station={nextStation} /><span>{nextStation.name}</span></button>}</div>
    </div>
    <div className="journey-progress" aria-hidden="true"><motion.div style={{ scaleX: progress }} /></div>
  </section>;
}

function RouteOverview({ current, onSelect, active, speed }) {
  const x = useMotionValue(-20);
  useAnimationFrame((_, delta) => { if (active) x.set((x.get() + Math.min(delta, 64) * .014 * speed) % 1100); });
  return <section className="route-overview" aria-label="東横線 多摩川から菊名の路線図">
    <div className="overview-route"><span className="route-line-badge">TY</span><div className="overview-stations">{stations.map((station, i) => <button key={station.id} className={cn('overview-station', current === i && 'is-current')} onClick={() => onSelect(i)} aria-label={`${station.name}の車窓へ`} aria-current={i === current ? 'step' : undefined}><span className="overview-dot" /><span className="overview-name">{station.name}</span></button>)}</div></div>
    <div className="railway-landscape" aria-hidden="true"><svg viewBox="0 0 1200 170" preserveAspectRatio="xMidYMax slice"><path d="M0 64H1200" stroke="#48594f" strokeWidth="3"/><path d="M0 68H1200" stroke="#786d5c" strokeWidth="7"/>{Array.from({length:15},(_,i)=><g key={i}><path d={`M${i*90} 71v35m-4-35h8v4h-8z`} fill="#657262" stroke="#657262" strokeWidth="4"/><path d={`M${i*90+37} 21v42m-5-40h10`} stroke="#75837c" strokeWidth=".8"/></g>)}<path d="M0 28H1200" stroke="#778782" strokeWidth=".5"/><motion.g style={{x}}><rect x="0" y="47" width="137" height="15" rx="2" fill="#d0cdba"/><path d="M0 56h137" stroke="#a64740" strokeWidth="2"/>{Array.from({length:18},(_,i)=><rect key={i} x={4+i*7.2} y="50" width="4.6" height="4" fill="#43594e"/>)}{[0,1,2,3,4].map(i=><path key={i} d={`M${i*28} 47v15`} stroke="#626b5f" strokeWidth="1"/>)}</motion.g></svg></div>
  </section>;
}

function RouteMap({ current, onSelect, compact = false }) {
  const coords = stations.map((s) => [90 + ((s.lon - 139.629) / 0.043) * 185, 32 + ((35.59 - s.lat) / 0.081) * 306]);
  return <div className={cn('geographic-map', compact && 'geographic-map-compact')}>
    <svg viewBox="0 0 400 375" role="img" aria-label="東横線の多摩川から菊名までの8駅の位置。北が上。駅間は直線で結んだ概略図。">
      <path d="M32 68 L105 94 L191 99 L297 74 L379 50" className="map-river" />
      <path d="M21 258 L100 284 L188 270 L244 242 L309 249 L381 285" className="map-river map-river-small" />
      <text x="34" y="56" className="map-river-label">多摩川</text><text x="275" y="233" className="map-river-label">鶴見川</text>
      <text x="51" y="35" className="map-area-label">TOKYO</text><text x="271" y="144" className="map-area-label">KAWASAKI</text><text x="226" y="337" className="map-area-label">YOKOHAMA</text>
      <path d={`M${coords.map((p) => p.join(',')).join(' L')}`} className="map-route" />
      {stations.map((s, i) => <g key={s.id}>
        {current === i && <circle cx={coords[i][0]} cy={coords[i][1]} r="12" fill="#d1dfd5" />}
        <circle cx={coords[i][0]} cy={coords[i][1]} r={current === i ? 6 : 4} fill={current === i ? '#1c5344' : '#fbfaf6'} stroke="#1c5344" strokeWidth="2" />
        <text x={coords[i][0] + 16} y={coords[i][1] + 5} className={cn('map-station-label', current === i && 'selected')}>{s.name}</text>
      </g>)}
      <path d="M365 34v-16m-4 5 4-5 4 5" fill="none" stroke="currentColor" /><text x="361" y="47" className="map-north">N</text>
    </svg>
    {!compact && <div className="map-station-links" aria-label="地図の駅を選ぶ">{stations.map((s, i) => <button key={s.id} className={cn('map-station-choice', i === current && 'is-selected')} onClick={() => onSelect(i)} aria-pressed={i === current}>{s.name}</button>)}</div>}
    <span className="map-disclaimer">駅の位置を結んだ概略図・縮尺は目安</span>
  </div>;
}

function StationDetail({ station, saved, onSave, onMap }) {
  const [reveal, setReveal] = useState(100);
  return <div className="station-detail">
    <div className="detail-visual">
      <div className="detail-photo"><Barcode photo={station.photo} flat /><img className="revealed-photo" src={station.photo.src} alt={station.photoCaption} style={{ opacity: reveal / 100 }} width={station.photo.width} height={station.photo.height} /><span className="photo-tag">{reveal === 0 ? 'COLOR BARCODE' : 'ORIGINAL SCENE'}</span></div>
      <label className="photo-slider-label" htmlFor="photo-reveal"><span>色の車窓</span><span>もとの風景</span></label>
      <input id="photo-reveal" className="photo-slider" type="range" min="0" max="100" value={reveal} onChange={(e) => setReveal(Number(e.target.value))} aria-label="色の車窓から元の写真へ" aria-valuetext={`元の写真 ${reveal}%`} />
      <p className="detail-photo-caption">{station.photoCaption}</p>
      <Credit station={station} />
      <div className="palette-label"><span>この街から採集した色</span><span>05 COLORS</span></div>
      <div className="detail-palette">{station.photo.palette.map((color) => <span key={color} style={{ backgroundColor: color }} title={color}><span>{color.toUpperCase()}</span></span>)}</div>
      <p className="text-xs text-stone-600 mt-4 leading-6">周辺で撮影された写真を使用しています。撮影時期と現在の様子は異なることがあります。</p>
    </div>
    <div className="detail-story">
      <span className="eyebrow">{station.area}</span>
      <div className="story-section"><h4><Info className="size-4" />駅名の由来</h4><p>{station.origin}</p><External href={station.originSource}>{station.originLabel}</External></div>
      <div className="story-section"><h4><Footprints className="size-4" />周辺を歩く</h4><h5>{station.spot}</h5><span className="walk-label">{station.walk}</span><p>{station.spotText}</p><div className="flex gap-5 flex-wrap"><External href={station.spotSource}>場所について詳しく</External><button className="text-link" onClick={onMap}><MapPin className="size-3.5" />駅の位置を見る</button></div></div>
      <button className={cn('primary-button save-detail', saved && 'is-saved')} onClick={onSave} aria-pressed={saved}>{saved ? <Check className="size-4" /> : <Bookmark className="size-4" />}{saved ? '保存済み' : '次に降りたい'}</button>
    </div>
  </div>;
}

function MapDetail({ current, onSelect }) {
  const station = stations[current];
  const [showMap, setShowMap] = useState(false);
  const bbox = `${station.lon - 0.013},${station.lat - 0.008},${station.lon + 0.013},${station.lat + 0.008}`;
  return <div className="map-detail"><div><RouteMap current={current} onSelect={onSelect} /><p className="text-xs text-stone-600 leading-6 mt-5">駅順・駅番号は東急公式路線図、座標は各駅の公開データを参照しています。体験では多摩川〜菊名の8駅を収録。</p><External href={routeSource}>東急の公式路線図</External></div><div className="map-detail-right"><span className="eyebrow">気になった街の位置</span><h3>{station.name}<small>{station.en}</small></h3><p className="text-sm text-stone-600">{station.area}</p><div className="real-map">{showMap ? <iframe key={station.id} title={`${station.name}駅周辺のOpenStreetMap`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${station.lat},${station.lon}`} loading="lazy" /> : <div className="load-map"><Map className="size-7" /><p>駅から、どちらへ歩こう。</p><button className="secondary-button" onClick={() => setShowMap(true)}>周辺の地図をひらく<ArrowUpRight className="size-4" /></button><small>OpenStreetMap を読み込みます</small></div>}</div><External href={mapUrl(station)}>大きな地図でこの駅を見る</External><p className="text-xs text-stone-600 mt-3 leading-6">地図が表示されない場合も、上のリンクから位置を確認できます。</p></div></div>;
}

function About() {
  return <div className="about-content"><span className="eyebrow">ABOUT THIS JOURNEY</span><h3>通り過ぎていた街が、<br />気になる街に変わる。</h3><p>電車の窓から流れていくのは、写真から生まれた色の帯。<br className="hidden sm:block" />空の青、木々の緑、商店街の看板。形をほどくと、街はどんな色に見えるでしょう。</p><div className="about-steps">{[{ Icon: Eye, title: '色をながめる', text: '何も決めず、流れる車窓に身をまかせる。' }, { Icon: MapPin, title: '気になる街をひらく', text: '窓や駅名にふれて、もとの写真や街の物語へ。' }, { Icon: Bookmark, title: '次のよりみちに', text: '「降りてみたい」を保存して、次の小さな旅に。' }].map(({ Icon, title, text }, i) => <div key={title}><span>0{i + 1}</span><Icon className="size-5" /><h4>{title}</h4><p>{text}</p></div>)}</div><div className="about-note"><p>舞台は東急東横線、多摩川から菊名までの8駅。実際の駅周辺の写真を使った、非公式のアート体験です。走行時間と光の演出は実際の運行・撮影時刻とは連動していません。</p><p>保存した駅は、このブラウザに記録されます。アカウント登録は不要です。</p></div></div>;
}

function Sources() {
  return <div className="sources-content"><p>実際の場所の写真から色を抽出しています。写真は縮小・WebP変換し、横方向に伸ばしたカラーバーコードとしても利用しています。各写真とその派生物には、下記の元のライセンスが適用されます。</p><p className="text-xs text-stone-600">データ収集日：2026年9月5日 · 朝・夜・夜明けは色調の演出です。</p><External href={routeSource}>駅順・駅番号：東急電鉄 公式路線図</External><div className="source-list">{stations.map((s) => <article key={s.id}><img src={s.photo.src} alt={s.photoCaption} loading="lazy" width="112" height="80" /><div><h3>{s.name} <span>{s.code}</span></h3><p>{s.photo.title}</p><Credit station={s} /><div className="flex flex-wrap gap-x-4 gap-y-1"><External href={s.originSource}>地名・駅名の資料</External><External href={s.spotSource}>よりみち先の資料</External><External href={`https://en.wikipedia.org/wiki/${s.wiki}`}>駅の座標</External></div></div></article>)}</div></div>;
}
export default function App() {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [current, setCurrent] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState('day');
  const [view, setView] = useState('window');
  const [peek, setPeek] = useState(false);
  const [modal, setModal] = useState(null);
  const [detailIndex, setDetailIndex] = useState(0);
  const [saved, setSaved] = useState(() => readSaved().filter((id) => stations.some((s) => s.id === id)));
  const [storageError, setStorageError] = useState('');
  const [journeyVisible, setJourneyVisible] = useState(true);
  const [finished, setFinished] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const isVisible = useSyncExternalStore(visibilitySubscribe, getVisibility);
  const triggerRef = useRef(null);
  const station = stations[current];
  const detailStation = stations[detailIndex];
  const running = playing && isVisible && !modal && !finished && !peek;
  const sound = useTrainSound(running && (view === 'route' || journeyVisible));
  const openModal = (type, index = current) => { triggerRef.current = document.activeElement; setDetailIndex(index); setModal(type); };
  const selectStation = (i) => { setCurrent(i); setFinished(false); setPeek(false); setResetKey((key) => key + 1); };
  const next = useCallback(() => {
    if (current === stations.length - 1) { setFinished(true); setPlaying(false); }
    else { setCurrent((i) => i + 1); setPeek(false); }
  }, [current]);
  const toggleSave = (id) => {
    const updated = saved.includes(id) ? saved.filter((s) => s !== id) : [...saved, id];
    setSaved(updated);
    try { localStorage.setItem('yorimichi-stations', JSON.stringify(updated)); setStorageError(''); }
    catch { setStorageError('ブラウザへの保存ができませんでした。この画面を閉じるまで記録を保持します。'); }
  };
  const togglePlayback = () => { if (peek) { setPeek(false); setPlaying(true); return; } if (finished) { selectStation(0); setPlaying(true); } else setPlaying((p) => !p); };
  const dialogTitle = modal === 'station' ? detailStation.name : modal === 'map' ? '路線図' : modal === 'saved' ? '次に降りたい駅' : modal === 'sources' ? '出典' : 'この車窓について';
  return <div className={cn('journey-app', `theme-${mode}`, view === 'route' && 'route-view')} style={{'--carriage-color':carriageColors[current]}}>
    <a className="skip-link" href="#journey">車窓へスキップ</a>
    <header className="app-header"><h1>よりみちの車窓</h1><div className="header-actions"><div className="mode-group" aria-label="光の演出">{modes.map(({id,label})=><button key={id} onClick={()=>setMode(id)} aria-pressed={mode===id}>{label}</button>)}</div><span className="header-divider"/><button className="icon-button" onClick={()=>{setPeek(false);setView(view==='window'?'route':'window');}} aria-label={view==='window'?'路線図を見る':'車窓に戻る'} title={view==='window'?'路線図':'車窓'}>{view==='window'?<Map className="size-4"/>:<Eye className="size-4"/>}</button><button className="icon-button saved-link" onClick={()=>openModal('saved')} aria-label={`次に降りたい駅 ${saved.length}件`} title="次に降りたい駅"><Bookmark className="size-4"/>{saved.length>0&&<span>{saved.length}</span>}</button></div></header>
    <main id="journey" className="immersive-main">
      {view === 'window' ? <Journey station={station} previousStation={stations[current-1]} nextStation={stations[current+1]} active={running} speed={speed} mode={mode} onNext={next} onExplore={()=>openModal('station')} onVisible={setJourneyVisible} resetKey={resetKey} peek={peek} onPeek={()=>setPeek(p=>!p)} onPrevious={()=>selectStation(current-1)} onForward={()=>selectStation(current+1)}/> : <RouteOverview current={current} onSelect={(i)=>{selectStation(i);setView('window');}} active={running} speed={speed}/>}
      <p className="sr-only" aria-live="polite">{station.name}、{station.code}{finished?'、終点です。':''}</p>
    </main>
    <footer className="app-footer"><button className="route-label" onClick={()=>openModal('map')}>東急東横線<span>多摩川 — 菊名</span></button><div className="transport-controls"><button className="icon-button" onClick={()=>selectStation(current-1)} disabled={current===0} aria-label="前の駅へ"><ChevronLeft className="size-4"/></button><button className="icon-button play-button" onClick={togglePlayback} aria-label={finished?'もう一度旅をする':playing&&!peek?'旅を一時停止':'旅を再生'}>{finished?<RotateCcw className="size-4"/>:playing&&!peek?<Pause className="size-4"/>:<Play className="size-4"/>}</button><button className="icon-button" onClick={()=>selectStation(current+1)} disabled={current===stations.length-1} aria-label="次の駅へ"><ChevronRight className="size-4"/></button><select value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} aria-label="走行速度"><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select><button className="icon-button" onClick={sound.toggle} aria-pressed={sound.enabled} aria-label={sound.enabled?'車内音を消す':'車内音を聴く'}>{sound.enabled?<Volume2 className="size-4"/>:<VolumeX className="size-4"/>}</button></div><div className="footer-actions"><button onClick={()=>openModal('sources')}>出典</button><button className="icon-button" onClick={()=>openModal('about')} aria-label="この車窓について"><Info className="size-4"/></button></div></footer>
    {sound.error&&<p className="sound-error" role="status">{sound.error}</p>}
    {reduced&&!playing&&<span className="sr-only">動きを控える設定に合わせて停止しています。再生ボタンで旅をはじめられます。</span>}
    <Dialog.Root open={modal!==null} onOpenChange={(open)=>{if(!open)setModal(null);}}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className={cn('dialog-content',(modal==='about'||modal==='saved'||modal==='sources')&&'dialog-narrow')} onCloseAutoFocus={(event)=>{event.preventDefault();triggerRef.current?.focus();}}><div className="dialog-header"><div>{modal==='station'&&<StationCode station={detailStation}/>}<div><Dialog.Title>{dialogTitle}</Dialog.Title><Dialog.Description className="sr-only">{modal==='station'?'写真、駅名の由来、周辺の見どころ。':dialogTitle}</Dialog.Description></div></div><Dialog.Close className="close-button" aria-label="閉じて車窓に戻る"><X className="size-5"/></Dialog.Close></div><div className="dialog-body">
      {modal==='station'&&<StationDetail key={detailStation.id} station={detailStation} saved={saved.includes(detailStation.id)} onSave={()=>toggleSave(detailStation.id)} onMap={()=>setModal('map')}/>}
      {modal==='map'&&<MapDetail current={detailIndex} onSelect={setDetailIndex}/>}
      {modal==='about'&&<About/>}
      {modal==='sources'&&<Sources/>}
      {modal==='saved'&&(saved.length===0?<div className="empty-saved"><Bookmark className="size-7"/><h3>まだ保存した駅はありません。</h3><p>駅名を押すと、その街を保存できます。</p><Dialog.Close className="primary-button">車窓に戻る<ArrowRight className="size-4"/></Dialog.Close></div>:<div className="saved-stations">{stations.filter(s=>saved.includes(s.id)).map(s=><article key={s.id}><button onClick={()=>{setDetailIndex(stations.indexOf(s));setModal('station');}}><img src={s.photo.src} alt={s.photoCaption} width="112" height="88"/><span><small>{s.code}</small><h3>{s.name}</h3></span><ArrowUpRight className="size-4"/></button><button className="remove-saved" onClick={()=>toggleSave(s.id)} aria-label={`${s.name}を保存から外す`}><Bookmark className="size-4 fill-current"/></button></article>)}</div>)}
      {storageError&&<p className="inline-error" role="status">{storageError}</p>}
    </div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
