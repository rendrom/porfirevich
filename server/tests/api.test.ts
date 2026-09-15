import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';

import express from 'express';

import { api } from '../src/api';
import { appConfig } from '../src/appConfig';
import dataSource from '../src/data-source';
import { connectDatabase } from '../src/database';
import { Story } from '../src/entity/Story';
import { User } from '../src/entity/User';
import { appendOgImage } from '../src/middlewares/appendOgImage';
import { generateAccessToken } from '../src/token';

let server: Server;
let origin: string;
let owner: User;
let other: User;
let story: Story;
const content = JSON.stringify([
  ['Облако\nНебо', 0],
  [' Продолжение.', 1],
]);

before(async () => {
  // Deliberately refuse to run write tests against a normal application database.
  assert.match(process.env.POSTGRES_DB || '', /_test$/);
  await connectDatabase();
  const repository = dataSource.getRepository(User);
  for (const assign of [
    (u: User) => {
      owner = u;
    },
    (u: User) => {
      other = u;
    },
  ]) {
    const user = repository.create({
      uid: randomUUID(),
      username: randomUUID(),
      password: 'test-password',
    });
    user.hashPassword();
    assign(await repository.save(user));
  }
  story = await dataSource.getRepository(Story).save(
    dataSource.getRepository(Story).create({
      content,
      user: owner,
      isPublic: true,
    }),
  );
  const app = express();
  appConfig(app);
  api(app);
  app.get('/:id', appendOgImage);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  origin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  if (dataSource.isInitialized) await dataSource.destroy();
});

