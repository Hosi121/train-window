import { motion } from 'motion/react';

export const STRIP_WIDTH = 1536;

export function Barcode({ photo, x, nearX, mode = 'day', offset = 0, flat = false }) {
  if (flat) return <img src={photo.flatBarcode} className="size-full object-fill" alt="写真から抽出した横縞のカラーバーコード" />;
  return <div className={`barcode-layer light-${mode}`} aria-hidden="true">
    <motion.div className="color-film" style={{ x, marginLeft: -offset }}>
      {[0, 1, 2].map((i) => <img key={i} src={photo.barcode} alt="" draggable="false" width={STRIP_WIDTH} height="360" />)}
    </motion.div>
    <motion.div className="near-film" style={{ x: nearX, marginLeft: -offset }}>
      {[0, 1, 2].map((i) => <svg key={i} width={STRIP_WIDTH} height="360" viewBox={`0 0 ${STRIP_WIDTH} 360`} preserveAspectRatio="none">
        {Array.from({ length: 20 }, (_, j) => <rect key={j} x={(j * 317) % STRIP_WIDTH} y={32 + ((j * 71) % 296)} width={100 + (j % 5) * 75} height={j % 3 === 0 ? 2 : 0.8} fill={photo.palette[j % photo.palette.length]} opacity=".65" />)}
      </svg>)}
    </motion.div>
  </div>;
}
