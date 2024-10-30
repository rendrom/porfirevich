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

  constructor(containerId: string, { onTextChange }: TextEditorOptions = {}) {
    this.editor = document.querySelector(containerId) as HTMLElement;
    this.onTextChange = onTextChange;
    this.initializeEditor();
  }

  focus(): void {
    this.editor.focus();
  }

  getText(): string {
    return this.editor.textContent || '';
  }

  deleteText(start: number, end: number, silent = false): void {
    // this.editor.textContent = '';
    // deleteText(start, end, this.editor, this.createTextBlock);
    // if (!silent) {
    //   this.onChange();
    // }
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

  clean(isApi = false): void {
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
    if (!isApi) {
      this.onChange();
    }
  }

  getContents(): Scheme {
    const contents: Scheme = [];
    this.editor.childNodes.forEach((node) => {
      if (
        node.nodeType === Node.TEXT_NODE ||
        node.nodeType === Node.ELEMENT_NODE
      ) {
        const element = node as HTMLElement | CharacterData;
        const text = element.textContent || '';
        const type =
          'getAttribute' in element && element.getAttribute('data-type') === '1'
            ? 1
            : 0;
        contents.push([text, type]);
      }
    });
    return contents;
  }

  getHtmlStr(): string {
    return this.editor.innerHTML;
  }

  insertText(
    userInput: string,
    {
      isApi = false,
      isActive = false,
    }: { isApi?: boolean; isActive?: boolean } = {}
  ): Element {
    const span = this.createTextBlock(userInput, isApi);
    if (isActive) {
      this.removeActiveBlocks();
      span.classList.add(this.activeTextClass);
    }
    this.editor.appendChild(span);
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

  private onChange() {
    if (this.onTextChange) {
      this.onTextChange();
    }
  }

  private initializeEditor(): void {
    this.editor.contentEditable = 'true';
    this.editor.style.color = this.userColor;

    this.editor.addEventListener('input', () => {
      this.onChange();
    });

    this.editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text) this.insertPlainText(text);
    });

    this.editor.addEventListener(
      'beforeinput',
      this.handleBeforeInput.bind(this)
    );
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
        : currentNode;

    const isApi =
      parentElement &&
      parentElement instanceof HTMLElement &&
      parentElement.getAttribute('data-type') === '1';

    return { selection, range, isApi, parentElement };
  }

  private handleBeforeInput(e: InputEvent): void {
    if (e.data) {
      const { isApi, parentElement } = this.currentSelection();

      if (isApi || parentElement === this.editor) {
        e.preventDefault();
        this.insertPlainText(e.data);
      }
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

  private insertPlainText(text: string): void {
    const { selection, range, isApi, parentElement } = this.currentSelection();
    if (!selection || !range || !parentElement) {
      const span = this.createTextBlock(text);
      this.editor.appendChild(span);
    } else {
      // this.deleteText(startCharacter, endCharacter, true);
      if (isApi) {
        this.splitApiBlock({ parentElement, text, offset: range.startOffset });
      } else {
        const span = this.createTextBlock(text);
        range.insertNode(span);
        range.selectNodeContents(span);

        range.collapse(false);

        const newSelection = window.getSelection();
        if (newSelection) {
          newSelection.removeAllRanges();
          newSelection.addRange(range);
        }
      }
    }
    this.onChange();
  }
}
