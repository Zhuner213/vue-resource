import { newArrayProto } from "./array"
import Dep from "./dep"

class Observer {
    constructor(data) {
        // Object.defineProperty 只能劫持已经存在的属性，删除的、新添加的不行（vue里面为此单独写了一些 api：$set $delete）

        // 给每个对象都增加收集功能（增加dep是让其拥有存储当前watcher和进行notify的能力）
        this.dep = new Dep()

        Object.defineProperty(data, '__ob__', { // 为了让数组能访问到 traverseArray方法
            value: this,                        // 并且给数据增加了一个标识，如果数据上有 __ob__ 则说明这个属性被观测过了
            enumerable: false                   // 将 __ob__ 变为不可枚举，避免 traverse方法 循环时一直获取导致死循环
        })


        // 关于响应式数据「数组」的问题：因为数组中可能会包含成千上万条数据（就像中交项目返回的部门名称）
        // 如果对数组中的每一项数据都进行 Object.defineProperty 的属性重写，太浪费性能，甚至可能会爆栈

        // 用户一般修改数组，都是通过方法来修改：push shift ...

        // 通过判断，对数组做额外的响应式处理
        if (Array.isArray(data)) {
            // 这里我们可以重写数组中的方法 7个变异方法（可以修改数组本身的）
            // 需求：需要保留数组原有的特性，并且重写部分方法            
            data.__proto__ = newArrayProto
            this.traverseArray(data) // 如果数组中放的是对象，可以监控到对象的变化
        } else {
            this.traverse(data)
        }
    }

    // 遍历对象，对属性依次劫持
    traverse(data) {
        // “重新定义”属性 性能差
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
    }

    // 遍历数组，对是对象的数组元素进行劫持
    traverseArray(arr) {
        arr.forEach(item => observe(item))
    }
}

// 深层次嵌套会递归，递归多了性能差，不存在的属性监控不到，存在的属性要重写方法。。。 所以vue3 => 采用proxy
function dependArray(arr) {
    for (let i = 0; i < arr.length; i++) {
        let current = arr[i]
        current.__ob__ && current.__ob__.dep.depend()
        if (Array.isArray(current)) dependArray(current)
    }
}

export function defineReactive(target, key, value) {
    let childOb = observe(value) // 对所有的对象都进行属性劫持（深度劫持）| childOb.dep用来收集依赖的
    let dep = new Dep() // 每一个属性都有一个dep
    Object.defineProperty(target, key, {
        get() { // 取值的时候，会执行get
            // console.log(`defineReactive：用户从vm._data上取值了${key} => ${JSON.stringify(value)} ${Dep.target ? '（收集watcher）' : '（当前Dep.target为空，不做watcher收集）'}`)
            console.log(`defineReactive：用户从vm._data上取值了${key} => ${value} ${Dep.target ? '（收集watcher）' : '（当前Dep.target为空，不做watcher收集）'}`)

            // 让这个属性的收集器记住当前的watcher
            if (Dep.target) {
                dep.depend()
                if (childOb) { // 让数组和对象本身也实现依赖收集
                    childOb.dep.depend()
                    if (Array.isArray(value)) dependArray(value) // 如果value是数组，则还要考虑数组里面嵌套数组的情况
                }
            }

            return value
        },
        set(newValue) { // 修改、更新的时候，会执行set
            if (newValue === value) return
            console.log('用户修改值了defineReactive')
            observe(newValue) // 如果用户设置的值是对象，应该再次代理
            value = newValue
            // 通知watcher进行更新，重新渲染
            dep.notify()
        }
    })
}

export function observe(data) {
    // 对这个对象进行劫持
    if (typeof data !== 'object' || data === null) return // 只对对象进行劫持

    // 如果对象被代理过，则不需再进行代理了
    if (data.__ob__ instanceof Observer) return data.__ob__

    // 如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过）
    return new Observer(data)
}