<template>
  <div class="settings-control">
    <div class="field">
      <b-field label="Объем генерируемого текста (токенов)">
        <b-slider
          v-model="store.tokens"
          size="is-small"
          rounded
          indicator
          :tooltip="false"
          :min="1"
          :max="300"
        />
      </b-field>
    </div>

    <div class="field">
      <b-field label="Креативность (шиз)">
        <b-slider
          v-model="temperatureSliderValue"
          size="is-small"
          rounded
          indicator
          :tooltip="false"
          :min="0"
          :max="10"
          :step="0.1"
          :custom-formatter="formatTemperature"
        />
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

<script setup lang="ts">
import { BField, BRadioButton, BSlider } from 'buefy';
import { computed } from 'vue';

import { useTransformerStore } from '@/store/transformerStore';

const store = useTransformerStore();

function temperatureToSliderValue(temperature: number) {
  return temperature <= 1
    ? temperature * 5
    : 5 + (temperature - 1) * (5 / 9);
}

function sliderValueToTemperature(value: number) {
  return value <= 5 ? value / 5 : 1 + (value - 5) * (9 / 5);
}

const temperatureSliderValue = computed({
  get: () => temperatureToSliderValue(store.temperature),
  set: (value: number) =>
    store.setTemperature(sliderValueToTemperature(value)),
});

function formatTemperature(value: number) {
  const temperature = sliderValueToTemperature(value);
  return temperature <= 1 ? temperature.toFixed(1) : temperature.toFixed(0);
}
</script>

<style scoped>
.settings-control {
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 1rem;
}
</style>
