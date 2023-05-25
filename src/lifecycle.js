import Wacther from "./observe/watcher"
import { createElementVNode, createTextVNode } from "./vdom/index"

function createElm(vnode) {
    let {tag, data, children, text} = vnode

    // 如果 tag 有值且为 String，则说明当前要创建的是 标签元素
    if(typeof tag === 'string') {
        vnode.el = document.createElement(tag) // 这里将真实节点和虚拟节点对应起来，
        patchProps(vnode.el, data)
        children.forEach(child => {
            vnode.el.appendChild(createElm(child))
        })
    } else {
        // 否则说明当前要创建的是 文本元素
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

function patchProps(el, props) {
    for(let key in props) {
        if(key === 'style') { // style: {color: 'red', background: 'yellow'}
            for(let styleName in props.style) {
                el.style[styleName] = props.style[styleName]
            }
        }else{
            el.setAttribute(key, props[key])
        }
    }
}

function patch(oldVNode, vnode) {
    // 判断 oldVNode 是虚拟DOM 还是真实的元素
    const isRealElement = oldVNode.nodeType

    // 如果 oldVNode 是真实的元素，则说明当前走的应该是 初次渲染的流程
    if(isRealElement) {
        const elm = oldVNode // 获取真实的元素
        const parentElm = elm.parentNode // 拿到父元素

        let newElm = createElm(vnode)
        // console.log(newElm)
        parentElm.insertBefore(newElm, elm.nextSibling)
        parentElm.removeChild(elm) // 删除老节点

        return newElm
    }else {
        // 如果 oldVNode 是虚拟DOM，则说明要走更新功能，即 diff算法
        // diff算法
        console.log('当前是要走diff算法')
    }
}

export function initLifeCycle(Vue) {
    Vue.prototype._render = function () {
        // 当渲染的时候会去 vm实例 中取值，我们就可以将属性和视图绑定在一起
        return this.$options.render.call(this) // 通过 ast 语法转义后生成的 render 方法
    }

    Vue.prototype._update = function (vnode) {
        const vm = this
        const el = vm.$el
        console.log(vnode)
        // patch 既有初始化渲染的功能，又有更新功能
        vm.$el = patch(el, vnode)
    }

    // _c('div', {}, ...children)
    Vue.prototype._c = function () {
        return createElementVNode(this, ...arguments)
    }

    // _v(text)
    Vue.prototype._v = function () {
        return createTextVNode(this, ...arguments)
    }

    Vue.prototype._s = function (value) {
        if (typeof value !== 'object') return value
        return JSON.stringify(value)
    }
}

export function mountComponent(vm, el) { // 这里的 el 是通过 querySelector 处理过的
    vm.$el = el
    // 1.调用 render 方法产生 虚拟 DOM
    // 2.根据虚拟 DOM 产生 真实 DOM
    // 3.插入到el元素中
    const updateComponent = () => {
        vm._update(vm._render()) // vm.$options.render 虚拟节点
    }
    
    const watcher = new Wacther(vm, updateComponent, true) // true 用于标识是一个渲染watcher
    console.log(watcher,11111)
}

// vue 核心流程：1）创造了响应式数据  2）模版转换成 ast抽象语法树
// 3）将 ast抽象语法树 转换成 render函数  4）后续每次数据更新可以只执行 render函数（无需再次执行 ast转化的过程）

// render函数会去产生虚拟节点（使用响应式数据）
// 根据生成的虚拟节点创造真实的 DOM