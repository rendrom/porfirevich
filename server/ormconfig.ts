import path from 'node:path';

import type { ConnectionOptions } from 'typeorm';

const sourceExtension = __filename.endsWith('.ts') ? 'ts' : 'js';

const ormconfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'db',
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER || 'porf',
  password: process.env.POSTGRES_PASSWORD || '123456',
  database: process.env.POSTGRES_DB || 'porf',
  synchronize: process.env.TYPEORM_SYNCHRONIZE !== 'false',
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [
    path.join(__dirname, `src/entity/**/*.${sourceExtension}`),
  ],
  migrations: [
    path.join(__dirname, `src/migration/**/*.${sourceExtension}`),
  ],
};

export { ormconfig };
export default ormconfig;
