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

interface IDisposable {
    dispose(): void;
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
        if (this._isDisposed) {
            console.warn("Cannot register disposable on a disposed object");
            disposable.dispose();
        } else {
            this._disposables.add(disposable);
        }
        return disposable;
    }

    /**
     * 释放所有资源。这个函数不允许被重写。
     */
    dispose(): void {
        if (this._isDisposed) return;

        this._isDisposed = true;

        // 遍历释放所有资源
        try {
            this._disposables.forEach(disposable => {
                try {
                    disposable.dispose();
                } catch (e) {
                    console.error("Error disposing object:", e);
                }
            });
        } finally {
            this._disposables.clear();
        }
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
