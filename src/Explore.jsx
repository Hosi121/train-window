import { useState } from 'react';
import { ArrowUpRight, Heart, Leaf, Library, Map, Play, Search, Shuffle, Store, TrainFront, Waves, X } from 'lucide-react';
import { StationMap } from './StationMap.jsx';
import { stations } from './data/stations.js';
import { cn, mapUrl } from './lib.js';
import './explore.css';

const collections = [
  { id: 'river', name: '川辺', title: '川辺でひと息', Icon: Waves, ids: ['tamagawa', 'shinmaruko'] },
  { id: 'green', name: '緑', title: '緑のあるほうへ', Icon: Leaf, ids: ['hiyoshi', 'tsunashima', 'okurayama'] },
  { id: 'town', name: '街歩き', title: '商店街と街の記憶', Icon: Store, ids: ['kosugi', 'motosumiyoshi', 'kikuna'] },
];

export function Explore({ current, saved, onSave, onPlay, onDetail, storageError }) {
  const [selected, setSelected] = useState(current);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const station = stations[selected];
  const collection = collections.find(c => c.id === filter);
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('ja').trim();
  const filtered = stations.filter(s => (filter === 'saved' ? saved.includes(s.id) : !collection || collection.ids.includes(s.id)) && normalize(`${s.name} ${s.kana} ${s.en} ${s.spot} ${s.area}`).includes(normalize(query)));
  const chooseFilter = (id) => { setFilter(id); setQuery(''); };
  const shuffle = () => {
    const candidates = filtered.filter(s => s.id !== station.id);
    const pool = candidates.length ? candidates : filtered;
    if (pool.length) setSelected(stations.indexOf(pool[Math.floor(Math.random() * pool.length)]));
  };

  return <section className="explorer" aria-label="地図と駅のライブラリ">
    <aside className="explore-sidebar">
      <div className="library-label"><Library className="size-4" /><span>ライブラリ</span></div>
      <nav className="library-nav" aria-label="駅のライブラリ">
        <button className={cn(filter !== 'saved' && 'is-active')} onClick={() => chooseFilter('all')}><Map className="size-4" />地図から選ぶ</button>
        <button className={cn(filter === 'saved' && 'is-active')} onClick={() => chooseFilter('saved')}><Heart className="size-4" />次に降りたい<span>{saved.length}</span></button>
      </nav>
      <div className="collection-label">気分でえらぶ</div>
      <div className="collection-list">{collections.map(({ id, title, Icon, ids }) => <button key={id} className={cn('collection', filter === id && 'is-active')} onClick={() => chooseFilter(id)} aria-pressed={filter === id}><span className={`collection-cover cover-${id}`}><Icon className="size-6" /></span><span><strong>{title}</strong><small>{ids.length}駅</small></span></button>)}</div>
      <div className="sidebar-route"><span className="tiny-train"><TrainFront className="size-6" /></span><span>東急東横線<small>多摩川 — 菊名</small></span><span className="route-count">08</span></div>
    </aside>

    <div className="explore-content">
      <div className="explore-topbar"><div className="explore-heading"><span>STATION LIBRARY</span><h2>{filter === 'saved' ? '次に降りたい' : collection ? collection.title : '地図から選ぶ'}</h2></div><label className="station-search"><Search className="size-4" /><input type="search" placeholder="駅・街をさがす" aria-label="駅や街を検索" value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="検索をクリア"><X className="size-4" /></button>}</label></div>
      <div className="explore-filterbar"><div className="mood-filters" aria-label="駅を絞り込む">{[{ id: 'all', name: 'すべて' }, ...collections, { id: 'saved', name: '保存した駅' }].map(({ id, name }) => <button key={id} className={cn(filter === id && 'is-active')} aria-pressed={filter === id} onClick={() => chooseFilter(id)}>{name}</button>)}</div><span className="station-total">{filtered.length} stations</span></div>

      <div className="explore-map-grid">
        <StationMap selected={selected} onSelect={setSelected} visibleIds={filtered.map(s => s.id)} />
        <article className="station-record" aria-label="選んだ駅">
          <div className="record-art"><button className="record-photo" onClick={() => onDetail(selected)} aria-label={`${station.name}の写真と街について`}><img src={station.photo.src} alt={station.photoCaption} width={station.photo.width} height={station.photo.height} /><span className="record-code">{station.code}</span></button><button className={cn('record-heart', saved.includes(station.id) && 'is-saved')} onClick={() => onSave(station.id)} aria-label={`${station.name}を${saved.includes(station.id) ? '保存から外す' : '次に降りたい駅に保存'}`} aria-pressed={saved.includes(station.id)}><Heart className={cn('size-4', saved.includes(station.id) && 'fill-current')} /></button></div>
          <div className="record-body"><div className="record-title"><div><h3>{station.name}</h3><span>{station.en}</span></div><div className="record-palette" role="img" aria-label="写真から抽出した5色">{station.photo.palette.map(color => <i key={color} style={{ background: color }} />)}</div></div><button className="record-spot" onClick={() => onDetail(selected)}>{station.spot}<ArrowUpRight className="size-3.5" /></button><div className="record-actions"><button className="record-play" onClick={() => onPlay(selected)} aria-label={`${station.name}の車窓へ`}><Play className="size-4 fill-current" />車窓をみる</button><a className="record-map-link" href={mapUrl(station)} target="_blank" rel="noreferrer" aria-label={`${station.name}駅をOpenStreetMapで開く（新しいタブ）`}><ArrowUpRight className="size-5" /></a></div><p className="record-credit"><a href={station.photo.source} target="_blank" rel="noreferrer">{station.photo.author}</a> · <a href={station.photo.licenseUrl} target="_blank" rel="noreferrer">{station.photo.license}</a></p></div>
        </article>
      </div>
      {storageError && <p className="inline-error" role="status">{storageError}</p>}

      <div className="station-shelf-heading"><h3>{filter === 'saved' ? 'あなたの駅リスト' : 'この路線の風景'}</h3><button onClick={shuffle} disabled={!filtered.length} aria-label="おまかせで駅を選ぶ"><Shuffle className="size-3.5" />おまかせ</button></div>
      {filtered.length ? <div className="station-shelf" aria-label="駅の一覧">{filtered.map(s => <article key={s.id} className={cn('station-album', selected === stations.indexOf(s) && 'is-selected')}><button className="album-select" onClick={() => setSelected(stations.indexOf(s))} aria-label={`${s.name}を地図で見る`} aria-pressed={selected === stations.indexOf(s)}><span className="album-art"><img src={s.photo.src} alt={s.photoCaption} width="220" height="220" loading="lazy" /><img className="album-barcode" src={s.photo.flatBarcode} alt="" aria-hidden="true" /></span><span className="album-title">{s.name}{saved.includes(s.id) && <Heart className="size-3 fill-current" aria-label="保存済み" />}</span><small>{s.code} · {s.tag}</small></button></article>)}</div> : <div className="explore-empty"><Heart className="size-6" /><p>{query ? '一致する駅がありません。' : '気になる駅をハートで保存。'}</p><button onClick={() => chooseFilter('all')}>すべての駅を見る</button></div>}
    </div>
  </section>;
}
