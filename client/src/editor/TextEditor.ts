import { Scheme } from '@shared/types/Scheme';

import './TextEditor.css';

interface TextEditorOptions {
  onTextChange?: () => void;
}

export class TextEditor {
  private editor: HTMLElement;
  private onTextChange?: () => void;
  private id = 0;
  private readonly activeTextClass = 'active-text';
  private observer!: MutationObserver;
  private isComposing = false; // Flag to track text composition (important for mobile keyboards)
  private savedRange?: Range;
  private readonly listeners = new AbortController();

  constructor(containerId: string, { onTextChange }: TextEditorOptions = {}) {
    this.editor = document.querySelector(containerId) as HTMLElement;
    this.onTextChange = onTextChange;
    this.initializeEditor();
  }

  focus(): void {
    this.editor.focus();
  }

  getText(excludeActive = true): string {
    return this.readContents(this.editor, excludeActive)
      .map(([text]) => text)
      .join('');
  }

  getTextBeforeSelection(blockSelector?: string): string {
    const range = this.captureSelection();
    const preRange = document.createRange();
    preRange.selectNodeContents(this.editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    const block = blockSelector && this.editor.querySelector(blockSelector);
    if (block) preRange.setEndBefore(block);
    return this.readContents(preRange.cloneContents(), true)
      .map(([text]) => text)
      .join('');
  }

  private containsRange(range: Range): boolean {
    return this.editor.contains(range.startContainer) && this.editor.contains(range.endContainer);
  }

  captureSelection(): Range {
    const selection = window.getSelection();
    if (selection?.rangeCount && this.containsRange(selection.getRangeAt(0))) {
      this.savedRange = selection.getRangeAt(0).cloneRange();
    }
    if (this.savedRange && this.containsRange(this.savedRange)) return this.savedRange.cloneRange();
    const range = document.createRange();
    range.selectNodeContents(this.editor);
    range.collapse(false);
    return range;
  }

  restoreSelection(range: Range): void {
    if (!this.containsRange(range)) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.savedRange = range.cloneRange();
  }

  destroy(): void {
    this.observer.disconnect();
    this.listeners.abort();
    this.savedRange = undefined;
  }

  clean(): void {
    this.disconnectObserver();
    this.editor.innerHTML = '';
    this.savedRange = undefined;
    this.connectObserver();
  }

  setPlaceHolder(val: string): void {
    this.editor.setAttribute('data-placeholder', val);
  }

  setContents(scheme: Scheme): void {
    this.clean();
    this.disconnectObserver();
    scheme.forEach(([text, type]) => {
      const span = this.createTextBlock(text, type === 1);
      this.editor.appendChild(span);
    });
    this.connectObserver();
  }

  getContents(): Scheme {
    return this.readContents(this.editor);
  }

  private readContents(root: Node, excludeActive = false): Scheme {
    const contents: Scheme = [];
    const append = (text: string, type: 0 | 1) => {
      if (!text) return;
      const last = contents.at(-1);
      if (last?.[1] === type) last[0] += text;
      else contents.push([text, type]);
    };
    const processNode = (node: Node, type: 0 | 1 = 0) => {
      if (node.nodeType === Node.TEXT_NODE) {
        append(node.textContent || '', type);
        return;
      }
      const element = node as HTMLElement;
      if (excludeActive && element.classList?.contains(this.activeTextClass)) return;
      if (element.nodeName === 'BR') {
        append('\n', type);
        return;
      }
      const isBlock = element.nodeName === 'DIV' || element.nodeName === 'P';
      if (isBlock && contents.length && !contents.at(-1)?.[0].endsWith('\n'))
        append('\n', 0);
      const dataType = element.getAttribute?.('data-type');
      const childType = dataType === '1' ? 1 : dataType === '0' ? 0 : type;
      node.childNodes.forEach((child) => processNode(child, childType));
      if (isBlock && node.nextSibling && !contents.at(-1)?.[0].endsWith('\n'))
        append('\n', 0);
    };
    root.childNodes.forEach((node) => processNode(node));
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
      selection,
    }: {
      isApi?: boolean;
      silent?: boolean;
      isActive?: boolean;
      atCurrentSelection?: boolean;
      selection?: Range;
    } = {}
  ): Element {
    if (silent) this.disconnectObserver();
    if (selection) this.restoreSelection(selection);

    let span: HTMLElement;
    if (atCurrentSelection) {
      span = this.insertPlainText(userInput, isApi);
    } else {
      span = this.createTextBlock(userInput, isApi);
      this.editor.appendChild(span);
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
      this.savedRange = newRange.cloneRange();
    }
  }

