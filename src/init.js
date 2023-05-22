import { compileToFunction } from "./compiler/index"
import { mountComponent } from "./lifecycle"
import { initState } from "./state"

export function initMixin(Vue) { // 给 Vue 增加 init方法
    Vue.prototype._init = function(options) { // 用于初始化操作 
        // vue vm.$options就是获取用户的配置

        // 我们使用 vue 的时候，$nextTick $data $attr... 这些带 $ 符号的，都是 Vue实例 的属性
        const vm = this
        vm.$options = options // 将用户的配置挂载到实例上

        // 初始化状态
        initState(vm)

        // 实现数据的挂载
        if(options.el) vm.$mount(options.el)
    }

    Vue.prototype.$mount = function(el) {
        const vm = this
        el = document.querySelector(el) // 获取到传入 el 对应的 DOM节点
        const opts = vm.$options

        // 先进行查找看有没有 render函数
        if(!opts.render) { // 如果用户没传入 render函数
            // 这里有两种情况
            // 1.用户在 new Vue时options配置项中「传入了」 el项
            // 2.用户在 new Vue时options配置项中「没有传入」 el项

            // $mount 调用有两种情况：
            // 如果在 options中 传入了 el项，则在 init 的过程中直接自动调用一次 $mount
            // 如果 options中 没有传入 el项，则会等待用户手动调用 vm.$mount(el)
            let template

            // 没有模版 template 但是有 el（包括 opts.el 和 vm.$mount(el)传入的 ）
            if(!opts.template && el) {
                template = el.outerHTML
            }else {
                // 有模版 template 且有 el（包括 opts.el 和 vm.$mount(el)传入的 ）
                if(el) template = opts.template
            }

            if(template) {
                const render = compileToFunction(template)
                // 最终就可以获取 render方法
                opts.render = render
            }    
        }

        // 组件的挂载
        mountComponent(vm, el)


        // <script> 标签引用的 vue.global.js 这个编译过程是在浏览器运行的
        // runtime 是不包含模版编译的，整个编译打包过程是通过 loader来转义 .vue文件的，用 runtime 的时候不能用 options.template
    }
}


