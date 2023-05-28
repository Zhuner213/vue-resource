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

    // 将当前watcher存放进队列进行等待
    update() {
        queueWatcher(this)
    }

    // 重新渲染更新模板
    run() {
        this.get() // 渲染的时候用的是最新的vm来渲染的
    }
}

let queue = [] // 存储将要执行的watcher的队列
let has = {} // 用于去重的对象
let pending = false // 防抖

function flushSchedulerQueue() {
    const flushQueue = queue.slice(0)
    queue = []
    has = {}
    pending = false
    flushQueue.forEach(watcher => watcher.run()) // 在刷新过程中可能还会有新的watcher，重新放到queue中
}

function queueWatcher(watcher) {
    const id = watcher.id
    // 如果去重对象中不包含当前watcher的id，则说明当前watcher没有添加进队列，可以进行push操作
    if (!has[id]) {
        has[id] = true
        queue.push(watcher)
        // 不管我们的update执行多少次，但是最终只执行一轮刷新操作
        if (!pending) {
            nextTick(flushSchedulerQueue)
            pending = true
        }
    }

}

let callbacks = []
let waiting = false

function flushCallbacks() {
    const cbs = callbacks.slice(0)
    callbacks = []
    waiting = false
    cbs.forEach(cb => cb()) // 按照顺序依次执行
}

// nextTick没有直接使用某个api，而是采用优雅降级的方式
// 内部先采用的是promise（ie不兼容）=> MutationObserver（h5的api）=> setImmediate（ie专享）=> setTimeout（终极方案）
let timerFunc
if(Promise) {
    timerFunc = () => {
        Promise.resolve().then(flushCallbacks)
    }
}else if(MutationObserver) {
    let observer = new MutationObserver(flushCallbacks) // 这里传入的回调是异步执行的
    let textNode = document.createTextNode(1)
    observer.observe(textNode, {
        characterData: true
    })
    timerFunc = () => {
        textNode.textContent = 2
    }
}else if(setImmediate) {
    timerFunc = () => {
        setImmediate(flushCallbacks)
    }
}else {
    timerFunc = () => {
        setTimeout(flushCallbacks)
    }
}

export function nextTick(cb) { // 先执行内部的还是先执行用户的？（看谁先调用）
    callbacks.push(cb) // 维护nextTick中的callback方法
    if (!waiting) {
        timerFunc() // 最后一起刷新
        waiting = true
    }
}

export default Wacther

// 需要给每个属性增加一个dep，目的就是收集watcher

// 一个组件中 有多个属性（n个属性对应一个组件）：n个dep中都收集着同一个watcher
// 一个属性 对应着 多个组件：1个dep中收集了多个watcher
// 多对多的关系