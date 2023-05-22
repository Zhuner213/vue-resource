// 被 h() _c() 所调用：创建元素虚拟节点
export function createElementVNode(vm, tag, data, ...children) {
    if (data == null) data = {}
    let key = data.key
    if (key) delete data.key
    return vnode(vm, tag, key, data, children)
}

// 被 _v() 所调用：创建文本虚拟节点
export function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text) 
}

// 虚拟DOM 和 ast 一样吗？
// ast 做的是语法层面的转化，他描述的是语法本身（js、css、html），语法中没有的东西 ast 不能描述
// 虚拟DOM 描述的是 DOM元素，可以增加一些自定义属性（描述 DOM 的）
function vnode(vm, tag, key, data, children, text) {
    return {
        vm,
        tag,
        key,
        data,
        children,
        text
        // ...
    }
}