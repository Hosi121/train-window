import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('the scenery moves, pauses, and resumes without changing the station', async ({ page }) => {
  const film = page.locator('.color-film').first();
  const start = await film.getAttribute('style');
  await expect.poll(() => film.getAttribute('style')).not.toBe(start);
  await page.getByRole('button', { name: '旅を一時停止', exact: true }).click();
  await page.waitForTimeout(80);
  const stopped = await film.getAttribute('style');
  await page.waitForTimeout(250);
  expect(await film.getAttribute('style')).toBe(stopped);
  await page.getByRole('button', { name: '旅を再生', exact: true }).click();
  await expect.poll(() => film.getAttribute('style')).not.toBe(stopped);
  await expect(page.getByRole('button', { name: '多摩川の駅と街について' })).toBeVisible();
});

test('the photo appears inside the window and play returns to the journey', async ({ page }) => {
  await page.getByRole('button', { name: '多摩川の車窓：写真を見る', exact: true }).click();
  await expect(page.locator('.window-original')).toHaveCSS('opacity', '1');
  const film = page.locator('.color-film').first();
  await expect.poll(async () => {
    const before = await film.getAttribute('style');
    await page.waitForTimeout(120);
    return await film.getAttribute('style') === before;
  }).toBe(true);
  const paused = await film.getAttribute('style');
  await page.waitForTimeout(200);
  expect(await film.getAttribute('style')).toBe(paused);
  await page.getByRole('button', { name: '旅を再生', exact: true }).click();
  await expect(page.locator('.window-original')).toHaveCSS('opacity', '0');
  await expect.poll(() => film.getAttribute('style')).not.toBe(paused);
});

test('station details, photo comparison, saving, persistence, and removal', async ({ page }) => {
  await page.getByRole('button', { name: '多摩川の駅と街について' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: '駅名の由来', exact: true })).toBeVisible();
  await page.getByRole('slider').fill('0');
  await expect(page.locator('.revealed-photo')).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: '次に降りたい', exact: true }).click();
  await expect(page.getByRole('button', { name: '保存済み', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: '次に降りたい駅 1件', exact: true }).click();
  await expect(page.getByRole('heading', { name: '多摩川', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '多摩川を保存から外す', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'まだ保存した駅はありません。' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('yorimichi-stations'))).toBe('[]');
});

test('all eight real stations can be selected and their assets load', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('button', { name: '旅を一時停止', exact: true }).click();
  for (const station of ['多摩川', '新丸子', '武蔵小杉', '元住吉', '日吉', '綱島', '大倉山', '菊名']) {
    await page.getByRole('button', { name: '路線図を見る', exact: true }).click();
    await page.getByRole('button', { name: `${station}を地図で見る`, exact: true }).click();
    await page.getByRole('button', { name: `${station}の車窓へ`, exact: true }).click();
    await expect(page.getByRole('button', { name: `${station}の駅と街について`, exact: true })).toBeVisible();
    await expect.poll(() => page.locator('.carriage img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  }
  await expect(page.getByRole('button', { name: '次の駅へ', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('24 seconds advances a station even at 4x; dialogs pause the journey and the end can restart', async ({ page }) => {
  await page.clock.install();
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('combobox', { name: '走行速度' }).selectOption('4');
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.clock.runFor(25000);
  await expect(page.getByRole('button', { name: '新丸子の駅と街について', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '新丸子の駅と街について', exact: true }).click();
  await page.clock.runFor(30000);
  await page.getByRole('button', { name: '閉じて車窓に戻る', exact: true }).click();
  await expect(page.getByRole('button', { name: '新丸子の駅と街について', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '路線図を見る', exact: true }).click();
  await page.getByRole('button', { name: '菊名を地図で見る', exact: true }).click();
  await page.getByRole('button', { name: '菊名の車窓へ', exact: true }).click();
  await page.clock.runFor(25000);
  await page.getByRole('button', { name: 'もう一度旅をする', exact: true }).click();
  await expect(page.getByRole('button', { name: '多摩川の駅と街について', exact: true })).toBeVisible();
});

test('map assets load on opening; station coordinates and selection survive a provider failure', async ({ page }) => {
  let requests = 0;
  page.on('request', request => { if (request.url().includes('tiles.openfreemap.org')) requests++; });
  expect(requests).toBe(0);
  await page.getByRole('button', { name: '東急東横線 多摩川 — 菊名', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.station-map')).toHaveAttribute('data-map-status', 'error');
  expect(requests).toBeGreaterThan(0);
  await expect(page.getByRole('link', { name: /大きな地図でこの駅を見る/ })).toHaveAttribute('href', /mlat=35.589765/);
  await page.getByRole('button', { name: '地図で菊名を選ぶ', exact: true }).click();
  await expect(page.getByRole('link', { name: /大きな地図でこの駅を見る/ })).toHaveAttribute('href', /mlat=35.50972222/);
  await expect(page.getByRole('heading', { name: '菊名 Kikuna' })).toBeVisible();
});

test('reduced motion starts paused, themes and speed are operable, no viewport overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.getByRole('button', { name: '旅を再生', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '夜', exact: true }).click();
  await expect(page.locator('.journey-app')).toHaveClass(/theme-night/);
  await page.getByRole('button', { name: '夜明け', exact: true }).click();
  await expect(page.locator('.journey-app')).toHaveClass(/theme-dawn/);
  await page.getByRole('combobox', { name: '走行速度' }).selectOption('2');
  await expect(page.getByRole('combobox', { name: '走行速度' })).toHaveValue('2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('keyboard dialog returns focus and the main view and details meet automated accessibility checks', async ({ page }) => {
  await page.getByRole('button', { name: '旅を一時停止', exact: true }).click();
  const main = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(main.violations).toEqual([]);
  const trigger = page.getByRole('button', { name: '多摩川の駅と街について', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  const dialog = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(dialog.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('malformed or unavailable browser storage does not break the journey', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('yorimichi-stations', '{invalid'));
  await page.reload();
  await page.getByRole('button', { name: '多摩川の駅と街について', exact: true }).click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('storage blocked'); }; });
  await page.getByRole('button', { name: '次に降りたい', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('ブラウザへの保存ができませんでした');
  await expect(page.getByRole('button', { name: '保存済み', exact: true })).toBeVisible();
});
