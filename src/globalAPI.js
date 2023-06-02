import { mergeOptions } from "./utils"

export function initGlobalAPI(Vue) {
    Vue.options = {}

    Vue.mixin = function (mixin) {
        // 我们期望将 用户的选项 和 全局的options 进行合并
        this.options = mergeOptions(this.options, mixin)
        // 将Vue返回出去方便链式调用
        return this
    }
}