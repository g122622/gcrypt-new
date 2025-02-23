import { defineConfig } from "@farmfe/core";
import vue from "@vitejs/plugin-vue";
import path from "path";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import less from "@farmfe/js-plugin-less";
const process = require("process");
const os = require("os");

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
    vitePlugins: [nodePolyfills(), vue()],
    plugins: [less()],
    compilation: {
        resolve: {
            alias: {
                "@": path.join(process.cwd(), "src")
            }
        },
        define: {
            COMPILE_DATE: JSON.stringify(new Date().toLocaleString()),
            COMPILE_NUMBER: JSON.stringify(generateBuildNumber()),
            COMPILE_PLATFORM: JSON.stringify(process.platform + " " + os.version() + " " + os.release()),
            COMPILE_ENV: JSON.stringify(JSON.stringify(process.env, undefined, 4)),
            COMPILE_CPU: JSON.stringify(JSON.stringify(os.cpus(), undefined, 4)),
            COMPILE_MEM: JSON.stringify(`total: ${prettyBytes(totalMem)}, free: ${prettyBytes(freeMem)}`)
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
