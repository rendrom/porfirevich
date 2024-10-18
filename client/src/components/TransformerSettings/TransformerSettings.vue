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
          :value="temperatureToSliderValue(store.temperature)"
          size="is-small"
          rounded
          indicator
          :tooltip="false"
          :min="0"
          :max="10"
          :step="0.1"
          :custom-formatter="formatTemperature"
          @input="updateTemperature"
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

<script src="./TransformerSettings.ts"></script>

<style scoped>
.settings-control {
  margin-bottom: 1rem;
}

.field {
  margin-bottom: 1rem;
}
</style>
