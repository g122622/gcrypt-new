import { Disposable } from "@/utils/helpers/Disposable";
import prettyBytes from "../prettyBytes";
import IKVPEngine from "@/api/core/types/IKVPEngine";

/**
 * LRUNode 是 LRUCache 中的节点。
 * 每个节点包含一个 key、一个 value 和一个 size，
 * 以及指向前一个节点和后一个节点的指针。
 */
class LRUNode {
    key: string;
    value: Buffer;
    size: number;
    prev: LRUNode | null;
    next: LRUNode | null;

    constructor(key: string, value: Buffer) {
        this.key = key;
        this.value = value;
        this.size = value.byteLength;
        this.prev = null;
        this.next = null;
    }
}

/**
 * LRUCache 是一个基于哈希表和双向链表的 LRU 缓存实现。
 * 它支持快速查找、插入和删除操作，并且可以根据缓存的大小自动删除最久未使用的节点。
 * 该缓存的最大容量和每个 key 对应的 buffer 最大容量都可以在初始化时指定。
 */
class LRUCache extends Disposable {
    private maxSizeInBytes: number; // 最大容量
    private maxPerKeySizeInBytes: number; // 每个 key 对应的 buffer 最大容量，超过该大小则无论如何都不会被缓存
    private currentSizeInBytes: number = 0; // 当前 key-value 的容量
    private hashMap: Map<string, LRUNode>; // 为了快速查找，使用哈希表存储节点
    private head: LRUNode;
    private tail: LRUNode;

    /**
     * constructor
     * @param maxSizeInBytes 最大容量
     * @param maxPerKeySizeInBytes 每个 key 对应的 buffer 最大容量，超过该大小则无论如何都不会被缓存
     */
    constructor(maxSizeInBytes: number, maxPerKeySizeInBytes?: number) {
        super();
        if (maxSizeInBytes <= 0) {
            throw new Error("maxSizeInBytes must be a positive number");
        }
        this.maxSizeInBytes = maxSizeInBytes;
        if (maxPerKeySizeInBytes < 0 || !maxPerKeySizeInBytes) {
            // default set to maxSizeInBytes
            this.maxPerKeySizeInBytes = maxSizeInBytes;
        } else {
            this.maxPerKeySizeInBytes = maxPerKeySizeInBytes;
        }
        this.hashMap = new Map();
        // 初始化虚拟头尾节点
        this.head = new LRUNode("", Buffer.alloc(0));
        this.tail = new LRUNode("", Buffer.alloc(0));
        this.head.next = this.tail;
        this.tail.prev = this.head;
        // 注册自身到 Disposable 管理器
        this._register({
            dispose: () => {
                this.hashMap.clear();
                this.head.next = null;
                this.tail.prev = null;
                this.head = null;
                this.tail = null;
                this.hashMap = null;
            }
        });
    }

    private addToHead(node: LRUNode): void {
        node.prev = this.head;
        node.next = this.head.next;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    private removeNode(node: LRUNode): void {
        const prevNode = node.prev!;
        const nextNode = node.next!;
        prevNode.next = nextNode;
        nextNode.prev = prevNode;
    }

    private moveToHead(node: LRUNode): void {
        this.removeNode(node);
        this.addToHead(node);
    }

    public put(key: string, value: Buffer): void {
        if (value.byteLength > this.maxPerKeySizeInBytes) {
            return; // 超过最大容量则不缓存
        }
        if (this.hashMap.has(key)) {
            // 更新现有节点
            const node = this.hashMap.get(key)!;
            this.currentSizeInBytes -= node.size;
            node.value = value;
            node.size = value.byteLength;
            this.currentSizeInBytes += node.size;
            this.moveToHead(node);
        } else {
            // 创建新节点
            const newNode = new LRUNode(key, value);
            this.hashMap.set(key, newNode);
            this.addToHead(newNode);
            this.currentSizeInBytes += newNode.size;
        }

        // 淘汰最近最少使用的节点，直到容量符合要求
        while (this.currentSizeInBytes > this.maxSizeInBytes && this.hashMap.size > 0) {
            const lruNode = this.tail.prev!;
            this.removeNode(lruNode);
            this.hashMap.delete(lruNode.key);
            this.currentSizeInBytes -= lruNode.size;
        }

        // console.log(`当前已用容量: ${prettyBytes(this.currentSizeInBytes)}，最大容量: ${prettyBytes(this.maxSizeInBytes)}`);
    }

    public get(key: string): Buffer | undefined {
        if (!this.hashMap.has(key)) {
            return undefined;
        }
        const node = this.hashMap.get(key)!;
        this.moveToHead(node);
        return node.value;
    }

    /**
     * 对上层应用暴露，用于移除指定 key 的缓存
     * @param key 键
     * @note 由于LRUCache会自动管理缓存的淘汰，因此上层应用调用这个方法的目的不应该是为了释放内存。
     */
    public remove(key: string): void {
        if (this.hashMap.has(key)) {
            const node = this.hashMap.get(key)!;
            this.removeNode(node);
            this.hashMap.delete(key);
            this.currentSizeInBytes -= node.size;
        }
    }

    // 获取当前缓存大小
    public getcurrentSizeInBytes(): number {
        return this.currentSizeInBytes;
    }

    // 获取缓存中的键数量
    public getKeyCount(): number {
        return this.hashMap.size;
    }
}

/**
 * LRU 缓存装饰器配置
 */
interface LRUConfig {
    maxSize: number;
    maxPerKeySize?: number;
}

/**
 * 为 KVPEngine 添加 LRU 缓存的类装饰器
 * @param config 缓存配置
 */
function WithLRUCache(config: LRUConfig): ClassDecorator {
    return function <T extends new (...args: any[]) => IKVPEngine>(target: T) {
        return class extends target {
            private cache: LRUCache;

            constructor(...args: any[]) {
                super(...args);
                this.cache = new LRUCache(config.maxSize, config.maxPerKeySize);
            }

            public init(...args: any[]): Promise<void> {
                return Promise.resolve()
            }

            public initWithConfig(...args: any[]): Promise<void> {
                return Promise.resolve()
            }

            public async hasData(key: string): Promise<boolean> {
                // 尝试从缓存读取
                const cachedData = this.cache.get(key);
                if (cachedData) return true;

                // 缓存未命中则走原始逻辑
                return super.hasData(key);
            }

            public async getData(key: string): Promise<Buffer | null> {
                // 尝试从缓存读取
                const cachedData = this.cache.get(key);
                if (cachedData) return cachedData;

                // 缓存未命中则走原始逻辑
                const data = await super.getData(key);

                if (data) {
                    // 数据存在时更新缓存（缓存会自动处理大小限制）
                    this.cache.put(key, data);
                }
                return data;
            }

            public async setData(key: string, buf: Buffer): Promise<void> {
                // 先更新存储
                await super.setData(key, buf);

                // 更新缓存（如果超过 maxPerKeySize 会被自动忽略）
                this.cache.put(key, buf);
            }

            public async deleteData(key: string): Promise<void> {
                // 先删除存储
                await super.deleteData(key);

                // 清理缓存
                this.cache.remove(key);
            }

            // 可选：添加缓存统计方法
            public getCacheStats() {
                return {
                    size: this.cache.getcurrentSizeInBytes(),
                    keys: this.cache.getKeyCount()
                };
            }
        };
    };
}

export default LRUCache;
export { WithLRUCache };
