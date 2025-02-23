import notification from "@/api/notification";
import getMimeType from "../file/getMimeType";
import { IDisposable } from "../helpers/Disposable";

let number = 1;

export default function openBufferFileInNewTab(buffer: ArrayBuffer, fileName: string): IDisposable {
    // 创建 Blob 对象
    const blob = new Blob([buffer], { type: getMimeType(fileName) });

    // 创建一个 object URL
    const url = URL.createObjectURL(blob);

    // 打开一个新的标签页
    const newTab = window.open(url, fileName);

    if (newTab) {
        // 在新标签页中添加 img 标签并设置 src 属性
        newTab.document.write(`
          <html>
            <body style="margin:0;">
              <!-- 标题 -->
              <div id="title">[${number}] ${fileName}</div>
              <img src="${url}" />
            </body>
            <style>
            /* 现代化的圆角样式，力求美观 */
              #title {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                /*consolas*/
                font-family: "Consolas", "Courier New", "Courier", monospace;
              }
            </style>
          </html>
        `);

        // 设置新标签页标题
        newTab.document.title = `[${number}] ${fileName}`;
        number++;

        // 清除 object URL，释放内存
        newTab.onload = () => URL.revokeObjectURL(url);
    } else {
        notification.error("未能打开新标签页，请检查浏览器设置");
    }

    return {
        dispose: () => {
            // 关闭标签页
            if (newTab) {
                newTab.close();
            }
        }
    };
}
