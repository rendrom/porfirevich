<template>
  <Transformer></Transformer>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Transformer from '../components/Transformer/Transformer.vue';

@Component({
  components: {
    Transformer
  }
})
export default class Home extends Vue {}
</script>
