const assert = require("node:assert/strict");
const { test } = require("node:test");
const puppeteer = require("puppeteer");

// Opt-in only: these checks consume GPU time. No stories/accounts are saved.
test(
  "long prompts complete through the browser and real inference API (#34)",
  {
    skip: process.env.LIVE_API !== "1" || !process.env.SMOKE_URL,
    timeout: 600000,
  },
  async (t) => {
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    t.after(() => browser.close());
    const page = await browser.newPage();
    page.on("dialog", (dialog) => dialog.accept());
    const prompt =
      "Однажды вечером над городом появились облака. Начался дождь, и прохожие поспешили домой. ".repeat(
        150,
      );
    for (const model of ["original", "gpt3", "mig", "lawa", "frida"]) {
      await page.goto(process.env.SMOKE_URL, { waitUntil: "networkidle0" });
      await page.evaluate(
        (model) =>
          localStorage.setItem(
            "transformerSettings",
            JSON.stringify({
              activeModel: model,
              tokens: 150,
              temperature: 0.3,
            }),
          ),
        model,
      );
      await page.reload({ waitUntil: "networkidle0" });
      await page.waitForSelector("#editorjs");
      await page.focus("#editorjs");
      await page.evaluate(
        (prompt) => document.execCommand("insertText", false, prompt),
        prompt,
      );
      await page.waitForFunction(
        () => !document.querySelector(".transform-btn").disabled,
      );
      const start = Date.now();
      const responsePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith("/generate/") && r.request().method() === "POST",
        { timeout: 200000 },
      );
      await page.click(".transform-btn");
      const response = await responsePromise;
      assert.equal(response.status(), 200, model);
      const body = await response.json();
      assert(
        body.replies.length > 0 &&
          body.replies.every((r) => typeof r === "string"),
      );
      assert.equal(JSON.parse(response.request().postData()).model, model);
      await page.waitForSelector("#editorjs .active-text");
      t.diagnostic(
        JSON.stringify({
          model,
          promptBytes: Buffer.byteLength(prompt),
          seconds: (Date.now() - start) / 1000,
          status: response.status(),
          replies: body.replies.length,
        }),
      );
    }
  },
);
