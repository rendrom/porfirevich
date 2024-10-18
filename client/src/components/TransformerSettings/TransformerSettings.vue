<template>
  <div class="settings-control">
    <div class="field">
      <b-field label="Объем генерируемого текста">
        <b-slider
          v-model="store.tokens"
          size="is-small"
          :min="1"
          :max="300"
          rounded
        >
          <b-slider-tick v-for="val in [50, 150, 250]" :key="val" :value="val">
            {{ val }}
          </b-slider-tick>
        </b-slider>
      </b-field>
    </div>

    <div class="field">
      <b-field label="Креативность">
        <b-slider
          v-model="store.temperature"
          size="is-small"
          :min="0.1"
          :max="10"
          :step="0.1"
          rounded
        >
          <b-slider-tick v-for="val in [0.1, 5, 10]" :key="val" :value="val">
            {{ val }}
          </b-slider-tick>
        </b-slider>
      </b-field>
    </div>

    <div class="field">
      <b-field label="Модель">
        <b-field grouped group-multiline>
          <b-radio-button
            v-for="model in store.models"
            :key="model"
            v-model="store.activeModel"
            :native-value="model"
            type="is-primary is-light is-outlined"
            size="is-small"
          >
            {{ model }}
          </b-radio-button>
        </b-field>
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

<style scoped>
.settings-control {
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 1rem;
}
</style>
