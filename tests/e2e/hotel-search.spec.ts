import { test, expect } from '@playwright/test';
import { addDays, todayInTehran } from '../../src/lib/dates/date-only';
const today = todayInTehran();
const query = new URLSearchParams({
  city: 'tehran',
  checkIn: addDays(today, 7),
  checkOut: addDays(today, 9),
  rooms: '1',
  guests: '2',
  sort: 'price_asc',
}).toString();
const scenario = process.env.E2E_SCENARIO ?? 'success';
test('restores URL, filters, sorts, refreshes, navigates history and previews a stay', async ({
  page,
}, testInfo) => {
  test.skip(scenario !== 'success');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`/hotels?${query}`);
  await expect(page.getByTestId('hotel-card')).toHaveCount(3);
  await expect(page.getByLabel('مقصد سفر')).toHaveValue('tehran');
  await page.getByLabel('تا', { exact: true }).fill('3000000');
  await page.locator('input[name="stars"][value="4"]').check();
  await page.getByRole('button', { name: 'اعمال فیلترها' }).click();
  await expect(page).toHaveURL(/stars=4/);
  await expect(page.getByTestId('hotel-card')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'مرتب‌سازی نتایج' }).selectOption('rating_desc');
  await page.getByRole('button', { name: 'اعمال فیلترها', exact: true }).click();
  await expect(page).toHaveURL(/sort=rating_desc/);
  await page.reload();
  await expect(page.getByTestId('hotel-card')).toHaveCount(1);
  await expect(page.getByRole('combobox', { name: 'مرتب‌سازی نتایج' })).toHaveValue('rating_desc');
  await page.goBack();
  await expect(page.getByRole('combobox', { name: 'مرتب‌سازی نتایج' })).toHaveValue('price_asc');
  await page.goForward();
  await expect(page.getByRole('combobox', { name: 'مرتب‌سازی نتایج' })).toHaveValue('rating_desc');
  await page.getByRole('link', { name: 'مشاهده اقامتگاه' }).click();
  await expect(page.getByRole('heading', { name: 'هتل باغ نیلوفر' })).toBeVisible();
  const preview = page.getByRole('button', { name: 'پیش‌نمایش رزرو' });
  await preview.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('۳٬۹۰۰٬۰۰۰');
  await page.screenshot({ path: testInfo.outputPath('reservation-preview.png') });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(preview).toBeFocused();
  await page.getByRole('link', { name: 'بازگشت به هتل‌های تهران' }).click();
  await expect(page.getByTestId('hotel-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('renders Persian calendar and supports typed Persian dates', async ({ page }) => {
  test.skip(scenario !== 'success');
  await page.goto('/hotels');
  await page.getByLabel('مقصد سفر').selectOption('tehran');
  await page.locator('#stay-dates').click();
  await expect(page.locator('.rmdp-calendar')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.rmdp-calendar')).not.toBeVisible();
  await page.getByText('وارد کردن تاریخ به‌صورت متنی', { exact: true }).click();
  const persianText = (value: string) => {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).formatToParts(new Date(`${value}T12:00:00Z`));
    return ['year', 'month', 'day']
      .map((type) => parts.find((part) => part.type === type)?.value)
      .join('/');
  };
  await page
    .getByRole('textbox', { name: 'تاریخ ورود شمسی', exact: true })
    .fill(persianText(addDays(today, 7)));
  await page
    .getByRole('textbox', { name: 'تاریخ خروج شمسی', exact: true })
    .fill(persianText(addDays(today, 9)));
  await page.getByRole('button', { name: 'جست‌وجوی هتل' }).click();
  await expect(page.getByTestId('hotel-card')).toHaveCount(3);
});
test('shows empty, invalid input and missing detail independently', async ({ page }) => {
  test.skip(scenario !== 'success');
  await page.goto(`/hotels?${query.replace('city=tehran', 'city=isfahan')}`);
  await expect(
    page.getByRole('heading', { name: 'برای این جست‌وجو اقامتگاهی پیدا نشد' }),
  ).toBeVisible();
  await page.goto('/hotels?city=tehran&checkIn=2027-02-30');
  await expect(page.getByRole('heading', { name: 'بیایید جست‌وجو را کامل کنیم' })).toBeVisible();
  await page.goto(`/hotels/not-real?${query}`);
  await expect(page.getByRole('heading', { name: 'این اقامتگاه پیدا نشد' })).toBeVisible();
});
test('renders within mobile and tablet viewports without horizontal overflow', async ({
  page,
}, testInfo) => {
  test.skip(scenario !== 'success');
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/hotels?${query}`);
    await expect(page.getByTestId('hotel-card')).toHaveCount(3);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width === 375) {
      const card = page.getByTestId('hotel-card').first();
      const cardBounds = await card.boundingBox();
      const imageBounds = await card.locator('.hotel-image').boundingBox();
      expect(imageBounds?.width).toBeGreaterThan((cardBounds?.width ?? 0) * 0.85);
    }
    for (const image of await page.getByTestId('hotel-card').locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((node) => (node instanceof HTMLImageElement ? node.naturalWidth : 0)),
        )
        .toBeGreaterThan(0);
    }
    // Remove keyboard focus from the fixed skip link before capturing the resting layout.
    await page.getByRole('heading', { name: 'هتل‌های تهران', exact: true }).click();
    // Capture from the top so offscreen fixed elements stay outside the full-page image.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: testInfo.outputPath(`hotels-${width}.png`), fullPage: true });
  }
});
test('shows a service failure and retries the same search', async ({ page }) => {
  test.skip(!['error', 'timeout'].includes(scenario));
  await page.goto(`/hotels?${query}`);
  await expect(page.getByRole('heading', { name: 'این بار به نتیجه نرسیدیم' })).toBeVisible();
  const url = page.url();
  await page.getByRole('button', { name: 'تلاش مجدد', exact: true }).click();
  await expect(page.getByRole('button', { name: 'تلاش مجدد', exact: true })).toBeEnabled();
  expect(page.url()).toBe(url);
  await expect(page.getByTestId('hotel-card')).toHaveCount(0);
});

test('forces an empty service response without rendering an error', async ({ page }) => {
  test.skip(scenario !== 'empty');
  await page.goto(`/hotels?${query}`);
  await expect(
    page.getByRole('heading', { name: 'برای این جست‌وجو اقامتگاهی پیدا نشد' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'تلاش مجدد', exact: true })).toHaveCount(0);
});

test('selects the Persian date range with keyboard activation', async ({ page }) => {
  test.skip(scenario !== 'success');
  const dateParts = (value: string) =>
    new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(new Date(`${value}T12:00:00Z`));
  const part = (value: string, type: string) =>
    dateParts(value).find((item) => item.type === type)?.value;
  const label = (value: string) =>
    ['day', 'month', 'year'].map((type) => part(value, type)).join(' ');
  await page.goto('/hotels');
  await page.getByLabel('مقصد سفر').selectOption('tehran');
  await page.getByLabel('تاریخ ورود و خروج', { exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`انتخاب .*${label(today)}`) }).press('Enter');
  const tomorrow = addDays(today, 1);
  if (part(today, 'month') !== part(tomorrow, 'month'))
    await page.getByRole('button', { name: 'ماه بعد', exact: true }).click();
  await page
    .getByRole('button', { name: new RegExp(`انتخاب .*${label(tomorrow)}`) })
    .press('Enter');
  await page.getByRole('button', { name: 'جست‌وجوی هتل', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`checkIn=${today}&checkOut=${tomorrow}`));
  await expect(page.getByTestId('hotel-card')).toHaveCount(3);
});

test('restores a valid star filter even when there is no matching supply', async ({ page }) => {
  test.skip(scenario !== 'success');
  await page.goto(`/hotels?${query}&stars=2`);
  await expect(page.getByRole('radio', { name: '۲', exact: true })).toBeChecked();
  await expect(
    page.getByRole('heading', { name: 'برای این جست‌وجو اقامتگاهی پیدا نشد' }),
  ).toBeVisible();
});

test('keeps manual dates synchronized and validates Enter without blur', async ({ page }) => {
  test.skip(scenario !== 'success');
  await page.goto(`/hotels?${query}`);
  await page.getByText('وارد کردن تاریخ به‌صورت متنی', { exact: true }).click();
  const checkIn = page.getByRole('textbox', { name: 'تاریخ ورود شمسی', exact: true });
  const checkOut = page.getByRole('textbox', { name: 'تاریخ خروج شمسی', exact: true });
  const originalCheckout = await checkOut.inputValue();
  await checkIn.focus();
  await page.keyboard.press('Tab');
  await expect(checkOut).toHaveValue(originalCheckout);
  await checkOut.fill('۱۴۰۵/۱۳/۴۰');
  await checkOut.press('Enter');
  await expect(checkOut).toBeFocused();
  await expect(checkOut).toHaveAttribute('aria-invalid', 'true');
  await expect(checkOut).toHaveAccessibleDescription(/تاریخ شمسی معتبر/);
  await expect(page).toHaveURL(new RegExp(`checkOut=${addDays(today, 9)}`));
  await checkOut.fill(originalCheckout);
  await checkOut.press('Enter');
  await expect(page.getByTestId('hotel-card')).toHaveCount(3);
  await expect(checkOut).toHaveAttribute('aria-invalid', 'false');
});

test('supports keyboard calendar navigation and keeps the popup inside narrow screens', async ({
  page,
}, testInfo) => {
  test.skip(scenario !== 'success');
  for (const width of [375, 720, 1440]) {
    // 720 CSS pixels also checks the reflow of a 1440px window at 200% browser zoom.
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/hotels');
    // Wait for a real form interaction before measuring focus across hydrated controls.
    await page.getByRole('button', { name: 'جست‌وجوی هتل', exact: true }).click();
    await expect(page.getByLabel('مقصد سفر')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('مقصد سفر')).toBeFocused();
    await page.keyboard.press('Tab');
    const input = page.getByLabel('تاریخ ورود و خروج', { exact: true });
    await expect(input).toBeFocused();
    await input.press('Enter');
    const calendar = page.locator('.rmdp-calendar');
    await expect(calendar).toBeVisible();
    const bounds = await calendar.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
    const monthHeading = calendar.locator('.rmdp-header-values');
    const originalMonth = await monthHeading.innerText();
    const nextMonth = page.getByRole('button', { name: 'ماه بعد', exact: true });
    await nextMonth.focus();
    await nextMonth.press('Enter');
    await expect(monthHeading).not.toHaveText(originalMonth);
    const previousMonth = page.getByRole('button', { name: 'ماه قبل', exact: true });
    await previousMonth.focus();
    await previousMonth.press('Space');
    await expect(monthHeading).toHaveText(originalMonth);
    await expect(previousMonth).toBeFocused();
    const outline = await previousMonth.evaluate((node) => getComputedStyle(node).outlineStyle);
    expect(outline).not.toBe('none');
    await page.screenshot({ path: testInfo.outputPath(`calendar-${width}.png`) });
    await page.keyboard.press('Escape');
    await expect(calendar).not.toBeVisible();
    await expect(input).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
