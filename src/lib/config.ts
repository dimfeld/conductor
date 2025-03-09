import fs from 'fs';
import path from 'path';

/**
 * Configuration structure for the application
 */
export interface Config {}

/**
 * Loads the configuration from a JSON file
 *
 * @returns The parsed configuration object
 * @throws Error if the file doesn't exist or contains invalid JSON
 */
export function loadConfig(): Config {
  // Check for custom config path in environment variable
  const configPath = process.env.CONFIG_PATH || './config.json';

  try {
    // Read and parse the config file
    const configFile = fs.readFileSync(path.resolve(configPath), 'utf-8');
    const config = JSON.parse(configFile) as Config;
    return config;
  } catch (error) {
    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Config file not found at ${configPath}`);
      }

      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file: ${error.message}`);
      }
    }

    // Re-throw any other errors
    throw error;
  }
}
