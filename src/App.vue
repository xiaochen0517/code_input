<template>
  <div id="app">
    <div style="width: 500px">
      <code-input v-model="codeString" />
    </div>
  </div>
</template>

<script>
import CodeInput from "../plugins/components/codeinput/CodeInput.vue";

export default {
  name: "App",
  components: {
    CodeInput,
  },
  data() {
    return {
      codeString: "",
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
