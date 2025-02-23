import { isNodeJS } from "../platform";

// 创建一个模拟的 process 对象
const mockProcess = {
    platform: "web",
    env: {
        NODE_ENV: "development"
    },
    pid: 1234,
    memoryUsage: function () {
        // 返回一个模拟的内存使用情况
        return {
            rss: 1024 * 1024, // 假设 RSS 为 1MB
            heapTotal: 1024 * 1024, // 假设堆总大小为 1MB
            heapUsed: 512 * 1024, // 假设堆已使用大小为 512KB
            external: 0,
            arrayBuffers: 0
        };
    },
    exec: function (command, callback) {
        // 拟执行命令
        setTimeout(() => {
            callback(null, `Executed command: ${command}`);
        }, 100);
    },
};

export default function mockNodeProcess() {
    // // 如果是在 Node.js 环境下，不进行模拟
    // if (isNodeJS()) {
    //     return;
    // }
    // // 将模拟的 process 对象挂载到 window 对象上
    // window.process = mockProcess;
}
