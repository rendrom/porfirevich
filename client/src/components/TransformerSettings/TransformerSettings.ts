import { defineComponent } from 'vue';
import { useTransformerStore } from '@/store/transformerStore';

export default defineComponent({
  name: 'TransformerSettings',
  setup() {
    const store = useTransformerStore();

    const temperatureToSliderValue = (temp: number): number => {
      if (temp <= 1) return temp * 5;
      return 5 + (temp - 1) * (5 / 9);
    };

    const sliderValueToTemperature = (value: number): number => {
      if (value <= 5) return value / 5;
      return 1 + (value - 5) * (9 / 5);
    };

    const formatTemperature = (value: number): string => {
      const temp = sliderValueToTemperature(value);
      if (temp <= 1) {
        return temp.toFixed(1);
      } else {
        return temp.toFixed(0);
      }
    };

    const updateTemperature = (value: number) => {
      store.setTemperature(sliderValueToTemperature(value));
    };

    return {
      store,
      temperatureToSliderValue,
      formatTemperature,
      updateTemperature,
    };
  },
});
