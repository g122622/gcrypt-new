export default function downloadBufferFile(buffer: ArrayBuffer, fileName: string) {
    // 创建一个Blob对象，指定数据和MIME类型
    const blob = new Blob([buffer], { type: "application/octet-stream" });

    // 创建一个隐藏的<a>元素
    const a = document.createElement("a");
    a.style.display = "none";

    // 创建一个指向Blob对象的URL
    const url = URL.createObjectURL(blob);

    // 设置<a>元素的href属性为刚刚创建的URL
    a.href = url;

    // 设置下载属性，即用户点击时默认操作是下载
    a.download = fileName;

    // 将<a>元素添加到DOM中
    document.body.appendChild(a);

    // 自动触发点击事件
    a.click();

    // 移除<a>元素
    document.body.removeChild(a);

    // 释放之前创建的对象URL
    URL.revokeObjectURL(url);
}
