import config from '@shared/config';

import type { GenerateApiOptions, TransformResp } from '../interfaces';

let i = 0;
const DEBUG = false;

async function mockResponse<T>(data: T): Promise<T> {
  const delay = Math.floor(Math.random() * 1000);
  return new Promise<T>((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
}

export async function generateApi({
  prompt,
  model,
  tokens,
  signal,
  temperature,
}: GenerateApiOptions): Promise<TransformResp> {
  if (DEBUG) {
    return mockResponse({ replies: [String(i++), String(i++), String(i++)] });
  }

  const resp = await fetch(`${config.endpoint}/generate/`, {
    method: 'POST',
    signal,
    body: JSON.stringify({
      prompt,
      model,
      length: tokens,
      temperature,
    }),
  });
  const data: TransformResp = await resp.json();
  return data;
}

export async function getModelsApi(): Promise<string[]> {
  if (DEBUG) {
    return mockResponse(['gpt3', 'frida']);
  }

  const resp = await fetch(`${config.endpoint}/models`, {
    method: 'GET',
  });
  const data: string[] = await resp.json();
  return data;
}
