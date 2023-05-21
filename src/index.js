import { initMixin } from "./init"
import { initLifeCycle } from "./lifecycle"

function Vue(options) { // options 是用户的配置项
    this._init(options)
}

initMixin(Vue) // 扩展了 init 方法
initLifeCycle(Vue) // 扩展了 _render 和 _update 方法

export default Vue