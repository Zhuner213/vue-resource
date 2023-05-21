import { defaultTagRE, parseHTML } from "./parse"

// 对 ast抽象语法树 中的 attrs 的 style作特殊的格式处理
function transStyle(value) {
    return value.split(';').reduce((obj, item) => {
        const itemArr = item.split(':') // itemArr 是拆开后的 style 属性：['color', 'red']
        const key = itemArr[0]
        const value = itemArr[1]
        obj[key] = value
        return obj
    }, {})
}

// 生成 渲染代码 的「属性」部分
function genProps(attrs) {
    // 遍历 attrs属性数组，然后拼接成：{ id: 'app', style: {color: 'red', bacground: 'yellow'} } 这种字符串形式
    // 因为是遍历数组，最后还需返回一个对象，这里我们想到 reduce 方法
    return JSON.stringify(attrs.reduce(
        (obj, attr) => {
            const key = attr['name']
            const value = attr['value']
            // 如果属性名是 style，则要进行特殊的格式处理 -> style: {color: 'red', bacground: 'yellow'}
            // 若属性名是 style，则此处 value 在处理前是这样的：'color: red; font-size: 16px;'
            obj[key] = key === 'style' ? transStyle(value) : value
            return obj
        }, {}))
}

// 生成 渲染代码 的「孩子」部分
function genChild(children) {
    // 孩子可能有一个或多个
    let childCode = ',' // 最终需要拼接回去（拼回 主渲染代码）的 孩子代码
    children.forEach((child, index) => {
        // 如果当前孩子的类型是 元素节点 类型，则需要生成 渲染代码
        if (child.type === 1) {
            childCode += codegen(child) + ','
        }

        // 如果当前孩子的类型是 文本 类型，则要判断出哪些是 {{}}，哪些是普通文本，二者要区分开来
        if (child.type === 3) {
            const text = child.text
            let token = '' // 用来拼装 _v(_s(name))这种
            // 这里要一直匹配，直到文本中 所有的 {{}} 都被匹配完
            let match
            let preLastIndex = 0 // 记录上一次匹配开始的位置
            while(match = defaultTagRE.exec(text)) {
                const lastIndex = defaultTagRE.lastIndex
                // 如果上一次 匹配开始的位置 在此次匹配到的开始位置index 之前，则说明中间有不是 {{}} 的文本内容
                if(preLastIndex < match.index) {
                    token += `+'${text.slice(preLastIndex, match.index)}'`
                }
                token += `+_s(${match[1]})`
                preLastIndex = lastIndex
            }
            if(preLastIndex < text.length) {
                // 说明后面还有非 {{}} 的文本内容，需要加上
                token += `+'${text.slice(preLastIndex)}'`
            }
            childCode += `_v(${token.slice(1)}),`
        }
    })
    return childCode.slice(0, -1) // 去掉最后一个孩子后面的 ','
}

// 生成 渲染代码
function codegen(ast) {
    let codeStr = '' // 利用 ast抽象语法树 生成的 渲染代码
    codeStr = `_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : undefined}${ast.children.length > 0 ? genChild(ast.children) : undefined})`

    return codeStr
}

// render() {
//    return _c('div', { id: 'app', style: {color: 'red', bacground: 'yellow'} }, _c('div', { style: {color: red} }, _v(_s(name) + 'hello') ), _c('span', null, _v(_s(age))) )
// }

export function compileToFunction(template) {
    // 1.将 template 转化成 ast 语法树
    // template是一段 outerHTML文本
    const ast = parseHTML(template)

    // console.log(ast)
    // 2.生成 render方法（render方法执行后的返回结果就是 虚拟DOM）

    // 模版引擎的实现原理 就是 with + new Function
    let code = codegen(ast)
    code = `with(this){return ${code}}`
    // console.log(code)
    const render = new Function(code)
    // console.log(render)

    return render
}