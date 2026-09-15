import type { DataSource } from 'typeorm';

import dataSource from './data-source';

const DEFAULT_MAX_ATTEMPTS = 15;
const DEFAULT_RETRY_DELAY_MS = 2_000;

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function connectDatabase(
  connection: DataSource = dataSource,
): Promise<DataSource> {
  const maxAttempts = readPositiveInteger(
    process.env.DATABASE_CONNECT_MAX_ATTEMPTS,
    DEFAULT_MAX_ATTEMPTS,
  );
  const retryDelayMs = readPositiveInteger(
    process.env.DATABASE_CONNECT_RETRY_DELAY_MS,
    DEFAULT_RETRY_DELAY_MS,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (!connection.isInitialized) {
        await connection.initialize();
      }
      return connection;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        `Database connection failed (${attempt}/${maxAttempts}): ${reason}. ` +
          `Retrying in ${retryDelayMs} ms.`,
      );
      await wait(retryDelayMs);
    }
  }

  throw new Error('Database connection attempts were exhausted');
}
