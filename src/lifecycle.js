export function initLifeCycle(Vue) {
    Vue.prototype._render = function() {
        console.log('render')
    }

    Vue.prototype._update = function() {
        console.log('update')
    }
}

export function mountComponent(vm, el) {
    // 1.调用 render 方法产生 虚拟 DOM

    vm._update(vm._render()) // vm.$options.render 虚拟节点
    // 2.根据虚拟 DOM 产生 真实 DOM

    // 3.插入到 el元素中
}

// vue 核心流程：1）创造了响应式数据  2）模版转换成 ast抽象语法树
// 3）将 ast抽象语法树 转换成 render函数  4）后续每次数据更新可以只执行 render函数（无需再次执行 ast转化的过程）

// render函数会去产生虚拟节点（使用响应式数据）
// 根据生成的虚拟节点创造真实的 DOM