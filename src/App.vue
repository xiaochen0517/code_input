<template>
  <div id="app">
    <div style="width: 500px">
      <code-input v-model="codeString"/>
    </div>
  </div>
</template>

<script setup>
import CodeInput from "~/components/codeinput/CodeInput.vue";
import {ref, watch} from "vue";

const codeString = ref("");

watch(codeString, (val) => {
  console.log("父组件参数变化", val);
}, {immediate: true});
</script>

<style></style>
