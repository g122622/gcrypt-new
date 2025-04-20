import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
// import electron from "@farmfe/js-plugin-electron";

export default defineConfig({
    test: {
        alias: {
            "@": path.join(process.cwd(), "src")
        },
        environment: "jsdom"
        // browser: {
        //     provider: "playwright", // or 'webdriverio'
        //     enabled: true,
        //     // at least one instance is required
        //     instances: [{ browser: "chromium" }]
        // }
    },
    plugins: [
        vue(),
         nodePolyfills(),
        //  electron({
        //     main: {
        //         input: "background.js", // 主进程的入口文件
        //     }
        //  })
        ]
});
