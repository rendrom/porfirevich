import { ToastProgrammatic as Toast } from 'buefy';

import { SITE } from '../config';

import { stripHtml } from './stripHtml';

import type { Story } from '@shared/types/Story';

export type CopyType = 'html' | 'text' | 'quote';

export function copyToClipboard(str: string) {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  let selection = document.getSelection();
  const selected =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
  el.select();
  try {
    document.execCommand('copy');
    Toast.open({
      message: 'Копирование завершено',
      type: 'is-success',
      position: 'is-bottom',
    });
  } catch (err) {
    Toast.open({
      message: 'Не удаётся скоприовать историю',
      type: 'is-danger',
      position: 'is-bottom',
    });
  }

  document.body.removeChild(el);
  if (selected) {
    selection = document.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(selected);
    }
  }
}

export function copyStory(
  content: string,
  type: CopyType = 'text',
  story?: Story | null
) {
  if (type === 'text' || type === 'quote') {
    content = stripHtml(content);
  }
  if (type === 'quote') {
    const link = SITE + (story && story.id ? '/' + story.id : '');
    content = `«${content}»\r\nнаписано с помощью нейронной сети\r\n#порфирьевич\r\n${link}`;
  }
  copyToClipboard(content);
}
