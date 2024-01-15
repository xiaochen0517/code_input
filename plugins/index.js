import CodeInput from "./components/codeinput"

// 组件数组
const components = [
  CodeInput
];

// 定义安装函数，接受app作为参数
const install = function (app, opts = {}) {
  // 在Vue 3中，不需要检查install.installed标志
  components.forEach(component => {
    app.component(component.name, component);
  });
};

// 创建一个可以通过app.use()使用的插件对象
export default {
  install,
  ...components.reduce((obj, component) => {
    obj[component.name] = component;
    return obj;
  }, {})
};

// 自动安装，如果检测到Vue是全局变量
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}
