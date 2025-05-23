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

export default function ASSERT(condition: any) {
    if (!condition) {
        error("ASSERT FAILED");
        console.trace();
        if (process.env.NODE_ENV === "development") {
            return;
        }
        abort();
    }
}
