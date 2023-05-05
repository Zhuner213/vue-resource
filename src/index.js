import { initMixin } from "./init"

function Vue(options) { // options 是用户的配置项
    this._init(options)
}

initMixin(Vue) // 扩展了 init 方法

export default Vue