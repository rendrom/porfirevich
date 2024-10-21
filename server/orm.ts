import ormconfigtypeless from './ormconfig.json';

import type { ConnectionOptions } from 'typeorm';

let ormconfig = ormconfigtypeless as ConnectionOptions;

if (process.env.NODE_ENV === 'development' && ormconfig.type === 'postgres') {
  ormconfig = {
    ...ormconfig,
    host: 'localhost',
    port: 5433

  } as ConnectionOptions
}

export { ormconfig };
