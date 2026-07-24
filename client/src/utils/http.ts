export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = (await response.text()).trim();
    throw new HttpError(
      response.status,
      message || `HTTP request failed with status ${response.status}`
    );
  }

  return (await response.json()) as T;
}

export function ensureResponseOk(response: Response) {
  if (!response.ok) {
    throw new HttpError(
      response.status,
      `HTTP request failed with status ${response.status}`
    );
  }
}
