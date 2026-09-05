import { useEffect, useState } from 'react';

const cache = new Map();
let worker;
let serial = 0;
const pending = new Map();

function prepare(src) {
  if (cache.has(src)) return cache.get(src);
  const promise = new Promise(resolve => {
    // Keep original photos usable on browsers without the offscreen image APIs.
    if (!('OffscreenCanvas' in window) || !('Worker' in window)) return resolve(null);
    try {
      if (!worker) {
        worker = new Worker(new URL('./scenery.worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = ({ data }) => {
          const request = pending.get(data.id);
          if (!request) return;
          clearTimeout(request.timeout);
          pending.delete(data.id);
          request.resolve(data.error ? null : data.blobs.map(blob => URL.createObjectURL(blob)));
        };
        worker.onerror = () => {
          for (const request of pending.values()) { clearTimeout(request.timeout); request.resolve(null); }
          pending.clear();
          worker?.terminate();
          worker = undefined;
        };
      }
      const id = serial++;
      const timeout = setTimeout(() => { pending.delete(id); resolve(null); }, 12000);
      pending.set(id, { resolve, timeout });
      worker.postMessage({ id, src: new URL(src, window.location.href).href });
    } catch { resolve(null); }
  });
  cache.set(src, promise);
  return promise;
}

export function useScenery(photo, nextPhoto) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let current = true;
    prepare(photo.src).then(urls => {
      if (current) setResult({ src: photo.src, urls });
      if (nextPhoto) prepare(nextPhoto.src);
    });
    return () => { current = false; };
  }, [photo.src, nextPhoto?.src]);
  return result?.src === photo.src ? result.urls : null;
}

if (import.meta.hot) import.meta.hot.dispose(() => {
  worker?.terminate();
  for (const request of pending.values()) { clearTimeout(request.timeout); request.resolve(null); }
  for (const value of cache.values()) value.then(urls => urls?.forEach(URL.revokeObjectURL));
});
