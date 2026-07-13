import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from './api.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, statusText: String(status), json: () => Promise.resolve(body) };
}

describe('api getJson resilience', () => {
  it('retries once on a 5xx, then returns the recovered body', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200, { roasters: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.listRoasters()).resolves.toEqual({ roasters: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries once on a network error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getCoffee(1)).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry a 404 and surfaces a friendly message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getCoffee(1)).rejects.toThrow(/couldn't find/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps a timeout (AbortError) to a friendly timeout message after the retry is spent', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const fetchMock = vi.fn().mockRejectedValue(abortErr);
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.listRoasters()).rejects.toThrow(/taking longer/i);
    expect(fetchMock).toHaveBeenCalledTimes(2); // initial attempt + one retry
  });
});
