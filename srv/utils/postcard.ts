/* eslint-disable @typescript-eslint/no-use-before-define */
import path from 'path';
import puppeteer, { Page } from 'puppeteer';
import config from '../../config';
import { Scheme } from '../../src/interfaces';
import { escapeHtml } from '../../src/utils/escapeHtml';
import { Story } from '../entity/Story';

interface DomScreenshotOptions {
  selector: string;
  page: Page;
  path: string;
  padding?: number;
}

export async function postcard(story: Story) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreDefaultArgs: ['--disable-extensions']
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1300,
    height: 200000,
    deviceScaleFactor: 1
  });
  const postcardPath = path.join('media', story.id + '.png');
  await page.setContent(getHtml(story));
  await screenshotDOMElement({
    page,
    path: postcardPath,
    selector: '#postcard',
    padding: 0
  });
  await browser.close();
  return postcardPath;
}

async function screenshotDOMElement(opts: DomScreenshotOptions) {
  const padding = opts.padding !== undefined ? opts.padding : 0;
  const path = opts.path;
  const selector = opts.selector;
  const page = opts.page;

  if (!selector) throw Error('Please provide a selector.');

  const rect = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    return { left: x, top: y, width, height, id: element.id };
  }, selector);

  if (!rect)
    throw Error(`Could not find element that matches selector: ${selector}.`);

  return await page.screenshot({
    path,
    clip: {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    }
  });
}

function getHtml(story: Story) {
  let fontSize = 6;
  const site = config.site;
  const color = config.primaryColor;
  const content = JSON.parse(story.content) as Scheme;
  let length = 0;
  const text = content.reduce((a, b) => {
    let str = escapeHtml(b[0]);
    str = str.replace(/\n/g, '<br>');
    length += str.length;
    a += b[1] ? `<strong style="color:${color};">${str}</strong>` : str;
    return a;
  }, '');

  const textSizeFromLength: [number, number][] = [
    [100, 40],
    [1000, 36],
    [2000, 32],
    [3000, 28],
    [8000, 24],
    [16000, 12]
  ];
  const size = textSizeFromLength.find(x => x[0] > length);
  if (size) {
    fontSize = size[1];
  }
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <style>
    #postcard {
      width: 1200px;
      border: 1px solid rgba(0, 0, 0, .3);
    }

    p {
      padding: 0;
      margin: 0;
    }

    .content {
      padding:  10px 20px;
      font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
    }

    .left,
    .right {
      display: inline-block;
    }

    .right {
      padding-left: 30px;
      line-height: 50px;
      vertical-align: bottom;
    }

    .title {
      font-size: 30px;
      color:rgba(0, 0, 0, .7);
    }
    .subtitle {
      font-size: 30px;
      color: rgba(0, 0, 0, .5);
    }
    .story {
      margin: 10px 0 15px 0;
      font-size: 40px;
    }
  </style>
</head>

