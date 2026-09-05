import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));
export const mapUrl = (station) => `https://www.openstreetmap.org/?mlat=${station.lat}&mlon=${station.lon}#map=16/${station.lat}/${station.lon}`;
export function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem('yorimichi-stations') || '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
  } catch { return []; }
}
