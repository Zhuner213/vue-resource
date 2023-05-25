import Dep from "./dep"

let id = 0

// 1）当我们创建渲染watcher的时候，我们会把当前的渲染watcher放到Dep.target上
// 2）调用 _render() 会取值，走到get上（Object.defineProperty） 

// 每个属性都有一个dep（属性就是被观察者），watcher就是观察者（属性变化了会通知观察者来更新）-> 观察者模式

class Wacther { // 不同组件有不同的watcher，目前只有一个：渲染根实例的
    constructor(vm, fn, isRender) { // fn就是传进来的 () => { vm._update(vm._render()) }
        this.id = id++
        this.renderWatcher = isRender // 标识此watcher是否为一个渲染watcher
        this.getter = fn // getter意味着调用这个函数可以发生取值操作
        this.deps = [] // 后续我们实现计算属性，和一些清理工作需要用到
        this.depsId = new Set() // 用于存储dep的id，去重使用

        this.get()
    }

    get() {
        Dep.target = this // 静态属性只有一份
        this.getter() // 会去vm上取值 vm._update(vm._render())
        Dep.target = null // 渲染完毕后就清空
    }

    addDep(dep) { // 一个组件对应着多个属性，重复的属性也不记录
        let id = dep.id
        if (!this.depsId.has(id)) {
            this.deps.push(dep)
            this.depsId.add(id)
            // watcher已经记住了dep并且去重了，此时让dep也记住watcher
            dep.addSub(this)
        }
    }

    // 重新渲染更新模板
    update() {
        this.get()
    }
}

export default Wacther

// 需要给每个属性增加一个dep，目的就是收集watcher

// 一个组件中 有多个属性（n个属性对应一个组件）：n个dep中都收集着同一个watcher
// 一个属性 对应着 多个组件：1个dep中收集了多个watcher
// 多对多的关系