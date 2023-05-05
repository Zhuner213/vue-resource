class Observer {
    constructor(data) {
        // Object.defineProperty 只能劫持已经存在的属性，删除的、新添加的不行（vue里面为此单独写了一些 api：$set $delete）
        this.traverse(data)
    }

    traverse(data) { // 遍历对象，对属性依次劫持
        // ”重新定义“属性 性能差
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
    }
}

export function defineReactive(target, key, value) {
    observe(value) // 对所有的对象都进行属性劫持（深度劫持）
    Object.defineProperty(target, key, {
        get() {
            console.log('用户取值了')
            return value
        },
        set(newValue) {
            if(newValue === value) return
            console.log('用户修改值了')
            value = newValue
        }
    })
}

export function observe(data) {
    // 对这个对象进行劫持
    if (typeof data !== 'object' || data === null) return // 只对对象进行劫持

    // 如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过）
    return new Observer(data)
}