import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useInView, useMotionValue, useTransform } from 'motion/react';
import { Focus, Info } from 'lucide-react';
import { cn } from './lib.js';
import { useScenery } from './scenery.js';
import './photographic.css';

function Film({ srcs, photo, distance, nearDistance, width, offset, exposure, nearOpacity, mode }) {
  const x = useTransform(distance, d => -(((d + offset) % 2 + 2) % 2) * width);
  const nearX = useTransform(nearDistance, d => -(((d + offset) % 2 + 2) % 2) * width);
  return <div className={cn('photographic-scenery', `photo-light-${mode}`)} aria-hidden="true" data-textures={srcs ? 'ready' : 'original'}>
    {[0, 1, 2, 3].map(level => <motion.div key={level} className="exposure-layer" style={{ opacity: exposure[level] }}>
      <motion.div className={cn('photo-film', level === 0 && 'color-film')} style={{ x }}>
        {[0, 1].map(copy => <img key={copy} src={srcs?.[level] || photo.src} alt="" draggable="false" style={{ width: width * 2 }} width="1536" height="768" />)}
      </motion.div>
    </motion.div>)}
    {srcs && <motion.div className="foreground-exposure" style={{ opacity: nearOpacity }}><motion.div className="photo-film" style={{ x: nearX }}>{[0, 1].map(copy => <img key={copy} src={srcs[4]} alt="" draggable="false" style={{ width: width * 2 }} width="1536" height="768" />)}</motion.div></motion.div>}
  </div>;
}

export function PhotographicJourney({ station, previousStation, nextStation, active, suspended, speed, mode, onNext, onExplore, onVisible, resetKey, peek, onPeek, onPrevious, onForward }) {
  const ref = useRef(null);
  const unit = useRef(null);
  const inView = useInView(ref, { amount: .15 });
  const [slow, setSlow] = useState(false);
  const [geometry, setGeometry] = useState({ width: 450, step: 1.55 });
  const textures = useScenery(station.photo, nextStation?.photo);
  const distance = useMotionValue(.2);
  const nearDistance = useMotionValue(.2);
  const progress = useMotionValue(0);
  const clear = useMotionValue(active ? 0 : 1);
  const soft = useMotionValue(0);
  const medium = useMotionValue(active ? 1 : 0);
  const strong = useMotionValue(0);
  const nearOpacity = useMotionValue(active ? .2 : 0);
  const exposure = [clear, soft, medium, strong];
  const elapsed = useRef(0);
  const changed = useRef(false);
  const velocity = useRef(active ? speed : 0);
  const displayedBlur = useRef(active ? speed : 0);

  useEffect(() => {
    elapsed.current = 0; changed.current = false; progress.set(0);
    setSlow(false); distance.set(.2); nearDistance.set(.2);
  }, [station.id, resetKey, progress, distance, nearDistance]);
  useEffect(() => onVisible(inView), [inView, onVisible]);
  useEffect(() => {
    const measure = () => {
      if (!unit.current) return;
      const fullWidth = unit.current.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(unit.current.parentElement).columnGap) || 0;
      const width = fullWidth * .746;
      setGeometry({ width, step: (fullWidth + gap) / width });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(unit.current); measure();
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (!inView || suspended) return;
    const dt = Math.min(delta, 64) / 1000;
    const target = active ? (slow ? .14 : speed) : 0;
    // A deliberate window stop eases into the photo; the global pause stops at once.
    velocity.current = !active && !peek ? 0 : velocity.current + (target - velocity.current) * (1 - Math.exp(-dt / .14));
    if (velocity.current < .002) velocity.current = 0;
    distance.set((distance.get() + dt * velocity.current / .72) % 100);
    nearDistance.set((nearDistance.get() + dt * velocity.current / .72 * 2.35) % 100);
    const desiredBlur = velocity.current;
    displayedBlur.current += (desiredBlur - displayedBlur.current) * (1 - Math.exp(-dt / .09));
    const blur = displayedBlur.current;
    // Opaque base + successive crossfades preserve brightness during transitions.
    clear.set(1);
    soft.set(Math.min(1, blur / .4));
    medium.set(Math.max(0, Math.min(1, (blur - .3) / .7)));
    strong.set(Math.max(0, Math.min(1, (blur - 1) / 2.5)));
    nearOpacity.set(Math.min(.3, blur * .19));
    if (active && !slow) {
      // Changing visual speed no longer rushes the station's 24-second dwell.
      elapsed.current += dt;
      progress.set(Math.min(elapsed.current / 24, 1));
      if (elapsed.current >= 24 && !changed.current) { changed.current = true; onNext(); }
    }
  });

  return <section ref={ref} className="carriage photographic-carriage" aria-label="流れる車窓" data-inspecting={slow} data-peek={peek}>
    <div className="window-scene"><div className="window-row photographic-windows">
      {[0, 1, 2].map(i => <div ref={i === 1 ? unit : undefined} className={cn('window-unit photographic-unit', i === 1 && 'window-unit-center')} key={i}>
        <button className="train-window photographic-window" onClick={onPeek} aria-pressed={peek} aria-label={`${station.name}の車窓${i === 1 ? '' : i === 0 ? '（左）' : '（右）'}：${peek ? '走行に戻る' : '写真を見る'}`}>
          <div className="scenery-aperture">
            <Film srcs={textures} photo={station.photo} distance={distance} nearDistance={nearDistance} width={geometry.width} offset={(i - 1) * geometry.step} exposure={exposure} nearOpacity={nearOpacity} mode={mode} />
            {i === 1 && <motion.img className="window-original photographic-original" src={station.photo.src} alt={peek ? station.photoCaption : ''} aria-hidden={!peek} initial={false} animate={{ opacity: peek ? 1 : 0 }} transition={{ duration: .18, delay: peek ? .18 : 0 }} width={station.photo.width} height={station.photo.height} />}
          </div>
          <img className="real-window-frame" src="/window/frame.png" alt="" aria-hidden="true" draggable="false" width="720" height="720" />
        </button>
      </div>)}
    </div></div>
    <div className="station-captions photographic-captions">
      <div>{previousStation && <button className="neighbor-station" onClick={onPrevious} aria-label={`前の駅、${previousStation.name}へ`}><small>{previousStation.code}</small><span>{previousStation.name}</span></button>}</div>
      <div className="window-station-tools"><button className="current-station" onClick={onExplore} aria-label={`${station.name}の駅と街について`}><small>{station.code}</small><span>{station.name}</span></button><span className="window-tool-divider" />{peek ? <button className="window-inspect" onClick={onExplore}><Info className="size-3.5" />駅と街について</button> : <button className={cn('window-inspect', slow && 'is-slow')} onClick={() => setSlow(s => !s)} aria-pressed={slow}><Focus className="size-3.5" />{slow ? '走行に戻る' : 'ゆっくり見る'}</button>}</div>
      <div>{nextStation && <button className="neighbor-station" onClick={onForward} aria-label={`次の駅、${nextStation.name}へ`}><small>{nextStation.code}</small><span>{nextStation.name}</span></button>}</div>
    </div>
    <div className="journey-progress" aria-hidden="true"><motion.div style={{ scaleX: progress }} /></div>
  </section>;
}
