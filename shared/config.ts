export interface Config {
  endpoint: string;
  primaryColor: string;
  site: string;
}

let localSettings: Partial<Config> | undefined;

const defaultConfig: Partial<Config> = {
  endpoint: 'https://api.porfirevich.com',
  primaryColor: '#5371FF',
  site: 'https://porfirevich.ru',
};

const config = { ...defaultConfig, ...localSettings } as Config;

export default config;
