import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // The provider is exercised separately; core interactions work without a network.
  await page.route('https://tiles.openfreemap.org/**', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: '路線図を見る', exact: true }).click();
});

test('collections, search, empty results, and shuffle select real stations', async ({ page }) => {
  const albums = page.locator('.station-album');
  const selected = page.getByRole('article', { name: '選んだ駅', exact: true });
  await expect(albums).toHaveCount(8);
  await page.getByRole('button', { name: '緑', exact: true }).click();
  await expect(albums).toHaveCount(3);
  await page.getByRole('searchbox').fill('ひよし');
  await expect(albums).toHaveCount(1);
  await page.getByRole('button', { name: '日吉を地図で見る', exact: true }).click();
  await expect(selected.getByRole('heading', { name: '日吉', exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('未収録の駅');
  await expect(albums).toHaveCount(0);
  await expect(page.getByText('一致する駅がありません。')).toBeVisible();
  await page.getByRole('button', { name: 'すべての駅を見る', exact: true }).click();
  await expect(albums).toHaveCount(8);
  await page.getByRole('button', { name: 'おまかせで駅を選ぶ', exact: true }).click();
  await expect(selected.getByRole('heading')).not.toHaveText('日吉');
});

test('map, album, saved collection, and playback share the selected station', async ({ page }) => {
  const record = page.getByRole('article', { name: '選んだ駅', exact: true });
  await page.getByRole('button', { name: '地図で菊名を選ぶ', exact: true }).click();
  await expect(record.getByRole('heading', { name: '菊名', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '菊名を次に降りたい駅に保存', exact: true }).click();
  await page.getByRole('button', { name: '保存した駅', exact: true }).click();
  await expect(page.locator('.station-album')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '菊名を地図で見る', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '路線図を見る', exact: true }).click();
  await page.getByRole('button', { name: '保存した駅', exact: true }).click();
  await page.getByRole('button', { name: '菊名を地図で見る', exact: true }).click();
  await page.getByRole('button', { name: '菊名の車窓へ', exact: true }).click();
  await expect(page.getByRole('button', { name: '菊名の駅と街について', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '旅を一時停止', exact: true })).toBeVisible();
});

test('fallback map can retry and switch views; saving failures remain visible', async ({ page }) => {
  await expect(page.locator('.station-map')).toHaveAttribute('data-map-status', 'error');
  await page.getByRole('button', { name: '背景地図を再読み込み', exact: true }).click();
  await expect(page.locator('.station-map')).toHaveAttribute('data-map-status', 'error');
  await page.getByRole('button', { name: '簡略路線図に切り替える', exact: true }).click();
  await expect(page.getByRole('button', { name: '背景地図に切り替える', exact: true })).toBeVisible();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('storage blocked'); }; });
  await page.getByRole('button', { name: '多摩川を次に降りたい駅に保存', exact: true }).click();
  await expect(page.getByText('ブラウザへの保存ができませんでした。', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '多摩川を保存から外す', exact: true }).click();
  await page.getByRole('button', { name: '保存した駅', exact: true }).click();
  await expect(page.getByText('気になる駅をハートで保存。')).toBeVisible();
});

test('library supports keyboard, focus restoration, contrast, and narrow viewports', async ({ page }) => {
  await expect(page.locator('.station-map')).toHaveAttribute('data-map-status', 'error');
  const trigger = page.getByRole('button', { name: '多摩川の写真と街について', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('interactive map initializes and keeps marker selection when switching to the schematic', async ({ page }) => {
  await page.unroute('https://tiles.openfreemap.org/**');
  await page.route('https://tiles.openfreemap.org/styles/positron', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      version: 8,
      sources: { terrain: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[139.60, 35.51], [139.70, 35.51], [139.70, 35.59], [139.60, 35.59], [139.60, 35.51]]] } } } },
      layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#edece5' } }, { id: 'terrain', type: 'fill', source: 'terrain', paint: { 'fill-color': '#c8d6bb' } }],
    }),
  }));
  await expect(page.locator('.station-map')).toHaveAttribute('data-map-status', 'error');
  await page.getByRole('button', { name: '背景地図を再読み込み', exact: true }).click();
  await expect(page.locator('.station-map')).toHaveAttribute('data-map-status', 'ready');
  await expect(page.locator('.geo-station')).toHaveCount(8);
  await page.getByRole('button', { name: '地図で元住吉を選ぶ', exact: true }).click();
  await expect(page.getByRole('button', { name: '地図で元住吉を選ぶ', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '地図を拡大', exact: true }).click();
  await page.getByRole('button', { name: '8駅をすべて表示', exact: true }).click();
  await page.getByRole('button', { name: '簡略路線図に切り替える', exact: true }).click();
  await expect(page.locator('.schematic-station.is-selected')).toHaveAccessibleName('地図で元住吉を選ぶ');
  await page.getByRole('button', { name: '背景地図に切り替える', exact: true }).click();
  await expect(page.locator('.geo-station.is-selected')).toHaveAccessibleName('地図で元住吉を選ぶ');
});
