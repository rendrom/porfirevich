import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { ormconfig } from '../ormconfig';

export default new DataSource(ormconfig);
