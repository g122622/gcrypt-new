/**
 * 动态切换页面 favicon 的函数
 * @note 这个函数必须零状态、零外部依赖。因为要放在类似eval这种函数中在其他标签页执行，不能依赖其他函数。
 * @param dataURL - 图片的 dataURL 字符串，格式如：data:image/png;base64,...
 */
const changeFavicon = (dataURL: string): void => {
    // 解析 dataURL 获取 MIME 类型
    const metaPart = dataURL.split(",")[0]; // 提取 metadata 部分
    const mimeMatch = metaPart.match(/^data:(image\/[^;]+)/i); // 使用正则匹配图片类型

    // 验证是否为合法的图片 dataURL
    if (!mimeMatch) {
        throw new Error('Invalid dataURL format. Must start with "data:image/"');
    }

    const mimeType = mimeMatch[1]; // 提取 MIME 类型，如 image/png
    console.log(`Setting favicon to ${mimeType}`);

    // 查询所有相关 link 标签（包含 icon 或 shortcut icon 的 rel 属性）
    const selectors = ['link[rel~="icon"]', 'link[rel="shortcut icon"]'];
    const links = Array.from(document.querySelectorAll(selectors.join(","))) as HTMLLinkElement[];

    if (links.length > 0) {
        console.log(`Replacing ${links.length} existing link tags`);
        // 替换现有 link 标签以触发浏览器更新
        links.forEach(link => {
            const clone = link.cloneNode() as HTMLLinkElement; // 克隆节点保持其他属性
            clone.href = dataURL; // 更新 href
            clone.type = mimeType; // 更新 MIME 类型
            link.parentNode?.replaceChild(clone, link); // 用克隆节点替换原节点
        });
    } else {
        console.log("Creating new link tag");
        // 创建新 link 标签（现代浏览器标准用法）
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = mimeType;
        link.href = dataURL;
        document.head.appendChild(link);

        const link2 = document.createElement("link");
        link2.rel = "shortcut icon";
        link2.type = mimeType;
        link2.href = dataURL;
        document.head.appendChild(link2);
    }

    // 兼容性处理：部分浏览器需要触发重绘
    setTimeout(() => {
        // 通过临时修改并恢复 document.title 强制更新 UI
        const { title } = document;
        document.title = "";
        document.title = title;
    }, 50);
};

export default changeFavicon;
