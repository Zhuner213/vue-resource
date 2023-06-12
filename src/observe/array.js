// 我们希望可以重写数组中的部分方法
const arrayProto = Array.prototype

// arrayMethods.__proto__ === arrayProto === Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 找到所有的变异方法
const methods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'reverse',
    'sort',
    'splice'
]

methods.forEach(method => {
    // 这里重写了数组的方法
    arrayMethods[method] = function(...args) {
        const observeArray = this.__ob__.observeArray
        // 内部调用原来的方法，函数的劫持，切片编程（aop）
        // 在保持原有功能不变的情况下，扩展我们自己的功能
        const result = arrayProto[method].call(this, ...args)

        // 如果用户向数组中增添新对象，还是监控不到
        // 所以我们需要对新增的数据再次进行劫持
        let inserted // 新增的内容
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args
                break
            case 'splice':
                inserted = args.slice(2)
                break
            default:
                break
        }

        // 对新增的内容再次进行观测
        if(inserted) observeArray(inserted)

        // 数组变化了，通知对应的watcher实现更新逻辑
        this.__ob__.dep.notify()

        return result
    }
})