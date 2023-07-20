import CodeInput from "./components/codeinput"

const commponents = [
  CodeInput
];

const install = function (Vue, opts = {}) {
  if (install.installed) return;
  install.installed = true;
  commponents.map(component => {
    Vue.component(component.name, component);
  });
};

if (typeof window !== "undefined" && window.Vue) {
  install(window.Vue);
}

export default {
  install,
  ...commponents
};