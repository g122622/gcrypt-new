// This file is used to test the LRUCache class.
import { describe, expect, test } from "vitest";
import LRUCache from "@/utils/helpers/LRUCache";

describe("LRUCache", () => {
    // 测试构造函数参数校验
    test("constructor should throw error for non-positive maxSize", () => {
        expect(() => new LRUCache(0)).toThrow("maxSizeInBytes must be a positive number");
        expect(() => new LRUCache(-5)).toThrow("maxSizeInBytes must be a positive number");
    });

    // 测试基础插入和查询功能
    test("should put and get values correctly", () => {
        const cache = new LRUCache(12);
        const buf1 = Buffer.from("value1");
        const buf2 = Buffer.from("value2");

        cache.put("key1", buf1);
        cache.put("key2", buf2);

        expect(cache.get("key1")).toBe(buf1);
        expect(cache.get("key2")).toBe(buf2);
        expect(cache.getcurrentSizeInBytes()).toBe(buf1.byteLength + buf2.byteLength);
    });

    // 测试LRU淘汰策略（简单淘汰场景）
    test("should evict least recently used item when capacity exceeded", () => {
        const cache = new LRUCache(5);
        // 插入三个元素，总容量 2+2+2=6 >5
        cache.put("a", Buffer.alloc(2));
        cache.put("b", Buffer.alloc(2));
        cache.put("c", Buffer.alloc(2));

        // 验证最旧的元素a被淘汰
        expect(cache.get("a")).toBeUndefined();
        expect(cache.get("b")).toBeDefined(); // b保留
        expect(cache.get("c")).toBeDefined(); // c保留
        expect(cache.getcurrentSizeInBytes()).toBe(4); // 2+2
    });

    // 测试LRU淘汰策略（访问顺序影响淘汰结果）
    test("should maintain correct LRU order after access", () => {
        const cache = new LRUCache(7);
        cache.put("a", Buffer.alloc(2)); // size2
        cache.put("b", Buffer.alloc(2)); // size2
        cache.put("c", Buffer.alloc(2)); // size2 → total6

        // 访问最旧元素a使其成为最新
        cache.get("a");

        // 插入新元素触发淘汰（7-6+3=4 → 需要淘汰）
        cache.put("d", Buffer.alloc(3)); // total6+3=9 >7

        // 应当淘汰未被访问的b（当前链表顺序 d->a->c->b）
        expect(cache.get("b")).toBeUndefined();
        expect(cache.getcurrentSizeInBytes()).toBe(2 + 2 + 3); // a,c,d → total7
    });

    // 测试节点更新逻辑（大小变化）
    test("should handle key update with size change", () => {
        const cache = new LRUCache(10);
        cache.put("key", Buffer.alloc(3)); // size3
        cache.put("key", Buffer.alloc(5)); // 更新后size5

        expect(cache.getcurrentSizeInBytes()).toBe(5);
        expect(cache.get("key")?.byteLength).toBe(5);
    });

    // 测试大文件立即淘汰场景
    test("should immediately evict oversized item", () => {
        const cache = new LRUCache(10);
        cache.put("big", Buffer.alloc(15)); // 直接触发淘汰

        expect(cache.get("big")).toBeUndefined();
        expect(cache.getcurrentSizeInBytes()).toBe(0);
    });

    // 测试边界条件（刚好达到最大容量）
    test("should handle exact maxSize match", () => {
        const cache = new LRUCache(6);
        cache.put("a", Buffer.alloc(2));
        cache.put("b", Buffer.alloc(2));
        cache.put("c", Buffer.alloc(2)); // total6

        // 插入相同容量元素应当触发淘汰
        cache.put("d", Buffer.alloc(2)); // total6+2=8 >6

        // 应当淘汰最旧的a
        expect(cache.get("a")).toBeUndefined();
        expect(cache.getcurrentSizeInBytes()).toBe(6); // b(2)+c(2)+d(2)=6
    });

    // 测试混合操作场景
    test("should handle complex sequence of operations", () => {
        const cache = new LRUCache(15);
        // 初始化状态
        cache.put("a", Buffer.alloc(5)); // size5, [a(5)]
        expect(cache.getcurrentSizeInBytes()).toBe(5);
        cache.put("b", Buffer.alloc(5)); // size5 → total10, [b(5), a(5)]
        expect(cache.getcurrentSizeInBytes()).toBe(10);
        cache.get("a"); // 将a设为最近使用 // [a(5), b(5)]
        expect(cache.getcurrentSizeInBytes()).toBe(10);

        // 插入新元素（总容量 10+3=13）
        cache.put("c", Buffer.alloc(3)); // total13, [c(3), a(5), b(5)]
        expect(cache.getcurrentSizeInBytes()).toBe(13);

        // 更新已有元素（新容量 13 - 5 + 7 = 15）
        cache.put("b", Buffer.alloc(7)); // total15, [b(7), c(3), a(5)]
        expect(cache.getcurrentSizeInBytes()).toBe(15);

        // 插入新元素触发淘汰
        cache.put("d", Buffer.alloc(4)); // total14, [d(4), b(7), c(3)]
        expect(cache.get("a")).toBeUndefined();
        expect(cache.getcurrentSizeInBytes()).toBe(14);
    });
});
