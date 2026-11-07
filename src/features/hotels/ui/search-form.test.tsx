// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from './search-form';
import { SearchNavigationProvider } from './search-navigation';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
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
    await user.selectOptions(screen.getByLabelText('مقصد سفر'), 'kish');
    await user.click(screen.getByRole('button', { name: 'جست‌وجوی هتل' }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.lastCall?.[0]).toContain('city=kish');
    expect(push.mock.lastCall?.[0]).not.toContain('stars=');
  });
});
