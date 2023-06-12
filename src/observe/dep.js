let id = 0
class Dep {
    constructor() {
        this.id = id++
        // 属性的dep要收集watcher
        this.subs = [] // 这里存放着当前属性对应的watcher有哪些
    }

    // 向收集器中存放watcher
    depend() {
        // 这里我们不希望存放重复的watcher,而且刚才只是一个单向的关系: dep -> watcher
        // 同时，我们也希望watcher能够记住dep

        // this.subs.push(Dep.target)
        Dep.target.addDep(this) // 让watcher记住dep
    }

    addSub(watcher) {
        this.subs.push(watcher)
    }

    // 通知所有的watcher进行更新，重新渲染模板
    notify() {
        this.subs.forEach(watcher => watcher.update())
    }
}

Dep.target = null // Dep.target用来存放当前的wathcer实例
let stack = []

export function pushTarget(watcher) {
    stack.push(watcher)
    Dep.target = watcher
}

export function popTarget() {
    stack.pop()
    Dep.target = stack[stack.length - 1]
    console.log(`执行完的watcher出栈，当前watcher重新定位为：`, stack.length ? Dep.target : '当前栈中没有任何watcher')
}

export default Dep

// dep 和 watcher 是一个多对多的关系（一个属性可以在多个组件中使用 dep -> 多个watcher）
// 一个组件中有多个属性（watcher -> 多个dep）