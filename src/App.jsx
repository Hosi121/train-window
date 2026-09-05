import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Bookmark, Check, ChevronLeft, ChevronRight, Eye, Footprints, Info, Map, MapPin, Moon, Pause, Play, RotateCcw, Sun, Sunrise, Volume2, VolumeX, X } from 'lucide-react';
import { Barcode } from './Barcode.jsx';
import { stations, routeSource } from './data/stations.js';
import { cn, mapUrl, readSaved } from './lib.js';
import { useTrainSound } from './useTrainSound.js';
import { Explore } from './Explore.jsx';
import { StationMap } from './StationMap.jsx';
import { PhotographicJourney } from './PhotographicJourney.jsx';

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
  return <div className="map-detail"><div><StationMap selected={current} onSelect={onSelect} /><p className="text-xs text-stone-600 leading-6 mt-5">多摩川〜菊名の8駅。駅間の線は座標を結んだ概略です。</p><External href={routeSource}>東急の公式路線図</External></div><div className="map-detail-right"><span className="eyebrow">{station.code} · {station.area}</span><h3>{station.name}<small>{station.en}</small></h3><img className="map-detail-cover" src={station.photo.src} alt={station.photoCaption}/><Credit station={station}/><h4 className="mt-5 mb-3 text-sm">{station.spot}</h4><p className="text-xs text-stone-600 leading-7">{station.spotText}</p><External href={mapUrl(station)}>大きな地図でこの駅を見る</External></div></div>;
}

function About() {
  return <div className="about-content"><span className="eyebrow">ABOUT THIS JOURNEY</span><h3>通り過ぎていた街が、<br />気になる街に変わる。</h3><p>電車の窓から流れていくのは、写真から生まれた色の帯。<br className="hidden sm:block" />空の青、木々の緑、商店街の看板。形をほどくと、街はどんな色に見えるでしょう。</p><div className="about-steps">{[{ Icon: Eye, title: '色をながめる', text: '何も決めず、流れる車窓に身をまかせる。' }, { Icon: MapPin, title: '気になる街をひらく', text: '窓や駅名にふれて、もとの写真や街の物語へ。' }, { Icon: Bookmark, title: '次のよりみちに', text: '「降りてみたい」を保存して、次の小さな旅に。' }].map(({ Icon, title, text }, i) => <div key={title}><span>0{i + 1}</span><Icon className="size-5" /><h4>{title}</h4><p>{text}</p></div>)}</div><div className="about-note"><p>舞台は東急東横線、多摩川から菊名までの8駅。実際の駅周辺の写真を使った、非公式のアート体験です。走行時間と光の演出は実際の運行・撮影時刻とは連動していません。</p><p>保存した駅は、このブラウザに記録されます。アカウント登録は不要です。</p></div></div>;
}

