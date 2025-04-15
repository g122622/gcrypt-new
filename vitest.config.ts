import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";
import nodePolyfills from "vite-plugin-node-stdlib-browser";

export default defineConfig({
    test: {
        alias: {
            "@": path.join(process.cwd(), "src")
        },
        environment: "jsdom",
    },
    plugins: [vue(), nodePolyfills()],
});
