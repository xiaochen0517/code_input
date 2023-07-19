<template>
  <div id="app">
    <code-input v-model="codeString" />
  </div>
</template>

<script>
import CodeInput from "./components/CodeInput.vue";

export default {
  name: "App",
  components: {
    CodeInput,
  },
  data() {
    return {
      codeString: "${test_name} MAX(v  ) WORLD",
    };
  },
  watch: {
    codeString: {
      immediate: true,
      handler(val) {
        console.log("父组件参数变化", val);
      },
    },
  },
};
</script>

<style></style>
