<template>
  <div class="columns settings-control">
    <div class="column">
      <b-field label="Автодополнение">
        <div class="autocomplate-control">
          <b-switch v-model="store.isAutocomplete" size="is-small">
            {{ store.isAutocomplete ? 'вкл' : 'выкл' }}
          </b-switch>
        </div>
      </b-field>
    </div>
    <div class="column">
      <b-field label="Задержка автодополнения" style="max-width: 250px">
        <b-numberinput
          v-model="store.interval"
          size="is-small"
          controls-rounded
          :min="1"
        />
      </b-field>
    </div>
    <div class="column">
      <b-field label="Количество автодополняемых слов">
        <b-slider
          v-model="store.length"
          size="is-small"
          :min="1"
          :max="60"
          rounded
        >
          <b-slider-tick
            v-for="val in [10, 20, 30, 40, 50]"
            :key="val"
            :value="val"
          >
            {{ val }}
          </b-slider-tick>
        </b-slider>
      </b-field>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useTransformerStore } from '@/store/transformerStore';

export default defineComponent({
  name: 'TransformerSettings',
  setup() {
    const store = useTransformerStore();

    return {
      store,
    };
  },
});
</script>