<body>
  <div id="postcard">
    <div class="content">
      <div class="story" style="font-size=${fontSize}px">
      ${text}
      </div>

      <div class="footer">
        <div class="left">
          <svg height="100px" clip-rule="evenodd" fill-rule="evenodd"
            image-rendering="optimizeQuality" shape-rendering="geometricPrecision" text-rendering="geometricPrecision"
            version="1.1" viewBox="0 0 5906.2 1135.8" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
            xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
            <metadata>
              <rdf:RDF>
                <cc:Work rdf:about="">
                  <dc:format>image/svg+xml</dc:format>
                  <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
                  <dc:title />
                </cc:Work>
              </rdf:RDF>
            </metadata>
            <defs>
              <style type="text/css">
                <![CDATA[
                .fil1 {
                  fill: #5371FF
                }

                .fil0 {
                  fill: #999A9B
                }

                .fil2 {
                  fill: #5371FF;
                  fill-rule: nonzero
                }
                ]]>
              </style>
            </defs>


            <path class="fil0"
              d="m933.39 558.63c5.14 16.82 11.95 30.76 19.54 42.86l9.05-91.19c-9.05-3.01-16.32-10.08-19.61-19.01h-232.31l220.96 12.62c-2.48 18.41-2.63 36.32 2.37 54.7v0.01zm-196.92-453.13c-0.91-6.93-3.32-13.64-7.11-19.67-13.46-21.34-40.86-29.04-63.46-19.2-6.45-2.83-13-5.44-19.61-7.77-48.95-17.22-101.06-23.92-152.81-22.17-49.34 1.67-98.6 10.98-145.48 26.5-14.48-5.72-31.21-4.66-44.95 3.4-9.18 5.39-16.32 13.46-20.47 23-82.66 39.72-159.45 102.44-203.75 183.62-2.68 1.02-5.29 2.27-7.77 3.73-22.24 13.06-30.65 40.73-19.74 63.47-1.32 4.72-2.51 9.49-3.58 14.27-6.49 28.89-8.21 59.23-5.78 88.7 5.25 63.58 31.28 133.4 85.89 170.64 43.42 29.61 94.06 31.14 143.05 15.62 8.22-2.6 15.69-5.69 23.11-9.24 10.91 5.92 23.77 7.68 35.93 4.9 1.37 2.3 2.71 4.71 4.31 7.37 5.62 9.39 11.98 16.22 21 22.51 39.21 27.29 111.87 8.25 151.16-12.03 14.3-7.38 27.53-16.34 39.98-26.43 9.04 1.12 18.29-0.06 26.89-3.53 22.74-9.19 35.8-32.58 32.26-55.8 42.07-47.77 78.88-93.52 138.39-122.74l2.9-1.42 2.34-2.21c6.19-5.84 24.05-8.41 32.2-9.84 21.19-3.71 41.2-7.72 59.41-20.06 2.79-1.9 5.53-3.86 8.22-5.93 9.06 0.02 18.06-2.37 26-7.04 22.78-13.38 31.05-42.1 18.91-65.13 11.41-85.39-89.36-172.8-157.43-217.51zm225.32 540.29c9.29 1.54 15.9 2.63 25.04-1.57 14.17 15.88 22.19 31.13 29.38 50.6 6.63 29.3-38.91 38.35-70.61 56.07-11.14 82.45 27.01 82.69-21.65 107.47 38.93 62.99-27.57 3.07-27.19 139.75 7.39 78.13-52.1 80.66-122.81 71.89-44.72-5.54-105.29-39.85-133.54-13.91-17.95 25.5-34.47 51.66-46.83 79.73l-417.06-171.28c63.11-131.29-112.69-264.96-153.93-407.77-73.87-206.29 30.32-482.36 359.47-545.42 286.26-54.86 537.68 95.18 567.38 328.79 7.22 56.86-6.06 100.6-14.29 140.32h5.29 16.68 7.84l1.15-11.63c0.44-4.29 4.21-7.48 8.5-7.1l8.3 0.75c11.76 1.05 20.65 11.54 19.46 23.29l-12.93 129.23c-1.35 13.51-10.84 27.9-27.65 30.8zm0 0z"
              paint-order="stroke" />
            <path class="fil1"
              d="m287.46 405.82c-8.56-0.98-16.6-5.62-21.43-13.28-3.17-5.03-4.51-10.63-4.19-16.09l-140.11-42.33c-2.32 3.65-5.56 6.84-9.62 9.23-4.41 2.59-9.26 3.92-14.1 4.07-1.7 5.66-3.19 11.38-4.5 17.16-23.84 106.21 26.25 264.54 162.98 221.27 12.13-3.85 22.85-9.75 33.77-15.53 1.78-6.92 6.29-13.2 13.09-17.2 1.38-0.81 2.8-1.5 4.24-2.06l-20.14-145.24zm158.19-166.33c0.18-4.36 1.38-8.63 3.56-12.45l-104.55-94.39c-0.18 0.12-0.36 0.22-0.54 0.33-11.81 6.93-26.7 4.79-35.94-4.39-82.46 38.48-152.7 98.59-190.55 170.99 1.58 1.53 3 3.26 4.21 5.19 0.42 0.67 0.81 1.37 1.18 2.06l322.64-67.34zm213.01-119.26c-0.71-2.15-1.13-4.37-1.27-6.58-9.9-4.81-19.01-8.71-26.95-11.5-84.78-29.83-182.98-24.26-272.38 6.35 0.09 4.89-1.14 9.72-3.57 14.01l104.55 94.39c0.18-0.12 0.35-0.22 0.54-0.33 10.94-6.43 24.54-5.06 33.83 2.48l165.24-98.81zm-1.45 174.21c4.97 2.26 9.34 5.91 12.41 10.79 2.24 3.53 3.56 7.36 4.03 11.22l148.4 18.8c2.25-5.45 6.27-10.27 11.87-13.55 4.1-2.4 8.56-3.72 13.02-4.01 10.51-60.19-74.28-135.52-147.57-180.76-3.59 1.74-7.4 2.68-11.22 2.9l-30.93 154.61zm-154.68-45.83 118.83 54.58c2.18-2.86 4.97-5.38 8.32-7.35 4.19-2.46 8.78-3.79 13.37-4.05l30.93-154.6c-2.81-1.28-5.44-3.01-7.75-5.16l-164.43 98.34c2.4 5.96 2.55 12.37 0.73 18.23zm-3.24 158.37c5 0.39 9.83 2.19 13.82 5.22l105.04-81.12c-2.58-5.69-3.07-11.87-1.67-17.63l-119.51-54.88c-1.99 2.3-4.38 4.31-7.16 5.94-3.8 2.24-7.91 3.52-12.07 3.94l21.54 138.53zm-14.51 3.01c0.97-0.51 1.94-0.95 2.93-1.34l-22-141.43c-6.38-2-12.08-6.13-15.85-12.1-0.42-0.67-0.81-1.37-1.18-2.06l-322.64 67.34-0.01 0.45 140.09 42.33c2.34-3.64 5.57-6.83 9.63-9.21 13.71-8.06 31.6-3.86 39.94 9.38 3.27 5.19 4.59 11.01 4.16 16.63l154.71 40.02c2.26-4.08 5.72-7.6 10.22-10.02zm49.14 130.65-35.59-84.12c-9.43 0.39-18.73-4.27-23.6-12.78-2.32-4.07-3.36-8.5-3.2-12.81l-154.85-40.06c-2.37 4.41-5.98 8.28-10.7 11.05-1.38 0.8-2.79 1.48-4.23 2.05l20.13 145.24c8.57 0.99 16.6 5.63 21.43 13.29 2.34 3.71 3.67 7.73 4.1 11.77 20.4 17.55 22.73 34.83 34.96 43.34 21.14 14.73 80.57-4.04 102.22-15.21 13.91-7.18 26.65-16.25 38.73-26.59-5.01-12.91-0.4-27.19 10.61-35.19v0.01zm-24.25-87.21 34.76 82.18c6.26-1.71 12.73-1.46 18.6 0.44 42.6-47.39 85.06-104.23 156.8-141.02 28.34-23.19 68.58-14.41 94.31-31.81 2.99-2.02 5.74-4.1 8.29-6.22-1.18-2.58-1.93-5.26-2.26-7.96l-148.39-18.8c-2.26 5.45-6.29 10.27-11.88 13.54-11.38 6.7-25.66 4.93-34.95-3.45l-104.52 80.7c5.82 11.76 1.2 26.02-10.76 32.4zm-173 145.56c16.08 16.26 13.29 26.39 30.81 38.59 30.81 21.44 96.41 3.39 129.12-13.48 16.15-8.33 30.67-18.84 44.29-30.74 7.52 3 16.25 3.24 24.36-0.05 16.16-6.52 23.77-24.46 17.01-40.05-0.18-0.42-0.38-0.85-0.58-1.25 42.54-47.66 83.81-102.71 152.81-136.61 20.24-19.08 63.46-11.14 94.28-32.03 4.97-3.37 9.46-6.84 13.54-10.38 7.19 1.65 15.02 0.67 21.85-3.33 13.71-8.06 18.06-25.32 9.71-38.58-0.78-1.22-1.64-2.38-2.58-3.46 16.74-71.34-73.14-158.5-156.33-210.51 1.32-6.62 0.19-13.7-3.72-19.89-8.35-13.24-26.23-17.45-39.94-9.38-1.47 0.86-2.84 1.84-4.08 2.9-9.92-4.71-19.35-8.65-28.03-11.7-91.67-32.27-197.31-26.11-292.96 7.35-9.21-6.53-21.95-7.45-32.33-1.35-7.69 4.51-12.43 11.93-13.64 19.91-89.82 41.2-166.28 106.85-206.87 186.56-3.94 0.48-7.86 1.75-11.48 3.88-13.73 8.05-18.07 25.32-9.72 38.57 0.73 1.17 1.53 2.26 2.4 3.27-2.3 7.29-4.29 14.68-5.96 22.14-28.11 125.23 37.96 299.82 195.82 249.85 13.31-4.21 22.56-9.04 31.81-14.03 9.08 10.43 24.92 13.2 37.34 5.9 1.09-0.65 2.12-1.34 3.08-2.08zm0 0z"
              paint-order="stroke" />
            <path class="fil2"
              d="m1187.1 292.19h420.11v535.23h-71.01v-472.44h-278.08v472.44h-71.02v-535.23zm503.71 341.25c0-71.64 19.93-124.71 59.92-159.23 33.27-28.65 74.01-42.98 121.97-42.98 53.2 0 96.8 17.45 130.69 52.33 33.76 34.76 50.71 82.97 50.71 144.4 0 49.83-7.48 88.96-22.43 117.48-14.95 28.54-36.76 50.71-65.42 66.54-28.52 15.82-59.8 23.67-93.56 23.67-54.32 0-98.17-17.33-131.68-52.08-33.51-34.76-50.21-84.85-50.21-150.13zm67.28 0.12c0 49.58 10.83 86.71 32.51 111.26 21.8 24.67 49.09 37 82.1 37 32.64 0 59.8-12.33 81.6-37.12 21.68-24.79 32.53-62.54 32.53-113.26 0-47.84-10.97-84.09-32.77-108.63-21.8-24.67-48.96-37.01-81.36-37.01-33.01 0-60.3 12.22-82.1 36.76-21.68 24.53-32.51 61.54-32.51 111zm373.14 342.63v-536.73h59.8v50.96c14.08-19.68 30.03-34.52 47.84-44.36 17.69-9.84 39.25-14.82 64.53-14.82 33.14 0 62.3 8.48 87.58 25.55 25.3 16.94 44.36 40.98 57.32 71.88 12.83 31.02 19.31 64.91 19.31 101.91 0 39.5-7.1 75.13-21.31 106.9-14.2 31.64-34.88 55.94-62.04 72.88-27.04 16.82-55.56 25.3-85.46 25.3-21.93 0-41.61-4.61-58.93-13.83-17.45-9.22-31.64-20.81-42.86-34.89v189.26h-65.78zm59.8-340.38c0 49.71 10.09 86.47 30.15 110.26 20.19 23.79 44.6 35.75 73.26 35.75 29.16 0 54.07-12.33 74.75-37 20.81-24.66 31.15-62.79 31.15-114.49 0-49.34-10.09-86.22-30.4-110.75-20.31-24.54-44.49-36.76-72.63-36.76-27.91 0-52.59 13.09-74.01 39.13-21.55 26.16-32.27 64.03-32.27 113.87zm581.7-343.61h65.78v185.39c13.58-15.57 28.54-27.16 44.85-34.88 16.2-7.6 33.76-11.47 52.46-11.47 45.84 0 82.23 19.19 109.14 57.44 26.78 38.25 40.24 86.34 40.24 144.4 0 60.54-14.46 109.39-43.36 146.64s-64.91 55.94-107.89 55.94c-14.08 0-28.41-2.25-42.98-6.6-14.59-4.37-32.02-16.33-52.46-35.76v182.9h-65.78v-182.9c-13.08 14.08-27.65 24.67-43.6 31.77s-33.14 10.59-51.7 10.59c-40.61 0-76.13-17.82-106.53-53.33-30.4-35.63-45.59-86.6-45.59-152.87 0-56.19 13.7-103.16 41.24-141.16 27.53-38 64.4-57.06 110.88-57.06 19.55 0 37.13 3.86 52.95 11.47 15.82 7.72 29.9 19.31 42.36 34.88v-185.39zm65.41 342.86c0 58.31 7.98 97.43 24.05 117.48 15.95 20.06 36 30.03 60.05 30.03 26.66 0 49.47-12.34 68.28-37 18.81-24.54 28.16-62.92 28.16-114.87 0-48.96-8.72-85.59-26.04-109.63-17.32-24.05-39.62-36.01-66.78-36.01-29.16 0-50.96 12.45-65.65 37.51-14.7 25.04-22.06 62.53-22.06 112.49zm-245.55-7.48c0 54.69 9.22 94.07 27.52 118.11 18.32 24.05 40.99 36.13 68.16 36.13 28.41 0 49.7-11.96 63.78-35.88 13.96-23.92 21.06-59.92 21.06-107.76 0-51.08-7.36-89.33-22.18-114.87-14.82-25.55-37.13-38.25-67.03-38.25-26.91 0-48.84 12.45-65.9 37.38-16.95 24.92-25.42 59.93-25.42 105.15zm569.48-188.13h65.78v295.9l182.77-295.9h70.64v387.97h-65.78v-294.03l-182.53 294.03h-70.89v-387.97zm417.61 536.73v-536.73h59.8v50.96c14.08-19.68 30.03-34.52 47.84-44.36 17.69-9.84 39.25-14.82 64.53-14.82 33.14 0 62.3 8.48 87.58 25.55 25.3 16.94 44.36 40.98 57.32 71.88 12.83 31.02 19.31 64.91 19.31 101.91 0 39.5-7.1 75.13-21.31 106.9-14.2 31.64-34.88 55.94-62.04 72.88-27.04 16.82-55.56 25.3-85.46 25.3-21.93 0-41.61-4.61-58.93-13.83-17.45-9.22-31.64-20.81-42.86-34.89v189.26h-65.78zm59.8-340.38c0 49.71 10.09 86.47 30.15 110.26 20.19 23.79 44.6 35.75 73.26 35.75 29.16 0 54.07-12.33 74.75-37 20.81-24.66 31.15-62.79 31.15-114.49 0-49.34-10.09-86.22-30.4-110.75-20.31-24.54-44.49-36.76-72.63-36.76-27.91 0-52.59 13.09-74.01 39.13-21.55 26.16-32.27 64.03-32.27 113.87zm354.46-196.36h65.78v151.75h83.23c54.32 0 96.05 10.47 125.45 31.53 29.28 21.05 43.98 50.08 43.98 87.08 0 32.4-12.21 60.05-36.75 83.1-24.42 23.05-63.55 34.52-117.37 34.52h-164.33v-387.97zm65.78 334.15h69.27c41.74 0 71.52-5.11 89.34-15.33 17.81-10.22 26.78-26.16 26.78-47.84 0-16.82-6.6-31.77-19.81-44.97-13.21-13.09-42.36-19.69-87.58-19.69h-77.99v127.83zm589.8-71.76 68.03 8.97c-10.59 39.5-30.41 70.27-59.31 92.07s-65.78 32.77-110.76 32.77c-56.56 0-101.42-17.45-134.55-52.34-33.14-34.75-49.7-83.72-49.7-146.63 0-65.04 16.69-115.61 50.21-151.49 33.51-36.01 76.99-53.95 130.43-53.95 51.7 0 93.94 17.56 126.71 52.82 32.76 35.26 49.21 84.85 49.21 148.76 0 3.86-0.13 9.71-0.38 17.43h-288.91c2.48 42.49 14.44 75.13 36.13 97.68 21.55 22.54 48.58 33.88 80.85 33.88 24.05 0 44.6-6.35 61.54-19.06 17.07-12.7 30.52-33.01 40.5-60.92zm-215.29-105.41h216.04c-2.87-32.63-11.22-57.06-24.8-73.38-20.8-25.3-47.96-38-81.23-38-30.15 0-55.43 10.09-76 30.28-20.42 20.18-31.76 47.22-34.01 81.1zm366.42-156.98h151.38c37.13 0 64.78 3.12 82.97 9.35 18.07 6.23 33.64 17.56 46.59 34.14 13.09 16.69 19.57 36.51 19.57 59.67 0 18.56-3.86 34.76-11.47 48.47-7.72 13.83-19.18 25.42-34.63 34.65 18.19 6.1 33.27 17.43 45.36 34.13 11.96 16.58 17.94 36.39 17.94 59.18-2.38 36.76-15.57 64.04-39.38 81.73-23.79 17.82-58.42 26.66-103.78 26.66h-174.54v-387.97zm65.78 163.71h69.77c27.78 0 46.97-1.5 57.31-4.36 10.47-2.99 19.81-8.85 28.03-17.82 8.23-8.84 12.34-19.55 12.34-32.02 0-20.55-7.23-34.76-21.55-42.85-14.46-8.1-39.12-12.09-74-12.09h-71.89v109.14zm0 170.44h86.34c37.13 0 62.67-4.36 76.49-12.96 13.83-8.72 21.06-23.54 21.81-44.85 0-12.33-3.99-23.92-11.96-34.5-8.1-10.59-18.56-17.32-31.4-20.06-12.84-2.87-33.51-4.24-61.92-4.24h-79.37v116.61zm331.41-334.15h65.78v295.9l182.77-295.9h70.64v387.97h-65.78v-294.03l-182.53 294.03h-70.89v-387.97zm392.95 0h65.78v73.26c0 31.65 1.86 54.58 5.72 68.77 3.74 14.21 12.83 26.66 27.29 37.26 14.33 10.58 32.4 15.82 54.2 15.82 24.92 0 57.06-6.6 96.68-19.68v-175.43h65.78v387.97h-65.78v-156.6c-40.5 12.7-78.37 19.06-113.51 19.06-29.52 0-55.56-7.48-78.12-22.43-22.54-14.95-37.87-33.27-45.97-54.94-8.1-21.68-12.08-45.48-12.08-71.52v-101.55z" />
          </svg>
        </div>
        <div class="right">
          <div class="title">написано с помощью нейронной сети</div>
          <div class="subtitle">${site}</div>
        </div>
      </div>
    </div>
  </div>
</body>

</html>
`;
}
