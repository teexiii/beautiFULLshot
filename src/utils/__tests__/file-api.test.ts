import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  writeText: vi.fn(),
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ save: vi.fn() }));
vi.mock('../logger', () => ({ logError: vi.fn(), logger: { error: vi.fn() } }));

import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { copyPathToClipboard } from '../file-api';
import { logError } from '../logger';

describe('copyPathToClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes the given path as text and returns true', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined);

    const result = await copyPathToClipboard('C:\\Users\\me\\Pictures\\shot.png');

    expect(writeText).toHaveBeenCalledWith('C:\\Users\\me\\Pictures\\shot.png');
    expect(result).toBe(true);
  });

  it('strips the Windows extended-length prefix before writing', async () => {
    vi.mocked(writeText).mockResolvedValue(undefined);

    const result = await copyPathToClipboard('\\\\?\\C:\\Users\\me\\shot.png');

    expect(writeText).toHaveBeenCalledWith('C:\\Users\\me\\shot.png');
    expect(result).toBe(true);
  });

  it('returns false and logs without throwing when writeText rejects', async () => {
    vi.mocked(writeText).mockRejectedValue(new Error('clipboard unavailable'));

    await expect(copyPathToClipboard('/tmp/shot.png')).resolves.toBe(false);
    expect(logError).toHaveBeenCalled();
  });
});
