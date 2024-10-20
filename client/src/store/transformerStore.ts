import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import Quill, { EmitterSource } from 'quill';
import Delta from 'quill-delta';
import debounce from 'debounce';
import { generateApi, getModelsApi } from '@/api/porfirevich';
import { PRIMARY_COLOR } from '@/config';
import { deltaToScheme, schemeToDelta } from '@/utils/schemeUtils';
import type { Scheme } from '@shared/types/Scheme';
import { useAppStore } from '@/store/app';

export const useTransformerStore = defineStore('transformer', () => {
  const appStore = useAppStore();

  const quill = ref<Quill | null>(null);
  const text = ref('');
  const html = ref('');
  const isReady = ref(false);
  const isLoading = ref(false);
  const isError = ref(false);
  const lastReply = ref('');
  const replies = ref<string[]>([]);

  const tokens = ref(150);
  const temperature = ref(0.3);
  const isTextSelected = ref(false);
  const placeholder = ref('Придумайте начало истории');
  const localScheme = ref<Scheme>([]);
  const abortControllers = ref<AbortController[]>([]);
  const history = ref<Scheme[]>([]);
  const models = ref<string[]>([]);
  const activeModel = ref('');

  const handleRequestError = ref(() => {
    console.error('Request error occurred');
  });

  const promptMaxLength = 1000000;
  const historyLength = 2000;
  const historyInterval = 300;

  function saveSettings() {
    localStorage.setItem(
      'transformerSettings',
      JSON.stringify({
        tokens: tokens.value,
        temperature: temperature.value,
        activeModel: activeModel.value,
      })
    );
  }

  function loadSettings() {
    const settings = localStorage.getItem('transformerSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      tokens.value = parsedSettings.tokens;
      temperature.value = parsedSettings.temperature;
      activeModel.value = parsedSettings.activeModel;
    }
  }

  function setTemperature(value: number) {
    temperature.value = value;
    saveSettings();
  }

  watch(
    [tokens, temperature, activeModel],
    () => {
      abort();
      cleanLastReply();
      saveSettings();
    },
    { deep: true }
  );

  const createQuill = (selector: string) => {
    const bindings = {
      tab: {
        key: 'Tab',
        handler: () => {
          // Handle tab
        },
      },
    };

    quill.value = new Quill(selector, {
      modules: {
        keyboard: { bindings },
        history: {
          delay: Infinity,
          maxStack: 0,
          userOnly: true,
        },
        toolbar: false,
        clipboard: {
          matchVisual: false,
        },
      },
      placeholder: placeholder.value,
      formats: ['bold', 'color'],
    });

    quill.value.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      delta.ops.forEach((op) => {
        if (op.attributes) {
          delete op.attributes.color;
          delete op.attributes.bold;
        }
      });
      return delta;
    });

    const keyboard = quill.value.keyboard;
    if (keyboard) {
      keyboard.addBinding({ key: 'Tab' }, () => {
        // Custom tab handling
      });

      if (localScheme.value) {
        setScheme(localScheme.value, true);
      }

      setPlaceholder();
      quill.value.focus();

      quill.value.on('text-change', onTextChange);
      quill.value.on('selection-change', (range, _, source) => {
        if (range && range.length > 0) {
          isTextSelected.value = true;
        } else {
          isTextSelected.value = false;
        }
        if (source === 'user') {
          if (range) {
            if (range.length !== 0) {
              return;
            }
          }
          resetFormat();
        }
      });
    }
  };

  const prompt = computed(() => {
    return stripHtml(text.value).replace(lastReply.value, '').trimStart();
  });

  let debouncedHistory: () => void;

  function setQuill(q: Quill) {
    quill.value = q;
  }

  function setIsReady(value: boolean) {
    isReady.value = value;
  }

  function clearFormatting(delta: Delta) {
    if (!quill.value) {
      return;
    }
    let changeIndex = 0;
    let changeLength = 0;

    delta.ops?.forEach((op) => {
      if (op.insert) {
        changeLength += typeof op.insert === 'string' ? op.insert.length : 1;
      } else if (op.retain) {
        changeIndex += op.retain as number;
      } else if (op.delete) {
        changeLength += 1 as number;
      }
      if (op.attributes) {
        op.attributes = {};
      }
    });

    if (changeIndex > 0) {
      quill.value.removeFormat(changeIndex, changeLength);
      quill.value.formatText(
        changeIndex,
        changeLength,
        {
          bold: false,
          italic: false,
          color: 'black',
        },
        'api'
      );
    }
  }

  function resetFormat() {
    if (quill.value) {
      quill.value.format('color', 'black');
      quill.value.format('bold', false);
    }
  }

  function onTextChange(delta: Delta, _oldDelta: Delta, source: EmitterSource) {
    setContent();
    text.value = quill.value?.getText() || '';
    setPlaceholder();
    abort();

    if (source === 'user') {
      lastReply.value = '';
      replies.value = [];
      if (isTextSelected.value) {
        if (delta && delta.filter((op) => op.insert !== undefined).length) {
          clearFormatting(delta);
          isTextSelected.value = false;
        }
      }
    }

    debouncedHistory();

    if (text.value.trim().length) {
      addWindowUnloadListener();
    } else {
      removeWindowUnloadListener();
    }
  }

  function abort() {
    abortControllers.value.forEach((x) => x.abort());
    abortControllers.value = [];
    isError.value = false;
  }

  async function transform() {
    abort();
    const mem = { isAborted: false };

    try {
      if (!prompt.value) {
        return;
      }
      isLoading.value = true;
      let currentReplies: string[] | undefined;
      if (replies.value.length) {
        currentReplies = replies.value;
      } else {
        const data = await request(prompt.value);
        currentReplies = data && data.replies;
        if (currentReplies) {
          appStore.appendReplies(currentReplies);
        }
      }
      if (currentReplies && !mem.isAborted && quill.value) {
        const reply = currentReplies.pop() || '';
        cleanLastReply();
        const text = quill.value.getText();
        const length = text.length - 1;
        quill.value.insertText(
          length,
          reply,
          {
            bold: true,
            color: PRIMARY_COLOR,
          },
          'api'
        );
        setTimeout(() => {
          lastReply.value = reply;
        }, 20);
        replies.value = currentReplies;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        mem.isAborted = true;
      } else {
        isError.value = true;
        handleRequestError.value();
      }
    } finally {
      isLoading.value = false;
      setCursorToEnd();
    }
  }

  function historyBack() {
    abort();
    cleanLastReply();
    const currentHistory = [...history.value];
    currentHistory.pop(); // last changes
    const prev = currentHistory.pop();
    if (prev) {
      setScheme(prev, true);
    } else {
      clean();
    }
    history.value = currentHistory;
  }

  function escape() {
    if (isLoading.value) {
      abort();
    } else if (history.value.length) {
      historyBack();
    } else if (lastReply) {
      cleanLastReply();
    } else {
      clean();
    }
  }

  function easyEscape() {
    if (isLoading.value) {
      abort();
    }
    if (lastReply.value) {
      lastReply.value = '';
    }
  }

  async function getModels() {
    if (!models.value.length) {
      const data = await getModelsApi();
      models.value = data;
      activeModel.value = data[0];
    }
    loadSettings();
  }

  function setPlaceholder() {
    if (quill.value) {
      const text = quill.value.getText();
      quill.value.root.dataset.placeholder =
        text.length > 1 ? '' : placeholder.value;
    }
  }

  function removeWindowUnloadListener() {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    e.preventDefault();
    e.returnValue =
      'Вы действительно хотите покинуть страницу? История будет утеряна.';
  }

  function setScheme(scheme: Scheme, cursorToEnd = false) {
    if (quill.value) {
      const delta = schemeToDelta(scheme);
      quill.value.setContents(delta, 'api');
      if (cursorToEnd) {
        setCursorToEnd();
      } else {
        setCursor();
      }
    }
    localScheme.value = scheme;
  }

  function getScheme(): Scheme {
    return quill.value ? deltaToScheme(quill.value.getContents()) : [];
  }

  function setContent() {
    html.value = quill.value?.root.innerHTML || '';
    localScheme.value = getScheme();
  }

  function clean() {
    abort();
    text.value = '';
    html.value = '';
    removeWindowUnloadListener();
    quill.value?.setText('', 'api');
    localScheme.value = [];
  }

  function cleanLastReply() {
    if (quill.value) {
      const text = quill.value.getText();
      const index = text.indexOf(lastReply.value);
      if (index !== -1) {
        quill.value.deleteText(index, lastReply.value.length, 'api');
      }
    }
    lastReply.value = '';
    replies.value = [];
    setCursor();
  }

  function setCursor() {
    resetFormat();
    setTimeout(() => {
      quill.value?.focus();
    }, 0);
  }

  function setCursorToEnd() {
    if (quill.value) {
      resetFormat();
      const length = quill.value.getLength();
      quill.value.setSelection(length - 1, 0);
    }
  }

  function addWindowUnloadListener() {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  async function request(prompt: string) {
    const controller = new AbortController();
    abortControllers.value.push(controller);

    prompt = prompt.slice(-promptMaxLength);
    prompt = prompt.trim();

    return generateApi({
      prompt,
      signal: controller.signal,
      model: activeModel.value,
      tokens: tokens.value,
      temperature: temperature.value,
    });
  }

  function stripHtml(html: string) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function updateHistory() {
    const scheme = getScheme();
    appendHistory(scheme);
  }

  function appendHistory(scheme: Scheme) {
    history.value = [...history.value, scheme].slice(-historyLength);
  }

  function changeModel() {
    const activeModelIndex = models.value.indexOf(activeModel.value);
    activeModel.value =
      activeModelIndex !== -1
        ? models.value[(activeModelIndex + 1) % models.value.length]
        : models.value[0];
    replies.value = [];
  }

  function setActiveModel(model: string) {
    activeModel.value = model;
  }

  function initialize() {
    debouncedHistory = debounce(updateHistory, historyInterval);

    if (quill.value) {
      quill.value.format('color', 'black');
      quill.value.format('bold', false);
      quill.value.format('italic', false);
    }
  }

  return {
    quill,
    text,
    html,
    isReady,
    isLoading,
    isError,

    lastReply,
    replies,
    tokens,
    temperature,
    placeholder,
    localScheme,
    history,
    models,
    activeModel,
    prompt,
    handleRequestError,
    createQuill,
    setQuill,
    setIsReady,
    onTextChange,
    abort,
    transform,
    historyBack,
    escape,
    easyEscape,
    getModels,
    setPlaceholder,
    removeWindowUnloadListener,
    setScheme,
    getScheme,
    setContent,
    setTemperature,
    clean,
    cleanLastReply,
    setCursor,
    setCursorToEnd,
    addWindowUnloadListener,
    setActiveModel,
    changeModel,
    initialize,
  };
});
