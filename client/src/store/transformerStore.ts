import { defineStore } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import debounce from 'debounce';
import { generateApi, getModelsApi } from '@/api/porfirevich';
import { TextEditor } from '@/editor/TextEditor';

import type { Scheme } from '@shared/types/Scheme';

export const useTransformerStore = defineStore('transformer', () => {
  const editor = shallowRef<TextEditor>();
  const text = ref('');
  const prompt = computed(() => text.value.trim());
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
  let transformId = 0;

  const handleRequestError = ref(() => {
    console.error('Request error occurred');
  });

  const promptMaxLength = 1000000;
  const historyLength = 2000;
  const historyInterval = 300;

  function saveSettings() {
    try {
      localStorage.setItem(
        'transformerSettings',
        JSON.stringify({
          tokens: tokens.value,
          temperature: temperature.value,
          activeModel: activeModel.value,
        })
      );
    } catch {
      // Storage can be disabled or full; generation should still work.
    }
  }

  function loadSettings() {
    try {
      const settings = localStorage.getItem('transformerSettings');
      if (!settings) return;
      const parsedSettings = JSON.parse(settings);
      if (!parsedSettings || typeof parsedSettings !== 'object') return;
      if (typeof parsedSettings.tokens === 'number' && Number.isFinite(parsedSettings.tokens)) {
        tokens.value = Math.min(150, Math.max(1, Math.round(parsedSettings.tokens)));
      }
      if (typeof parsedSettings.temperature === 'number' && Number.isFinite(parsedSettings.temperature)) {
        temperature.value = Math.min(10, Math.max(0.1, parsedSettings.temperature));
      }
      if (models.value.includes(parsedSettings.activeModel)) {
        activeModel.value = parsedSettings.activeModel;
      }
    } catch {
      // Ignore malformed settings or unavailable browser storage.
    }
  }

  function setTemperature(value: number) {
    temperature.value = value;
    saveSettings();
  }

  watch([tokens, temperature, activeModel], () => {
    abort();
    cleanLastReply();
    saveSettings();
  });

  const createEditor = (selector: string) => {
    editor.value?.destroy();
    editor.value = new TextEditor(selector, { onTextChange });
    history.value = [[]];
    text.value = '';

    setPlaceholder();
    editor.value.focus();
    isReady.value = true;
  };

  const getPrompt = () => {
    return (editor.value?.getTextBeforeSelection(lastReply.value || undefined) || '').trimStart();
  };

  const debouncedHistory = debounce(updateHistory, historyInterval);

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
    transformId += 1;
    abortControllers.value?.abort();
    abortControllers.value = undefined;
    isLoading.value = false;
    isError.value = false;
  }

  async function transform() {
    abort();
    const currentTransformId = transformId;
    try {
      const prompt = getPrompt();
      if (!prompt) {
        return;
      }
      updateHistory();
      const selection = editor.value?.captureSelection();
      isLoading.value = true;
      let currentReplies: string[] | undefined;
      if (replies.value.length) {
        currentReplies = replies.value;
      } else {
        const data = await request(prompt);
        currentReplies = data && data.replies;
      }
      if (currentTransformId !== transformId) return;
      if (currentReplies && editor.value) {
        const reply = currentReplies.pop() || '';
        const replacing = !!lastReply.value;
        deleteLastReply();
        const lastBlock = editor.value.insertText(reply, {
          isApi: true,
          isActive: true,
          silent: true,
          atCurrentSelection: true,
          selection: replacing ? undefined : selection,
        });
        text.value = editor.value.getText();
        lastReply.value = `#${lastBlock.id}`;
        updateHistory();
        setPlaceholder();

        replies.value = currentReplies;
      }
    } catch (err) {
      if (currentTransformId !== transformId) return;
      if (!(err instanceof Error && err.name === 'AbortError')) {
        isError.value = true;
        handleRequestError.value();
      }
    } finally {
      if (currentTransformId === transformId) isLoading.value = false;
    }
  }

  function historyBack() {
    abort();
    debouncedHistory.flush();
    updateHistory();
    cleanLastReply();
    if (history.value.length > 1) history.value.pop();
    setScheme(history.value.at(-1) || [], true, false);
  }

  function escape() {
    cleanLastReply();

    if (isLoading.value) {
      abort();
    } else if (history.value.length > 1) {
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
      activeModel.value = data.includes('original') ? 'original' : data[0];
      loadSettings();
    }
  }

  function setPlaceholder() {
    if (editor.value) {
      const text = editor.value.getText(false);
      editor.value.setPlaceHolder(text.length ? '' : placeholder.value);
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

  function setScheme(newScheme: Scheme, cursorToEnd = false, recordHistory = true) {
    abort();
    cleanLastReply();
    if (editor.value) {
      editor.value.setContents(newScheme);
      text.value = editor.value.getText();
      if (cursorToEnd) {
        setCursorToEnd();
      } else {
        setCursor();
      }
      if (recordHistory) updateHistory();
      setPlaceholder();
      if (text.value.trim()) addWindowUnloadListener();
      else removeWindowUnloadListener();
    }
  }

  function clean() {
    debouncedHistory.flush();
    updateHistory();
    abort();
    cleanLastReply();
    removeWindowUnloadListener();
    editor.value?.clean();
    text.value = '';
    updateHistory();
    setPlaceholder();
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
    text.value = editor.value?.getText() || text.value;
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
    if (JSON.stringify(history.value.at(-1)) === JSON.stringify(scheme)) return;
    history.value = [...history.value, scheme].slice(-historyLength);
  }

  function changeModel() {
    if (!models.value.length) return;
    const activeModelIndex = models.value.indexOf(activeModel.value);
    activeModel.value =
      activeModelIndex !== -1
        ? models.value[(activeModelIndex + 1) % models.value.length]
        : models.value[0];
    replies.value = [];
  }

  function setActiveModel(model: string) {
    if (models.value.includes(model)) activeModel.value = model;
  }

  function initialize() {
    debouncedHistory.clear();
  }

  function destroy() {
    abort();
    debouncedHistory.clear();
    editor.value?.destroy();
    editor.value = undefined;
    isReady.value = false;
    lastReply.value = '';
    replies.value = [];
    removeWindowUnloadListener();
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
    destroy,
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
