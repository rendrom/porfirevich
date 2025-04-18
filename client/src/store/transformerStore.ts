import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import debounce from 'debounce';
import { generateApi, getModelsApi } from '@/api/porfirevich';
import { TextEditor } from '@/editor/TextEditor';

import type { Scheme } from '@shared/types/Scheme';

export const useTransformerStore = defineStore('transformer', () => {
  const editor = ref<TextEditor>();
  const text = ref('');
  const isReady = ref(false);
  const isLoading = ref(false);
  const isError = ref(false);
  const lastReply = ref('');
  const replies = ref<string[]>([]);

  const tokens = ref(150);
  const temperature = ref(0.3);
  const placeholder = ref('Придумайте начало истории');

  const abortControllers = ref<AbortController>();
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

  watch([tokens, temperature, activeModel], () => {
    abort();
    saveSettings();
  });

  const createEditor = (selector: string) => {
    editor.value = new TextEditor(selector, { onTextChange });

    setPlaceholder();
    editor.value.focus();
    isReady.value = true;
  };

  const getPrompt = () => {
    const lastReplyText =
      lastReply.value && editor.value
        ? editor.value.getBlockText(lastReply.value)
        : null;
    let str = editor.value?.getTextBeforeSelection() || '';
    if (lastReplyText) {
      str = str.replace(lastReplyText, '').trimStart();
    }
    return str.trimStart();
  };

  let debouncedHistory: () => void;

  function onTextChange() {
    setPlaceholder();
    abort();
    cleanLastReply();

    text.value = editor.value?.getText() || '';

    debouncedHistory();

    if (text.value.trim().length) {
      addWindowUnloadListener();
    } else {
      removeWindowUnloadListener();
    }
  }

  function abort() {
    abortControllers.value?.abort();
    isError.value = false;
  }

  async function transform() {
    abort();
    try {
      const prompt = getPrompt();
      if (!prompt) {
        return;
      }
      isLoading.value = true;
      let currentReplies: string[] | undefined;
      if (replies.value.length) {
        currentReplies = replies.value;
      } else {
        const data = await request(prompt);
        currentReplies = data && data.replies;
      }
      if (currentReplies && editor.value) {
        const reply = currentReplies.pop() || '';
        deleteLastReply();
        const lastBlock = editor.value.insertText(reply, {
          isApi: true,
          isActive: true,
          silent: true,
          atCurrentSelection: true,
        });
        text.value = editor.value.getText();
        lastReply.value = `#${lastBlock.id}`;
        debouncedHistory();

        replies.value = currentReplies;
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        isError.value = true;
        handleRequestError.value();
      }
    } finally {
      isLoading.value = false;
    }
  }

  function historyBack() {
    abort();
    deleteLastReply();
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
    cleanLastReply();

    if (isLoading.value) {
      abort();
    } else if (history.value.length) {
      historyBack();
    } else {
      clean();
    }
  }

  function easyEscape() {
    if (isLoading.value) {
      abort();
    }
    cleanLastReply();
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
    if (editor.value) {
      const text = editor.value.getText();
      editor.value.setPlaceHolder(text.length > 1 ? '' : placeholder.value);
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

  function setScheme(newScheme: Scheme, cursorToEnd = false) {
    if (editor.value) {
      editor.value.setContents(newScheme);
      text.value = editor.value.getText();
      if (cursorToEnd) {
        setCursorToEnd();
      } else {
        setCursor();
      }
    }
  }

  function clean() {
    abort();
    removeWindowUnloadListener();
    editor.value?.clean();
    text.value = '';
  }

  function deleteLastReply() {
    if (editor.value && lastReply.value) {
      editor.value.deleteBlocks(lastReply.value);
    }
    cleanLastReply();
    setCursor();
  }

  function cleanLastReply() {
    lastReply.value = '';
    editor.value?.removeActiveBlocks();
    replies.value = [];
  }

  function setCursor() {
    setTimeout(() => {
      editor.value?.focus();
    }, 0);
  }

  function setCursorToEnd() {
    if (editor.value) {
      editor.value.setCursorToEnd();
    }
  }

  function addWindowUnloadListener() {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  async function request(prompt: string) {
    const controller = new AbortController();
    abortControllers.value = controller;

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

  function updateHistory() {
    const scheme = editor.value?.getContents();
    if (scheme) {
      appendHistory(scheme);
    }
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
  }

  return {
    text,
    prompt,
    models,
    editor,
    tokens,
    isReady,
    isError,
    replies,
    history,
    isLoading,
    lastReply,
    temperature,
    placeholder,
    activeModel,
    handleRequestError,
    removeWindowUnloadListener,
    addWindowUnloadListener,
    setPlaceholder,
    setTemperature,
    setActiveModel,
    setCursorToEnd,
    createEditor,
    onTextChange,
    changeModel,
    historyBack,
    initialize,
    easyEscape,
    transform,
    getModels,
    setScheme,
    setCursor,
    escape,
    clean,
    abort,
  };
});
