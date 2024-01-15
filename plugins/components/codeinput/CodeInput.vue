<template>
  <div ref="codeInputContainerRefs" class="code-input">
    <div
        ref="EditorBoxRefs"
        class="editor-box"
        contenteditable="true"
        v-html="htmlContent"
        @compositionstart="isComposing = true"
        @compositionend="compositionend"
        @input="handleInput"
        @keydown.delete="handleDelete"
    ></div>
  </div>
</template>

<script>
const tokenizer = {
  root: [
    {reg: /^\$\{/, class: "keyword", next: "placeholder"},
    {reg: /^"/, class: "string", next: "string"},
    {reg: /^(MAX|ROUND|MIN)\(/i, class: "keyword", next: "function"},
    {reg: /^\s/, class: "space"},
    {reg: /^[+\-*/]/, class: "operator"},
    {reg: /^./, class: "string"},
  ],
  string: [
    {reg: /^"/, class: "string", next: "root"},
    {reg: /^[^"]+/, class: "string"},
  ],
  function: [
    {reg: /^\$\{/, class: "keyword", next: "func_placeholder"},
    {reg: /^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?/i, class: "number"},
    {reg: /^,/, class: "separator"},
    {reg: /^\s+/, class: "space"},
    {reg: /^\)/, class: "keyword", next: "root"},
    {reg: /^[^\s\)]/, class: "string"},
  ],
  func_placeholder: [
    {reg: /^}/, class: "keyword", next: "function"},
    {reg: /^\[/, class: "keyword", next: "phnumber"},
    {reg: /^[^}\[]+/, class: "string"},
  ],
  func_ph_number: [
    {reg: /^[0-9]+/, class: "number"},
    {reg: /^]/, class: "keyword", next: "func_placeholder"},
    {reg: /^[^0-9\]]/, class: "string"},
  ],
  placeholder: [
    {reg: /^}/, class: "keyword", next: "root"},
    {reg: /^\[/, class: "keyword", next: "phnumber"},
    {reg: /^[^}\[]+/, class: "string"},
  ],
  phnumber: [
    {reg: /^[0-9]+/, class: "number"},
    {reg: /^]/, class: "keyword", next: "placeholder"},
    {reg: /^[^0-9\]]/, class: "string"},
  ],
};

export default {
  name: "CodeInput",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      content: "",
      htmlContent: "",
      temp: 0,
      timer: null,
      trigger: false,
      cursorIndex: null,
      isComposing: false,
    };
  },
  watch: {
    modelValue: {
      handler(val) {
        this.content = val;
        this.htmlContent = this.parseString2Html(val, tokenizer.root);
      },
      immediate: true,
    },
  },
  mounted() {
    this.handleLeftAndRightKey();
  },
  methods: {
    handleLeftAndRightKey() {
      this.$refs.EditorBoxRefs.addEventListener("keydown", (event) => {
        // 获取按下的键的代码
        let keyCode = event.keyCode || event.which;

        // 如果是左箭头键（keyCode为37）或右箭头键（keyCode为39）
        if (keyCode === 37 || keyCode === 39) {
          // 获取当前选区
          let selection = window.getSelection();
          let range = selection.getRangeAt(0);

          // 获取选区的起始位置
          let startContainer = range.startContainer;
          let startOffset = range.startOffset;

          // 如果按下的是左箭头键，并且光标在contenteditable元素的第一个位置
          if (keyCode === 37 && startOffset === 0) {
            // 获取contenteditable元素的父元素
            let parentElement = startContainer.parentElement;
            // 获取光标对象
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            // 获取到上一个元素
            const previousElement = parentElement.previousElementSibling;
            // 如果上一个元素存在
            if (previousElement) {
              // 将光标移动到上一个元素的最后一个字符之后
              range.setStart(
                  previousElement.childNodes[0],
                  previousElement.textContent.length - 1
              );
            }
          }
          // 如果按下的是右箭头键，并且光标在contenteditable元素的最后一个位置
          if (keyCode === 39 && startOffset === startContainer.length) {
            let parentElement = startContainer.parentElement;
            // 获取光标对象
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            // 获取到下一个元素
            const nextElement = parentElement.nextElementSibling;
            // 如果下一个元素存在
            if (nextElement) {
              // 将光标移动到下一个元素的第一个字符之后
              range.setStart(nextElement.childNodes[0], 1);
            }
          }
        }
      });
    },
    handleDelete(event) {
      if (
          this.isComposing &&
          this.cursorIndex != null &&
          this.cursorIndex > 0
      ) {
        return;
      }
      // 设置缓存光标位置
      this.cursorIndex = this.getCursorIndex() - 1;
    },
    compositionend() {
      this.isComposing = false;
      this.handleInput();
    },
    async handleInput(event) {
      // 如果中文输入法已经关闭，则处理输入事件
      if (this.isComposing) {
        return;
      }
      const editorElement = this.$refs.EditorBoxRefs;
      // 读取EditorBoxRefs下的html中的内容
      const changedValue = this.getAllTextFromElement(editorElement);
      let cursorIndex = this.getCursorIndex();
      console.log("getCursorIndex", cursorIndex);
      if (this.cursorIndex != null && this.cursorIndex >= 0) {
        cursorIndex = this.cursorIndex;
      }
      // 更新内容
      this.$emit("update:modelValue", changedValue);
      // 恢复光标位置
      await this.setCursorPos(cursorIndex);
      // 去除index
      this.cursorIndex = null;
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
          return cursorIndex;
        } else {
          cursorIndex += nodeTextContent.length;
        }
      }
      return cursorIndex;
    },
    async setCursorPos(cursorIndex) {
      console.log("cursorIndex", cursorIndex);
      const editorElement = this.$refs.EditorBoxRefs;
      await this.$nextTick();
      // this.$nextTick(() => {
      let cursorNode = null;
      let cursorOffset = 0;
      if (cursorIndex === 0) {
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
      if (cursorNode !== undefined && cursorNode !== null) {
        range.setStart(cursorNode, cursorOffset);
      }
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      // });
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
      content = !content ? "" : content;
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
  border: 2px solid #b4bccc;
  border-radius: 5px;
  overflow: hidden;
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
  padding: 5px;
  background: #ececec;

  &:focus-within {
    border: 2px solid #1e87f0;
  }

  .editor-box {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    font-size: 16px;
    line-height: 1.5;
    overflow: auto;

    &:focus {
      outline: none;
    }

    &::-webkit-scrollbar {
      height: 3px;
      cursor: pointer;
      border-radius: 5px;
      overflow: hidden;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #888; /* 设置滚动条的颜色 */
      border-radius: 5px;
      overflow: hidden;
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: #555; /* 设置滚动条的悬停颜色 */
      cursor: pointer;
    }

    &::-webkit-scrollbar-track {
      background-color: #ececec; /* 设置滚动条的背景颜色 */
    }
  }
}
</style>

<style>
span {
  white-space: pre;
}

.keyword {
  color: #0000ff;
}

.uat-placeholder-quotation {
  color: #00ff00;
}

.uat-placeholder-content {
  color: #a31515;
}

.string {
  color: #a31515;
}

.number {
  color: #098658;
}

.separator {
  color: #ff0000;
}

.operator {
  color: #ff0000;
}
</style>
