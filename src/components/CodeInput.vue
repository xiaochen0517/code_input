<template>
  <div class="code-input">
    <div
      ref="EditorBoxRefs"
      class="editor-box"
      contenteditable="true"
      v-html="htmlContent"
      @input="handleInput"
    ></div>
  </div>
</template>

<script>
const tokenizer = {
  root: [
    { reg: /^\$\{[a-zA-Z0-9_]+}/, class: "uat-placeholder" },
    { reg: /^"/, class: "string-quotation", next: "string" },
    { reg: /^MAX\(/i, class: "function-symbol", next: "function" },
    { reg: /^\s+/, class: "space" },
    { reg: /^./, class: "other-content" },
    { reg: /^[+\-*/]/, class: "operator" },
  ],
  string: [
    { reg: /^"/, class: "string-quotation", next: "root" },
    { reg: /^[^"]+/, class: "string-content" },
  ],
  function: [
    { reg: /^\$\{[a-zA-Z0-9_]+}/, class: "uat-placeholder" },
    { reg: /^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i, class: "number" },
    { reg: /^,/, class: "separator" },
    { reg: /^\s+/, class: "space" },
    { reg: /^\)/, class: "function-symbol", next: "root" },
    { reg: /^[^\s\)]/, class: "string" },
  ],
};

export default {
  name: "CodeInput",
  props: {
    value: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      inputValue: this.value,
      content: "",
      htmlContent: "",
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(val) {
        this.content = val;
        this.htmlContent = this.parseString2Html(val, tokenizer.root);
      },
    },
  },
  methods: {
    handleInput(event) {
      const editorElement = this.$refs.EditorBoxRefs;
      // 读取EditorBoxRefs下的html中的内容
      const changedValue = this.getAllTextFromElement(editorElement);
      // 获取当前光标位置
      const cursorIndex = this.getCursorIndex();
      // 更新内容
      this.$emit("input", changedValue);
      // 恢复光标位置
      this.setCursorPos(cursorIndex);
    },
    getCursorIndex() {
      const editorElement = this.$refs.EditorBoxRefs;
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      // 遍历子元素，找到光标所在的子元素
      let cursorIndex = 0;
      for (const childNode of editorElement.childNodes) {
        const nodeTextContent = childNode.textContent;
        if (range.endContainer === childNode.childNodes[0]) {
          cursorIndex += range.endOffset;
          break;
        } else {
          cursorIndex += nodeTextContent.length;
        }
      }
      return cursorIndex;
    },
    setCursorPos(cursorIndex) {
      const editorElement = this.$refs.EditorBoxRefs;
      this.$nextTick(() => {
        let cursorNode = null;
        let cursorOffset = 0;
        if (cursorIndex == 0) {
          cursorNode = editorElement;
          cursorOffset = 0;
        } else {
          // 遍历子元素，找到光标所在的子元素
          for (const childNode of editorElement.childNodes) {
            const nodeTextContent = childNode.textContent;
            if (cursorIndex <= nodeTextContent.length) {
              cursorNode = childNode.childNodes[0];
              cursorOffset = cursorIndex;
              break;
            } else {
              cursorIndex -= nodeTextContent.length;
            }
          }
        }
        // 设置光标位置
        let selection = window.getSelection();
        let range = selection.getRangeAt(0);
        range.setStart(cursorNode, cursorOffset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    },
    getAllTextFromElement(element) {
      let text = "";
      // 遍历子元素
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        // 如果是文本节点，将文本内容添加到字符串中
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        }
        // 如果是元素节点，递归调用函数处理子元素
        if (child.nodeType === Node.ELEMENT_NODE) {
          text += this.getAllTextFromElement(child);
        }
      }
      return text;
    },
    parseString2Html(content, states) {
      console.log(content);
      // 储存当前转换的内容
      let contentTemp = content;
      let resultContent = "";
      while (contentTemp.length > 0) {
        for (const state of states) {
          let matchContent = state.reg.exec(contentTemp);
          if (matchContent != null) {
            let matchString = matchContent[0];
            let matchClass = state.class;
            let matchHtml = `<span class="${matchClass}">${matchString}</span>`;
            resultContent += matchHtml;
            contentTemp = contentTemp.substring(matchString.length);
            const nextStates = tokenizer[state.next];
            if (state.next && nextStates) {
              resultContent += this.parseString2Html(contentTemp, nextStates);
              contentTemp = "";
            }
            break;
          }
        }
      }
      return resultContent;
    },
  },
};
</script>

<style scoped lang="less">
.code-input {
  font-family: "Fira Code", monospace;

  .editor-box {
  }
}
</style>

<style>
.keyword {
  color: #ff0000;
}
.uat-placeholder {
  color: #00ff00;
}
.function-symbol {
  color: #0000ff;
}
.number {
  color: #ff00ff;
}
.separator {
  color: #ff0000;
}
.operator {
  color: #ff0000;
}
</style>
