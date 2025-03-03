import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import * as config from '$lib/config';
import { load } from '../+layout.server';

vi.mock('$lib/config', () => ({
  loadConfig: vi.fn()
}));

describe('Layout Server Load', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should return repositories from config', async () => {
    const mockRepositories = [
      { id: 'repo1', path: '/path/to/repo1' },
      { id: 'repo2', path: '/path/to/repo2' }
    ];
    
    vi.mocked(config.loadConfig).mockReturnValue({
      repositories: mockRepositories
    });
    
    const result = await load({ params: {}, url: new URL('http://localhost') } as any);
    
    expect(config.loadConfig).toHaveBeenCalled();
    expect(result).toEqual({ repositories: mockRepositories });
  });
  
  test('should throw a 404 error if config loading fails', async () => {
    vi.mocked(config.loadConfig).mockImplementation(() => {
      throw new Error('Config file not found');
    });
    
    await expect(load({ params: {}, url: new URL('http://localhost') } as any)).rejects.toMatchObject({
      status: 404
    });
  });
});