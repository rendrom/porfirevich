import {
  type Connection,
  type ConnectionOptions,
  getConnectionManager,
} from 'typeorm';

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
  options: ConnectionOptions,
): Promise<Connection> {
  const maxAttempts = readPositiveInteger(
    process.env.DATABASE_CONNECT_MAX_ATTEMPTS,
    DEFAULT_MAX_ATTEMPTS,
  );
  const retryDelayMs = readPositiveInteger(
    process.env.DATABASE_CONNECT_RETRY_DELAY_MS,
    DEFAULT_RETRY_DELAY_MS,
  );
  const connectionName = options.name ?? 'default';
  const connectionManager = getConnectionManager();
  const connection = connectionManager.has(connectionName)
    ? connectionManager.get(connectionName)
    : connectionManager.create(options);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (!connection.isConnected) {
        await connection.connect();
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
