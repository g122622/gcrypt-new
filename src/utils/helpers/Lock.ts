/**
 * File: \src\utils\helpers\Lock.ts
 * Project: Gcrypt
 * Created Date: 2024-02-16 15:32:34
 * Author: Guoyi
 * -----
 * Last Modified: 2024-02-16 16:23:40
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

abstract class ILock {
    /**
     * 返回一个promise，直到锁被释放，这个promise才被兑现。
     */
    public abstract lock(): Promise<void>;
    public abstract unlock(): void;
    public abstract unlockAll(): void;
}

class Lock implements ILock {
    // 等待队列
    public lockedQueue = null;

    public async lock() {
        if (this.lockedQueue === null) {
            this.lockedQueue = [];
        } else {
            await new Promise(resolve => this.lockedQueue.push(resolve));
        }
    }

    public unlock() {
        if (this.lockedQueue && this.lockedQueue.length) {
            this.lockedQueue.shift()();
        } else {
            this.lockedQueue = null;
        }
    }

    public unlockAll() {
        if (this.lockedQueue) {
            while (this.lockedQueue.length) {
                this.lockedQueue.shift()();
            }
            this.lockedQueue = null;
        }
    }
}

class NoopLock implements ILock {
    public lock() {
        return Promise.resolve();
    }
    public unlock() {}
    public unlockAll() {}
}

export { Lock, NoopLock, ILock };
