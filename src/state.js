import Dep from "./observe/dep"
import { observe } from "./observe/index"
import Wacther from "./observe/watcher"

export function initState(vm) {
    const opts = vm.$options // 获取用户所有的配置项
    // 初始化 data 属性
    if (opts.data) initData(vm)
    // 初始化 computed 属性
    if (opts.computed) initComputed(vm)

    // ......
}

function proxy(vm, target, data) {
    for (let key in data) {
        Object.defineProperty(vm, key, {
            get() {
                console.log(`proxy：用户直接从vm上取值了${key}，代理到：${target}`)
                return vm[target][key]
            },
            set(newValue) {
                if (newValue === vm[target][key]) return
                console.log('用户修改值了proxy')
                vm[target][key] = newValue
            }
        })

    }
}

// 初始化data
function initData(vm) {
    let data = vm.$options.data // data 可能是函数或对象

    data = typeof data === 'function' ? data.call(vm) : data // data 是用户返回的对象

    vm._data = data // 将返回的对象放到 _data 上

    // 对数据进行劫持，vue2 里采用了一个 api：Object.defineProperty
    observe(data)

    // 对数据进行代理，使用户能直接通过 vm.xxx 取到 data 上的某个属性
    proxy(vm, '_data', data)
}

const testObj = {
    a: 123
}

// 初始化computed
function initComputed(vm) {
    const computed = vm.$options.computed
    const watchers = vm._computedWathcers = {} // 将计算属性watcher保存到vm上

    for (let key in computed) {
        let userDef = computed[key]

        // 我们需要监测计算属性中get的变化
        const fn = typeof userDef === 'function' ? userDef : userDef.get

        // 将属性和watcher对应起来
        watchers[key] = new Wacther(vm, fn, { lazy: true }) // 如果直接new Watcher默认就会执行fn，这里我们不希望fn立即执行，所以传入lazy配置项

        defineComputed(vm, key, userDef)
    }
}

// 将computed中的属性定义到vm实例上
function defineComputed(target, key, userDef) {
    // const getter = typeof userDef === 'function' ? userDef : userDef.get
    const setter = userDef.set || (() => { })

    // 可以通过vm实例拿到对应的computed的属性（getter和setter的this都指向传入的target）
    Object.defineProperty(target, key, {
        get: createComputedGetter(key),
        set: setter
    })
}

// 计算属性根本不会收集依赖，只会让自己的依赖属性去收集依赖（这个和vue3不一样）
function createComputedGetter(key) {
    // 我们需要根据对应watcher的dirty属性来判断：是执行这个computed的getter来重新计算，还是直接返回缓存值即可（这个值存储在wathcer的value属性上）
    return function getter () {
        // 因为Object.defineProperty，这里的this指向是vm
        const watcher = this._computedWathcers[key]

        // 如果dirty为true则说明当前需要重新计算新值（计算完成后还要将dirty置为false）
        if(watcher.dirty) {
            watcher.evaluate() // 求值后，dirty变为了false，下次就不求值了
        }

        // 计算属性watcher出栈后，还有渲染watcher，应该让计算属性的依赖属性也去收集上层watcher
        if(Dep.target) {
            watcher.depend()
        }

        // 否则直接返回缓存值，不需要重新计算
        return watcher.value
    }
}