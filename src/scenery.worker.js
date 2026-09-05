// Prepare photographic exposure textures once, away from the animation thread.
// Every pixel comes from the station's photograph; no palette quantization.
const WIDTH = 1536;
const HEIGHT = 768;

function smear(input, radius) {
  const output = new Uint8ClampedArray(input.length);
  for (let y = 0; y < HEIGHT; y++) {
    // Longer streaks close to the train, shorter ones in the distance.
    const r = Math.max(1, Math.round(radius * (0.55 + (y / HEIGHT) ** 2 * 1.15)));
    const n = r * 2 + 1;
    const start = y * WIDTH * 4;
    const sums = [0, 0, 0];
    for (let k = -r; k <= r; k++) {
      const p = start + ((k + WIDTH) % WIDTH) * 4;
      for (let c = 0; c < 3; c++) sums[c] += input[p + c];
    }
    for (let x = 0; x < WIDTH; x++) {
      const p = start + x * 4;
      for (let c = 0; c < 3; c++) output[p + c] = sums[c] / n;
      output[p + 3] = 255;
      const leaving = start + ((x - r + WIDTH) % WIDTH) * 4;
      const entering = start + ((x + r + 1) % WIDTH) * 4;
      for (let c = 0; c < 3; c++) sums[c] += input[entering + c] - input[leaving + c];
    }
  }
  return output;
}

function finish(pixels, near = false) {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const p = (y * WIDTH + x) * 4;
      // Fixed fine grain travels with the photograph; no flashing noise overlay.
      const grain = (((Math.imul(x + 17, 73856093) ^ Math.imul(y + 23, 19349663)) >>> 0) % 101 - 50) * .07;
      for (let c = 0; c < 3; c++) pixels[p + c] = (pixels[p + c] - 110) * 1.06 + 110 + grain;
      if (near) pixels[p + 3] = Math.max(0, Math.min(1, (y / HEIGHT - .73) / .2)) * 255;
    }
  }
  return pixels;
}

self.onmessage = async ({ data: { id, src } }) => {
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error('Photo unavailable');
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const scale = Math.max(WIDTH / bitmap.width, HEIGHT / bitmap.height);
    ctx.drawImage(bitmap, (WIDTH - bitmap.width * scale) / 2, (HEIGHT - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
    bitmap.close();
    const base = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
    // Blend just the two edges into a common seam; keep the central scene intact.
    for (let y = 0; y < HEIGHT; y++) {
      const start = y * WIDTH * 4;
      for (let x = 0; x < 100; x++) {
        const mix = (1 - x / 100) ** 2;
        for (let c = 0; c < 3; c++) {
          const left = start + x * 4 + c;
          const right = start + (WIDTH - 1 - x) * 4 + c;
          const mean = (base[left] + base[right]) / 2;
          base[left] += (mean - base[left]) * mix;
          base[right] += (mean - base[right]) * mix;
        }
      }
    }
    const blobs = [];
    for (const radius of [0, 9, 38, 110]) {
      const pixels = radius ? smear(smear(base, radius), radius) : new Uint8ClampedArray(base);
      ctx.putImageData(new ImageData(finish(pixels), WIDTH, HEIGHT), 0, 0);
      blobs.push(await canvas.convertToBlob({ type: 'image/webp', quality: .9 }));
    }
    ctx.putImageData(new ImageData(finish(smear(base, 150), true), WIDTH, HEIGHT), 0, 0);
    blobs.push(await canvas.convertToBlob({ type: 'image/webp', quality: .88 }));
    self.postMessage({ id, blobs });
  } catch {
    self.postMessage({ id, error: true });
  }
};
