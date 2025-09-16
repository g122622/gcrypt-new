import notification from "@/backend/notification";
import getMimeType from "../file/getMimeType";
import { IDisposable } from "../helpers/Disposable";
import getFileType from "../file/getFileType";
import changeFavicon from "../DOM/changeFavicon";
import generateThumbnailUsingCanvas from "../image/generateThumbnailUsingCanvas";

let number = 1;

export default function openBufferFileInNewTab(buffer: ArrayBuffer, fileName: string): IDisposable {
    const mimeType = getMimeType(fileName);
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, fileName) as unknown as typeof window;

    if (newTab) {
        let contentHtml = "";
        const titleHtml = `
            <div id="title">[${number}] ${fileName}</div>
            <div id="title">Opened at ${new Date().toLocaleString()}</div>
        `;

        const fileType = getFileType(fileName);
        if (fileType === "img") {
            // 图片
            contentHtml = `<img src="${url}" style="max-width:100%;height:auto;display:block;margin:0 auto;">`;
        } else if (fileType === "audio") {
            // 音频
            contentHtml = `<audio controls src="${url}" style="display:block;margin:20px auto;"></audio>`;
        } else if (fileType === "video") {
            // 视频
            contentHtml = `<video controls src="${url}" style="max-width:100%;margin:0 auto;"></video>`;
        } else if (
            // 文本文件 / 代码文件
            fileType === "txt" ||
            fileType === "code" ||
            fileType === "config"
        ) {
            const text = new TextDecoder().decode(buffer);
            // 对文本内容进行转义，防止XSS攻击
            contentHtml = `<pre style="white-space:pre-wrap;padding:20px;background:#f8f9fa;border-radius:4px;margin:20px;">${text.replace(
                /[&<>"']/g,
                m =>
                    ({
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#39;"
                    }[m]!)
            )}</pre>`;
        } else {
            // 其他文件
            contentHtml = `
            <p style="text-align:center;">
                This file is not supported for preview. Please download it to view.
            </p>
            <a href="${url}" download="${fileName}" style="display:block;text-align:center;padding:20px;color:#0366d6;">
                Download File (${fileName})
            </a>`;
        }

        newTab.document.write(`
            <html>
                <head>
                    <title>[${number}] ${fileName}</title>
                    <style>
                        #title {
                            background: #f5f5f5;
                            padding: 12px;
                            border-radius: 6px;
                            font: 16px/1.5 Consolas, Courier New, monospace;
                            text-align: center;
                            margin: 10px;
                        }
                        body {
                            margin: 0;
                            padding: 20px;
                            background: white;
                        }
                    </style>
                </head>
                <body>
                    ${titleHtml}
                    ${contentHtml}
                </body>
            </html>
        `);

        newTab.document.close(); // Closes an output stream and forces the sent data to display.
        newTab.document.title = `[${number}] ${fileName}`;
        // 将changeFavicon函数注入到newTab中(通过script标签)
        generateThumbnailUsingCanvas(url, {
            width: 16,
            keepAspectRatio: true,
            outputType: "dataURL"
        }).then(dataURL => {
            console.log("生成的缩略图数据URL：" + dataURL);
            newTab.eval(`
                console.log("开始执行注入的代码");
                (${changeFavicon.toString()})('${dataURL}');
                console.log("注入的代码执行完毕")
            `);
        });

        number++;

        // 安全释放URL（当窗口关闭时）
        newTab.addEventListener("beforeunload", () => URL.revokeObjectURL(url));
    } else {
        notification.error("Failed to open new tab");
    }

    return {
        dispose: () => {
            URL.revokeObjectURL(url);
            newTab?.close();
        }
    };
}
