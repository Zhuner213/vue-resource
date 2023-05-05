import { observe } from "./observe/index"

export function initState(vm) {
    const opts = vm.$options // 获取用户所有的配置项
    // 初始化 data 属性
    if (opts.data) initData(vm)
}

function proxy(vm, target, data) {
    for (let key in data) {
        Object.defineProperty(vm, key, {
            get() {
                console.log('用户取值了')
                return vm[target][key]
            },
            set(newValue) {
                if(newValue === vm[target][key]) return
                console.log('用户修改值了')
                vm[target][key] = newValue
            }
        })

    }
}

function initData(vm) {
    let data = vm.$options.data // data 可能是函数或对象

    data = typeof data === 'function' ? data.call(vm) : data // data 是用户返回的对象


    // 对数据进行劫持，vue2 里采用了一个 api：Object.defineProperty
    observe(data)

    vm._data = data // 将返回的对象放到 _data 上

    // 对数据进行代理，使用户能直接通过 vm.xxx 取到 data 上的某个属性
    proxy(vm, '_data', data)
}