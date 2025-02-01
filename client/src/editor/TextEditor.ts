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
      return '';
    }
    const range = selection.getRangeAt(0);
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

    const span = this.createTextBlock(userInput, isApi);
    if (isActive) {
      this.removeActiveBlocks();
      span.classList.add(this.activeTextClass);
    }

    if (atCurrentSelection) {
      // Get the current selection range and insert the new span there.
      const { range } = this.currentSelection();
      if (range) {
        range.insertNode(span);
      } else {
        this.editor.appendChild(span);
      }
    } else {
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

  private currentSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { isApi: false, selection };
    }

    const range = selection.getRangeAt(0);
    const currentNode = range.startContainer;
    const parentElement =
      currentNode.nodeType === Node.TEXT_NODE
        ? currentNode.parentElement
        : (currentNode as HTMLElement);

    const isApi =
      parentElement &&
      parentElement instanceof HTMLElement &&
      parentElement.getAttribute('data-type') === '1';

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

  private splitApiBlock({
    text,
    parentElement,
    offset,
  }: {
    text: string;
    parentElement: Node;
    offset: number;
  }): void {
    const fullText = parentElement.textContent || '';
    const textBeforeCursor = fullText.slice(0, offset);
    const textAfterCursor = fullText.slice(offset);

    if (textBeforeCursor) {
      const firstBlueSpan = this.createTextBlock(textBeforeCursor, true);
      parentElement.parentNode?.insertBefore(firstBlueSpan, parentElement);
    }

    const userInputSpan = this.createTextBlock(text);
    parentElement.parentNode?.insertBefore(userInputSpan, parentElement);

    if (textAfterCursor) {
      const secondBlueSpan = this.createTextBlock(textAfterCursor, true);
      parentElement.parentNode?.insertBefore(secondBlueSpan, parentElement);
    }
    parentElement.parentNode?.removeChild(parentElement);
    this.setCursorAfter(userInputSpan);
  }

  private deleteSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
  }

  private insertPlainText(text: string): void {
    const { selection, range, isApi, parentElement } = this.currentSelection();
    if (!selection || !range || !parentElement) {
      const span = this.createTextBlock(text);
      this.editor.appendChild(span);
      this.setCursorAfter(span);
    } else {
      // Delete any currently selected content
      this.deleteSelection();
      if (parentElement.classList.contains(this.activeTextClass)) {
        // If the current block is active, insert a new user text block immediately after it
        // to preserve the active block without appending user text inside it.
        const span = this.createTextBlock(text, false);
        parentElement.parentNode?.insertBefore(span, parentElement.nextSibling);
        this.setCursorAfter(span);
      } else if (isApi) {
        // If insertion is inside an API block, split the block so that the new text is user styled
        this.splitApiBlock({ parentElement, text, offset: range.startOffset });
      } else {
        // Otherwise, insert a new span with user styling
        const span = this.createTextBlock(text, false);
        range.insertNode(span);
        // Update the selection: place the cursor after the inserted node
        range.selectNodeContents(span);
        range.collapse(false);
        const newSelection = window.getSelection();
        if (newSelection) {
          newSelection.removeAllRanges();
          newSelection.addRange(range);
        }
        this.setCursorAfter(span);
      }
    }
    this.focus();
  }
}
