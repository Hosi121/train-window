import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('speed controls change both travel speed and photographic smear', async ({ page }) => {
  const center = page.locator('.window-unit-center');
  await expect(center.locator('.photographic-scenery')).toHaveAttribute('data-textures', 'ready');
  const film = center.locator('.photo-film').first();
  const travel = async () => {
    const start = await film.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
    await page.waitForTimeout(160);
    return await film.evaluate((el, before) => {
      const period = el.querySelector('img').getBoundingClientRect().width;
      return (before - new DOMMatrix(getComputedStyle(el).transform).m41 + period) % period;
    }, start);
  };
  await page.getByRole('combobox', { name: '走行速度' }).selectOption('0.25');
  await page.waitForTimeout(650);
  const slow = await travel();
  expect(Number(await center.locator('.exposure-layer').nth(3).evaluate(el => getComputedStyle(el).opacity))).toBeLessThan(.05);
  await page.getByRole('combobox', { name: '走行速度' }).selectOption('4');
  await page.waitForTimeout(650);
  const fast = await travel();
  expect(fast).toBeGreaterThan(slow * 6);
  expect(Number(await center.locator('.exposure-layer').nth(3).evaluate(el => getComputedStyle(el).opacity))).toBeGreaterThan(.95);
  await expect.poll(() => center.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
});

test('taking a closer look keeps scenery moving and holds the station until released', async ({ page }) => {
  const film = page.locator('.window-unit-center .photo-film').first();
  const progress = page.locator('.journey-progress > div');
  await page.getByRole('button', { name: 'ゆっくり見る', exact: true }).click();
  await expect(page.getByRole('button', { name: '走行に戻る', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(650);
  const held = await progress.getAttribute('style');
  const moving = await film.getAttribute('style');
  await page.waitForTimeout(350);
  expect(await progress.getAttribute('style')).toBe(held);
  expect(await film.getAttribute('style')).not.toBe(moving);
  await expect(page.locator('.window-original')).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: '走行に戻る', exact: true }).click();
  await expect.poll(() => progress.getAttribute('style')).not.toBe(held);
});

test('original photos remain usable when offscreen processing is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'OffscreenCanvas', { value: undefined, configurable: true }); });
  await page.reload();
  const scenery = page.locator('.window-unit-center .photographic-scenery');
  await expect(scenery).toHaveAttribute('data-textures', 'original');
  await expect.poll(() => scenery.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  await page.getByRole('button', { name: '多摩川の車窓：写真を見る', exact: true }).click();
  await expect(page.locator('.window-original')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: '旅を再生', exact: true }).click();
  await expect(page.locator('.window-original')).toHaveCSS('opacity', '0');
});
