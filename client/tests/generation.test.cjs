const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { test, afterEach } = require('node:test');
const { build } = require('esbuild');
const { createPinia, setActivePinia } = require('pinia');
const { nextTick } = require('vue');

// Bundle TypeScript using the existing build dependency; no browser or weights.
async function loadSource(entry) {
  const result = await build({
    entryPoints: [path.resolve(__dirname, '..', entry)],
    bundle: true, write: false, platform: 'node', format: 'cjs',
    external: ['vue', 'pinia'],
    plugins: [{
      name: 'editor-stub',
      setup(builder) {
        builder.onResolve({ filter: /editor\/TextEditor$/ }, () => ({
          path: 'editor', namespace: 'stub',
        }));
        builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
          contents: 'export class TextEditor {}',
        }));
      },
    }],
  });
  const filename = path.resolve(__dirname, 'bundled.cjs');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded._compile(result.outputFiles[0].text, filename);
  return loaded.exports;
}

const apiPromise = loadSource('src/api/porfirevich.ts');
const storePromise = loadSource('src/store/transformerStore.ts');
const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

test('generation sends JSON with the proper content type', async () => {
  const api = await apiPromise;
  const controller = new AbortController();
  global.fetch = async (url, options) => {
    assert.match(url, /\/generate\/$/);
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.equal(options.signal, controller.signal);
    assert.deepEqual(JSON.parse(options.body), {
      prompt: 'Начало', model: 'original', length: 60, temperature: 1.1,
    });
    return Response.json({ replies: ['Продолжение'] });
  };
  assert.deepEqual(await api.generateApi({
    prompt: 'Начало', model: 'original', tokens: 60, temperature: 1.1,
    signal: controller.signal,
  }), { replies: ['Продолжение'] });
});

test('HTTP failures and malformed responses are not silently accepted', async () => {
  const api = await apiPromise;
  for (const response of [
    Response.json({ detail: 'bad input' }, { status: 422 }),
    new Response('Bad Gateway', { status: 502 }),
    Response.json({ replies: [] }), Response.json({ replies: [null] }),
    Response.json({ detail: 'missing replies' }),
  ]) {
    global.fetch = async () => response;
    await assert.rejects(api.generateApi({ prompt: 'Начало' }));
  }
  for (const response of [
    new Response('Unavailable', { status: 503 }),
    Response.json([]), Response.json(['original', null]), Response.json({}),
  ]) {
    global.fetch = async () => response;
    await assert.rejects(api.getModelsApi());
  }
});

async function createStore(settings, storageDisabled = false) {
  global.localStorage = {
    getItem: () => {
      if (storageDisabled) throw new Error('Storage disabled');
      return settings;
    },
    setItem: () => {
      if (storageDisabled) throw new Error('Storage disabled');
    },
  };
  global.window = { addEventListener() {}, removeEventListener() {} };
  global.fetch = async () => Response.json(['lawa', 'original', 'gpt3']);
  setActivePinia(createPinia());
  const { useTransformerStore } = await storePromise;
  const store = useTransformerStore();
  await store.getModels();
  await nextTick();
  store.initialize();
  return store;
}

test('first visit chooses original independently of API ordering', async () => {
  const store = await createStore(null);
  assert.equal(store.activeModel, 'original');
  assert.equal(store.prompt, '');
  store.text = '  Начало  ';
  assert.equal(store.prompt, 'Начало');
  store.$dispose();
});

test('valid saved model is preserved and repeated loading does not reset a choice', async () => {
  const store = await createStore(JSON.stringify({ activeModel: 'gpt3' }));
  assert.equal(store.activeModel, 'gpt3');
  store.setActiveModel('lawa');
  await store.getModels();
  assert.equal(store.activeModel, 'lawa');
  store.$dispose();
});

test('invalid saved model and legacy out-of-range settings are repaired', async () => {
  const store = await createStore(JSON.stringify({ activeModel: 'removed', tokens: 300, temperature: 0 }));
  assert.equal(store.activeModel, 'original');
  assert.equal(store.tokens, 150);
  assert.equal(store.temperature, 0.1);
  store.$dispose();
});

test('malformed settings and unavailable storage do not break initialization', async () => {
  for (const [settings, disabled] of [['{broken', false], ['null', false], [null, true]]) {
    const store = await createStore(settings, disabled);
    assert.equal(store.activeModel, 'original');
    assert.equal(store.tokens, 150);
    store.$dispose();
  }
});

function setEditor(store, inserted) {
  store.editor = {
    getTextBeforeSelection: () => 'Начало',
    captureSelection: () => undefined,
    setPlaceHolder() {},
    removeActiveBlocks() {}, deleteBlocks() {}, focus() {},
    getText: () => 'Начало', getContents: () => [],
    insertText(reply) { inserted.push(reply); return { id: 'reply' }; },
  };
}

test('an old cancelled request cannot insert text or stop a newer loading indicator', async () => {
  const store = await createStore(null);
  const inserted = [];
  setEditor(store, inserted);
  const pending = [];
  global.fetch = () => new Promise((resolve) => pending.push(resolve));
  const oldRequest = store.transform();
  const newRequest = store.transform();
  pending[0](Response.json({ replies: ['old'] }));
  await oldRequest;
  assert.equal(store.isLoading, true);
  assert.deepEqual(inserted, []);
  pending[1](Response.json({ replies: ['new'] }));
  await newRequest;
  assert.deepEqual(inserted, ['new']);
  assert.equal(store.isLoading, false);
  assert.equal(store.isError, false);
  store.$dispose();
});

test('changing settings invalidates cached continuations from the old model', async () => {
  const store = await createStore(null);
  store.replies = ['old model'];
  store.lastReply = '#old';
  store.setActiveModel('lawa');
  await nextTick();
  assert.deepEqual(store.replies, []);
  assert.equal(store.lastReply, '');
  store.$dispose();
});
