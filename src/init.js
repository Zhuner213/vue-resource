import { initState } from "./state"

export function initMixin(Vue) { // 给 Vue 增加 init方法
    Vue.prototype._init = function(options) { // 用于初始化操作 
        // vue vm.$options就是获取用户的配置

        // 我们使用 vue 的时候，$nextTick $data $attr... 这些带 $ 符号的，都是 Vue实例 的属性
        const vm = this
        vm.$options = options // 将用户的配置挂载到实例上

        // 初始化状态
        initState(vm)
    }
}


