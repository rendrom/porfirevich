const assert = require("node:assert/strict");
const { test } = require("node:test");
const puppeteer = require("puppeteer");

const origin = process.env.SMOKE_URL;
for (const mobile of [false, true]) {
  test(
    `built site: models, settings, variants, saved story and navigation (${mobile ? "mobile" : "desktop"})`,
    { skip: !origin },
    async (t) => {
      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_PATH,
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      t.after(() => browser.close());
      const page = await browser.newPage();
      if (mobile)
        await page.setViewport({
          width: 390,
          height: 844,
          isMobile: true,
          hasTouch: true,
        });
      const errors = [];
      const requests = [];
      let failModels = true;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("dialog", (dialog) => dialog.accept());
      await page.setRequestInterception(true);
      page.on("request", async (request) => {
        const url = new URL(request.url());
        const json = (body) =>
          request.respond({
            status: 200,
            contentType: "application/json",
            headers: { "access-control-allow-origin": "*" },
            body: JSON.stringify(body),
          });
        if (url.pathname === "/models") {
          if (failModels)
            return request.respond({
              status: 503,
              headers: { "access-control-allow-origin": "*" },
              body: "Unavailable",
            });
          return json(["lawa", "original", "gpt3"]);
        }
        if (url.pathname === "/generate/" && request.method() === "OPTIONS")
          return request.respond({
            status: 204,
            headers: {
              "access-control-allow-origin": "*",
              "access-control-allow-headers": "content-type",
            },
          });
        if (url.pathname === "/generate/") {
          requests.push(JSON.parse(request.postData()));
          return json({ replies: [" Первый.", " Второй.", " Третий."] });
        }
        if (url.pathname === "/api/story/test_story")
          return json({
            id: "test_story",
            content: JSON.stringify([
              ["Сохранённая история\nВторая строка", 0],
            ]),
            likesCount: 0,
          });
        if (url.origin !== new URL(origin).origin) return request.abort();
        return request.continue();
      });
      await page.goto(origin, { waitUntil: "networkidle0" });
      await page.waitForSelector("#editorjs");
      await page.type("#editorjs", "Облако");
      assert.equal(await page.$eval(".transform-btn", (b) => b.disabled), true);
      failModels = false;
      const retry = await page.$("::-p-text(Повторить)");
      assert(
        retry,
        "model list failure should offer retry without losing the editor",
      );
      await retry.click();
      await page.waitForFunction(
        () => !document.querySelector(".transform-btn").disabled,
      );
      await page.click(".transform-btn");
      await page.waitForSelector("#editorjs .active-text");
      assert.equal(requests[0].model, "original");
      assert.equal(requests[0].prompt, "Облако");
      await page.click(".transform-btn");
      await page.waitForFunction(
        () =>
          document.querySelector("#editorjs").textContent === "Облако Второй.",
      );
      assert.equal(requests.length, 1, "variants reuse the same response");
      await page.click(".settings-dropdown .dropdown-trigger button");
      const slider = await page.waitForSelector(
        ".settings-control .b-slider-thumb",
        { visible: true },
      );
      assert(slider, "updated component library still renders sliders");
      await slider.focus();
      await page.waitForFunction(
        () => document.activeElement.classList.contains("b-slider-thumb"),
        { timeout: 5000 },
      );
      await page.keyboard.press("ArrowLeft");
      await page.waitForFunction(
        () =>
          JSON.parse(localStorage.getItem("transformerSettings") || "{}")
            .tokens < 150,
        { timeout: 5000 },
      );
      await page.keyboard.press("Escape");
      await page.waitForSelector(".settings-dropdown .dropdown-menu", {
        hidden: true,
      });
      await page.click(".transform-btn");
      await page
        .waitForFunction(
          () =>
            document.querySelectorAll("#editorjs .active-text").length === 1,
          { timeout: 5000 },
        )
        .catch(async (error) => {
          throw new Error(
            error.message +
              JSON.stringify({
                requests,
                errors,
                state: await page.evaluate(() => ({
                  text: document.querySelector("#editorjs").textContent,
                  settings: localStorage.getItem("transformerSettings"),
                  button: document.querySelector(".transform-btn").outerHTML,
                  activeElement: document.activeElement.outerHTML.slice(0, 500),
                })),
              }),
          );
        });
      await page
        .waitForFunction(
          () =>
            document.querySelector("#editorjs").textContent ===
            "Облако Второй. Третий.",
          { timeout: 5000 },
        )
        .catch(async (error) => {
          throw new Error(
            error.message +
              JSON.stringify({
                requests,
                errors,
                state: await page.evaluate(() => ({
                  text: document.querySelector("#editorjs").textContent,
                  settings: localStorage.getItem("transformerSettings"),
                })),
              }),
          );
        });
      assert.equal(
        await page.$eval(
          "body",
          (b) => b.querySelectorAll(".active-text").length,
        ),
        1,
      );
      await page.goto(origin + "/test_story", { waitUntil: "networkidle0" });
      await page.waitForFunction(
        () =>
          document.querySelector("#editorjs")?.textContent ===
          "Сохранённая история\nВторая строка",
      );
      assert.equal(new URL(page.url()).pathname, "/test_story");
      await page.evaluate(() => {
        history.pushState({}, "", "/about");
        dispatchEvent(new PopStateEvent("popstate"));
      });
      await page.waitForFunction(() => !document.querySelector("#editorjs"));
      await page.evaluate(() => {
        history.pushState({}, "", "/");
        dispatchEvent(new PopStateEvent("popstate"));
      });
      await page.waitForSelector("#editorjs");
      await page.type("#editorjs", "Новая история");
      await page.click(".transform-btn");
      await page.waitForSelector("#editorjs .active-text");
      assert.deepEqual(errors, []);
    },
  );
}
