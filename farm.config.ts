import { defineConfig } from "@farmfe/core";
import vue from "@vitejs/plugin-vue";
import path from "path";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import less from "@farmfe/js-plugin-less";
import { VitePWA } from "vite-plugin-pwa";
import { execSync } from "child_process";
const process = require("process");
const os = require("os");

// 获取 Git 信息的辅助函数
function getGitInfo() {
    try {
        const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
        const commitDate = execSync("git log -1 --format=%cd --date=iso", { encoding: "utf8" }).trim();
        const commitMessage = execSync("git log -1 --format=%s", { encoding: "utf8" }).trim();

        return {
            hash,
            date: commitDate,
            message: commitMessage.replace(/[\r\n]/g, " ").trim() // 防止换行符破坏 JSON
        };
    } catch (error: any) {
        console.warn("⚠️ 无法获取 Git 信息（可能不在 Git 仓库中或 Git 未安装）:", error.message);
        return {
            hash: "unknown",
            date: "unknown",
            message: "unknown"
        };
    }
}

const gitInfo = getGitInfo();

// 生成从minNum到maxNum的随机数
const randomRange = function (minNum: number, maxNum: number): number {
    return Math.floor(Math.random() * (maxNum - minNum + 1) + minNum);
};

const generateBuildNumber = () => {
    const mapTable = "0123456789abcdef";
    let res = "";
    for (let i = 0; i < 20; i++) {
        res += mapTable[randomRange(0, mapTable.length - 1)];
    }
    return res;
};

function prettyBytes(bytes: number, decimals: number = 2) {
    if (isNaN(bytes)) return "unknown";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const totalMem = os.totalmem();
const freeMem = os.freemem();

export default defineConfig({
    vitePlugins: [
        nodePolyfills(),
        vue()
        // VitePWA({
        //     registerType: "autoUpdate",
        //     workbox: {
        //         globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
        //     },
        //     manifest: {
        //         name: "Gcrypt",
        //         short_name: "Gcrypt",
        //         description: "跨平台文件加密一站式解决方案",
        //         theme_color: "#000000",
        //         icons: [
        //             {
        //                 src: "pwa-192x192.png",
        //                 sizes: "192x192",
        //                 type: "image/png"
        //             },
        //             {
        //                 src: "pwa-512x512.png",
        //                 sizes: "512x512",
        //                 type: "image/png"
        //             }
        //         ]
        //     }
        // }),
    ],
    plugins: [less()],
    compilation: {
        resolve: {
            alias: {
                "@": path.join(process.cwd(), "src")
            }
        },
        define: {
            COMPILE_DATE: JSON.stringify(new Date().toISOString() + " UTC+0"),
            COMPILE_NUMBER: JSON.stringify(generateBuildNumber()),
            COMPILE_PLATFORM: JSON.stringify(process.platform + " " + os.version() + " " + os.release()),
            COMPILE_ENV: JSON.stringify(JSON.stringify(process.env, undefined, 4)),
            COMPILE_CPU: JSON.stringify(JSON.stringify(os.cpus(), undefined, 4)),
            COMPILE_MEM: JSON.stringify(`total: ${prettyBytes(totalMem)}, free: ${prettyBytes(freeMem)}`),
            // Git 信息
            GIT_COMMIT_HASH: JSON.stringify(gitInfo.hash),
            GIT_COMMIT_DATE: JSON.stringify(gitInfo.date),
            GIT_COMMIT_MESSAGE: JSON.stringify(gitInfo.message)
        },
        output: {
            publicPath: "/gcrypt/"
        },
        persistentCache: false
    },
    server: {
        port: 9001
        // ...
    }
});
