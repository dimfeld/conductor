import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config';
import fs from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs', () => {
  return {
    default: {
      readFileSync: vi.fn()
    },
    readFileSync: vi.fn()
  };
});

// Mock path module
vi.mock('path', () => {
  return {
    default: {
      resolve: vi.fn((p) => p)
    },
    resolve: vi.fn((p) => p)
  };
});

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
    process.env = { ...originalEnv };
    
    // Reset mock implementations
    vi.mocked(fs.readFileSync).mockReset();
    vi.mocked(path.resolve).mockReset();
    
    // Default implementation of path.resolve
    vi.mocked(path.resolve).mockImplementation((p) => p);
  });

  afterEach(() => {
    // Restore environment variables after each test
    process.env = originalEnv;
  });

  test('should load and parse a valid config file from default path', () => {
    const mockConfig = {
      repositories: [
        { name: 'repo1', path: '/path/to/repo1' },
        { name: 'repo2', path: '/path/to/repo2' }
      ]
    };
    
    // Mock readFileSync to return a valid JSON
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
    
    const config = loadConfig();
    
    // Verify readFileSync was called with the default path
    expect(fs.readFileSync).toHaveBeenCalledWith('./config.json', 'utf-8');
    
    // Verify the returned config matches our mock
    expect(config).toEqual(mockConfig);
  });

  test('should load config from custom path when GIT_TOOL_CONFIG_PATH is set', () => {
    const mockConfig = {
      repositories: [
        { name: 'custom-repo', path: '/custom/path' }
      ]
    };
    
    // Set custom config path
    process.env.GIT_TOOL_CONFIG_PATH = '/custom/config.json';
    
    // Mock readFileSync to return a valid JSON
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
    
    const config = loadConfig();
    
    // Verify readFileSync was called with the custom path
    expect(fs.readFileSync).toHaveBeenCalledWith('/custom/config.json', 'utf-8');
    
    // Verify the returned config matches our mock
    expect(config).toEqual(mockConfig);
  });

  test('should throw an error if the config file does not exist', () => {
    // Mock readFileSync to throw a ENOENT error
    const error = new Error('File not found') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw error;
    });
    
    // Expect loadConfig to throw an error with a specific message
    expect(() => loadConfig()).toThrow('Config file not found at ./config.json');
  });

  test('should throw an error if the config file contains invalid JSON', () => {
    // Mock readFileSync to return invalid JSON
    vi.mocked(fs.readFileSync).mockReturnValue('{ invalid: json }');
    
    // Expect loadConfig to throw an error with a specific message
    expect(() => loadConfig()).toThrow('Invalid JSON in config file:');
  });
});