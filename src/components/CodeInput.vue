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
    { reg: /^\d\.?\d*/, class: "number" },
    { reg: /^,/, class: "separator" },
    { reg: /^\s+/, class: "space" },
    { reg: /^\)/, class: "function-symbol", next: "root" },
    { reg: /^[^0-9\.\s\)]/, class: "string" },
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
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      // 获取当前编辑器元素的所有子元素
      const childNodes = editorElement.childNodes;
      // 遍历子元素，找到光标所在的子元素
      let cursorNode = null;
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          if (range.startOffset <= child.textContent.length) {
            cursorNode = child;
            break;
          } else {
            range.startOffset -= child.textContent.length;
          }
        }
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (range.startOffset <= child.textContent.length) {
            cursorNode = child;
            break;
          } else {
            range.startOffset -= child.textContent.length;
          }
        }
      }
      // 计算当前位置在整个文本中的位置
      let cursorIndex = 0;
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          if (child === cursorNode) {
            cursorIndex += range.startOffset;
            break;
          } else {
            cursorIndex += child.textContent.length;
          }
        }
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (child === cursorNode) {
            cursorIndex += range.startOffset;
            break;
          } else {
            cursorIndex += child.textContent.length;
          }
        }
      }

      // 更新内容
      this.$emit("input", changedValue);
      // 恢复光标位置
      this.$nextTick(() => {
        // 获取当前编辑器元素的所有子元素
        const childNodes = editorElement.childNodes;
        // 遍历子元素，找到光标所在的子元素
        let cursorNode = null;
        let cursorOffset = 0;
        for (let i = 0; i < childNodes.length; i++) {
          const child = childNodes[i];
          if (child.nodeType === Node.TEXT_NODE) {
            if (cursorIndex <= child.textContent.length) {
              cursorNode = child;
              cursorOffset = cursorIndex;
              break;
            } else {
              cursorIndex -= child.textContent.length;
            }
          }
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (cursorIndex <= child.textContent.length) {
              cursorNode = child;
              cursorOffset = cursorIndex;
              break;
            } else {
              cursorIndex -= child.textContent.length;
            }
          }
        }
        // 设置光标位置
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStart(cursorNode, cursorOffset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      });
      console.log("edit", this.value);
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
