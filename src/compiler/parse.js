const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 匹配到的分组是一个 标签名 <div 匹配到的是开始标签的名字
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`) // 匹配的是 </xxx> 最终匹配到的分组就是结束标签的名字
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // 匹配属性
//                     ｜    分组1   ｜     ｜2｜      ｜分组3｜    ｜分组4｜   /   分组5   /
// 分组0是匹配到的整体，分组1是属性的 key，value 是 分组 3｜4｜5
const startTagClose = /^\s*(\/?)>/ // 开始标签的结束 > 或 />（自闭合）
export const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g // {{ name }} 匹配到的内容就是我们表达式的变量

// vue3 采用的不是正则

// 对模版进行编译处理
export function parseHTML(htmlStr) {

    // 切除已经解析过的内容
    function advance(n) {
        htmlStr = htmlStr.slice(n)
    }

    // 解析开始标签的结束 > 或 />
    function parseStartTagClose() {
        return htmlStr.match(startTagClose)
    }

    // 解析标签内的属性
    function parseAttribute() {
        return htmlStr.match(attribute)
    }

    // 解析开始标签 <div
    function parseStartTag() {
        const start = htmlStr.match(startTagOpen)

        // 如果匹配到了，则说明当前是开始标签，否则是结束标签
        if (start) {
            const match = {
                tagName: start[1], // 标签名
                attrs: []
            }
            // 将开始标签 <div 切除，接下来准备解析标签内的 属性
            advance(start[0].length)

            // 解析标签内的属性：只要没有碰到 开始标签的结束 > 或 />，就一直解析下去
            let attr
            while (!parseStartTagClose()) {
                attr = parseAttribute()
                if (attr) {
                    // 将属性推入 match对象 的attrs中
                    match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] || true })
                    // 每解析完一组属性就要将其切除
                    advance(attr[0].length)

                } else {
                    throw new Error('Syntax Error: 标签内属性语法不规范')
                }
            }
            // 当走到这里，说明已经解析到了 开始标签的结束 > 或 />
            // 此时将其切除即可
            const end = parseStartTagClose()
            advance(end[0].length)

            return match
        }

        return false
    }

    // 解析文本内容
    function parseText(textEnd) {
        return htmlStr.slice(0, textEnd)

    }

    // 解析结束标签
    function parseEndTag() {
        return htmlStr.match(endTag)
    }

    // 最终需要转化成一棵 ast抽象语法树
    function createASTElement(tag, attrs) {
        return {
            tag,
            attrs,
            parent: null,
            children: [],
            type: ELEMENT_TYPE
        }
    }

    const ELEMENT_TYPE = 1 // 元素节点 类型
    const TEXT_TYPE = 3 // 文本 类型
    const stack = []
    let root = null // 根节点，也是最后拼装完成返回去的 完整ast树对象
    let currentParent = null // 当前的父节点：永远指向栈中最后一个元素

    function onStartTag(tag, attrs) {
        // 碰到开始标签，需要创建一个新的 ast节点
        const node = createASTElement(tag, attrs)
        // 新 ast节点入栈
        stack.push(node)
        // 判断当前创建的新 ast节点 是否是整棵树的 根节点
        if (!root) root = node // 如果当前 root 为空，则说明当前创建的为整棵树的根节点

        // 如果当前父元素不为空
        if (currentParent) {
            // 则创建的新 ast节点 就为当前父元素的 children
            currentParent.children.push(node)
            // 创建的新 ast节点 的parent 就为当前父元素
            node.parent = currentParent
        }

        // 插入完成之后 新创建的 ast节点 就变成了新的 当前父元素
        currentParent = node

    }

    function onText(text) {
        // 去除文本中的多余空格
        text = text.replace(/\s/g, '') // 如果空格超过2，就删除2个以上的
        // 碰到不为空的文本内容，则直接插入到当前父元素的 children 中
        text && currentParent.children.push({
            text,
            type: TEXT_TYPE,
            parent: currentParent
        })
    }

    function onEndTag(tag) {
        // 碰到结束标签，则说明配对陈坤，将栈中最后一个元素弹出（即匹配的开始标签）
        stack.pop()
        // 之后移交 currentParent指针的指向
        currentParent = stack[stack.length - 1]
    }

    while (htmlStr) {
        // html 最开始肯定是一个 <，通过 < 所处的位置来判断当前是什么内容
        let textEnd = htmlStr.indexOf('<')

        // 如果 textEnd === 0，说明是一个开始标签或者结束标签
        if (textEnd === 0) {
            const startTagMatch = parseStartTag() // 开始标签的匹配结果

            // 如果能拿到开始标签的匹配结果，说明成功匹配到开始标签
            if (startTagMatch) {
                // 传入开始标签的数据，构建 ast
                onStartTag(startTagMatch.tagName, startTagMatch.attrs)
                continue
            }

            // 走到这就说明是当前结束标签了
            const end = parseEndTag()
            if (end) {
                // 切除结束标签
                advance(end[0].length)
                // 传入结束标签的数据，构建 ast
                onEndTag(end[1])
                continue
            }
            break
        }

        // 如果 textEnd > 0，说明就是文本的结束位置
        if (textEnd > 0) {
            let text = parseText(textEnd)
            // 切除文本
            advance(text.length)
            // 传入文本的数据，构建 ast
            onText(text)
        }
    }

    return root
}