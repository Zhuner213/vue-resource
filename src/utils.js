// 静态方法
const strats = {} // 策略对象
const LIFECYCLE = [
    'beforeCreate',
    'created'
]
LIFECYCLE.forEach(hook => {
    strats[hook] = function (p, c) {
        // 
        if (c) {
            if (p) {
                // 如果儿子有并且父亲也有，则让父亲和儿子拼接在一起（此时父亲必定为数组）
                return p.concat(c)
            } else {
                // 如果儿子有父亲没有，此时对应第一次合并的情况，则直接将儿子包装成数组返回即可，这样一来，后续父亲就会有值并且为数组
                return [c]
            }
        } else {
            // 如果儿子没有，则直接返回父亲即可
            return p
        }
    }
})
// 将儿子和父亲合并 
export function mergeOptions(parent, child) {
    const options = {}

    for (let key in parent) { // 循环父亲
        mergeField(key)
    }
    for (let key in child) { // 循环儿子
        if (!parent.hasOwnProperty(key)) {
            mergeField(key)
        }
    }

    function mergeField(key) {
        // 策略模式，减少if/else
        if (strats[key]) {
            options[key] = strats[key](parent[key], child[key])
        } else {
            // 如果不在策略中则以儿子为主
            options[key] = child[key] || parent[key] // 优先采用儿子，再采用父亲
        }

    }

    return options
}