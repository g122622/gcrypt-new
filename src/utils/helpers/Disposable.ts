/**
 * File: \src\utils\helpers\Disposable.ts
 * Description: 实现 IDisposable 接口的基类
 * Detail: 实现 IDisposable 接口的基类，提供注册和释放资源的方法，并提供是否已释放的状态
 * Note: 该类主要用于管理生命周期相关的资源，如事件监听、定时器、已打开的文件资源等。
 * Project: Gcrypt
 * Modified By: Guoyi
 * -----
 * Copyright (c) 2024 Guoyi Inc.
 *
 * ------------------------------------
 */

import { error, warn } from "../gyConsole";

interface IDisposable {
    dispose(): Promise<void> | void;
}

class Disposable implements IDisposable {
    // 存储需要释放的资源
    private _disposables = new Set<IDisposable>();
    // 标记是否已释放
    private _isDisposed = false;

    /**
     * 注册一个可释放对象
     * @param disposable 需要管理生命周期的对象
     * @returns 返回入参以便链式调用
     */
    protected _register<T extends IDisposable>(disposable: T): T {
        if (!disposable) {
            error("Cannot register null or undefined disposable");
            return disposable;
        }
        if (this._isDisposed) {
            warn("Cannot register disposable on a disposed object");
            disposable.dispose();
            return disposable;
        } else {
            if ((disposable as unknown as Disposable) === this) {
                throw new Error("Cannot register a disposable on itself!");
            }
            this._disposables.add(disposable);
        }
        return disposable;
    }

    /**
     * 释放所有资源。这个函数不允许被重写。
     */
    async dispose() {
        if (this._isDisposed) return;
        // 遍历释放所有资源
        const promises = [] as Array<Promise<void>>; // 存储所有异步任务的 Promise
        this._disposables.forEach(disposable => {
            try {
                const promise = disposable.dispose();
                if (promise && typeof promise.then === "function") {
                    promises.push(promise);
                }
            } catch (e) {
                console.error("Error disposing object:", e);
            }
        });

        return Promise.all(promises)
            .then(() => {
                this._disposables.clear();

                // 清除这个对象的所有属性（除了 _isDisposed）
                for (const key in this) {
                    if (key !== "_isDisposed" && this.hasOwnProperty(key)) {
                        delete this[key];
                    }
                }

                // success("Disposed object successfully");

                this._isDisposed = true;
            })
            .catch(e => {
                console.error("Error disposing objects:", e);
                this._isDisposed = false;
            });
    }

    /**
     * 检查是否已释放
     */
    get isDisposed(): boolean {
        return this._isDisposed;
    }
}

export { Disposable };
export type { IDisposable };