function request(path: string, method = 'GET', body?: unknown, user?: User) {
  return fetch(origin + path, {
    method,
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/json',
      ...(user
        ? { Authorization: `Bearer ${generateAccessToken(user.uid)}` }
        : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

test('current ORM maps the production schema without schema changes', async () => {
  const changes = await dataSource.driver.createSchemaBuilder().log();
  assert.deepEqual(
    changes.upQueries.map((q) => q.query),
    [],
  );
  assert.equal((await request('/health')).status, 200);
  assert.equal((await request(`/api/story/${story.id}`)).status, 200);
  assert.equal(
    (await request('/api/story/missing_story/postcard')).status,
    404,
  );
});

test('story filters use parameters and cannot reveal private stories anonymously', async () => {
  assert.equal((await request('/api/story?filter=my')).status, 401);
  assert.equal((await request('/api/story?filter=favorite')).status, 401);
  for (const query of [
    'offset=-1',
    'offset=Infinity',
    'afterDate=oops',
    'orderBy=pg_sleep(10)',
    'orderBy=content',
  ]) {
    assert.equal((await request('/api/story?' + query)).status, 400);
  }
  const injection = await request(
    '/api/story?tags=' + encodeURIComponent("' OR TRUE --"),
  );
  assert.equal(injection.status, 200);
  assert.deepEqual((await injection.json()).data, []);
  assert.equal(
    (await request('/api/story?orderBy=likesCount,createdAt')).status,
    200,
  );
  assert.equal(
    (await request('/api/story?filter=my', 'GET', undefined, owner)).status,
    200,
  );
});

test('invalid story data and malformed JSON return controlled client errors', async () => {
  for (const value of [
    undefined,
    {},
    'not json',
    '{}',
    '[]',
    '[[42,0]]',
    '[["text",9]]',
  ]) {
    assert.equal(
      (await request('/api/story', 'POST', { content: value })).status,
      400,
    );
  }
  const result = await fetch(origin + '/api/story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(result.status, 400);
  assert.match(result.headers.get('content-type') || '', /json/);
});

test('story edits cannot change ownership or moderation fields', async () => {
  assert.equal(
    (
      await request(
        `/api/story/${story.id}`,
        'PATCH',
        { userId: other.id },
        owner,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        `/api/story/${story.id}`,
        'PATCH',
        { isBanned: false },
        owner,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request(`/api/story/${story.id}`, 'PATCH', { content }, other))
      .status,
    403,
  );
  assert.equal(
    (
      await request(
        `/api/story/${story.id}`,
        'PATCH',
        { content, isPublic: true },
        owner,
      )
    ).status,
    200,
  );
});

test('likes and reports update different counters, and dislikes are awaited', async () => {
  assert.equal(
    (await request(`/api/story/${story.id}/like`, 'POST', {}, other)).status,
    200,
  );
  assert.equal(
    (await request(`/api/story/${story.id}/like`, 'POST', {}, other)).status,
    409,
  );
  assert.equal(
    (await request(`/api/story/${story.id}/violation`, 'POST', {})).status,
    200,
  );
  const repository = dataSource.getRepository(Story);
  let current = await repository.findOneByOrFail({ id: story.id });
  assert.equal(current.likesCount, 1);
  assert.equal(current.violationsCount, 1);
  assert.equal(
    (await request(`/api/story/${story.id}/dislike`, 'POST', {}, other)).status,
    200,
  );
  current = await repository.findOneByOrFail({ id: story.id });
  assert.equal(current.likesCount, 0);
  assert.equal(current.violationsCount, 1);
});

test('password changes require authentication and complete before replying', async () => {
  assert.equal(
    (await request('/auth/change-password', 'POST', {})).status,
    401,
  );
  assert.equal(
    (await request('/auth/change-password', 'POST', {}, owner)).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/auth/change-password',
        'POST',
        { oldPassword: 'wrong', newPassword: 'updated-password' },
        owner,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await request(
        '/auth/change-password',
        'POST',
        { oldPassword: 'test-password', newPassword: 'updated-password' },
        owner,
      )
    ).status,
    204,
  );
  assert.equal(
    (
      await request('/auth/login', 'POST', {
        username: owner.username,
        password: 'updated-password',
      })
    ).status,
    200,
  );
  assert.equal(
    (await request(`/api/user/${owner.id}`, 'DELETE', {}, other)).status,
    403,
  );
  assert.equal(
    (await request(`/api/user/${owner.id}`, 'DELETE', {})).status,
    401,
  );
});

test('new local accounts receive a usable identity and refresh cookie', async () => {
  const username = randomUUID();
  assert.equal(
    (
      await request('/api/user', 'POST', {
        username,
        password: 'local-password',
      })
    ).status,
    201,
  );
  const login = await request('/auth/login', 'POST', {
    username,
    password: 'local-password',
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get('set-cookie') || '', /HttpOnly/);
  const token = await login.text();
  const current = await fetch(origin + '/api/user', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(current.status, 200);
  assert.equal((await current.json()).username, username);
});

test('login rejects invalid credentials and restores identity for legacy accounts', async () => {
  const repository = dataSource.getRepository(User);
  const user = repository.create({ username: randomUUID(), password: 'legacy-password' });
  user.hashPassword();
  await repository.save(user);
  for (const [body, status] of [
    [{}, 400],
    [{ username: [], password: 'legacy-password' }, 400],
    [{ username: user.username, password: '' }, 400],
    [{ username: randomUUID(), password: 'legacy-password' }, 401],
    [{ username: user.username, password: 'wrong' }, 401],
  ] as const) {
    assert.equal((await request('/auth/login', 'POST', body)).status, status);
  }
  assert.equal((await repository.findOneByOrFail({ id: user.id })).uid, null);
  const login = await request('/auth/login', 'POST', { username: user.username, password: 'legacy-password' });
  assert.equal(login.status, 200);
  assert.match(login.headers.get('set-cookie') || '', /HttpOnly/);
  const current = await fetch(origin + '/api/user', {
    headers: { Authorization: `Bearer ${await login.text()}` },
  });
  assert.equal(current.status, 200);
  const saved = await repository.findOneByOrFail({ id: user.id });
  assert.equal((await current.json()).uid, saved.uid);
  assert(saved.uid);
  assert.equal(saved.password, user.password);
});

test('saving a story renders a postcard and its endpoint responds', async () => {
  const saved = await request('/api/story', 'POST', { content });
  assert.equal(saved.status, 200);
  const value = await saved.json();
  assert.match(value.postcard || '', /^\/media\/[\w-]+\.png$/);
  const picture = await request(value.postcard);
  assert.equal(picture.status, 200);
  assert.match(picture.headers.get('content-type') || '', /image\/png/);
  assert.equal((await request(`/api/story/${value.id}/postcard`)).status, 302);
});

test('shared story metadata escapes HTML instead of injecting markup', async () => {
  const malicious = dataSource
    .getRepository(Story)
    .create({
      content: JSON.stringify([['"><script>window.injected=1</script>', 0]]),
    });
  await dataSource.getRepository(Story).save(malicious);
  const response = await request('/' + malicious.id);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert(!html.includes('<script>window.injected=1</script>'));
  assert(html.includes('&lt;script&gt;window.injected=1&lt;/script&gt;'));
});
