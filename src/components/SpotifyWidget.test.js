import { act, render, screen } from '@testing-library/react';
import SpotifyWidget from './SpotifyWidget';

afterEach(() => { jest.useRealTimers(); delete global.fetch; });

test('stays hidden without a configured service', () => {
  global.fetch = jest.fn();
  const { container } = render(<SpotifyWidget endpoint="" />);
  expect(container).toBeEmptyDOMElement();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('shows a real response, then hides a paused track on the next refresh', async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ isPlaying: true, title: 'Test song', artist: 'Test artist', url: 'https://open.spotify.com/track/test' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ isPlaying: false }) });
  await act(async () => { render(<SpotifyWidget endpoint="https://example.test/now-playing" />); });
  expect(screen.getByRole('link', { name: /Test song/ })).toHaveAttribute('href', 'https://open.spotify.com/track/test');
  await act(async () => { jest.advanceTimersByTime(15000); });
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

test('does not show a widget on service failure', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
  let view;
  await act(async () => { view = render(<SpotifyWidget endpoint="https://example.test/now-playing" />); });
  expect(view.container).toBeEmptyDOMElement();
});
