// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from './search-form';
import { SearchNavigationProvider } from './search-navigation';
import { toPersianDate } from '@/lib/dates/calendar';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const restored = {
  city: 'tehran',
  checkIn: '2026-11-10',
  checkOut: '2026-11-12',
  rooms: '1',
  guests: '2',
};
const persianText = (date: string) => toPersianDate(date).format('YYYY/MM/DD');
async function manualForm() {
  const user = userEvent.setup();
  render(<SearchForm today="2026-11-07" raw={restored} />, { wrapper: SearchNavigationProvider });
  await user.click(screen.getByText('وارد کردن تاریخ به‌صورت متنی'));
  return {
    user,
    checkIn: screen.getByRole('textbox', { name: 'تاریخ ورود شمسی' }),
    checkOut: screen.getByRole('textbox', { name: 'تاریخ خروج شمسی' }),
  };
}
describe('Persian search form', () => {
  it('shows field errors and does not navigate for incomplete input', async () => {
    const user = userEvent.setup();
    render(<SearchForm today="2026-11-07" raw={{}} />, { wrapper: SearchNavigationProvider });
    await user.click(screen.getByRole('button', { name: 'جست‌وجوی هتل' }));
    expect(await screen.findByText('مقصد سفر را انتخاب کنید.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
  it('submits restored valid values and resets filters for the new search', async () => {
    const user = userEvent.setup();
    render(
      <SearchForm
        today="2026-11-07"
        raw={{
          city: 'tehran',
          checkIn: '2026-11-10',
          checkOut: '2026-11-12',
          rooms: '1',
          guests: '2',
          stars: '4',
        }}
      />,
      { wrapper: SearchNavigationProvider },
    );
    const city = screen.getByRole('combobox', { name: 'مقصد سفر' });
    await user.clear(city);
    await user.type(city, 'کیش');
    await user.click(screen.getByRole('option', { name: /کیش/ }));
    await user.click(screen.getByRole('button', { name: 'جست‌وجوی هتل' }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.lastCall?.[0]).toContain('city=kish');
    expect(push.mock.lastCall?.[0]).not.toContain('stars=');
  });
  it('keeps rooms and guests in the submitted query from the occupancy panel', async () => {
    const user = userEvent.setup();
    render(<SearchForm today="2026-11-07" raw={restored} />, { wrapper: SearchNavigationProvider });
    await user.click(screen.getByRole('button', { name: /مسافر، .* اتاق/ }));
    await user.click(screen.getByRole('button', { name: 'افزایش تعداد اتاق' }));
    await user.click(screen.getByRole('button', { name: 'افزایش تعداد مسافر' }));
    await user.click(screen.getByRole('button', { name: 'جست‌وجوی هتل' }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.lastCall?.[0]).toContain('rooms=2');
    expect(push.mock.lastCall?.[0]).toContain('guests=3');
  });
  it('preserves checkout when check-in is unchanged or edited to a compatible date', async () => {
    const { user, checkIn, checkOut } = await manualForm();
    await user.click(checkIn);
    await user.tab();
    expect(checkOut).toHaveValue(persianText(restored.checkOut));
    await user.clear(checkIn);
    await user.type(checkIn, persianText('2026-11-09'));
    await user.tab();
    expect(checkOut).toHaveValue(persianText(restored.checkOut));
    await user.click(screen.getByRole('button', { name: 'جست‌وجوی هتل' }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.lastCall?.[0]).toContain('checkIn=2026-11-09&checkOut=2026-11-12');
  });
  it('clears an incompatible checkout with an explanation and focuses its input', async () => {
    const { user, checkIn, checkOut } = await manualForm();
    await user.clear(checkIn);
    await user.type(checkIn, persianText('2026-11-14'));
    // Reconciliation waits for the completed edit, rather than intermediate keystrokes.
    expect(checkOut).toHaveValue(persianText(restored.checkOut));
    await user.tab();
    expect(checkOut).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('خروج را دوباره انتخاب کنید');
    await user.click(screen.getByRole('button', { name: 'جست‌وجوی هتل' }));
    await waitFor(() => expect(checkOut).toHaveFocus());
    expect(checkOut).toHaveAccessibleDescription(/خروج: تاریخ معتبر انتخاب کنید/);
    expect(push).not.toHaveBeenCalled();
  });
  it('rejects incomplete and invalid text instead of submitting the previous valid value', async () => {
    const { user, checkOut } = await manualForm();
    await user.clear(checkOut);
    await user.type(checkOut, '۱۴۰۵/');
    expect(checkOut).toHaveValue('۱۴۰۵/');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(checkOut).toHaveFocus());
    expect(checkOut).toHaveAttribute('aria-invalid', 'true');
    expect(checkOut).toHaveAccessibleDescription(/تاریخ شمسی معتبر/);
    expect(push).not.toHaveBeenCalled();
    await user.clear(checkOut);
    await user.type(checkOut, '۱۴۰۵/۱۳/۴۰{Enter}');
    expect(push).not.toHaveBeenCalled();
  });
  it('submits the latest typed checkout with Enter before blur', async () => {
    const { user, checkOut } = await manualForm();
    await user.clear(checkOut);
    await user.type(checkOut, `${persianText('2026-11-15')}{Enter}`);
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(checkOut).toHaveFocus();
    expect(push.mock.lastCall?.[0]).toContain('checkOut=2026-11-15');
  });
  it('updates both manual fields after a calendar range selection', async () => {
    const user = userEvent.setup();
    render(<SearchForm today="2026-11-07" raw={{ city: 'tehran' }} />, {
      wrapper: SearchNavigationProvider,
    });
    await user.click(screen.getByText('وارد کردن تاریخ به‌صورت متنی'));
    await user.click(screen.getByLabelText('تاریخ ورود و خروج', { exact: true }));
    for (const date of ['2026-11-10', '2026-11-12']) {
      await user.click(
        screen.getByRole('button', {
          name: `انتخاب ${toPersianDate(date).format('dddd D MMMM YYYY')}`,
        }),
      );
    }
    expect(screen.getByRole('textbox', { name: 'تاریخ ورود شمسی' })).toHaveValue(
      persianText('2026-11-10'),
    );
    expect(screen.getByRole('textbox', { name: 'تاریخ خروج شمسی' })).toHaveValue(
      persianText('2026-11-12'),
    );
  });
  it('opens manual dates and focuses the first invalid date on submission', async () => {
    const user = userEvent.setup();
    render(<SearchForm today="2026-11-07" raw={{ city: 'tehran' }} />, {
      wrapper: SearchNavigationProvider,
    });
    await user.click(screen.getByRole('button', { name: 'جست‌وجوی هتل' }));
    const checkIn = await screen.findByRole('textbox', { name: 'تاریخ ورود شمسی' });
    await waitFor(() => expect(checkIn).toHaveFocus());
    expect(checkIn).toHaveAccessibleDescription(/ورود: تاریخ معتبر انتخاب کنید/);
    expect(push).not.toHaveBeenCalled();
  });
  it('navigates months in the named direction and retains focus at the lower boundary', async () => {
    const user = userEvent.setup();
    render(<SearchForm today="2026-11-07" raw={{}} />, { wrapper: SearchNavigationProvider });
    await user.click(screen.getByLabelText('تاریخ ورود و خروج'));
    const previousMonth = screen.getByRole('button', { name: 'ماه قبل' });
    const nextMonth = screen.getByRole('button', { name: 'ماه بعد' });
    expect(previousMonth).toHaveAttribute('aria-disabled', 'true');
    await user.click(previousMonth);
    expect(screen.getByText('آبان', { exact: true })).toBeInTheDocument();
    await user.click(nextMonth);
    expect(screen.getByText('آذر', { exact: true })).toBeInTheDocument();
    await user.click(previousMonth);
    expect(screen.getByText('آبان', { exact: true })).toBeInTheDocument();
    expect(previousMonth).toHaveFocus();
    expect(previousMonth).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Escape}');
    expect(screen.getByLabelText('تاریخ ورود و خروج')).toHaveFocus();
  });
});
