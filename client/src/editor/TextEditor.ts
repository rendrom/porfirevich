import { PRIMARY_COLOR } from '@/config';
import { Scheme } from '@shared/types/Scheme';

import './TextEditor.scss';

interface TextEditorOptions {
  onTextChange?: () => void;
}

export class TextEditor {
  private editor: HTMLElement;
  private onTextChange?: () => void;
  private apiColor = PRIMARY_COLOR;
  private userColor = '#4a4a4a';
  private id = 0;
  private readonly activeTextClass = 'active-text';
  private observer!: MutationObserver;
  private isComposing = false; // Flag to track text composition (important for mobile keyboards)

  constructor(containerId: string, { onTextChange }: TextEditorOptions = {}) {
    this.editor = document.querySelector(containerId) as HTMLElement;
    this.onTextChange = onTextChange;
    this.initializeEditor();
  }

  focus(): void {
    this.editor.focus();
  }

  getText(excludeActive = true): string {
    let str = this.editor.textContent || '';
    if (excludeActive) {
      const activeBlocks = this.editor.querySelectorAll(
        `.${this.activeTextClass}`
      );
      for (const b of activeBlocks) {
        if (b.textContent) {
          str = str.replace(b.textContent, '');
        }
      }
    }
    return str;
  }

  getTextBeforeSelection(): string {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return this.editor.textContent || '';
    }

    const range = selection.getRangeAt(0);

    // if the caret isn’t inside our editor, return the full editor text
    if (!this.editor.contains(range.startContainer)) {
      return this.editor.textContent || '';
    }

    const preRange = document.createRange();
    preRange.selectNodeContents(this.editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString();
  }

  getLength(): number {
    return this.getText().length;
  }

