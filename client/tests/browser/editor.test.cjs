const assert = require("node:assert/strict");
const path = require("node:path");
const { before, after, test } = require("node:test");
const { build } = require("esbuild");
const puppeteer = require("puppeteer");

let browser;
let source;
before(async () => {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const result = await build({
    stdin: {
      contents: `import { TextEditor } from './src/editor/TextEditor';
        import { useTransformerStore } from './src/store/transformerStore';
        import { createPinia, setActivePinia } from 'pinia';
        import { nextTick } from 'vue';
        window.tick = nextTick;
        window.TextEditor = TextEditor;
        window.createStore = () => {
          setActivePinia(createPinia());
          const store = useTransformerStore();
          store.initialize();
          store.createEditor('#editorjs');
          window.store = store;
          return store;
        };`,
      resolveDir: path.resolve(__dirname, "../.."),
      loader: "ts",
    },
    bundle: true,
    write: false,
    format: "iife",
    plugins: [
      {
        name: "css",
        setup(b) {
          b.onLoad({ filter: /\.css$/ }, () => ({
            contents: "",
            loader: "js",
          }));
        },
      },
    ],
    define: { "process.env.NODE_ENV": '"test"' },
  });
  source = result.outputFiles[0].text;
});
after(async () => {
  await browser?.close();
});

async function pageFor(t, mobile = false) {
  const page = await browser.newPage();
  t.after(() => page.close());
  if (mobile)
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
    });
  await page.setContent(
    '<div id="editorjs" style="white-space:pre-wrap;min-height:100px"></div><button id="settings">Settings</button><div id="outside">Outside</div>',
  );
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    window.editor = new window.TextEditor("#editorjs");
  });
  return page;
}

test("history includes native text nodes and line breaks (#25, #26)", async (t) => {
  const page = await pageFor(t);
  const result = await page.evaluate(() => {
    document.querySelector("#editorjs").innerHTML =
      "Облако<div>Небо<br>Дождь</div>";
    const contents = editor.getContents();
    const text = editor.getText();
    editor.setContents(contents);
    return { text, restored: editor.getText() };
  });
  assert.deepEqual(result, {
    text: "Облако\nНебо\nДождь",
    restored: "Облако\nНебо\nДождь",
  });
});

test("active continuation is excluded by node, not by first matching text", async (t) => {
  const page = await pageFor(t);
  const text = await page.evaluate(() => {
    editor.setContents([["Облако. Небо. Облако.", 0]]);
    editor.insertText("Облако.", { isApi: true, isActive: true, silent: true });
    return editor.getText();
  });
  assert.equal(text, "Облако. Небо. Облако.");
});

for (const mobile of [false, true]) {
  test(`selection crossing the editor cannot delete controls (${mobile ? "mobile #28–29" : "desktop #24–27"})`, async (t) => {
    const page = await pageFor(t, mobile);
    const result = await page.evaluate(() => {
      editor.setContents([["Облако", 0]]);
      const range = document.createRange();
      range.setStart(document.querySelector("#editorjs span").firstChild, 3);
      range.setEnd(document.querySelector("#outside").firstChild, 3);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      editor.insertText(" Продолжение", {
        isApi: true,
        atCurrentSelection: true,
      });
      return {
        text: editor.getText(false),
        controls: !!document.querySelector("#settings"),
        outside: document.querySelector("#outside")?.textContent,
      };
    });
    assert.deepEqual(result, {
      text: "Облако Продолжение",
      controls: true,
      outside: "Outside",
    });
  });
}

test("element offsets are not mistaken for character offsets (#26)", async (t) => {
  const page = await pageFor(t);
  const text = await page.evaluate(() => {
    editor.setContents([["Облако", 0]]);
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#editorjs span"));
    range.collapse(false);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    editor.insertText("!", { atCurrentSelection: true });
    return editor.getText();
  });
  assert.equal(text, "Облако!");
});

async function storePage(t, mobile = false) {
  const page = await pageFor(t, mobile);
  await page.evaluate(async () => {
    editor.destroy();
    window.createStore();
    window.editor = store.editor;
    store.activeModel = "original";
    window.requests = [];
    window.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return Response.json({ replies: [" Первый.", " Второй.", " Третий."] });
    };
    await window.tick();
    store.setScheme([["Облако.", 0]], true);
  });
  return page;
}