  removeActiveBlocks() {
    const blocks = this.editor.querySelectorAll(`.${this.activeTextClass}`);
    for (const b of blocks) {
      b.classList.remove(this.activeTextClass);
    }
  }

  deleteBlocks(selectors: string): void {
    this.disconnectObserver();
    const blocks = this.editor.querySelectorAll(selectors);
    if (blocks[0]) {
      const range = document.createRange();
      range.setStartBefore(blocks[0]);
      range.collapse(true);
      this.restoreSelection(range);
    }
    for (const b of blocks) {
      b.parentElement?.removeChild(b);
    }
    this.connectObserver();
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

    // Add mobile-friendly attributes
    this.editor.setAttribute('inputmode', 'text');
    this.editor.setAttribute('autocorrect', 'off');
    this.editor.setAttribute('autocomplete', 'off');
    this.editor.setAttribute('spellcheck', 'false');

    this.observer = new MutationObserver(() => {
      if (!this.isComposing) this.onChange();
    });
    this.connectObserver();

    const options = { signal: this.listeners.signal };
    document.addEventListener('selectionchange', () => this.captureSelection(), options);
    this.editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text) {
        this.insertPlainText(text);
      }
      this.focus();
    }, options);

    // Prevent native insertion so that all input is wrapped in our custom span blocks
    this.editor.addEventListener(
      'beforeinput',
      this.handleBeforeInput.bind(this),
      options
    );

    // Handle composition events (for mobile keyboards)
    this.editor.addEventListener('compositionstart', () => {
      this.isComposing = true;
    }, options);
    this.editor.addEventListener('compositionend', () => {
      this.isComposing = false;
      this.onChange();
    }, options);

    // On mobile touch, ensure the editor is focused
    this.editor.addEventListener('touchstart', () => {
      if (document.activeElement !== this.editor) {
        this.focus();
      }
    }, options);
  }
  private currentSelection(): {
    selection: Selection | null;
    range: Range | null;
    isApi: boolean;
    parentElement: HTMLElement | null;
  } {
    this.restoreSelection(this.captureSelection());
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
    if (this.isComposing || e.isComposing || !e.cancelable) return;

    if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') {
      e.preventDefault();
      this.insertPlainText('\n');
      return;
    }

    if (e.inputType && e.inputType.startsWith('insert') && e.data) {
      e.preventDefault();
      this.insertPlainText(e.data);
    }
  }

  private createTextBlock(text: string, isApi = false): HTMLSpanElement {
    const block = document.createElement('span');
    block.id = `tb-${this.id++}`;
    block.textContent = text;
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
    const fullText = parentElement.textContent || '';
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

  private insertPlainText(text: string, fromApi = false): HTMLElement {
    const { selection, range: selectedRange, parentElement } = this.currentSelection();
    let span: HTMLElement;

    if (!selection || !selectedRange || !parentElement) {
      span = this.createTextBlock(text, fromApi);
      this.editor.appendChild(span);
      this.setCursorAfter(span);
    } else {
      selectedRange.deleteContents();
      // Deleting a multi-block selection can change both the container and offset.
      const { range, isApi, parentElement } = this.currentSelection();
      if (!range || !parentElement) throw new Error('Editor selection was lost');
      const prefix = document.createRange();
      prefix.selectNodeContents(parentElement);
      prefix.setEnd(range.startContainer, range.startOffset);
      const offset = prefix.toString().length;

      if (this.isDataBlock(parentElement)) {
        if (!fromApi && this.isUserBlock(parentElement)) {
          span = this.insertSameInput({
            text,
            parentElement,
            offset,
          });
        } else {
          span = this.splitBlock({
            text,
            parentElement,
            offset,
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