function Sources() {
  return <div className="sources-content"><p>実際の場所の写真に横方向のにじみを加えて、車窓として再生しています。写真は縮小・WebP変換し、切り抜き表示や色の抽出にも利用しています。各写真とその派生物には、下記の元のライセンスが適用されます。</p><p className="text-xs text-stone-600">データ収集日：2026年9月5日 · 朝・夜・夜明けは色調の演出です。窓枠は提供された参考写真の内側をマスクして使用しています。</p><External href={routeSource}>駅順・駅番号：東急電鉄 公式路線図</External><div className="source-list">{stations.map((s) => <article key={s.id}><img src={s.photo.src} alt={s.photoCaption} loading="lazy" width="112" height="80" /><div><h3>{s.name} <span>{s.code}</span></h3><p>{s.photo.title}</p><Credit station={s} /><div className="flex flex-wrap gap-x-4 gap-y-1"><External href={s.originSource}>地名・駅名の資料</External><External href={s.spotSource}>よりみち先の資料</External><External href={`https://en.wikipedia.org/wiki/${s.wiki}`}>駅の座標</External></div></div></article>)}</div></div>;
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
  const sound = useTrainSound(running && view === 'window' && journeyVisible);
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
  const togglePlayback = () => { if (view === 'route') { setView('window'); setPlaying(true); setPeek(false); if (finished) selectStation(0); return; } if (peek) { setPeek(false); setPlaying(true); return; } if (finished) { selectStation(0); setPlaying(true); } else setPlaying((p) => !p); };
  const dialogTitle = modal === 'station' ? detailStation.name : modal === 'map' ? '路線図' : modal === 'saved' ? '次に降りたい駅' : modal === 'sources' ? '出典' : 'この車窓について';
  return <div className={cn('journey-app', `theme-${mode}`, view === 'route' ? 'route-view' : 'photo-view')} style={{'--carriage-color':carriageColors[current]}}>
    <a className="skip-link" href="#journey">車窓へスキップ</a>
    <header className="app-header"><h1>よりみちの車窓</h1><div className="header-actions"><div className="mode-group" aria-label="光の演出">{modes.map(({id,label})=><button key={id} onClick={()=>setMode(id)} aria-pressed={mode===id}>{label}</button>)}</div><span className="header-divider"/><button className="icon-button view-toggle" onClick={()=>{setPeek(false);setView(view==='window'?'route':'window');}} aria-label={view==='window'?'路線図を見る':'車窓に戻る'} title={view==='window'?'路線図':'車窓'}>{view==='window'?<Map className="size-4"/>:<Eye className="size-4"/>}<span>{view==='window'?'地図':'車窓'}</span></button><button className="icon-button saved-link" onClick={()=>openModal('saved')} aria-label={`次に降りたい駅 ${saved.length}件`} title="次に降りたい駅"><Bookmark className="size-4"/>{saved.length>0&&<span>{saved.length}</span>}</button></div></header>
    <main id="journey" className="immersive-main">
      {view === 'window' ? <PhotographicJourney suspended={!isVisible || !!modal} station={station} previousStation={stations[current-1]} nextStation={stations[current+1]} active={running} speed={speed} mode={mode} onNext={next} onExplore={()=>openModal('station')} onVisible={setJourneyVisible} resetKey={resetKey} peek={peek} onPeek={()=>setPeek(p=>!p)} onPrevious={()=>selectStation(current-1)} onForward={()=>selectStation(current+1)}/> : <Explore current={current} saved={saved} onSave={toggleSave} onPlay={(i)=>{selectStation(i);setPlaying(true);setView('window');}} onDetail={(i)=>openModal('station',i)} storageError={storageError}/>}
      <p className="sr-only" aria-live="polite">{station.name}、{station.code}{finished?'、終点です。':''}</p>
    </main>
    <footer className="app-footer">{view==='route'?<button className="footer-now-playing" onClick={()=>setView('window')} aria-label={`${station.name}の車窓に戻る`}><img src={station.photo.src} alt=""/><span>{station.name}<small>{station.code} · 東急東横線</small></span></button>:<button className="route-label" onClick={()=>openModal('map')}>東急東横線<span>多摩川 — 菊名</span></button>}<div className="transport-controls"><button className="icon-button" onClick={()=>selectStation(current-1)} disabled={current===0} aria-label="前の駅へ"><ChevronLeft className="size-4"/></button><button className="icon-button play-button" onClick={togglePlayback} aria-label={finished?'もう一度旅をする':playing&&!peek&&view==='window'?'旅を一時停止':'旅を再生'}>{finished?<RotateCcw className="size-4"/>:playing&&!peek&&view==='window'?<Pause className="size-4"/>:<Play className="size-4"/>}</button><button className="icon-button" onClick={()=>selectStation(current+1)} disabled={current===stations.length-1} aria-label="次の駅へ"><ChevronRight className="size-4"/></button><select value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} aria-label="走行速度"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option><option value="4">4×</option></select><button className="icon-button" onClick={sound.toggle} aria-pressed={sound.enabled} aria-label={sound.enabled?'車内音を消す':'車内音を聴く'}>{sound.enabled?<Volume2 className="size-4"/>:<VolumeX className="size-4"/>}</button></div><div className="footer-actions"><button onClick={()=>openModal('sources')}>出典</button><button className="icon-button" onClick={()=>openModal('about')} aria-label="この車窓について"><Info className="size-4"/></button></div></footer>
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
