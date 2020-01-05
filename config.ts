export interface Config {
  endpoint: string;
  primaryColor: string;
  site: string;
  jwtSecret: string;
}

let localSettings: Partial<Config>;

try {
  localSettings = require('./configLocal.ts');
} catch {
  throw new Error('No local config founded');
}

const defaultConfig: Partial<Config> = {
  endpoint: 'https://models.dobro.ai',
  primaryColor: '#5371FF',
  site: 'https://porfirevich.ru'
};

const config = { ...defaultConfig, ...localSettings } as Config;

export default config;