for (const mobile of [false, true]) {
  test(`settings and variants stay inside the editor (${mobile ? "mobile #28, #29" : "desktop #24, #27"})`, async (t) => {
    const page = await storePage(t, mobile);
    const result = await page.evaluate(async () => {
      await store.transform();
      const first = editor.getText(false);
      store.temperature = 1.2;
      await tick();
      const range = document.createRange();
      range.selectNodeContents(document.querySelector("#settings"));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      await store.transform();
      await store.transform();
      await tick();
      return {
        first,
        text: editor.getText(false),
        active: document.querySelectorAll(".active-text").length,
        outsideActive: document.querySelectorAll("body > .active-text").length,
        requestPrompts: requests.map((r) => r.prompt),
        error: store.isError,
        lastReply: !!store.lastReply,
      };
    });
    assert.deepEqual(result, {
      first: "Облако. Третий.",
      text: "Облако. Третий. Второй.",
      active: 1,
      outsideActive: 0,
      requestPrompts: ["Облако.", "Облако. Третий."],
      error: false,
      lastReply: true,
    });
  });
}

test("deleting generated text then switching variants preserves the remaining story (#25, #26)", async (t) => {
  const page = await storePage(t);
  await page.evaluate(async () => {
    await store.transform();
    const active = document.querySelector(".active-text");
    const range = document.createRange();
    range.setStart(active.firstChild, 4);
    range.setEnd(active.firstChild, active.textContent.length);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
  });
  await page.keyboard.press("Backspace");
  const result = await page.evaluate(async () => {
    await tick();
    const edited = editor.getText(false);
    const hadVariant = !!store.lastReply;
    await store.transform();
    await store.transform();
    await tick();
    return {
      edited,
      hadVariant,
      text: editor.getText(false),
      prompt: requests.at(-1).prompt,
      error: store.isError,
    };
  });
  assert.deepEqual(result, {
    edited: "Облако. Тре",
    hadVariant: false,
    text: "Облако. Тре Второй.",
    prompt: "Облако. Тре",
    error: false,
  });
});

test("undo immediately after generation restores the preceding snapshot (#27)", async (t) => {
  const page = await storePage(t);
  const texts = await page.evaluate(async () => {
    await store.transform();
    await store.transform();
    store.historyBack();
    const first = editor.getText(false);
    store.historyBack();
    const second = editor.getText(false);
    store.historyBack();
    return [first, second, editor.getText(false)];
  });
  assert.deepEqual(texts, ["Облако. Третий.", "Облако.", ""]);
});

test("a delayed response inserts at the request caret, not the later selection", async (t) => {
  const page = await storePage(t);
  const text = await page.evaluate(async () => {
    store.setScheme([["Начало Конец", 0]], true);
    const range = document.createRange();
    range.setStart(document.querySelector("#editorjs span").firstChild, 6);
    range.collapse(true);
    editor.restoreSelection(range);
    let resolve;
    window.fetch = () =>
      new Promise((r) => {
        resolve = r;
      });
    const pending = store.transform();
    editor.setCursorToEnd();
    resolve(Response.json({ replies: [" между"] }));
    await pending;
    return editor.getText(false);
  });
  assert.equal(text, "Начало между Конец");
});

test("plain paste, Enter and composition survive serialization and undo", async (t) => {
  const page = await storePage(t, true);
  await page.evaluate(() => store.clean());
  await page.focus("#editorjs");
  await page.keyboard.type("Cloud");
  await page.keyboard.press("Enter");
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/plain", "Небо\nДождь");
    document
      .querySelector("#editorjs")
      .dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
  });
  const result = await page.evaluate(async () => {
    await tick();
    const target = document.querySelector("#editorjs");
    target.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    target.appendChild(document.createTextNode("雨"));
    target.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "雨" }),
    );
    await tick();
    const scheme = editor.getContents();
    editor.setContents(scheme);
    return editor.getText(false);
  });
  assert.equal(result, "Cloud\nНебо\nДождь雨");
});

test("destroyed editor no longer reacts to mutations after route changes", async (t) => {
  const page = await storePage(t);
  const value = await page.evaluate(async () => {
    store.destroy();
    document.querySelector("#editorjs").textContent = "Detached";
    await new Promise((r) => setTimeout(r, 350));
    return { ready: store.isReady, text: store.text };
  });
  assert.deepEqual(value, { ready: false, text: "Облако." });
});
