import { initGlobalAPI } from "./globalAPI"
import { initMixin } from "./init"
import { initLifeCycle } from "./lifecycle"
import { nextTick } from "./observe/watcher"

function Vue(options) { // options 是用户的配置项
    this._init(options)
}

Vue.prototype.$nextTick = nextTick
initMixin(Vue) // 扩展了 init 方法
initLifeCycle(Vue) // 扩展了 _render 和 _update 方法
initGlobalAPI(Vue) // 扩展Vue上的全局方法

export default Vue