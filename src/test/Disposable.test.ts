import { describe, expect, test, beforeEach, vi } from "vitest";
import { Disposable, IDisposable } from "@/utils/helpers/Disposable";

// 模拟可释放对象
class MockDisposable implements IDisposable {
    public isDisposed = false;
    dispose() {
        this.isDisposed = true;
    }
}

// 模拟会抛出错误的对象
class ErrorDisposable implements IDisposable {
    dispose() {
        throw new Error("Dispose error");
    }
}

describe("Disposable", () => {
    let disposable: Disposable;

    beforeEach(() => {
        disposable = new Disposable();
    });

    test("初始状态应为未释放", () => {
        expect(disposable.isDisposed).toBe(false);
    });

    test("注册资源应添加到内部集合", () => {
        const mock = new MockDisposable();
        disposable["_register"](mock);
        expect((disposable as any)._disposables.has(mock)).toBe(true);
    });

    // test("释放后注册资源应立即释放并警告",async () => {
    //     await disposable.dispose();

    //     const mock = new MockDisposable();
    //     const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    //     disposable["_register"](mock);

    //     expect(mock.isDisposed).toBe(true);
    //     expect(consoleWarnSpy).toHaveBeenCalledWith("Cannot register disposable on a disposed object");
    //     consoleWarnSpy.mockRestore();
    // });

    test("释放时应清空所有资源", async () => {
        const mock1 = new MockDisposable();
        const mock2 = new MockDisposable();
        disposable["_register"](mock1);
        disposable["_register"](mock2);

        await disposable.dispose();

        expect(mock1.isDisposed).toBe(true);
        expect(mock2.isDisposed).toBe(true);
        expect((disposable as any)._disposables).toBe(undefined);
        expect(disposable.isDisposed).toBe(true);
    });

    test("多次释放应安全", async () => {
        const mock = new MockDisposable();
        disposable["_register"](mock);

        await disposable.dispose();
        await disposable.dispose(); // 二次调用

        expect(mock.isDisposed).toBe(true);
        expect((disposable as any)._disposables).toBe(undefined);
    });

    test("资源释放错误应被捕获并记录", () => {
        const errorDisposable = new ErrorDisposable();
        const normalDisposable = new MockDisposable();
        disposable["_register"](errorDisposable);
        disposable["_register"](normalDisposable);

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        disposable.dispose();

        expect(consoleErrorSpy).toHaveBeenCalledWith("Error disposing object:", expect.any(Error));
        expect(normalDisposable.isDisposed).toBe(true);
        consoleErrorSpy.mockRestore();
    });
});
