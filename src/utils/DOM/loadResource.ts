// 动态创建并插入link元素以加载CSS
const loadCss = (url: string) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;
    document.head.appendChild(link);
};

/**
 * 动态创建并插入script元素以加载JavaScript文件
 * @param url 资源路径
 * @param callback 回调函数，成功时传入null，失败时传入Error对象
 */
const loadScript = (url: string, callback: (err) => void) => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    if (callback) {
        script.onload = function () {
            callback(null); // 成功加载时调用回调函数
        };
        script.onerror = function (evt) {
            console.error("Failed to load script: " + url, evt);
            callback(new Error("Failed to load script: " + url)); // 加载失败时调用回调函数
        };
    }
    document.head.appendChild(script);
};

export { loadCss, loadScript };
