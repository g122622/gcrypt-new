/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * File: \src\utils\ASSERT.ts
 * Project: Gcrypt
 * Created Date: 2023-11-26 17:14:30
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-15 10:15:49
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import { error } from "./gyConsole";
import { abort } from "process";
import { isNodeJS } from "@/platform/platform";

function AEESRT_FOR_WEB(condition: any) {
    // 浏览器环境下，通过alert达到阻塞整个页面的效果，并提示用户出错的调用栈
    if (!condition) {
        error("ASSERT FAILED");
        const stack = new Error().stack || "No stack trace available";
        alert(`ASSERTION FAILED!\n\nStack trace:\n${stack}`);
        // 在浏览器中不调用 abort()，因为它是 Node.js 的 API
        // 可以抛出错误以便开发者捕获或让程序停止执行
        throw new Error("Assertion failed in browser environment");
    }
}

function ASSERT_FOR_NODE(condition: any) {
    if (!condition) {
        error("ASSERT FAILED");
        console.trace();
        if (process.env.NODE_ENV === "development") {
            return;
        }
        abort();
    }
}

export default function ASSERT(condition: any) {
    if (isNodeJS()) {
        ASSERT_FOR_NODE(condition);
    } else {
        AEESRT_FOR_WEB(condition);
    }
}
