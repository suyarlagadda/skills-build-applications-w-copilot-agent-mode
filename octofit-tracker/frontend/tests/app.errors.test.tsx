import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

for (const route of ['/activities', '/teams', '/leaderboard', '/workouts']) {
  describe(`${route} request errors`, () => {
    it('announces network failures rather than showing an empty list', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
      render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
      expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load/i);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('announces malformed list responses as errors', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })));
      render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
      expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load/i);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
}
