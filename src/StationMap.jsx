import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import { stations } from './data/stations.js';
import { cn } from './lib.js';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

const bounds = [[139.625, 35.505], [139.675, 35.595]];
const points = stations.map(s => [25 + (s.lon - 139.629) / .043 * 35, 17 + (35.59 - s.lat) / .081 * 68]);

function Schematic({ selected, onSelect, visibleIds }) {
  return <div className="map-schematic" aria-label="駅の座標をもとにした簡略路線図。北が上です。">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M${points.map(p => p.join(',')).join(' L')}`} fill="none" stroke="#ad506b" strokeWidth="1" />
    </svg>
    <span className="schematic-area area-tokyo">TOKYO</span><span className="schematic-area area-kawasaki">KAWASAKI</span><span className="schematic-area area-yokohama">YOKOHAMA</span>
    {stations.map((s, i) => <button key={s.id} className={cn('schematic-station', i === 1 && 'label-left', selected === i && 'is-selected', !visibleIds.includes(s.id) && 'is-muted')} style={{ left: `${points[i][0]}%`, top: `${points[i][1]}%` }} onClick={() => onSelect(i)} aria-label={`地図で${s.name}を選ぶ`} aria-pressed={selected === i}><i /><span><small>{s.code.slice(2)}</small>{s.name}</span></button>)}
    <span className="schematic-north">↑ N</span>
  </div>;
}

export function StationMap({ selected, onSelect, visibleIds = stations.map(s => s.id) }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef([]);
  const selectRef = useRef(onSelect);
  const [status, setStatus] = useState('loading');
  const [schematic, setSchematic] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const live = status === 'ready' && !schematic;
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let disposed = false;
    let map;
    let resize;
    const controller = new AbortController();
    const fail = () => { if (!disposed) setStatus('error'); };
    const timeout = window.setTimeout(fail, 15000);
    async function initialize() {
      try {
        const [lib, response] = await Promise.all([
          import('maplibre-gl'),
          fetch('https://tiles.openfreemap.org/styles/positron', { signal: controller.signal }),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ]);
        if (!response.ok) throw new Error('Map style unavailable');
        const style = await response.json();
        if (disposed) return;
        // Keep the provider's source attribution; only restyle its existing layers.
        for (const layer of style.layers) {
          const paint = layer.paint ??= {};
          if (layer.id === 'background') paint['background-color'] = '#edece5';
          if (layer.id === 'water') paint['fill-color'] = '#a8c6ca';
          if (layer.id === 'waterway') paint['line-color'] = '#a8c6ca';
          if (['park', 'landcover_wood'].includes(layer.id)) paint['fill-color'] = '#c8d6bb';
          if (layer.id === 'landuse_residential') paint['fill-color'] = '#e7e5dc';
          if (layer.id === 'building') paint['fill-color'] = '#d7d4ca';
          if (layer.type === 'symbol' && layer.layout?.['text-field']) {
            layer.layout['text-field'] = ['coalesce', ['get', 'name:ja'], ['get', 'name'], ['get', 'name:latin']];
          }
        }
        lib.setWorkerUrl(workerUrl);
        map = new lib.Map({
          container: container.current, style, bounds,
          fitBoundsOptions: { padding: { top: 54, bottom: 40, left: 48, right: 100 } },
          minZoom: 10, maxZoom: 17, maxBounds: [[139.48, 35.43], [139.82, 35.68]],
          dragRotate: false, pitchWithRotate: false, touchPitch: false,
          scrollZoom: false, attributionControl: false, renderWorldCopies: false,
        });
        mapRef.current = map;
        map.touchZoomRotate.disableRotation();
        map.getCanvas().setAttribute('aria-label', '東横線沿線の地図。矢印キーで移動できます。');
        map.addControl(new lib.AttributionControl({ compact: false }), 'bottom-right');
        map.on('load', () => {
          if (disposed) return;
          map.addSource('journey-route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: stations.map(s => [s.lon, s.lat]) } } });
          map.addLayer({ id: 'journey-line-border', type: 'line', source: 'journey-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff8ef', 'line-width': 7 } });
          map.addLayer({ id: 'journey-line', type: 'line', source: 'journey-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ad506b', 'line-width': 3 } });
          markers.current = stations.map((s, i) => {
            const button = document.createElement('button');
            button.className = cn('geo-station', i === 1 && 'label-left');
            button.setAttribute('aria-label', `地図で${s.name}を選ぶ`);
            const dot = document.createElement('i');
            const label = document.createElement('span');
            label.textContent = s.name;
            button.append(dot, label);
            button.onclick = () => selectRef.current(i);
            const marker = new lib.Marker({ element: button, anchor: 'center' }).setLngLat([s.lon, s.lat]).addTo(map);
            return { button, marker };
          });
          clearTimeout(timeout);
          setStatus('ready');
        });
        // Individual failed tiles must not discard an otherwise usable map.
        map.on('error', () => {});
        resize = new ResizeObserver(() => map.resize());
        resize.observe(container.current);
      } catch (error) {
        if (error.name !== 'AbortError') fail();
      }
    }
    initialize();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
      resize?.disconnect();
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    markers.current.forEach(({ button }, i) => {
      button.classList.toggle('is-selected', i === selected);
      button.classList.toggle('is-muted', !visibleIds.includes(stations[i].id));
      button.setAttribute('aria-pressed', String(i === selected));
    });
  }, [selected, visibleIds, status]);

  return <div className="station-map" data-map-status={status}>
    <div ref={container} className={cn('map-canvas', !live && 'map-canvas-hidden')} aria-hidden={!live} inert={!live ? true : undefined} />
    {!live && <Schematic selected={selected} onSelect={onSelect} visibleIds={visibleIds} />}
    <div className="map-topline"><span className="map-route-pill"><b>TY</b>東急東横線</span><button className="map-format" onClick={() => setSchematic(!schematic)} aria-label={schematic ? '背景地図に切り替える' : '簡略路線図に切り替える'}>{schematic ? '地図' : '路線図'}</button></div>
    {live && <div className="map-tools"><button onClick={() => mapRef.current?.fitBounds(bounds, { padding: { top: 54, bottom: 40, left: 48, right: 100 }, duration: 0 })} aria-label="8駅をすべて表示"><LocateFixed className="size-4" /></button><button onClick={() => mapRef.current?.zoomIn({ duration: 0 })} aria-label="地図を拡大"><Plus className="size-4" /></button><button onClick={() => mapRef.current?.zoomOut({ duration: 0 })} aria-label="地図を縮小"><Minus className="size-4" /></button></div>}
    {status === 'error' && !schematic && <div className="map-status" role="status">背景地図を取得できません。路線図を表示中<button onClick={() => { setStatus('loading'); setAttempt(n => n + 1); }} aria-label="背景地図を再読み込み"><RotateCcw className="size-3.5" /></button></div>}
    {status === 'loading' && !schematic && <span className="map-status" role="status">背景地図を読み込み中</span>}
    <span className="map-line-note">駅間の線は概略</span>
  </div>;
}