  clearSelection(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  clean(): void {
    this.editor.innerHTML = '';
  }

  setPlaceHolder(val: string): void {
    this.editor.setAttribute('data-placeholder', val);
    this.editor.addEventListener('focus', () => {
      if (this.editor.textContent === val) {
        this.editor.textContent = '';
      }
    });
    this.editor.addEventListener('blur', () => {
      if (this.editor.textContent === '') {
        this.editor.textContent = val;
      }
    });
  }

  setContents(scheme: Scheme, isApi = true): void {
    this.clean();
    scheme.forEach(([text, type]) => {
      const span = this.createTextBlock(text, type === 1);
      this.editor.appendChild(span);
    });
  }

  getContents(): Scheme {
    const contents: Scheme = [];

    const processNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.nodeName === 'DIV') {
          contents.push(['\n', 0]);
          element.childNodes.forEach(processNode);
        } else if (element.nodeName === 'SPAN') {
          const text = element.textContent || '';
          const type = element.getAttribute('data-type') === '1' ? 1 : 0;
          contents.push([text, type]);
        }
      }
    };

    this.editor.childNodes.forEach(processNode);
    return contents;
  }

  getHtmlStr(): string {
    return this.editor.innerHTML;
  }

  insertText(
    userInput: string,
    {
      isApi = false,
      silent = false,
      isActive = false,
      atCurrentSelection = false, // If true, insert at the current cursor position
    }: {
      isApi?: boolean;
      silent?: boolean;
      isActive?: boolean;
      atCurrentSelection?: boolean;
    } = {}
  ): Element {
    if (silent) this.disconnectObserver();

    let span: HTMLElement;
    if (atCurrentSelection) {
      span = this.insertPlainText(userInput, isApi);
    } else {
      span = this.createTextBlock(userInput, isApi);
      const lastSpan = Array.from(this.editor.querySelectorAll('span')).pop();
      // If the last span contains only a <br>, replace it; otherwise, insert after it.
      if (lastSpan) {
        if (
          lastSpan.childNodes.length === 1 &&
          lastSpan.firstChild?.nodeName === 'BR'
        ) {
          lastSpan.replaceWith(span);
        } else {
          lastSpan.after(span);
        }
      } else {
        this.editor.appendChild(span);
      }
    }

    if (isActive) {
      this.removeActiveBlocks();
      span.classList.add(this.activeTextClass);
    }

    this.setCursorAfter(span);

    if (silent) this.connectObserver();

    return span;
  }

  setCursorToEnd() {
    if (this.editor.lastChild) {
      this.setCursorAfter(this.editor.lastChild);
    }
  }

  setCursorAfter(node: Node) {
    const selection = window.getSelection();
    if (selection) {
      const newRange = document.createRange();
      newRange.setStartAfter(node);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  getBlockText(selectors: string): string | null {
    const block = this.editor.querySelector(selectors);
    return block ? block.textContent : null;
  }

  removeActiveBlocks() {
    const blocks = this.editor.querySelectorAll(`.${this.activeTextClass}`);
    for (const b of blocks) {
      b.classList.remove(this.activeTextClass);
    }
  }

  deleteBlocks(selectors: string): void {
    const blocks = this.editor.querySelectorAll(selectors);
    for (const b of blocks) {
      b.parentElement?.removeChild(b);
    }
  }

  private setCursorToEndOfBlock(block: HTMLElement): void {
    const range = document.createRange();

    range.selectNodeContents(block);

    range.collapse(false);

    const sel = window.getSelection();
    if (!sel) return;

    sel.removeAllRanges();
    sel.addRange(range);
  }

  private isApiBlock(el: Node | null): el is HTMLElement {
    return el instanceof HTMLElement && el.getAttribute('data-type') === '1';
  }

  private isUserBlock(el: Node | null): el is HTMLElement {
    return el instanceof HTMLElement && el.getAttribute('data-type') === '0';
  }
  private isDataBlock(el: HTMLElement): el is HTMLElement {
    const type = el instanceof HTMLElement && el.getAttribute('data-type');
    return type === '0' || type === '1';
  }

  private disconnectObserver(): void {
    this.observer.disconnect();
  }

  private connectObserver(): void {
    this.observer.observe(this.editor, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private onChange() {
    if (this.onTextChange) {
      this.onTextChange();
    }
  }

  private initializeEditor(): void {
    if (!this.editor) {
      throw new Error('Editor element not found');
    }

    this.editor.contentEditable = 'true';
    this.editor.style.color = this.userColor;

    // Add mobile-friendly attributes
    this.editor.setAttribute('inputmode', 'text');
    this.editor.setAttribute('autocorrect', 'off');
    this.editor.setAttribute('autocomplete', 'off');
    this.editor.setAttribute('spellcheck', 'false');

    this.observer = new MutationObserver(() => {
      this.onChange();
    });
    this.connectObserver();

    this.editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text) {
        this.insertPlainText(text);
      }
      this.focus();
    });

    // Prevent native insertion so that all input is wrapped in our custom span blocks
    this.editor.addEventListener(
      'beforeinput',
      this.handleBeforeInput.bind(this)
    );

    // Handle composition events (for mobile keyboards)
    this.editor.addEventListener('compositionstart', () => {
      this.isComposing = true;
    });
    this.editor.addEventListener('compositionend', (e: CompositionEvent) => {
      this.isComposing = false;
    });

    // On mobile touch, ensure the editor is focused
    this.editor.addEventListener('touchstart', () => {
      if (document.activeElement !== this.editor) {
        this.focus();
      }
    });
  }
  private currentSelection(): {
    selection: Selection | null;
    range: Range | null;
    isApi: boolean;
    parentElement: HTMLElement | null;
  } {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return {
        selection: null,
        range: null,
        isApi: false,
        parentElement: null,
      };
    }

    const range = selection.getRangeAt(0);

    if (!this.editor.contains(range.startContainer)) {
      selection.removeAllRanges();
      return {
        selection: null,
        range: null,
        isApi: false,
        parentElement: null,
      };
    }

    const node = range.startContainer;
    const parentElement =
      node.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : (node as HTMLElement);

    const isApi = this.isApiBlock(parentElement);

    return { selection, range, isApi, parentElement };
  }

  private handleBeforeInput(e: InputEvent): void {
    // If a composition is in progress, let compositionend handle the input
    if (this.isComposing) return;

    if (e.inputType && e.inputType.startsWith('insert') && e.data) {
      e.preventDefault();
      this.insertPlainText(e.data);
    }
  }

  private createTextBlock(text: string, isApi = false): HTMLSpanElement {
    const block = document.createElement('span');
    block.id = `tb-${this.id++}`;
    block.textContent = text;
    block.style.color = isApi ? this.apiColor : this.userColor;
    block.style.fontWeight = isApi ? 'bold' : 'normal';
    block.setAttribute('data-type', isApi ? '1' : '0');
    return block;
  }

  private splitBlock({
    text,
    parentElement,
    offset,
    newIsApi,
    oldIsApi,
  }: {
    text: string;
    parentElement: HTMLElement;
    offset: number;
    oldIsApi?: boolean;
    newIsApi?: boolean;
  }): HTMLElement {
    const fullText = parentElement.textContent || '';
    const beforeText = fullText.slice(0, offset);
    const afterText = fullText.slice(offset);

    if (beforeText) {
      const beforeSpan = this.createTextBlock(beforeText, oldIsApi);
      parentElement.parentNode?.insertBefore(beforeSpan, parentElement);
    }

    const newSpan = this.createTextBlock(text, newIsApi);
    parentElement.parentNode?.insertBefore(newSpan, parentElement);

    if (afterText) {
      const afterSpan = this.createTextBlock(afterText, oldIsApi);
      parentElement.parentNode?.insertBefore(afterSpan, parentElement);
    }

    parentElement.remove();
    this.setCursorAfter(newSpan);
    return newSpan;
  }

  private insertSameInput({
    text,
    parentElement,
    offset,
  }: {
    text: string;
    parentElement: HTMLElement;
    offset: number;
  }) {
    const node = parentElement.firstChild as Text;
    const fullText = node?.nodeValue ?? '';
    const before = fullText.slice(0, offset);
    const after = fullText.slice(offset);
    const newText = before + text + after;
    parentElement.textContent = newText;

    const range = document.createRange();
    const sel = window.getSelection();
    const newOffset = offset + text.length;

    if (parentElement.firstChild instanceof Text) {
      range.setStart(parentElement.firstChild, newOffset);
    } else {
      range.selectNodeContents(parentElement);
      range.collapse(false);
    }
    sel?.removeAllRanges();
    sel?.addRange(range);
    return parentElement;
  }

  private deleteSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
  }

  private insertPlainText(text: string, fromApi = false): HTMLElement {
    const { selection, range, isApi, parentElement } = this.currentSelection();
    let span: HTMLElement;

    if (!selection || !range || !parentElement) {
      span = this.createTextBlock(text, fromApi);
      this.editor.appendChild(span);
      this.setCursorAfter(span);
    } else {
      this.deleteSelection();

      if (this.isDataBlock(parentElement)) {
        if (
          (!fromApi && this.isUserBlock(parentElement)) ||
          (fromApi && this.isApiBlock(parentElement))
        ) {
          span = this.insertSameInput({
            text,
            parentElement,
            offset: range.startOffset,
          });
        } else {
          span = this.splitBlock({
            text,
            parentElement,
            offset: range.startOffset,
            newIsApi: fromApi,
            oldIsApi: isApi,
          });
        }
      } else {
        span = this.createTextBlock(text, fromApi);
        range.insertNode(span);
        this.setCursorToEndOfBlock(span);
      }
    }

    this.focus();
    return span;
  }
}
